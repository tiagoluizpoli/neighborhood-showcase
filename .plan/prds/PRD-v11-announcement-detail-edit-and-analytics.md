# PRD-v11 — Announcement Detail, Edit Split, and Analytics

## Problem Statement

The provider-facing announcement management page (`panel.provider.announcements.$id`) tries to be four things on one screen: a showcase, a management detail view, an inline edit form, and an analytics panel. The page swaps its right-hand column between the analytics panel (when viewing) and the edit form (when editing), so view and edit are entangled on a single route and analytics has to fight the edit form for the same space.

As a provider, this produces several concrete pains:

- The key facts a provider needs at a glance (category, price, status, condo, contact) are pushed below the fold because a full-width 4:3 image hero dominates the top of the page. The provider must scroll to reach the information they came for.
- Editing happens in-place by toggling the same screen, which makes "view" and "edit" feel like two faces of one cramped surface rather than two clear, similar experiences.
- There are two separate "new announcement" forms (one under the `panel.dashboard.*` namespace, one under `panel.provider.*`), plus a narrow `ProviderDashboardEditFormFields` component. Create and edit can drift apart because they do not share one form, which is exactly the capability-parity risk PRD-v10 fought to close.
- A right-rail "summary" mini-card repeats information already carried by the status badge, the tag chips, and the contact card (status / contact-count / tag-count), wasting prime space.
- The analytics block uses a fixed 320px-tall bar chart that is taller than its informational weight; the three metric cards already carry the at-a-glance value.

Two defects from the original packet are already fixed in code and must not be re-litigated: the debug `console.log` in the route (removed in commit d42373d) and tag editability (`tags: form.tags` now saved; the edit form has `tags` + `onTagsChange`). Tags are fully editable end to end.

The root problem is not cosmetic. The single-route view/edit/analytics entanglement blocks a clean information hierarchy and forces create and edit to live as separate, drift-prone forms. This packet targets only the provider management surface. The public announcement page (`_portal.anuncios.$id`) is a separate surface and stays untouched.

## Solution

Split the provider announcement management surface along its natural seams and rebuild the detail page facts-first.

Separate view from edit by route, not by column-swap.

- `/panel/provider/announcements/$id` becomes a pure read-only view.
- `/panel/provider/announcements/$id/edit` becomes the dedicated edit route.
- `/panel/provider/announcements/new` stays as create.
- The view page's Edit button navigates to the `/edit` child route.

Consolidate create and edit onto ONE shared form.

- Extract a single `AnnouncementForm` component on the `panel.provider.*` namespace.
- The form branches on the presence of an `id`: edit mode fetches the announcement by id, prefills every field, and submits via `update` (carrying the `id`); create mode submits via `create`.
- Same inputs, same positions, same validation rules. There must not be two different experiences for the same thing.
- Delete the duplicate `panel.dashboard.*` new form and the narrow `ProviderDashboardEditFormFields` component.
- The shared form must preserve the full PRD-v10 authoring field set (provider contact defaults/overrides, CTA targets, category/tags/money primitives, image cropper). Consolidation must not narrow that field set.

Make field-level lockability a built-in pattern, not a hardcoded assumption.

- For MVP, every field is editable in edit mode except identity fields (e.g. `id`). Category stays editable for now.
- The form must carry a per-field policy seam (a field-policy/config map or mode-aware disabled flags) so a specific field can be frozen later with a minimal, localized change — no wide refactor. This is an acceptance criterion, not an aspiration.

Rebuild the read-only detail page facts-first.

- Title plus key facts (category, price, status, condo, contact) sit at the top, above the fold. The strongest rule: a provider must not scroll to reach key info.
- The per-announcement image (`announcement.imageUrl`, the cropper output) is demoted from a full-width 4:3 hero to a constrained cover beside or above the facts. Keep the 4:3 aspect (matches the create cropper, no re-crop), cap roughly 280–320px max width, rounded, object-cover.
- Remove the right-rail "summary" mini-card. The status badge, tag chips, and contact card already carry that information; the counts are redundant.

Keep analytics on the view page, below the primary facts block.

- Analytics sits below the facts block (below the fold).
- Keep the three metric cards (impressions / interactions / conversion) always visible.
- Shrink the bar chart from a fixed 320px to roughly 200–220px. The metric cards carry the at-a-glance value; the chart is secondary.

## User Stories

