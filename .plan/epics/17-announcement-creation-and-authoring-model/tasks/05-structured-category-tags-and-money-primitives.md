---
type: task
id: T-17-05
epic: E-17
status: ready
blocked-by: [T-17-03]
default-model: medium
---

## What to Build

Upgrade announcement authoring primitives to the locked scalable set: async searchable single-category combobox, structured token/chip tags input with conservative normalization, and money-aware price input with normalized numeric storage. The richer widgets must be available in both create and edit so capability parity remains intact.

## Context

The current create route uses a category button grid, raw tag string splitting, and a plain text price field; the edit route is also narrower than the intended model. The PRD locks exactly one structural category, conservative tag normalization only, and money semantics that feel like money to the provider while persisting normalized numeric state. This slice should reuse shared authoring components where practical and avoid speculative taxonomy/product-governance work.

## Acceptance Criteria

- [ ] Category selection uses an async searchable single-select combobox in both create and edit.
- [ ] Tags are authored through a structured chip/token input in both create and edit.
- [ ] Tag normalization is limited to trim, case-fold/lowercase, dedupe, and accent-folding for search; no semantic rewriting is introduced.
- [ ] Price input behaves like money in the UI while persisting normalized numeric storage.
- [ ] Tests cover user-visible behavior and persisted results for category, tags, and money semantics in both create and edit.

## Sub-Tasks

### ST-01 - Replace category, tag, and price primitives with shared authoring controls

status: ready
model: medium
escalate-if:
- Existing component/library constraints make the locked primitives impossible without introducing a larger UI foundation change.

blocked-by:
- T-17-03

what-to-do:
- Introduce or adapt shared authoring controls for searchable single-category selection, chip/token tags, and money input.
- Keep the category cardinality fixed at one structural category.
- Preserve the existing panel-authoring direction instead of redesigning unrelated shell chrome.

files-to-touch:
- `apps/web/src/routes/panel.provider.announcements.new.tsx`
- `apps/web/src/routes/panel.provider.announcements.$id.tsx`
- `apps/web/src/routes/panel/-provider-dashboard-edit-form-fields.tsx`
- `apps/web/src/components/` (shared authoring inputs)
- announcement translation files

verification:
- `bun run check`
- `bun run check-types`
- route/component tests for the new category/tag/price controls

#### Execution Notes

- No execution notes yet.

### ST-02 - Align server normalization and persistence with the richer primitives

status: ready
model: medium
escalate-if: []
blocked-by:
- ST-01

what-to-do:
- Ensure create/update contracts accept the richer category/tag/price inputs without diverging between routes.
- Normalize and persist tags conservatively per the PRD.
- Keep money normalization explicit and centralized enough that create and edit cannot drift.

files-to-touch:
- `apps/server/src/application/use-cases/announcement/create-announcement.ts`
- `apps/server/src/application/use-cases/announcement/update-announcement.ts`
- `apps/server/src/domain/entities/announcement.entity.ts`
- `apps/server/src/presentation/routers/announcement/provider.ts`
- `apps/server/src/infrastructure/db/mappers/announcement.mapper.ts`

verification:
- `bun run check`
- `bun run check-types`
- create/update integration tests for category, tags, and price normalization

#### Execution Notes

- No execution notes yet.

### ST-03 - Lock create/edit primitive parity with behavior-focused tests

status: ready
model: medium
escalate-if: []
blocked-by:
- ST-01
- ST-02

what-to-do:
- Add tests that exercise searchable category selection, structured tag editing, and money entry in both create and edit.
- Assert user-visible outcomes and persisted values rather than widget internals.
- Include scenarios that catch accidental regression back to raw-string tags or plain-text price handling.

files-to-touch:
- `apps/web/src/routes/` (announcement create/detail tests)
- `apps/server/src/application/use-cases/announcement/create-announcement.integration.test.ts`
- `apps/server/src/application/use-cases/announcement/update-announcement.integration.test.ts`

verification:
- `bun run check`
- `bun run check-types`
- category/tag/price behavior tests pass in create and edit paths

#### Execution Notes

- No execution notes yet.

---

<!-- INDEX SYNC: After completing a sub-task, run
.plan/helper-scripts/sync-state.sh and update the parent epic.md checklist and
.plan/index.md in the same turn. -->
