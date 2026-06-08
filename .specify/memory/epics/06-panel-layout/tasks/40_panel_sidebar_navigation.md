---
type: feature
epic: 06-panel-layout
status: blocked
blocked-by: null
---

## What to Build

Replace the current top header bar in the authenticated panel with the official shadcn `Sidebar` component, featuring collapsible mode, role-grouped navigation, and mobile off-canvas drawer.

1. **Install and integrate shadcn Sidebar**: Use the official shadcn `Sidebar` component as the primary navigation for the `/panel/*` layout.
2. **Collapsible mode**: Full sidebar with labels when expanded, icon-only rail when collapsed. User can toggle.
3. **Role-grouped navigation**: Navigation items grouped under labeled headers — "Provedor" (Dashboard, Meus Anúncios), "Moderação" (if moderator), "Administração" (if admin). Only groups relevant to the user's current roles are rendered.
4. **Mobile behavior**: Off-canvas drawer sliding from the left, triggered by a hamburger menu icon (standard shadcn Sidebar mobile pattern).
5. **Panel header**: Clean top bar with space for the user avatar menu (to be implemented in Slice 5).

## Acceptance Criteria

- [x] shadcn `Sidebar` component is the primary navigation for all `/panel/*` routes
- [x] Sidebar is collapsible (full ↔ icon-only rail)
- [x] Navigation items are grouped by role ("Provedor", "Moderação", "Administração")
- [x] Only role-relevant groups are visible to the current user
- [x] Mobile: sidebar renders as an off-canvas drawer with hamburger trigger
- [x] Old top header bar is removed from the panel layout
- [x] All panel routes remain functional and navigable

## Sub-Tasks

_Sub-tasks will be defined when this task is executed._

---

<!-- INDEX SYNC: After completing a sub-task, update the parent
epic.md child task checklist AND .specify/memory/index.md in the
same turn. Never skip this sync step. -->
