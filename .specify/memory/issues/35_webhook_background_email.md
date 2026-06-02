## Parent

[32 AbacatePay Webhook Security & Type Safety Fixes](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/issues/32_abacatepay_webhook_fixes.md)

## What to build

Refactor email dispatches to prevent blocking webhook responses:
1. Run the Resend email confirmation dispatch asynchronously in the background.
2. Ensure that the parent Fastify request handler does not `await` the email promise, allowing it to reply with `200 OK` to AbacatePay immediately after the database transaction successfully commits.
3. Catch and log any background email dispatch errors locally using Fastify's request log.
4. Keep the developer email mock fallback so that a valid Resend API key remains optional for development.

## Acceptance criteria

- [x] Webhook endpoint returns `200 OK` immediately after database updates succeed, without waiting for the Resend email dispatch API call to resolve.
- [x] Email dispatch failures are logged correctly in the background, without causing the webhook request to fail or crash.

## Blocked by

- [34 Webhook Zod Payload Validation & Strict Status Check](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/issues/34_webhook_zod_payload_and_status.md)
