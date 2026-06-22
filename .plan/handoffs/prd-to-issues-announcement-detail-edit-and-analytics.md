# Handoff: PRD To Issues

Date: 2026-06-22
Source PRD: .plan/prds/PRD-v11-announcement-detail-edit-and-analytics.md
Status: ready-for-issues
Scope: Provider-facing announcement detail/edit/analytics surface in the `panel.provider.*` namespace. Split view from edit by route, consolidate create/edit onto one shared `AnnouncementForm`, rebuild the `$id` detail page facts-first, and trim/resize the analytics block. Public `_portal.anuncios.$id` is OUT OF SCOPE.

## Locked Decisions

- Routes: `/panel/provider/announcements/$id` = read-only view, `/$id/edit` = edit, `/new` = create. View page Edit button navigates to `/edit`.
- One shared `AnnouncementForm` on `panel.provider.*`, branching on presence of `id`: edit fetches by id + prefills + `update` (carries id); create submits `create`. Same inputs, positions, validation in both modes.
- Delete the duplicate `panel.dashboard.*` new form and the narrow `ProviderDashboardEditFormFields` component.
- Field-lock is a built-in PATTERN (per-field policy/config map or mode-aware disabled flags). MVP: all fields editable except identity (id); category stays editable. Freezing a field later must be a minimal localized change. This is an acceptance criterion.
- Shared form preserves the full PRD-v10 authoring field set (provider contact defaults/overrides, CTA targets, category/tags/money primitives, image cropper). No narrowing.
- Detail page is facts-first: title + key facts (category/price/status/condo/contact) above the fold; provider must not scroll to reach key info.
- Image demoted from full-width 4:3 hero to constrained cover beside/above facts: keep 4:3 (no re-crop), cap ~280–320px max width, rounded, object-cover.
- Remove the right-rail "summary" mini-card (status/contact-count/tag-count) — redundant.
- Analytics below the facts block; keep 3 metric cards always visible; shrink chart from 320px to ~200–220px.

## Decomposition Constraints

- Sequence the shared-form extraction so the create flow (image cropper, contact section, CTA section) is never regressed while edit wiring lands.
- Keep public vs management separation a hard boundary: no analytics/edit affordance may leak to `_portal`.
- Treat already-fixed defects as done: debug `console.log` (commit d42373d) and tag editability (`tags: form.tags` saved; edit form has `tags` + `onTagsChange`). Do not re-plan them.
- The field-lock seam must be an explicit slice/acceptance criterion, not folded silently into form work.
- All visible strings via i18next `t()`, keys added to both pt and en locale files.
- Tests at the highest seam: route-level RTL panel tests + existing Playwright patterns; verify `bun test` failures per-file due to cross-file `mock.module` leakage.

## Out Of Scope

- Public announcement page (`_portal.anuncios.$id`).
- Changing the PRD-v10 authoring model itself (this packet reuses it via the shared form).
- Deciding post-publish `category`-change implications (deferred; seam must make freezing cheap later).
- Broader panel-shell/navigation redesign.
- Pixel-perfect create/edit parity beyond identical inputs/positions/rules.

## Next Step

- Run `luna-to-issues` using this handoff plus the canonical PRD.
