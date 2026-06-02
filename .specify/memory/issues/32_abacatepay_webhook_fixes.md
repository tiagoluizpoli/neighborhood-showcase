## What to build

Address security vulnerabilities, compiler blockers, lint errors, and type safety constraints in the AbacatePay Webhook integration:
1. **Zod Payload Validation**: Define a Zod schema `abacatePayWebhookPayloadSchema` in [webhook.ts](file:///apps/server/src/presentation/routes/webhook.ts) to parse and validate the request body instead of raw type assertions.
2. **Fastify Query Validation**: Implement Fastify JSON Schema validation for route query parameters, typing `webhookSecret` securely and removing inline query type casting.
3. **Strict Status Verification**: Use the extracted `paymentStatus` variable to assert that `paymentStatus === 'PAID'` before modifying database states or upgrading announcements to `ACTIVE`. Log the processed status.
4. **Local Type Casting for rawBody**: Resolve the Biome lint error regarding explicit `any` by defining a localized interface `FastifyRequestWithRawBody` to safely cast `request.rawBody`.
5. **Background Email Dispatch**: Refactor the Resend email confirmation call to run asynchronously in the background so that the webhook handler responds to AbacatePay immediately without blocking on network requests.
6. **Integration Tests Refactor**: Ensure tests in [webhook.integration.test.ts](file:///apps/server/src/presentation/routes/webhook.integration.test.ts) generate signatures matching the production key (`env.ABACATEPAY_PUBLIC_KEY` as HMAC key, `base64` digest) and cover query schema errors and invalid statuses.

## Acceptance criteria

- [x] Webhook query validation rejects requests with invalid or missing secrets at the Fastify level.
- [x] Zod schema validation blocks malformed request bodies with a `400 Bad Request`.
- [x] Payments are only marked as `PAID` and announcements activated if `paymentStatus` is verified as `"PAID"`.
- [x] Confirmation emails are dispatched asynchronously without blocking the client response.
- [x] No explicit `any` casts are used to retrieve the raw body, and all linting/format checks pass.
- [ ] The `bun run check-types` and `bun run check` commands pass with zero warnings/errors.
- [ ] All integration tests in `webhook.integration.test.ts` pass successfully.
