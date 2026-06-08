---
type: feature
epic: 04-provider-and-moderation
status: completed
blocked-by: null
---

## What to Build

Implement the Provider Dashboard interface at `/dashboard` and the LGPD-compliant account deletion workflow. Providers can view listing metrics, manage status groups, renew listings, and scrub their personal data permanently.

## Acceptance Criteria

- [x] Stat metrics display total impressions (views), total interactions (clicks), and conversion rate.
- [x] Swappable lists for active, draft, expired, and suspended announcements.
- [x] Suspension alerts display the reason entered by the moderator.
- [x] Edit action flags updated ads for moderator review.
- [x] LGPD Delete Account action performs a soft-delete: scrubs `Users.name`, `Users.email`, and `Users.phone` but retains anonymized financial payment records.
- [x] Integration tests verify that metrics calculations aggregate accurately and account deletions scrub personal identifiable data.

## Sub-Tasks

_Sub-tasks will be defined when this task is executed._

---

<!-- INDEX SYNC: After completing a sub-task, update the parent
epic.md child task checklist AND .specify/memory/index.md in the
same turn. Never skip this sync step. -->
