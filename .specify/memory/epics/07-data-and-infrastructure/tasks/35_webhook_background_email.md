---
type: feature
epic: 07-data-and-infrastructure
status: completed
blocked-by: null
---

## What to Build

Refactor email dispatches to prevent blocking webhook responses:
1. Run the Resend email confirmation dispatch asynchronously in the background.
2. Ensure that the parent Fastify request handler does not `await` the email promise, allowing it to reply with `200 OK` to AbacatePay immediately after the database transaction successfully commits.
3. Catch and log any background email dispatch errors locally using Fastify's request log.
4. Keep the developer email mock fallback so that a valid Resend API key remains optional for development.

## Acceptance Criteria

- [x] Webhook endpoint returns `200 OK` immediately after database updates succeed, without waiting for the Resend email dispatch API call to resolve.
- [x] Email dispatch failures are logged correctly in the background, without causing the webhook request to fail or crash.

## Sub-Tasks

_Sub-tasks will be defined when this task is executed._

---

<!-- INDEX SYNC: After completing a sub-task, update the parent
epic.md child task checklist AND .specify/memory/index.md in the
same turn. Never skip this sync step. -->
