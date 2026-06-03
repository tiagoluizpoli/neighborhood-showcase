# Slice 4: Panel Sidebar Navigation

## Parent

PRD-v2-backlog-overhaul (Item 12)

## What to build

Replace the current top header bar in the authenticated panel with the official shadcn `Sidebar` component, featuring collapsible mode, role-grouped navigation, and mobile off-canvas drawer.

1. **Install and integrate shadcn Sidebar**: Use the official shadcn `Sidebar` component as the primary navigation for the `/panel/*` layout.
2. **Collapsible mode**: Full sidebar with labels when expanded, icon-only rail when collapsed. User can toggle.
3. **Role-grouped navigation**: Navigation items grouped under labeled headers — "Provedor" (Dashboard, Meus Anúncios), "Moderação" (if moderator), "Administração" (if admin). Only groups relevant to the user's current roles are rendered.
4. **Mobile behavior**: Off-canvas drawer sliding from the left, triggered by a hamburger menu icon (standard shadcn Sidebar mobile pattern).
5. **Panel header**: Clean top bar with space for the user avatar menu (to be implemented in Slice 5).

## Acceptance criteria

- [ ] shadcn `Sidebar` component is the primary navigation for all `/panel/*` routes
- [ ] Sidebar is collapsible (full ↔ icon-only rail)
- [ ] Navigation items are grouped by role ("Provedor", "Moderação", "Administração")
- [ ] Only role-relevant groups are visible to the current user
- [ ] Mobile: sidebar renders as an off-canvas drawer with hamburger trigger
- [ ] Old top header bar is removed from the panel layout
- [ ] All panel routes remain functional and navigable

## Blocked by

- #39 (Portal/Panel Route Restructuring & Layout Separation)
