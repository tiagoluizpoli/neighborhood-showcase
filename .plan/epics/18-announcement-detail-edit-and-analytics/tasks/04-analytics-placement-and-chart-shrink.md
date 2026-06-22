---
type: task
id: T-18-04
epic: E-18
status: ready
blocked-by: [T-18-03]
default-model: medium
---

## What to Build

Settle analytics on the read-only view page: it sits below the primary facts block (below the fold), the three metric cards (impressions / interactions / conversion) stay always visible, and the bar chart shrinks from a fixed 320px to roughly 200–220px. The metric cards carry the at-a-glance value; the chart is secondary and should not overwhelm them.

## Context

The analytics panel is `apps/web/src/routes/panel/-provider-dashboard-analytics-panel.tsx`, rendered on the detail page. After T-18-03 the facts-first block owns the top of the page; this slice positions analytics beneath it and reduces the chart's vertical weight. No analytics or edit affordance may leak to the public surface (covered by the boundary guard in T-18-05). All visible strings via i18next `t()`.

## Acceptance Criteria

- [ ] Analytics renders below the primary facts block on the read-only view page.
- [ ] The three metric cards (impressions / interactions / conversion) are always visible.
- [ ] The bar chart occupies a reduced height band (~200–220px), not the old fixed 320px.
- [ ] All visible strings route through i18next `t()` with keys in both pt and en.

## Sub-Tasks

### ST-01 - Reposition and resize the analytics block

status: ready
model: medium
escalate-if:
- The chart height cannot be reduced without breaking the chart library's layout or the metric cards.

blocked-by:
- T-18-03

what-to-do:
- Place the analytics block below the facts block on the view page.
- Keep the three metric cards always visible.
- Reduce the bar chart height from 320px to ~200–220px.

files-to-touch:
- `apps/web/src/routes/panel/-provider-dashboard-analytics-panel.tsx`
- `apps/web/src/routes/panel.provider.announcements.$id.tsx`

verification:
- `bun run check`
- `bun run check-types`
- analytics sits below facts; chart height reduced; metric cards visible

#### Execution Notes

- No execution notes yet.

---

<!-- INDEX SYNC: After completing a sub-task, run
.plan/helper-scripts/sync-state.sh and update the parent epic.md checklist and
.plan/index.md in the same turn. -->
