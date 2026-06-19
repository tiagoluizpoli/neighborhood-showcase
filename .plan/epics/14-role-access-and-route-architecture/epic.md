---
type: epic
id: E-14
name: "Role Access and Route Architecture"
status: done
blocked-by: []
---

## About this Epic

Replace the ambiguous panel access model with section-scoped dashboard ownership, a canonical backend-derived Provider-enabled contract, top-boundary Provider route-group protection, deterministic section-correct landings, and redirect-shim migration for legacy `/panel/dashboard` entry points.

## Context

Canonical PRD: `.plan/prds/PRD-v8-role-access-and-route-architecture.md`

Canonical PRD handoff: `.plan/handoffs/prd-to-issues-role-access-and-route-architecture.md`

The implementation must keep frontend navigation, redirect behavior, backend capability resolution, persistence semantics, and Playwright verification aligned as one contract. Existing tests that encode old Provider-dashboard ambiguity are migration evidence, not requirements to preserve.

## Child Tasks

| Task ID | Task | Status | Blocked By | File |
| --- | --- | --- | --- | --- |
| T-14-01 | Canonical Provider-enabled access contract | done | — | `.plan/epics/14-role-access-and-route-architecture/tasks/01-canonical-provider-enabled-contract.md` |
| T-14-02 | Provider route group and dashboard shim | done | — | `.plan/epics/14-role-access-and-route-architecture/tasks/02-provider-route-group-and-dashboard-shim.md` |
| T-14-03 | Section-specific non-Provider landings | done | — | `.plan/epics/14-role-access-and-route-architecture/tasks/03-section-specific-non-provider-landings.md` |
| T-14-04 | Fail-closed landing resolution | done | — | `.plan/epics/14-role-access-and-route-architecture/tasks/04-fail-closed-landing-resolution.md` |
| T-14-05 | Provider enablement surface sync | done | — | `.plan/epics/14-role-access-and-route-architecture/tasks/05-provider-enablement-surface-sync.md` |

---

<!-- INDEX SYNC: After completing or modifying any child task file, run
.plan/helper-scripts/sync-state.sh and update .plan/index.md in the same turn. -->
