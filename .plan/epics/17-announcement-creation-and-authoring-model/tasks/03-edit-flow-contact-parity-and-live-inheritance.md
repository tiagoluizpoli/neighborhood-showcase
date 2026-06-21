---
type: task
id: T-17-03
epic: E-17
status: done
blocked-by: [T-17-02]
default-model: medium
---

## What to Build

Bring the provider announcement detail/edit flow up to the same contact-model capability as create, including explicit inherited-versus-custom state and the live-follow semantics for announcements that still inherit provider defaults. This slice closes the current create/edit capability drift for contact behavior before CTA and richer widgets land.

## Context

`apps/web/src/routes/panel.provider.announcements.$id.tsx` and `apps/web/src/routes/panel/-provider-dashboard-edit-form-fields.tsx` currently expose a much narrower edit contract than the PRD allows, and the current form state is populated from announcement-local fields only. The PRD explicitly forbids create from outgrowing edit again. It also requires that inherited announcements continue following provider-default changes until customized, while customized announcements stay isolated from later provider-default edits.

## Acceptance Criteria

- [x] The detail/edit route exposes the same contact concepts available in create: inherited mode, custom mode, primary WhatsApp baseline, and optional same-number direct call.
- [x] Announcements still marked as inheriting follow provider-default changes live when reloaded/read back from the canonical contract.
- [x] Customized announcements remain isolated from later provider-default changes.
- [x] The detail read view communicates inherited-versus-custom contact state clearly enough for providers/support to understand behavior.
- [x] Tests prove create/edit capability parity and the inheritance-follow versus custom-isolated scenarios.

## Sub-Tasks

### ST-01 - Refactor the detail/edit surface to the canonical contact model

status: done
model: medium
escalate-if:
- The current detail-page structure cannot represent inherited-versus-custom contact state without a UI change outside the locked scope.

blocked-by:
- T-17-02

what-to-do:
- Update the edit panel and read view to show canonical contact behavior instead of raw contact-link fields.
- Reuse or share the create-side contact authoring primitive where it meaningfully reduces drift.
- Preserve the existing detail-page structure unless the minimum change required for the locked contact semantics forces a local adjustment.

files-to-touch:
- `apps/web/src/routes/panel.provider.announcements.$id.tsx`
- `apps/web/src/routes/panel/-provider-dashboard-edit-form-fields.tsx`
- `apps/web/src/components/` (shared authoring/contact section if introduced)
- announcement detail translation files

verification:
- `bun run check`
- `bun run check-types`
- announcement detail route tests for inherited/custom contact rendering and editing

#### Execution Notes

- Reused the create-side contact authoring semantics in the provider edit flow so inherited/custom mode, WhatsApp baseline, and same-number direct-call toggling stay aligned instead of drifting into a second bespoke form contract.
- Upgraded the provider detail read view, plus the dashboard alias detail route, to explain inherited-versus-custom behavior directly in the contact card instead of dumping raw contact-link fields.

### ST-02 - Implement live inheritance and custom-isolation semantics end to end

status: done
model: medium
escalate-if:
- Persisted legacy announcement rows require a migration or compatibility path beyond straightforward read-time resolution.

blocked-by:
- ST-01

what-to-do:
- Ensure read/update behavior resolves inherited announcements against current provider defaults.
- Ensure customized announcements persist explicit override state and do not drift when provider defaults change later.
- Keep the behavior coherent across dashboard/detail/public consumers of the announcement model.

files-to-touch:
- `apps/server/src/application/use-cases/announcement/update-announcement.ts`
- `apps/server/src/application/use-cases/announcement/get-provider-dashboard-data.ts`
- `apps/server/src/domain/repositories/announcement.repository.ts`
- `apps/server/src/infrastructure/db/announcement-repository/`
- `apps/server/src/infrastructure/db/mappers/`

verification:
- `bun run check`
- `bun run check-types`
- integration scenarios for inherited-follow and custom-isolated contact behavior

#### Execution Notes

- Read-time resolution now pulls current provider defaults for inherited announcements while preserving explicit `contactCustom` payloads for customized announcements.
- Router/update coverage now locks the canonical structured contact input in both directions, including switching an edited announcement back to `inherit` with no lingering custom payload.

### ST-03 - Lock parity and inheritance behavior with focused tests

status: done
model: medium
escalate-if: []
blocked-by:
- ST-01
- ST-02

what-to-do:
- Add route/integration coverage for edit in inherited mode, edit after switching to custom mode, and provider-default changes affecting only inherited announcements.
- Reuse the highest existing seams for dashboard/detail tests rather than introducing test-only helpers.
- Make the parity failure obvious in tests so future create/edit drift is caught quickly.

files-to-touch:
- `apps/web/src/routes/-panel.provider.announcements.test.tsx`
- `apps/server/src/application/use-cases/announcement/update-announcement.integration.test.ts`
- `apps/server/src/application/use-cases/announcement/get-provider-dashboard-data.integration.test.ts`

verification:
- `bun run check`
- `bun run check-types`
- edit/detail parity and inheritance integration suites pass

#### Execution Notes

- Added backend integration coverage proving inherited announcements follow live provider-default changes while customized announcements remain isolated.
- Extended edit/detail coverage across route tests and Playwright snapshots, including inherited detail presentation and a persisted switch to custom contact mode.

---

<!-- INDEX SYNC: After completing a sub-task, run
.plan/helper-scripts/sync-state.sh and update the parent epic.md checklist and
.plan/index.md in the same turn. -->
