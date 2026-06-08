---
type: fix
epic: 07-data-and-infrastructure
status: completed
blocked-by: null
---

## What to Build

Implement strict validation and type safety for the webhook request body payload:
1. Define a Zod schema `abacatePayWebhookPayloadSchema` that reflects the expected payload format from AbacatePay v2 (handling both transparent checkout and standard checkout data elements).
2. Validate and parse `request.body` on endpoint entry using this schema.
3. Assert that the extracted `paymentStatus` is `'PAID'` before triggering any announcement upgrades or transaction logs.
4. Log the processed `paymentStatus` and `billingId` to satisfy the TypeScript compiler's unused variable constraint (TS6133).

## Acceptance Criteria

- [x] Webhook endpoint returns `400 Bad Request` if the incoming request body does not match the Zod payload schema.
- [x] Database updates are bypassed if the payload's `paymentStatus` is not `"PAID"`.
- [x] Unused variable compiler errors (TS6133) on `paymentStatus` are fully resolved.

## Sub-Tasks

_Sub-tasks will be defined when this task is executed._

---

<!-- INDEX SYNC: After completing a sub-task, update the parent
epic.md child task checklist AND .specify/memory/index.md in the
same turn. Never skip this sync step. -->
