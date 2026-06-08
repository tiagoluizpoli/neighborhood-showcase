---
type: feature
epic: 06-panel-layout
status: blocked
blocked-by: null
---

## What to Build

Add per-announcement analytics views with charts and time-period filtering to the provider dashboard, using shadcn charts (Recharts).

1. **Time-period aggregation API**: Create tRPC procedures to aggregate analytics events (`IMPRESSION`, `CONTACT_CLICK`) per announcement over configurable time periods: Last 7 Days (daily granularity), Last 30 Days (daily/weekly), Last 12 Months (monthly).
2. **Dashboard charts**: Add chart components to the dashboard home showing aggregate metrics (total impressions, total clicks, conversion rate) using shadcn `chart` components powered by Recharts.
3. **Per-announcement analytics view**: Add a "View Analytics" action button to each announcement card in the provider panel. Clicking it shows the analytics breakdown for that specific announcement with time-period selector and line/bar charts.
4. **Action buttons on panel cards**: Add "View Analytics" and "View Details" action buttons to announcement cards in the panel (alongside the existing edit button).

## Acceptance Criteria

- [x] Time-period aggregation API returns correct counts per day/week/month
- [x] Dashboard home shows aggregate charts (impressions, clicks, conversion)
- [x] Per-announcement analytics view accessible via "View Analytics" button
- [x] Time-period selector (7d / 30d / 12m) is functional
- [x] Charts render correctly using shadcn chart / Recharts
- [x] Panel announcement cards have "View Analytics" and "View Details" action buttons
- [x] Integration tests: aggregation queries return correct counts for seeded events

## Sub-Tasks

_Sub-tasks will be defined when this task is executed._

---

<!-- INDEX SYNC: After completing a sub-task, update the parent
epic.md child task checklist AND .specify/memory/index.md in the
same turn. Never skip this sync step. -->
