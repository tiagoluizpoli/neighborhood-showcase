# PRD-v9 — Panel Shell, Layout, and Navigation

## Problem Statement

The provider panel has no canonical shell. The shared layout owns sidebar and top-bar behavior, but the dashboard namespace renders only a bare `<Outlet />` with no content container. As a result, every child route invents its own width, padding, and framing conventions. Concretely, "My Announcements" renders a full-width `px-6 py-8` frame while "New Announcement" renders a centered `mx-auto max-w-4xl` form, even though both are sibling provider surfaces. The dashboard is the user's declared visual benchmark for spacing and framing, yet sibling pages drift from it because nothing at the layout level enforces the benchmark.

Three more shell-quality problems compound the drift:

1. The sidebar collapse button no longer works. This is a shell-level regression that affects every authenticated panel route, not a page-local annoyance.
2. The sidebar header and top bar are visually thin. The sidebar header is brand text only, with no section/condo context or utility. The top bar is a bare sidebar trigger plus theme and language toggles, with no section title or breadcrumb. Users experience this weakness on every panel route.
3. Announcement presentation is inconsistent across surfaces. The dashboard card, the detail header, and the public profile card each appear to use different display logic, so the same domain object looks different depending on where it is shown.

Cross-surface localization debt also leaks into shell-adjacent copy: visible strings are still hardcoded in Portuguese in route components such as the New Announcement page and the public provider profile, and navigation labels mix PT and EN. This degrades the coherence of the shell and navigation experience.

The root problem is not one broken button or one mis-padded page. The shared shell is too permissive: it has no strong content-shell contract, so child routes keep reinventing width, padding, chrome, and copy.

## Solution

Establish one canonical provider-panel shell contract, owned at the dashboard-namespace layout level, and make every provider child route consume it instead of inventing its own.

- Introduce a single shared content container owned at the `panel.dashboard` layout level, replacing the bare `<Outlet />`. This container is the single source of layout truth: it owns canonical max-width and padding. Child routes stop setting their own width and padding.
- The container is one primitive with explicit variants, not a family of bespoke shells:
  - `default/list` — standard framed full-width content for list and index routes.
  - `centered-form` — focused create/edit forms, such as New Announcement.
  - `full-bleed` — intentional edge-to-edge surfaces.
  - A page selects a variant; it never invents its own frame.
- Strengthen, but do not redesign, the shell chrome:
  - The sidebar header gains hierarchy beyond brand text: brand plus active section / condo context plus a primary utility affordance.
  - The top bar gains a section title or breadcrumb beyond the bare trigger and the theme/language toggles.
- Introduce one shared announcement presentation primitive now, with explicit variant slots: `dashboard-card`, `detail-header`, and `public-card`. This packet owns the primitive's existence and its variant boundaries. Deep tuning of each surface is deferred.
- Scope localization in this pass to shell- and navigation-adjacent surfaces only: the sidebar, the top bar, and the called-out hardcoded copy in the New Announcement route and the public provider profile route. A full PT/EN codebase sweep is routed to a separate i18n task.
- Fix the sidebar collapse regression as a concrete implementation task with verification, not a redesign.

The dashboard remains the visual reference benchmark for spacing and framing throughout.

## User Stories

1. As a provider, I want every provider route to share one canonical width and padding, so that the panel feels consistent as I move between pages.
2. As a provider, I want list and index pages to use the same framed full-width layout, so that "My Announcements" no longer looks different from its sibling pages.
3. As a provider, I want create and edit forms to use a focused centered layout, so that the New Announcement form reads as a deliberate variant rather than an accidental divergence.
4. As a provider, I want intentional edge-to-edge surfaces to be a named option, so that full-bleed pages are a deliberate choice and not a one-off hack.
5. As a provider, I want the dashboard's spacing to be the benchmark every other page follows, so that the panel matches the reference I consider correct.
6. As a provider, I want the sidebar collapse button to work reliably, so that I can control the navigation chrome on every panel route.
7. As a provider, I want my collapsed/expanded sidebar preference to persist across reloads, so that the panel respects how I like to work.
8. As a provider, I want the sidebar header to show my active section and condo context, so that I always know where I am in the panel.
9. As a provider, I want a primary utility affordance in the sidebar header, so that the header is more than a brand label.
10. As a provider, I want the top bar to show a section title or breadcrumb, so that I have orientation beyond the bare trigger and toggles.
11. As a provider, I want announcements to look coherent across the dashboard, the detail view, and my public profile, so that the same announcement does not appear to be three different components.
12. As a provider, I want one shared announcement primitive with clear variant slots, so that future work extends a single component instead of forking new ones.
13. As a visitor viewing a public provider profile, I want announcement cards to use the same shared presentation primitive, so that the public surface stays visually consistent with the panel.
14. As a Portuguese-speaking user, I want shell and navigation copy to be localized consistently, so that the sidebar and top bar do not mix languages.
15. As a user, I want the previously hardcoded Portuguese copy on the New Announcement page to flow through the localization system, so that the page respects my language preference.
16. As a user, I want the hardcoded copy on the public provider profile (loading state and back-to-showcase link) to be localized, so that navigation-adjacent strings are consistent.
17. As a developer, I want the dashboard namespace to own the canonical content container, so that there is one place to change panel layout instead of many route files.
18. As a developer, I want child routes to stop setting their own width and padding, so that layout drift cannot be reintroduced at the route level.
19. As a developer, I want the content container exposed as one primitive with named variants, so that adding a page means choosing a variant, not authoring a shell.
20. As a developer, I want the sidebar collapse fix to be root-caused and verified, so that the regression does not silently return.
21. As a developer, I want the announcement primitive's variant boundaries documented, so that deeper card/detail/analytics work in later packets does not violate the contract.
22. As a developer, I want localization in this pass scoped to shell-adjacent surfaces, so that the change stays reviewable and does not balloon into a full i18n sweep.
23. As a developer, I want a clear out-of-scope boundary against deep announcement and provider-profile redesign, so that this packet does not pre-empt packets 03, 04, and 05.

