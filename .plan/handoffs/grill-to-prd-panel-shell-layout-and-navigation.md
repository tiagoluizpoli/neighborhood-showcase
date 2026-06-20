# Handoff: Grilling To PRD

Date: 2026-06-19
Source Session: .plan/grilling/2026-06-19-01-panel-shell-layout-and-navigation-grilling.md
Source Packet: .plan/sessions/panel-bugs-style-issues/01-panel-shell-layout-and-navigation.md
Status: ready-for-prd
Scope: Canonical provider-panel shell contract (width, padding, header/sidebar chrome, content framing), shared announcement presentation primitive, localization scope for shell-adjacent surfaces, and the sidebar collapse regression.

## Stable Decisions

- The provider-panel shell uses ONE canonical shared content container owned by the dashboard namespace (`panel.dashboard.tsx` level), not a bare `<Outlet />`.
  - The container owns canonical max-width and padding.
  - Child routes stop setting their own width/padding (no more `px-6 py-8` full-width vs `mx-auto max-w-4xl` divergence).
- The container is a single primitive with explicit variants:
  - `default/list` — standard framed full-width content (list/index routes).
  - `centered-form` — focused create/edit forms (e.g. New Announcement).
  - `full-bleed` — intentional edge-to-edge surfaces.
  - Pages select a variant; they do not invent bespoke shells.
- Sidebar and top-bar chrome get a stronger treatment (not a full redesign):
  - Sidebar header gains hierarchy beyond brand text: brand + active section/condo context + primary utility.
  - Top bar gains a section title / breadcrumb beyond the bare trigger + theme/language toggles.
- A single shared announcement presentation primitive is introduced now, with explicit variant slots:
  - `dashboard-card`, `detail-header`, `public-card`.
  - The primitive's existence and variant boundaries are owned by this packet.
- Localization in this pass is scoped to shell/nav-adjacent surfaces only:
  - Sidebar, top bar, and the called-out hardcoded copy in `panel.dashboard.announcements.new.tsx` and `_portal.providers.$id.tsx`.
- The sidebar collapse button regression (Issue 1) is in scope as an implementation-level fix.
  - Likely cause: localStorage init or `SidebarTrigger` API drift in `panel.tsx`.

## Open Tensions

- Exact canonical max-width and padding token values for each container variant are not fixed here; the contract is "one container with variants," not the precise numbers.
- Deep detail/edit/analytics tuning of announcement surfaces is deliberately deferred to packets 04 (dashboard/cards), 05 (detail/edit/analytics), and 03 (provider config/public profile). The shared primitive must not pre-empt those decisions beyond its variant boundaries.
- The full PT/EN localization sweep across the rest of the codebase is deferred to a dedicated i18n task and is out of scope for this packet.
- Root-cause of the collapse regression is asserted, not yet proven; implementation must confirm whether it is state wiring, localStorage init, or component API drift.

## PRD Expectations

- Codify the shared content container as the single source of layout truth for provider routes, with the three named variants.
- Remove per-route width/padding overrides; route components consume the container variant instead.
- Specify the stronger sidebar/top-bar chrome contract (header context + utility, top-bar section title/breadcrumb) without sliding into a speculative full redesign.
- Define the shared announcement primitive and its `dashboard-card` / `detail-header` / `public-card` variant boundaries; explicitly defer deeper surface work to packets 04/05/03.
- Scope localization work to shell/nav-adjacent surfaces this pass; route a full sweep to a separate i18n task.
- Treat the sidebar collapse fix as a concrete implementation task with verification, not a redesign.
- Keep the dashboard as the visual reference benchmark for spacing/framing throughout.

## Next Step

- Run `luna-to-prd` using this handoff plus the canonical grilling session.
