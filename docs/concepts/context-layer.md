# Enterprise Context Layer

The Enterprise Context Layer controls what context an agent or skill may access.

Context can include user identity, session state, customer profile summaries, case metadata, knowledge references, system state, and policy facts. Access should be explicit, scoped, and auditable.

## Context Scope

A context scope is a named boundary such as `customer.summary`, `account.entitlements`, or `active.case`. Agents and skills may request scopes, while policies decide whether the request is allowed for the current user, channel, risk level, and purpose.

Context records should avoid storing raw sensitive data in examples. They should describe access patterns and classifications instead.
