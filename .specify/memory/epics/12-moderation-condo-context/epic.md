---
type: epic
name: "Moderation Condominium Info and Context Selector"
status: ready
blocked-by: 10-playwright-setup
---

## About this Epic

Add the Moderation Condominium Info page (read-only) and the condo context selector for multi-condo moderators. All UI changes under this epic require Playwright tests.

## Context

PRD-v6. Moderators need to see condo info and switch between multiple assigned condominiums. Backend requires a new `getCondominiumInfo` tRPC procedure.

## Child Tasks

- [x] 01_moderation_condo_info_backend.md (completed: procedure already existed, added integration test)
- [x] 02_moderation_condo_info_frontend.md (completed: implementation done, Playwright test blocked — no MODERATOR seed user)
- [x] 03_moderation_condo_context_selector.md (completed: CondoSelector wired, seed fixed, data-* attrs added, test created, test.skip removed from moderation-condo-info.spec.ts)

Note: e2e tests require server on port 3001 (currently on 3000 — pre-existing port mismatch). Seed data (language/theme columns) was added via ALTER after migration gap surfaced.

---

<!-- INDEX SYNC: After completing or modifying any child task file, update .specify/memory/index.md in the same turn. Keep the child task checklist above in sync with actual file statuses.</!-->
