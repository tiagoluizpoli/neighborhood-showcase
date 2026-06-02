## What to build

Create an Architectural Decision Record (ADR) detailing the trade-offs for payment error handling and state transitions:
1. Initialize a new ADR markdown file under `docs/adr/` (e.g. `0004-abacatepay-payment-error-handling.md`).
2. Document the structure for managing checkout generation failures, duplicate intent calls, and webhook resolution errors.
3. Outline how the system distinguishes between `ANNOUNCEMENT_ALREADY_ACTIVE`, `ANNOUNCEMENT_SUSPENDED`, and `ANNOUNCEMENT_EXPIRED` exceptions.
4. Detail retry rules, webhook signature validation procedures, and failure-safes to keep data synchronized between AbacatePay and the local DB.

## Acceptance criteria

- [ ] A new ADR is written and persisted in the `docs/adr/` folder following the standard ADR template.
- [ ] Technical trade-offs regarding toast UI errors vs backend tRPC errors are cleanly documented.
- [ ] Webhook validation, signature checks, and transaction status mappings are explicitly defined.
- [ ] The file is correctly indexed in `docs/adr/README.md` or similar directory logs.

## Blocked by

- [.specify/memory/issues/17_draft_announcement_publish_button.md](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/issues/17_draft_announcement_publish_button.md)
