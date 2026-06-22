# Handoff: Grilling To PRD

Date: 2026-06-22
Source Session: .plan/grilling/2026-06-21-05-announcement-detail-edit-and-analytics-grilling.md
Source Packet: .plan/sessions/panel-bugs-style-issues/05-announcement-detail-edit-and-analytics.md
Status: ready-for-prd
Scope: Provider-facing announcement detail/edit/analytics surface in the `/panel` provider namespace. Splits view from edit, consolidates create/edit onto one shared form, and rebuilds the detail page as a facts-first read-only view. Public announcement page (`_portal.anuncios.$id.tsx`) is explicitly OUT OF SCOPE.

## Pre-existing fixes (do NOT re-litigate)
- Issue 6 (debug `console.log` in route) — already removed in code (commit d42373d).
- Issue 4 (tags not editable) — already fixed: `tags: form.tags` now saved; edit form has `tags` + `onTagsChange`. Tags fully editable end-to-end.
- The PRD should treat these as done and not re-plan them.

## Stable Decisions

### Surface separation
- Provider MANAGEMENT view and PUBLIC view are separate surfaces and stay separate.
  - Management view = `panel.provider.announcements.$id.tsx` (analytics + edit). This packet targets ONLY this.
  - Public view = `_portal.anuncios.$id.tsx` (no analytics/edit). Untouched here.

### View vs edit IA
- Editing moves to a dedicated route; the detail `$id` page becomes a pure read-only view.
- Routes (provider namespace, per packet 07):
  - `/panel/provider/announcements/$id` = read-only view
  - `/panel/provider/announcements/$id/edit` = edit
  - `/panel/provider/announcements/new` = create
  - View page's Edit button navigates to the `/edit` child.

### Shared create/edit form
- Create and edit share ONE form component, branching on presence of an `id`:
  - edit mode fetches the announcement by id, prefills all fields, submits via `update` (carrying `id`)
  - create mode submits via `create`
  - same inputs, same positions, same validation rules ("don't want two experiences for the same thing").
- Consolidate onto the `panel.provider.*` namespace form. Extract a shared `AnnouncementForm` (mode/id-driven).
- Delete the duplicate `panel.dashboard.*` new form and the narrow `ProviderDashboardEditFormFields` component.

### Editable field policy
- MVP: all fields editable in edit mode except identity fields (e.g. `id`). Category stays editable for now.
- REQUIREMENT: field-level lockability must be a built-in PATTERN (per-field policy/config or mode-aware disabled flags) so a specific field can be frozen later with a minimal, localized change — no wide refactor.

### Read-only detail (view) page layout — facts-first
- Title + key facts (category/price/status/condo/contact) at the top, above the fold. Strongest rule: provider must not scroll to reach key info.
- The per-announcement image (`announcement.imageUrl`, cropper output) is demoted from a full-width 4:3 hero to a constrained cover beside/above the facts:
  - keep 4:3 aspect (matches create cropper, no re-crop)
  - cap ~280–320px max width, rounded, object-cover.
- Remove the right-rail "summary" mini-card (status/contact-count/tag-count) — redundant with the status badge, tag chips, and contact card.

### Analytics on the view page
- Analytics sits below the primary facts block (below the fold).
- Keep the 3 metric cards (impressions / interactions / conversion) always visible.
- Shrink the bar chart from fixed 320px to ~200–220px (metric cards carry the at-a-glance value; chart is secondary).

## Open Tensions
- Whether changing `category` post-publish has analytics/downstream implications is deliberately deferred. MVP leaves it editable; the field-lock pattern must make freezing it later cheap.
- Exact image cover cap (280 vs 320px) and whether it sits beside vs above facts at smaller breakpoints is a visual-polish detail for the PRD/implementation to settle responsively.
- The shared `AnnouncementForm` extraction touches create + edit + two namespaces; the PRD should sequence it so create flow isn't regressed (the create form carries an image cropper, contact section, CTA section).

## PRD Expectations
- Preserve the create/edit parity model from packet 06 (contact defaults/overrides, CTA targets, category/tags/money primitives) — this packet's shared form is the same form, so it must not narrow that field set.
- Make the field-lock seam explicit as an acceptance criterion, not just an aspiration.
- Keep public vs management separation as a hard boundary; no analytics/edit affordances leak to `_portal`.
- Treat the two already-fixed defects (debug log, tag editability) as done.

## Next Step
- Run `luna-to-prd` using this handoff plus the canonical grilling session.
