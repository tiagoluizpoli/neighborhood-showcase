---
type: fix
epic: 07-data-and-infrastructure
status: completed
blocked-by: null
---

## What to Build

Realign the integration test suite to match the corrected webhook implementation:
1. Update HMAC signature generation blocks in `webhook.integration.test.ts` to compute signatures using `env.ABACATEPAY_PUBLIC_KEY` as the HMAC key and digest as `base64`, matching the production code and AbacatePay specifications.
2. Add new integration test scenarios validating:
   - Query schema validation: returns a `400 Bad Request` or `401 Unauthorized` when the `webhookSecret` is invalid or missing.
   - Body validation: returns a `400 Bad Request` when the request body violates the Zod payload schema.
   - Strict status verification: returns `400 Bad Request` or `200` with ignored message when `paymentStatus` is not `"PAID"`.

## Acceptance Criteria

- [x] All tests in `webhook.integration.test.ts` pass successfully.
- [x] Test coverage includes invalid query parameters and malformed body validation cases.

## Sub-Tasks

_Sub-tasks will be defined when this task is executed._

---

<!-- INDEX SYNC: After completing a sub-task, update the parent
epic.md child task checklist AND .specify/memory/index.md in the
same turn. Never skip this sync step. -->
