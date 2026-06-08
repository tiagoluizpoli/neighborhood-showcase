---
type: feature
epic: 06-panel-layout
status: blocked
blocked-by: null
---

## What to Build

Implement the user reporting system that allows authenticated users to report announcements with predefined reasons.

1. **Schema**:
   - Create a `reportReasonEnum` pg enum: `FRAUDE_GOLPE`, `ASSEDIO_OFENSIVO`, `SPAM`, `SERVICO_ILEGAL`, `OUTROS`.
   - Create a `report` table: `id`, `reporterId` (FK to user), `announcementId` (FK to announcement), `reason` (reportReasonEnum), `createdAt`. Add a unique constraint on (`reporterId`, `announcementId`) to prevent duplicate reports.
2. **API**: Create a tRPC procedure for authenticated users to submit a report. Validate the reason against the enum. Reject duplicate reports from the same user.
3. **UI**: Add a "Denunciar" (Report) button on the announcement detail page (Slice 13). Clicking it opens a dialog with radio buttons for the predefined reasons. Submit button sends the report.
4. **Unauthenticated users**: The report button is hidden for unauthenticated users (Visitors cannot report — only registered users can).

## Acceptance Criteria

- [x] `report` table and `reportReasonEnum` exist in the schema
- [x] Unique constraint prevents duplicate reports from the same user on the same announcement
- [x] tRPC report procedure validates reason and rejects duplicates
- [x] "Denunciar" button appears on the announcement detail page for authenticated users only
- [x] Report dialog shows predefined reasons as radio buttons
- [x] Integration test: successful report creation
- [x] Integration test: duplicate report rejection
- [x] Migration runs cleanly

## Sub-Tasks

_Sub-tasks will be defined when this task is executed._

---

<!-- INDEX SYNC: After completing a sub-task, update the parent
epic.md child task checklist AND .specify/memory/index.md in the
same turn. Never skip this sync step. -->
