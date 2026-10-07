# ReachAgent

ReachAgent is a portfolio reference for a safety-conscious outreach workflow. This repository contains a small, fully synthetic TypeScript demonstration and high-level architecture documentation. It is not the production application: integrations are represented by interfaces, all examples use reserved `.example` domains, and no live service is contacted.

## Architecture

```text
trusted tenant policy + untrusted lead context
                    |
                    v
          deterministic context builder
                    |
                    v
       bounded workflow state machine
         |          |           |
      provider   validation   policy gate
       adapter       |           |
         +------------+-----------+
                      |
              persisted checkpoint
                      |
            background job boundary
```

The application design separates deterministic control flow from probabilistic text generation. A request enters a bounded state machine, builds a labelled context, calls an AI provider through a narrow interface, validates the structured response, applies policy checks, and persists the next checkpoint. External effects belong behind explicit, idempotent commands.

## Bounded agentic workflows

“Agentic” here means a model contributes within a fixed workflow—not that it can invent tools, goals, or execution plans. Allowed stages, transitions, attempt limits, input sizes, output schemas, and side effects are defined in code. A model may propose structured content; deterministic application logic decides whether the workflow can advance.

## Deterministic orchestration

The example orchestrator is a finite-state transition function. Given the same state and event, it produces the same next state. Unsupported transitions fail closed. This makes workflow behaviour reviewable, testable, and replayable without storing hidden reasoning.

## Persisted workflow state

Production-oriented design persists compact checkpoints such as stage, version, attempt count, timestamps, and deduplication keys. Workers resume from the latest committed checkpoint instead of relying on process memory. The public example models this state but deliberately includes no database client, schema, migration, or operational identifiers.

## AI provider abstraction

Providers sit behind a minimal `AIProvider` interface that accepts labelled context and returns an unknown structured value. Provider-specific authentication, model selection, retry behaviour, and SDK wiring are intentionally omitted. This isolates the workflow from vendor APIs and keeps validation at the application boundary.

## Structured outputs and validation

AI responses are treated as untrusted data. The example parser checks object shape, exact allowed keys, types, trimmed values, and character bounds before producing a typed value. Invalid output is rejected; it is never silently coerced into an executable command.

## Context engineering

Context is assembled into explicit trust zones:

- `policy` contains trusted application constraints.
- `task` contains the narrowly scoped instruction.
- `untrustedData` contains external text that may include hostile instructions.

The renderer labels untrusted material as data, applies deterministic size limits, and tells the model not to follow instructions found inside it. This reduces ambiguity but does not replace output validation or authorization.

## Guardrails

Layered guardrails include bounded inputs, fixed workflow transitions, allowlisted output fields, length limits, refusal to interpret external text as authority, tenant-scoped persistence, explicit approval boundaries, and side-effect gates. No single prompt is treated as a security boundary.

## Retries and idempotency

Retries should apply only to classified transient failures, use capped attempts and backoff, and record the reason. Side effects use stable idempotency keys derived from a workflow and operation so that job redelivery cannot duplicate an action. Validation and policy failures are terminal until the input changes; blindly retrying them wastes capacity and can mask defects.

## Observability

Useful telemetry records workflow stage, latency, outcome category, retry count, provider alias, prompt/template version, and correlation identifiers. Logs should exclude raw prompts, credentials, personal data, and full provider responses. Metrics and traces support diagnosis while retaining only the minimum necessary context.

## Offline AI evaluation

The included offline evaluation uses synthetic cases and a deterministic candidate function. It scores schema validity, safety behaviour, and length compliance without network access. In a real delivery process, offline suites act as regression gates before any separately approved live evaluation.

Run the example:

```sh
npm install
npm test
npm run eval
```

## Prompt-injection and security testing

Security fixtures place instruction-like text inside the untrusted-data zone and verify that it remains labelled and bounded. Additional testing should cover output-field smuggling, oversized inputs, malformed structured output, cross-tenant identifier substitution, retry storms, replayed jobs, and authorization failures. Tests assert observable inputs and outputs; they do not request or store chain-of-thought.

## Multi-tenant and RLS design

Every tenant-owned record should carry an immutable tenant identifier set from authenticated server context. Database access should use least privilege, with Row Level Security enforcing tenant membership for every read and write. Service roles must remain confined to audited server-side paths, and background jobs must re-establish tenant scope rather than trusting tenant identifiers in payloads. This is a design description only; executable database policies and production schemas are excluded.

## Trigger.dev background processing

Long-running stages can be dispatched to Trigger.dev as versioned jobs. Payloads should contain opaque workflow references rather than sensitive business content. Each job reloads current state, verifies tenant scope, claims an idempotency key, performs one bounded stage, persists the checkpoint, and emits sanitised telemetry. This repository includes no Trigger.dev configuration or integration code.

## Technology stack

The public demonstration uses TypeScript, Node.js, and Node's built-in test runner. The broader documented design is compatible with a Next.js application, PostgreSQL/Supabase with Row Level Security, Trigger.dev background jobs, schema-validated AI providers, and structured telemetry. Those services are named as architectural context only and are not configured here.

## Scope and limitations

This portfolio is educational and intentionally incomplete. It does not send messages, access mailboxes, authenticate users, connect to databases, call AI services, deploy infrastructure, or contain production prompts. It does not claim a multi-agent architecture, retrieval-augmented generation, a vector database, MCP integration, unrestricted autonomous planning, or chain-of-thought storage.

## Repository map

```text
src/context.ts       trust-separated context construction
src/contracts.ts     structured output validation and provider interface
src/workflow.ts      deterministic bounded state transitions
src/offline-eval.ts  synthetic offline evaluation runner
test/                deterministic and security-focused tests
```

## Safe configuration

Copy `.env.example` only when needed. Its values are inert examples; the demonstration requires no environment variables. Never commit real credentials or environment-specific identifiers.

