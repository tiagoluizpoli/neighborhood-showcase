---
type: feature
epic: 07-data-and-infrastructure
status: completed
blocked-by: null
---

## What to Build

Refactor the onboarding setup screen and guards:
1. Update `apps/web/src/routes/dashboard.tsx` route guard to check for an approved `provider_location` of any type (`RESIDENT`, `MODERATOR`, or `EXTERNAL`).
2. Add "Independent/External Provider" choice to `apps/web/src/routes/dashboard.condo-setup.tsx`.
3. Implement address fields lookup (via ViaCEP) and creation when registering as an external provider.
4. Set status of external `provider_location` records to auto-approved (`APPROVED`).
5. Update backend tRPC router queries/mutations to support creating external locations.

## Acceptance Criteria

- [x] Route guard does not redirect a user who has an approved external provider location.
- [x] Setup screen offers an "Independent/External" option that queries CEP using ViaCEP.
- [x] Submitting address details successfully registers the external location and grants access to the dashboard.
- [x] Integration tests verify the onboarding flow for external providers.

## Sub-Tasks

_Sub-tasks will be defined when this task is executed._

---

<!-- INDEX SYNC: After completing a sub-task, update the parent
epic.md child task checklist AND .specify/memory/index.md in the
same turn. Never skip this sync step. -->
