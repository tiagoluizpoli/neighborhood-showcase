## What to build

Implement the AbacatePay webhook receiver endpoint at `POST /api/webhooks/abacatepay`. The endpoint processes paid callbacks, transitions announcements to active status, extends their expiration dates, and dispatches confirmation notifications.

## Acceptance criteria

- [x] Webhook route processes raw POST requests and validates AbacatePay cryptographic signature header.
- [x] Transition database transaction: update payment status to `PAID`, update announcement status to `ACTIVE`, and set `expiresAt` to `now + 30 days`.
- [x] Handles duplicate callback requests idempotently, returning 200 OK without duplicating status updates.
- [x] Integrates Resend to send confirmation emails to the provider upon successful processing.
- [x] Webhook validation failure returns HTTP 401 Unauthorized.
- [x] Integration tests verify payload signature validation, database transitions, and idempotency.

## Blocked by

- [.specify/memory/issues/07_payment_intent_pix.md](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/issues/07_payment_intent_pix.md)