1. As a provider, I want the announcement detail page to show its key facts at the top, so that I can read category, price, status, condo, and contact without scrolling.
2. As a provider, I want the detail page to be read-only, so that I can review an announcement without accidentally entering an edit state.
3. As a provider, I want a clear Edit button on the detail page, so that I can move into editing intentionally.
4. As a provider, I want editing to happen on its own dedicated screen, so that viewing and editing feel like distinct, deliberate actions.
5. As a provider, I want the edit screen to feel like the same experience as creating an announcement, so that I am not relearning a different layout to change my content.
6. As a provider, I want create and edit to use the exact same inputs in the same positions with the same rules, so that nothing behaves inconsistently between the two flows.
7. As a provider, I want the edit screen to prefill every field from my existing announcement, so that I only change what I intend to change.
8. As a provider, I want my edits to save through the update path while creation saves through the create path, so that the right operation runs without me thinking about it.
9. As a provider, I want all my announcement fields editable after creation, so that I do not have to recreate an announcement to fix it.
10. As a provider, I want identity fields like the announcement id to stay non-editable, so that I cannot corrupt the record's identity.
11. As a provider, I want the announcement image shown as a tidy constrained cover, so that it supports the facts instead of dominating the page.
12. As a provider, I want the image to keep its 4:3 crop, so that it matches what I cropped at creation and is never re-cropped.
13. As a provider, I want redundant summary counts removed from the detail page, so that I am not reading the same status, tag, and contact information twice.
14. As a provider, I want the analytics metric cards always visible, so that I can see impressions, interactions, and conversion at a glance.
15. As a provider, I want the analytics chart to take less vertical space, so that it does not overwhelm the metrics it supports.
16. As a provider, I want analytics placed below the primary facts, so that management facts come first and trend detail comes second.
17. As a developer, I want one shared `AnnouncementForm` driven by the presence of an id, so that create and edit cannot drift apart.
18. As a developer, I want the duplicate dashboard-namespace new form and the narrow edit-fields component deleted, so that there is a single canonical authoring form.
19. As a developer, I want a per-field lockability seam built into the form, so that freezing a specific field later is a minimal localized change rather than a refactor.
20. As a developer, I want view, edit, and create separated into distinct routes, so that analytics no longer has to share a column with the edit form.
21. As a developer, I want the shared form to preserve the full PRD-v10 authoring field set, so that consolidation does not regress contact defaults/overrides, CTA, category, tags, or money primitives.
22. As a developer, I want the public announcement surface left untouched, so that no analytics or edit affordance leaks into the resident-facing page.
23. As a provider, I want the create flow to keep its image cropper, contact section, and CTA section intact after the shared-form extraction, so that creating an announcement is not regressed.

## Implementation Decisions

- The provider MANAGEMENT surface and the PUBLIC surface are separate and stay separate. This packet targets only the provider management view (`panel.provider.announcements.$id`). The public view (`_portal.anuncios.$id`) is untouched: no analytics or edit affordances may leak into it.
- View and edit are separated by route, not by column-swap. The `$id` route is a pure read-only view; `$id/edit` is the dedicated edit route; `new` remains create. The view page's Edit button navigates to the `/edit` child.
- Create and edit share one `AnnouncementForm` component on the `panel.provider.*` namespace, branching on the presence of an `id`. Edit mode fetches by id, prefills all fields, and submits via `update` (carrying the id); create mode submits via `create`. Inputs, positions, and validation rules are identical across both modes.
- The duplicate `panel.dashboard.*` new form and the narrow `ProviderDashboardEditFormFields` component are deleted. `panel.provider.*` is the canonical namespace for authoring.
- The shared form preserves the full PRD-v10 authoring field set: provider contact defaults and announcement overrides, CTA targets, structural category, structured tags, money-aware price, and the image cropper. Consolidation must not narrow this set.
- Field-level lockability is a built-in pattern: a per-field policy/config map or mode-aware disabled flags. For MVP, all fields are editable in edit mode except identity fields (id); category stays editable. The seam must let a specific field be frozen later with a minimal, localized change. This is an explicit acceptance criterion.
- The read-only detail page is facts-first. Title plus key facts (category, price, status, condo, contact) render at the top, above the fold. The provider must not scroll to reach key info.
- The per-announcement image is demoted from a full-width 4:3 hero to a constrained cover beside or above the facts: keep 4:3 aspect (no re-crop), cap roughly 280–320px max width, rounded, object-cover. The exact cap (280 vs 320) and beside-vs-above behavior at smaller breakpoints is responsive polish to settle in implementation.
- The right-rail "summary" mini-card is removed. Status badge, tag chips, and contact card already carry that information; the counts are redundant.
- Analytics stays on the view page, below the primary facts block (below the fold). The three metric cards (impressions / interactions / conversion) remain always visible. The bar chart shrinks from a fixed 320px to roughly 200–220px.
- The shared-form extraction touches create, edit, and two namespaces. Sequence the work so the create flow (with its image cropper, contact section, and CTA section) is not regressed while edit is wired in.
- Two defects are already resolved in code and are out of re-planning: the debug `console.log` in the route (commit d42373d) and tag editability (`tags: form.tags` saved; edit form has `tags` + `onTagsChange`). Treat both as done.
- Keep the project's glossary and business framing: the product is a showcase/discovery layer connecting residents directly to providers. All visible UI strings go through i18next `t()` with keys added to both pt and en locale files.

