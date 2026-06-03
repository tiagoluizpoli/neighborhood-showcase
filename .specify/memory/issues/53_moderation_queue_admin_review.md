# Slice 17: Moderation Queue & Admin Review Actions

## Parent

PRD-v2-backlog-overhaul (Item 8)

## What to build

Build the admin moderation queue that surfaces spotlighted announcements (those exceeding the report threshold) and provides manual review actions.

1. **Spotlight query**: Create a tRPC procedure for admins/moderators to list announcements that have accumulated reports from at least N unique users (configurable threshold, default 5). These are "spotlighted" for review.
2. **Moderation queue UI**: Add a moderation queue screen in the panel (`/panel/moderation/denuncias` or similar) showing spotlighted announcements with:
   - Announcement preview (title, image, provider name)
   - Report count and breakdown by reason
   - List of individual reports (reporter, reason, date)
3. **Admin actions**:
   - **Dismiss**: Clear all reports on the announcement (de-spotlight it). The announcement remains active.
   - **Suspend Announcement**: Suspend the announcement with a predefined reason (reuses existing `suspensionReason` field). Updates announcement status to `SUSPENDED`.
   - **Ban User**: Blacklist the provider. System resolves the CPF hash internally — no raw CPF input needed. All active announcements from the user are also suspended.
4. **No automatic suspension**: The threshold only highlights — it never auto-suspends. All actions are manual.

## Acceptance criteria

- [x] Spotlight query returns announcements exceeding the configurable report threshold
- [x] Moderation queue screen shows spotlighted announcements with report details
- [x] Dismiss action clears reports without affecting the announcement
- [x] Suspend action updates announcement status to `SUSPENDED` with a reason
- [x] Ban action blacklists the provider and suspends all their announcements
- [x] No automatic suspension — threshold only triggers visibility in the queue
- [x] Integration tests: threshold detection, dismiss, suspend, ban actions

## Blocked by

- #40 (Panel Sidebar Navigation)
- #52 (Reporting System — Submit & Store)