## Implementation Decisions

- The provider-panel shell uses one canonical shared content container owned at the dashboard-namespace layout level (the `panel.dashboard` layout), replacing the current bare `<Outlet />`. This container is the single source of layout truth for provider routes.
- The container owns canonical max-width and padding. Child routes no longer set their own width or padding; the existing per-route overrides (full-width `px-6 py-8` vs centered `mx-auto max-w-4xl`) are removed in favor of container-owned values.
- The container is a single primitive with three explicit variants: `default/list` (standard framed full-width content for list/index routes), `centered-form` (focused create/edit forms such as New Announcement), and `full-bleed` (intentional edge-to-edge surfaces). Pages select a variant; they do not invent bespoke shells.
- The exact max-width and padding token values per variant are an implementation detail to be settled during build, using the dashboard as the visual benchmark. The locked contract is "one container with named variants," not the precise numbers.
- Shell chrome is strengthened, not redesigned. The sidebar header gains hierarchy: brand plus active section / condo context plus a primary utility affordance. The top bar gains a section title or breadcrumb beyond the bare trigger and the theme/language toggles. This is polish within the existing structure, not a speculative full redesign.
- One shared announcement presentation primitive is introduced now, with explicit variant slots: `dashboard-card`, `detail-header`, and `public-card`. This packet owns the primitive's existence and its variant boundaries only. Deep detail/edit/analytics and dashboard-card tuning are deferred to later packets and must not be pre-empted here beyond the variant boundaries.
- Localization in this pass is scoped to shell- and navigation-adjacent surfaces only: the sidebar, the top bar, and the called-out hardcoded copy in the New Announcement route and the public provider profile route. The full PT/EN codebase sweep is routed to a dedicated i18n task and is not part of this PRD.
- The sidebar collapse regression is an implementation-level fix with verification. The likely cause is localStorage initialization or sidebar-trigger API drift in the shared panel layout, but the root cause is asserted, not proven; implementation must confirm whether it is state wiring, localStorage init, or component API drift before claiming the fix.
- The dashboard remains the canonical visual reference benchmark for spacing and framing across all of the above.

## Testing Decisions

- Good tests verify externally visible behavior, not implementation details: which layout frame a route renders, whether the sidebar collapse toggle actually toggles and persists, whether shell chrome shows the expected section context, and whether previously hardcoded strings now resolve through localization.
- The shared content container is the primary module under test. Tests should assert that list/index routes render the `default/list` variant, that create/edit routes render the `centered-form` variant, and that routes no longer carry their own width/padding overrides.
- The sidebar collapse fix must have a regression test that proves the toggle changes sidebar state and that the preference persists across a reload, so the regression cannot silently return.
- The shared announcement primitive should be tested at its variant boundaries: that `dashboard-card`, `detail-header`, and `public-card` render the correct variant in their respective surfaces, without asserting deep visual details reserved for later packets.
- Localization tests should confirm that the called-out shell-adjacent strings (New Announcement title/subtitle, public-profile loading state and back-to-showcase link, sidebar/top-bar labels) resolve through the i18n system rather than rendering hardcoded copy.
- Prior art: follow the existing panel/route test patterns established in the role-access and route-architecture work (v8) and earlier panel layout PRDs (v5/v6), reusing the highest practical seam — the route/layout render boundary — rather than introducing new low-level seams.
- Visual/structural assertions on the dashboard-as-benchmark are appropriate where runtime correctness alone could miss a framing regression.

## Out of Scope

- Deep announcement authoring model, dashboard-card detail tuning, announcement detail/edit/analytics surfaces — deferred to packets 04, 05, and 03.
- Provider-profile branding decisions and account-page information architecture.
- Moderation reporting workflow.
- A full PT/EN localization sweep across the rest of the codebase — routed to a dedicated i18n task.
- A speculative full redesign of the sidebar/top-bar chrome beyond the agreed stronger treatment.
- Fixing the exact max-width/padding token values as a contract; those are tuned during implementation against the dashboard benchmark.

## Further Notes

- The handoff explicitly leaves some tensions open: the precise container variant token values, and confirmation of the collapse regression's true root cause. Implementation resolves both; the PRD locks the contracts, not the numbers.
- This packet defines the shared frame rules first so later packets (03/04/05) do not re-decide spacing, sidebar chrome, and announcement framing per page.
- The shared announcement primitive must not grow beyond its variant boundaries in this pass; later packets own the deep tuning.
- Keep the dashboard as the visual reference benchmark throughout build and review.
- Source grilling: `.plan/grilling/2026-06-19-01-panel-shell-layout-and-navigation-grilling.md`. Source handoff: `.plan/handoffs/grill-to-prd-panel-shell-layout-and-navigation.md`. Source packet: `.plan/sessions/panel-bugs-style-issues/01-panel-shell-layout-and-navigation.md`.
