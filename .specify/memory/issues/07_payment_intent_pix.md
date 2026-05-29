## What to build

Implement the checkout payment creation flow at `/dashboard/anuncios/:id/pagamento`. Enables providers to generate an AbacatePay Pix billing order (R$ 2,00) for draft announcements and displays the QR Code and copy-paste details.

## Acceptance criteria

- [x] Fetching payment screen generates a new AbacatePay billing order (sets pricing to R$ 2,00).
- [x] Saves a transaction record in the `payments` database table with status `PENDING` linked to the announcement.
- [x] Payment screen displays clear billing details, dynamic QR Code, Copia e Cola raw text string, and active countdown timer (10 mins).
- [x] Frontend triggers polling query every 5 seconds checking status in DB.
- [x] Integration tests verify AbacatePay client connection, payload, and DB creation.

## Blocked by

- [.specify/memory/issues/06_announcement_draft_creation.md](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/issues/06_announcement_draft_creation.md)
 Brocade
