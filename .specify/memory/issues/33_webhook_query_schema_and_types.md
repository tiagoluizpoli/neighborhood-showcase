## Parent

[32 AbacatePay Webhook Security & Type Safety Fixes](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/issues/32_abacatepay_webhook_fixes.md)

## What to build

Secure the AbacatePay webhook query parameters and types:
1. Configure Fastify route JSON Schema validation for the `webhookSecret` query parameter.
2. Remove the inline `request.query as { webhookSecret?: string }` type assertion, utilizing Fastify's native type inference.
3. Define a localized `FastifyRequestWithRawBody` interface extending `FastifyRequest` to securely retrieve `request.rawBody` without explicit `any` casting, resolving the Biome lint check warning.

## Acceptance criteria

- [ ] Webhook endpoint rejects requests with missing or mismatching `webhookSecret` query parameters at the Fastify level.
- [ ] Query parameter retrieval does not use TypeScript type assertions (`as`).
- [ ] Retrieval of `rawBody` does not use `any` casting and passes Biome lint checking.

## Blocked by

None - can start immediately
