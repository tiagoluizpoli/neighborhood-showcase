# Slice 16: Reporting System — Submit & Store

## Parent

PRD-v2-backlog-overhaul (Item 8)

## What to build

Implement the user reporting system that allows authenticated users to report announcements with predefined reasons.

1. **Schema**:
   - Create a `reportReasonEnum` pg enum: `FRAUDE_GOLPE`, `ASSEDIO_OFENSIVO`, `SPAM`, `SERVICO_ILEGAL`, `OUTROS`.
   - Create a `report` table: `id`, `reporterId` (FK to user), `announcementId` (FK to announcement), `reason` (reportReasonEnum), `createdAt`. Add a unique constraint on (`reporterId`, `announcementId`) to prevent duplicate reports.
2. **API**: Create a tRPC procedure for authenticated users to submit a report. Validate the reason against the enum. Reject duplicate reports from the same user.
3. **UI**: Add a "Denunciar" (Report) button on the announcement detail page (Slice 13). Clicking it opens a dialog with radio buttons for the predefined reasons. Submit button sends the report.
4. **Unauthenticated users**: The report button is hidden for unauthenticated users (Visitors cannot report — only registered users can).

## Acceptance criteria

- [ ] `report` table and `reportReasonEnum` exist in the schema
- [ ] Unique constraint prevents duplicate reports from the same user on the same announcement
- [ ] tRPC report procedure validates reason and rejects duplicates
- [ ] "Denunciar" button appears on the announcement detail page for authenticated users only
- [ ] Report dialog shows predefined reasons as radio buttons
- [ ] Integration test: successful report creation
- [ ] Integration test: duplicate report rejection
- [ ] Migration runs cleanly

## Blocked by

- #49 (Announcement Detail Page)
