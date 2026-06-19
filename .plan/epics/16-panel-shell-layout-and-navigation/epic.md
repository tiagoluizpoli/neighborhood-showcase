---
type: epic
id: E-16
name: "Panel Shell, Layout, and Navigation"
status: in-progress
blocked-by: []
---

## About this Epic

Establish one canonical provider-panel shell contract owned at the panel layout level and make every provider child route consume it instead of inventing its own width, padding, chrome, and copy. Introduce a single content container with three named variants, strengthen (not redesign) sidebar/top-bar chrome, fix the sidebar collapse regression with a real regression test, introduce one shared announcement presentation primitive at its variant boundaries, and localize the called-out shell-adjacent copy. The dashboard remains the visual reference benchmark for spacing and framing.

## Context

Canonical PRD: `.plan/prds/PRD-v9-panel-shell-layout-and-navigation.md`

Canonical PRD handoff: `.plan/handoffs/prd-to-issues-panel-shell-layout-and-navigation.md`

Route reality after v8: the canonical Provider namespace is `/panel/provider/*`, whose group layout `apps/web/src/routes/panel.provider.tsx` currently renders a bare `<Outlet />`. The outer shell (sidebar + top bar) lives in `apps/web/src/routes/panel.tsx` and uses the shared shadcn `Sidebar`/`SidebarTrigger`/`SidebarProvider` primitives. `/panel/dashboard` is now a redirect-only shim. The PRD language says "panel.dashboard layout level"; that language predates the v8 route migration, so the content container lands at the canonical provider layout — implementation confirms the exact seam.

Shared-shell tasks (T-16-03 collapse fix, T-16-04 chrome, T-16-06 localization) all touch `panel.tsx` and are serialized to cut merge churn. The container-migration task depends on the container existing. The announcement primitive is independent.

## Child Tasks

| Task ID | Task | Status | Blocked By | File |
| --- | --- | --- | --- | --- |
| T-16-01 | Canonical content container primitive | done | — | `.plan/epics/16-panel-shell-layout-and-navigation/tasks/01-canonical-content-container.md` |
| T-16-02 | Migrate provider routes to container variants | done | — | `.plan/epics/16-panel-shell-layout-and-navigation/tasks/02-migrate-routes-to-variants.md` |
| T-16-03 | Sidebar collapse regression fix | done | — | `.plan/epics/16-panel-shell-layout-and-navigation/tasks/03-sidebar-collapse-regression-fix.md` |
| T-16-04 | Strengthen sidebar header and top bar chrome | done | — | `.plan/epics/16-panel-shell-layout-and-navigation/tasks/04-strengthen-shell-chrome.md` |
| T-16-05 | Shared announcement presentation primitive | done | — | `.plan/epics/16-panel-shell-layout-and-navigation/tasks/05-announcement-presentation-primitive.md` |
| T-16-06 | Shell-adjacent localization | in-progress | — | `.plan/epics/16-panel-shell-layout-and-navigation/tasks/06-shell-adjacent-localization.md` |

---

<!-- INDEX SYNC: After completing or modifying any child task file, run
.plan/helper-scripts/sync-state.sh and update .plan/index.md in the same turn. -->