## Testing Decisions

- Good tests verify externally visible behavior and route/contract boundaries, not widget internals. For this packet that means asserting the facts-first hierarchy, the view/edit route split, create/edit field parity through the shared form, and analytics placement/visibility.
- The highest useful seam is the route boundary: the read-only `$id` view route, the `$id/edit` route, and the `new` route. Prefer route-level/component integration tests over unit tests of low-level form wiring. Reuse the project's existing route-level panel tests (RTL) and existing Playwright patterns rather than introducing test-only abstractions.
- Add tests proving the shared `AnnouncementForm` behaves correctly in both modes: edit mode prefills every field from the fetched announcement and submits via `update` carrying the id; create mode submits via `create`. Both modes expose the same inputs and the same validation rules.
- Add a test that locks the field-policy seam: identity fields (id) are not editable, and a representative field can be marked frozen through the policy/config without restructuring the form. This protects the lockability acceptance criterion against regression.
- Add view-page tests asserting the facts-first contract: title plus key facts (category, price, status, condo, contact) render in the primary block above the analytics block, the image renders as a constrained 4:3 cover (not a full-width hero), and the redundant summary mini-card is absent.
- Add analytics tests asserting the three metric cards are always visible and that the chart occupies the reduced height band rather than the old fixed 320px.
- Add a regression guard that the create flow keeps its image cropper, contact section, and CTA section after the shared-form extraction.
- Add a boundary test that the public announcement surface (`_portal.anuncios.$id`) exposes no analytics or edit affordance.
- Playwright is appropriate for the create and edit end-to-end flows with seeded provider data, including visual assertions that protect the facts-first layout and the demoted image cover against regressions. Seed data is part of the test contract; do not use skipped tests as a substitute for setup. Be aware of cross-file `mock.module` leakage when reading a full `bun test` run — verify suspicious failures per-file.

## Out of Scope

- The public announcement page (`_portal.anuncios.$id`) — no layout, analytics, or edit changes there.
- Re-planning the two already-fixed defects (debug `console.log`, tag editability).
- Deciding the downstream/analytics implications of changing `category` post-publish. MVP leaves category editable; the field-lock seam must make freezing it later cheap, but the freeze itself is deferred.
- Expanding or redesigning the PRD-v10 authoring model (contact defaults/overrides, CTA model, category/tag/money primitives). This packet reuses that model through the shared form; it does not change it.
- A broader panel-shell or navigation redesign.
- Pixel-perfect parity beyond the requirement that create and edit expose the same inputs, positions, and rules through the shared form.

## Further Notes

- The view/edit entanglement existed because the original page swapped its right-hand column between the analytics panel and the edit form, making view and edit mutually exclusive on one route. Splitting edit onto its own route is what frees the view page to be a clean facts-first read-only surface with analytics below.
- The shared `AnnouncementForm` is the same form PRD-v10 established for create; this packet's contribution is making edit ride the same component via id-presence branching, plus the field-policy seam. It must not regress the PRD-v10 field set.
- The exact image cover cap (280 vs 320px) and whether it sits beside or above the facts at smaller breakpoints is deliberately left as responsive implementation polish.
- Source grilling: `.plan/grilling/2026-06-21-05-announcement-detail-edit-and-analytics-grilling.md`. Source handoff: `.plan/handoffs/grill-to-prd-announcement-detail-edit-and-analytics.md`. Source packet: `.plan/sessions/panel-bugs-style-issues/05-announcement-detail-edit-and-analytics.md`.
