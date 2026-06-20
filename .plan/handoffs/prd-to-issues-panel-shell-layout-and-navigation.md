# Handoff: PRD To Issues

Date: 2026-06-19
Source PRD: .plan/prds/PRD-v9-panel-shell-layout-and-navigation.md
Status: ready-for-issues
Scope: Canonical provider-panel shell contract (one content container with `default/list`, `centered-form`, `full-bleed` variants), stronger sidebar/top-bar chrome, one shared announcement presentation primitive (`dashboard-card`/`detail-header`/`public-card`), shell-adjacent localization, and the sidebar collapse regression fix.

## Locked Decisions

- One canonical shared content container owned at the `panel.dashboard` layout level replaces the bare `<Outlet />`. It owns max-width + padding; child routes stop setting their own width/padding.
- Container is ONE primitive with three explicit variants: `default/list`, `centered-form`, `full-bleed`. Pages select a variant; they never invent a shell.
- Exact max-width/padding token values per variant are settled in implementation against the dashboard benchmark — the contract is "one container with named variants," not the numbers.
- Sidebar/top-bar chrome is strengthened, not redesigned: sidebar header = brand + active section/condo context + primary utility; top bar = section title/breadcrumb beyond trigger + theme/language toggles.
- ONE shared announcement presentation primitive is introduced now, with variant slots `dashboard-card`, `detail-header`, `public-card`. This packet owns its existence and variant boundaries only.
- Localization this pass is scoped to shell/nav-adjacent surfaces: sidebar, top bar, New Announcement route copy, public provider-profile copy (loading state + back-to-showcase link).
- Sidebar collapse regression is a concrete implementation-level fix with verification (toggle works + persists across reload). Likely cause: localStorage init or sidebar-trigger API drift in the shared panel layout; root cause asserted, not proven — confirm during build.
- The dashboard stays the visual reference benchmark for spacing/framing.

## Decomposition Constraints

- Keep the shared content container as one vertical slice / foundation epic; per-route migration (removing width/padding overrides, adopting a variant) depends on it.
- The announcement primitive slice must stop at variant boundaries — do not pull in deep card/detail/edit/analytics tuning.
- The sidebar collapse fix is its own concrete task with a regression test, separate from the chrome-strengthening task.
- Chrome strengthening (sidebar header + top bar) is polish within existing structure, not a redesign epic.
- Localization tasks must stay scoped to the called-out shell-adjacent surfaces; do not spawn a codebase-wide i18n sweep here.
- Tests should reuse the highest practical seam (route/layout render boundary), following v8 and v5/v6 panel test prior art.

## Out Of Scope

- Deep announcement authoring model, dashboard-card tuning, detail/edit/analytics surfaces — packets 04, 05, 03.
- Provider-profile branding and account-page IA.
- Moderation reporting workflow.
- Full PT/EN codebase localization sweep — dedicated i18n task.
- Speculative full sidebar/top-bar redesign.
- Locking exact max-width/padding token values as contract.

## Next Step

- Run `luna-to-issues` using this handoff plus the canonical PRD.
