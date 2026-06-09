---
type: feature
epic: 06-panel-layout
status: completed
blocked-by: null
---

## What to Build

Persist sidebar collapsed/expanded state across page reloads using `localStorage` key `sidebar:state`. `SidebarProvider` `defaultOpen` reads from localStorage. Toggle via `useSidebar` `setOpen` callback.

## Context

- Depends on Slice 1 (Sidebar Foundation)
- `SidebarProvider` accepts `defaultOpen` prop
- `useSidebar()` hook provides `setOpen` for the toggle callback
- Key: `sidebar:state`, value: `true` (open) / `false` (collapsed)

## Acceptance Criteria

- [ ] Sidebar is open by default on first load
- [ ] Collapsing/expanding the sidebar persists to localStorage key 'sidebar:state'
- [ ] Page reload restores the last collapsed/expanded state

## Sub-Tasks

### Sub-task 1: Wire SidebarProvider defaultOpen to localStorage

**What to do:** In `panel.tsx`, pass `defaultOpen={localStorage.getItem('sidebar:state') !== 'false'}` to `SidebarProvider`. On first load with no key, sidebar is open by default.

**Files to touch:** `apps/web/src/routes/panel.tsx`

**Verification:** First load shows sidebar open. State persists across reload.

### Sub-task 2: Persist state on toggle

**What to do:** In the sidebar toggle handler (hooked to `SidebarTrigger` or a toggle button), call `localStorage.setItem('sidebar:state', open)` where `open` is the new state.

**Files to touch:** `apps/web/src/routes/panel.tsx`

**Verification:** Toggling sidebar updates localStorage. Reloading preserves the last state.

---

<!-- INDEX SYNC: After completing a sub-task, update the parent epic.md child task checklist AND .specify/memory/index.md in the same turn. Never skip this sync step. -->
