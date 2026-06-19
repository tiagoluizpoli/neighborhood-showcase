---
type: task
id: T-16-03
epic: E-16
status: ready
blocked-by: []
default-model: medium
---

## What to Build

Fix the sidebar collapse regression that affects every authenticated panel route: the collapse button no longer toggles the sidebar. Root-cause the failure (asserted, not proven), apply a concrete implementation-level fix, and add a regression test proving the toggle changes sidebar state and that the collapsed/expanded preference persists across a reload. This is not a redesign.

## Context

The outer shell lives in `apps/web/src/routes/panel.tsx` and uses the shared shadcn `Sidebar`, `SidebarTrigger`, `SidebarProvider`, and `SidebarRail` primitives. The likely cause is `SidebarProvider` open-state init (localStorage/cookie) or `SidebarTrigger`/`useSidebar` API drift, but this is asserted, not proven — confirm whether it is state wiring, persistence init, or component API drift before claiming the fix. This is the first of the three serialized shell-touching tasks (03 → 04 → 06).

## Acceptance Criteria

- [ ] The sidebar collapse button toggles the sidebar on panel routes.
- [ ] The collapsed/expanded preference persists across a page reload.
- [ ] The true root cause is confirmed (state wiring vs persistence init vs API drift), not assumed.
- [ ] A regression test proves both toggle and persistence so the regression cannot silently return.

## Sub-Tasks

### ST-01 - Root-cause and fix the collapse toggle

status: ready
model: medium
escalate-if:
- The confirmed root cause is not localStorage/cookie init or `SidebarTrigger`/`useSidebar` API drift and points to deeper shell-state or upstream UI-package breakage.

blocked-by: []

what-to-do:
- Reproduce the broken collapse toggle on a panel route.
- Confirm the true cause among: `SidebarProvider` open-state wiring, persistence (localStorage/cookie) init, or `SidebarTrigger`/`useSidebar` API drift.
- Apply the minimal concrete fix that restores toggling and persistence; do not redesign the sidebar.

files-to-touch:
- `apps/web/src/routes/panel.tsx`
- the shared `Sidebar` primitive wiring if the drift originates there

verification:
- `bun run check`
- `bun run check-types`
- manual: collapse button toggles the sidebar

#### Execution Notes

- Root cause is asserted in the PRD, not proven. Confirm before claiming the fix.

### ST-02 - Add a regression test for toggle and persistence

status: ready
model: medium
escalate-if: []
blocked-by: []

what-to-do:
- Add a regression test proving the collapse toggle changes sidebar state.
- Prove the collapsed/expanded preference persists across a reload.
- Reuse the highest practical panel-route seam per v8 and v5/v6 prior art.

files-to-touch:
- `apps/web/src/routes/-panel.test.tsx`
- `apps/web/tests/` (if persistence-across-reload needs the E2E seam)

verification:
- `bun run check`
- `bun run check-types`
- collapse regression test passes (toggle + persist across reload)

#### Execution Notes

- Persistence-across-reload may require the Playwright seam rather than a render-only test.

---

<!-- INDEX SYNC: After completing a sub-task, run
.plan/helper-scripts/sync-state.sh and update the parent epic.md checklist and
.plan/index.md in the same turn. -->
