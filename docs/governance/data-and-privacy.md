# Data and Privacy

AgentHarness should minimize unnecessary data exposure and make context access explicit, scoped, policy-aware, and auditable.

## Data Classification

Registry objects should describe the highest expected data classification they access or produce. A simple public pattern is:

- `public`: safe to disclose broadly
- `internal`: intended for internal business use
- `confidential`: sensitive business or user-related information
- `restricted`: highly sensitive data requiring strict controls

Exact definitions and thresholds belong in private organisational policy.

## Minimum Necessary Context

Agents and skills should request the minimum context needed for the task. Context scopes should describe purpose, data class, source systems, and allowed use without storing raw sensitive data in public manifests.

## Consent

Consent should be explicit when a journey affects a user, account, entitlement, transaction, or other protected interest. Consent evidence should be captured as structured audit metadata where appropriate.

## PII Handling

Avoid storing personal data in registry records, examples, prompts, traces, or audit events unless there is a clear approved purpose. Prefer references, classifications, summaries, redacted values, hashes, or evidence IDs.

## Memory Policy

Memory should be treated as context with lifecycle and purpose limits.

Useful questions:

- What can be remembered?
- For what purpose?
- For how long?
- Who can access it?
- What clears it?
- How is access audited?

## Cross-Border Processing Pattern

Some deployments may need to account for where data is processed, stored, or accessed. The public specification should describe this as a pattern without naming jurisdictions or encoding legal interpretations.

Useful fields may include data region, processing region, allowed transfer conditions, and policy obligations. Exact rules belong in private legal and compliance guidance.

## Public Repo Safety Boundaries

Public GitHub should not contain:

- Real personal data
- Customer-specific examples
- Private system names
- Credentials
- Internal approval thresholds
- Legal interpretations
- Sensitive architecture notes
- Operational contacts

Use fictional examples and reusable open-source patterns instead.
