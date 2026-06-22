---
type: epic
id: E-18
name: "Announcement Detail, Edit Split, and Analytics"
status: in-progress
blocked-by: []
---

## About this Epic

Split the provider announcement management surface along its natural seams. Separate view from edit by route instead of column-swap, consolidate create and edit onto one shared `AnnouncementForm` driven by id-presence, rebuild the `$id` detail page facts-first, and trim/resize the analytics block. The shared-form extraction is sequenced first so the create flow (cropper, contact section, CTA section) is never regressed while edit wiring lands. The public surface (`_portal.anuncios.$id`) stays untouched.

## Context

Canonical PRD: `.plan/prds/PRD-v11-announcement-detail-edit-and-analytics.md`

Canonical PRD handoff: `.plan/handoffs/prd-to-issues-announcement-detail-edit-and-analytics.md`

Current state: `apps/web/src/routes/panel.provider.announcements.$id.tsx` entangles a read view, an inline edit form (toggled via `isEditing`), and an analytics panel on one route, swapping the right column between analytics and `-provider-dashboard-edit-form-fields.tsx`. `panel.provider.announcements.new.tsx` is an all-inline create form that already imports the shared `-announcement-contact-section`, `-announcement-cta-section`, category/price/tags components, and cropper. A duplicate create form lives at `panel.dashboard.announcements.new.tsx`, and the narrow `-provider-dashboard-edit-form-fields.tsx` is a second edit-fields path; both are deleted by this epic. Two prior defects (debug `console.log` in commit d42373d, tag editability) are already fixed and are out of re-planning. All visible strings go through i18next `t()` with keys in both pt and en. Verify suspicious `bun test` failures per-file due to cross-file `mock.module` leakage.

## Child Tasks

| Task ID | Task | Status | Blocked By | File |
| --- | --- | --- | --- | --- |
| T-18-01 | Extract shared AnnouncementForm and field-policy seam | done | — | `.plan/epics/18-announcement-detail-edit-and-analytics/tasks/01-extract-shared-announcement-form-and-field-policy-seam.md` |
| T-18-02 | Edit route split onto shared form and delete duplicates | done | T-18-01 | `.plan/epics/18-announcement-detail-edit-and-analytics/tasks/02-edit-route-split-and-delete-duplicates.md` |
| T-18-03 | Facts-first read-only detail rebuild | done | T-18-02 | `.plan/epics/18-announcement-detail-edit-and-analytics/tasks/03-facts-first-read-only-detail-rebuild.md` |
| T-18-04 | Analytics placement and chart shrink | done | T-18-03 | `.plan/epics/18-announcement-detail-edit-and-analytics/tasks/04-analytics-placement-and-chart-shrink.md` |
| T-18-05 | Test matrix and boundary guards | in-progress | T-18-01, T-18-02, T-18-03, T-18-04 | `.plan/epics/18-announcement-detail-edit-and-analytics/tasks/05-test-matrix-and-boundary-guards.md` |

---

<!-- INDEX SYNC: After completing or modifying any child task file, run
.plan/helper-scripts/sync-state.sh and update .plan/index.md in the same turn. -->
