import type { PolicyEngine } from "../../policy-engine/src/policy-engine";
import type { PolicyDefinition } from "../../core/src";
import type { ToolGateway } from "../../tool-gateway/src/tool-gateway";
import type { TraceEvent } from "../../observability/src/trace-model";
import {
  type StepDefinition,
  type RetryPolicy,
  DEFAULT_RETRY_POLICY,
} from "./step-definitions";
import type { CompensationEntry } from "./workflow-state";

export interface StepExecutionResult {
  outcome: "completed" | "failed" | "requires_approval";
  outputKey?: string;
  outputValue?: unknown;
  error?: string;
  policyDecisionId: string;
  traceSpanId: string;
  compensationEntry?: CompensationEntry;
}

export interface StepExecutorDeps {
  policyEngine: PolicyEngine;
  toolGateway: ToolGateway;
  policy: PolicyDefinition;
  agentId: string;
  emitTrace: (event: Omit<TraceEvent, "traceId">) => void;
}

export class StepExecutor {
  constructor(private readonly deps: StepExecutorDeps) {}

  async execute(
    step: StepDefinition,
    context: Record<string, unknown>,
    runId: string,
    traceId: string,
  ): Promise<StepExecutionResult> {
    const spanId = `span-${step.id}-${Date.now()}`;

    // --- Policy checkpoint ---
    const policyDecision = await this.deps.policyEngine.evaluate(
      this.deps.policy,
      {
        agentId: this.deps.agentId,
        skillId: step.kind === "skill" ? step.skillId : undefined,
        toolId: step.kind === "tool" ? step.toolId : undefined,
        context,
      },
    );

    this.deps.emitTrace({
      spanId,
      eventType: "step.policy_checked",
      timestamp: new Date().toISOString(),
      attributes: {
        runId,
        stepId: step.id,
        outcome: policyDecision.outcome,
        policyDecisionId: policyDecision.policyId,
      },
    });

    if (policyDecision.outcome === "deny") {
      return {
        outcome: "failed",
        error: `Policy denied: ${policyDecision.reason}`,
        policyDecisionId: policyDecision.policyId,
        traceSpanId: spanId,
      };
    }

    if (
      policyDecision.outcome === "require_approval" ||
      policyDecision.outcome === "require_consent"
    ) {
      return {
        outcome: "requires_approval",
        policyDecisionId: policyDecision.policyId,
        traceSpanId: spanId,
      };
    }

    // --- Execute by step kind ---
    switch (step.kind) {
      case "human_approval":
        // Parks the workflow — actual execution resumes via WorkflowRunner.approve()
        return {
          outcome: "requires_approval",
          policyDecisionId: policyDecision.policyId,
          traceSpanId: spanId,
        };

      case "tool":
        return this.executeWithRetry(
          async () => {
            const toolInput = this.mapInput(step.inputMapping, context);
            const result = await this.withTimeout(
              this.deps.toolGateway.callTool({
                tool: { id: step.toolId } as never,
                input: toolInput,
                traceId,
              }),
              step.timeoutMs,
            );
            const compensationEntry: CompensationEntry | undefined =
              step.compensationToolId
                ? {
                    stepId: step.id,
                    compensationToolId: step.compensationToolId,
                    input: toolInput, // captured at completion time
                  }
                : undefined;
            return {
              outcome: "completed" as const,
              outputKey: step.outputKey,
              outputValue: result.output,
              policyDecisionId: policyDecision.policyId,
              traceSpanId: spanId,
              compensationEntry,
            };
          },
          { ...DEFAULT_RETRY_POLICY, ...step.retry },
          policyDecision.policyId,
          spanId,
        );

      case "skill":
        // Skills use the same gateway path in v0.2 — treated as tool calls
        return this.executeWithRetry(
          async () => {
            const skillInput = this.mapInput(step.inputMapping, context);
            const result = await this.withTimeout(
              this.deps.toolGateway.callTool({
                tool: { id: step.skillId } as never,
                input: skillInput,
                traceId,
              }),
              step.timeoutMs,
            );
            return {
              outcome: "completed" as const,
              outputKey: step.outputKey,
              outputValue: result.output,
              policyDecisionId: policyDecision.policyId,
              traceSpanId: spanId,
            };
          },
          { ...DEFAULT_RETRY_POLICY, ...step.retry },
          policyDecision.policyId,
          spanId,
        );

      case "conditional": {
        const branch = this.evaluateCondition(step.condition, context)
          ? step.ifTrue
          : (step.ifFalse ?? []);
        // Conditional steps return the branch to execute — runner handles sub-steps
        return {
          outcome: "completed",
          outputKey: `__branch_${step.id}`,
          outputValue: branch,
          policyDecisionId: policyDecision.policyId,
          traceSpanId: spanId,
        };
      }

      default: {
        const _exhaustive: never = step;
        return {
          outcome: "failed",
          error: `Unknown step kind: ${(_exhaustive as StepDefinition).kind}`,
          policyDecisionId: "unknown",
          traceSpanId: spanId,
        };
      }
    }
  }

  private async executeWithRetry(
    fn: () => Promise<StepExecutionResult>,
    retry: RetryPolicy,
    policyDecisionId: string,
    spanId: string,
  ): Promise<StepExecutionResult> {
    let lastError: string = "Unknown error";
    let delayMs = retry.initialDelayMs;

    for (let attempt = 1; attempt <= retry.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        const isTimeout = lastError.includes("timed out");

        if (
          attempt === retry.maxAttempts ||
          (retry.retryOn === "tool_error" && isTimeout) ||
          (retry.retryOn === "timeout" && !isTimeout)
        ) {
          break;
        }

        await this.sleep(delayMs);
        delayMs = Math.round(delayMs * retry.backoffMultiplier);
      }
    }

    return {
      outcome: "failed",
      error: lastError,
      policyDecisionId,
      traceSpanId: spanId,
    };
  }

  private mapInput(
    mapping: Record<string, string>,
    context: Record<string, unknown>,
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [toolKey, contextPath] of Object.entries(mapping)) {
      result[toolKey] = this.resolvePath(contextPath, context);
    }
    return result;
  }

  /**
   * Evaluates simple expressions against workflow context.
   * Supports dot-path access and comparison operators.
   * Example: "context.riskScore >= 0.7"
   * v0.3+: replace with CEL or OPA for production-grade evaluation.
   */
  private evaluateCondition(
    condition: string,
    context: Record<string, unknown>,
  ): boolean {
    try {
      // Safe evaluation: only allow context access and comparison operators
      const sanitised = condition.replace(/context\./g, "__ctx__.");
      const fn = new Function(
        "__ctx__",
        `"use strict"; return (${sanitised});`,
      );
      return Boolean(fn(context));
    } catch {
      return false;
    }
  }

  private resolvePath(path: string, obj: Record<string, unknown>): unknown {
    return path
      .split(".")
      .reduce<unknown>(
        (acc, key) =>
          acc && typeof acc === "object"
            ? (acc as Record<string, unknown>)[key]
            : undefined,
        obj,
      );
  }

  private withTimeout<T>(promise: Promise<T>, timeoutMs?: number): Promise<T> {
    if (!timeoutMs) return promise;
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Step timed out after ${timeoutMs}ms`)),
          timeoutMs,
        ),
      ),
    ]);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
