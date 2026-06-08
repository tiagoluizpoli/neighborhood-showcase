---
type: fix
epic: 07-data-and-infrastructure
status: completed
blocked-by: null
---

## What to Build

Secure the AbacatePay webhook query parameters and types:
1. Configure Fastify route JSON Schema validation for the `webhookSecret` query parameter.
2. Remove the inline `request.query as { webhookSecret?: string }` type assertion, utilizing Fastify's native type inference.
3. Define a localized `FastifyRequestWithRawBody` interface extending `FastifyRequest` to securely retrieve `request.rawBody` without explicit `any` casting, resolving the Biome lint check warning.

## Acceptance Criteria

- [x] Webhook endpoint rejects requests with missing or mismatching `webhookSecret` query parameters at the Fastify level.
- [x] Query parameter retrieval does not use TypeScript type assertions (`as`).
- [x] Retrieval of `rawBody` does not use `any` casting and passes Biome lint checking.

## Sub-Tasks

_Sub-tasks will be defined when this task is executed._

---

<!-- INDEX SYNC: After completing a sub-task, update the parent
epic.md child task checklist AND .specify/memory/index.md in the
same turn. Never skip this sync step. -->
