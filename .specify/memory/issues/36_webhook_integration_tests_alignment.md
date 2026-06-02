## Parent

[32 AbacatePay Webhook Security & Type Safety Fixes](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/issues/32_abacatepay_webhook_fixes.md)

## What to build

Realign the integration test suite to match the corrected webhook implementation:
1. Update HMAC signature generation blocks in `webhook.integration.test.ts` to compute signatures using `env.ABACATEPAY_PUBLIC_KEY` as the HMAC key and digest as `base64`, matching the production code and AbacatePay specifications.
2. Add new integration test scenarios validating:
   - Query schema validation: returns a `400 Bad Request` or `401 Unauthorized` when the `webhookSecret` is invalid or missing.
   - Body validation: returns a `400 Bad Request` when the request body violates the Zod payload schema.
   - Strict status verification: returns `400 Bad Request` or `200` with ignored message when `paymentStatus` is not `"PAID"`.

## Acceptance criteria

- [x] All tests in `webhook.integration.test.ts` pass successfully.
- [x] Test coverage includes invalid query parameters and malformed body validation cases.

## Blocked by

- [33 Fastify Query Schema Validation & rawBody Types](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/issues/33_webhook_query_schema_and_types.md)
- [34 Webhook Zod Payload Validation & Strict Status Check](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/issues/34_webhook_zod_payload_and_status.md)
