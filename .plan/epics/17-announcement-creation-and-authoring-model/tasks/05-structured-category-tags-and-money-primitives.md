---
type: task
id: T-17-05
epic: E-17
status: done
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

status: done
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

- Shared controls added under `apps/web/src/components/`: `announcement-category-combobox.tsx` (Popover + cmdk Command, single-select, keyword search), `announcement-tags-input.tsx` (inline chips + autocomplete dropdown sourced from known tags, conservative client dedupe), `announcement-price-input.tsx` (calculator-style cents → fixed 2-decimal money display via Intl, emits integer cents).
- Wired into create (`panel.provider.announcements.new.tsx`) and BOTH edit surfaces (`panel/-provider-dashboard-edit-form-fields.tsx`, consumed by `panel.provider.announcements.$id.tsx` + `panel.dashboard.announcements.$id.tsx`). Category button grid + raw tag string + plain price field all replaced.
- Edit form props migrated `price: number|''`→`priceCents: number|null`, added `tags`/`onTagsChange`; both edit routes updated in lockstep.
- i18n: new `announcement_authoring.*` namespace (category/tags/price) + `meus_anuncios.detail.form.tags` in en+pt.
- User asked mid-task for the richer shadcnblocks-style tags widget → upgraded tags from chips-above-field to inline-chips + autocomplete.

### ST-02 - Align server normalization and persistence with the richer primitives

status: done
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

- Canonical normalization centralized in the domain: `domain/entities/tags.ts` (`normalizeTags`: trim, case-fold, accent-fold dedupe, length cap; NO singular/plural rewrite) + `domain/entities/money.ts` (`normalizePriceCents`: positive integer cents or null). Applied inside BOTH `create-announcement.ts` and `update-announcement.ts` use-cases so create/edit cannot drift (router stays thin).
- Autocomplete source added end-to-end (new since the original spec): `announcement.listTagSuggestions` public tRPC query → `ListTagSuggestions` use-case → repo interface/class method → `announcement-repository/tags.ts` (`SELECT ... unnest(tags) ... GROUP BY tag ORDER BY uses DESC`, excludes soft-deleted) → DI wiring.
- `categoryId` cardinality stays exactly one; CTA/contact contracts untouched.

### ST-03 - Lock create/edit primitive parity with behavior-focused tests

status: done
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

- Domain unit: `tags.test.ts` (6) + `money.test.ts` (5). Server integration: tag/price normalization added to create + update integration suites; new `list-tag-suggestions.integration.test.ts` (distinct, frequency-ordered, excludes soft-deleted). Web component: `announcement-authoring-controls.test.tsx` (price money format/parse + tag chip render/remove via the repo's shallow renderer). Playwright: `announcement-authoring-primitives.spec.ts` — category search/empty-state/select, tag chip dedupe (no plural collapse), autocomplete suggestion pick, money formatting, and edit-parity tag round-trip (uses the DRAFT seed announcement to avoid contaminating meus-anuncios active-announcement screenshots).
- Regenerated create-page baselines (create-cta, create-contact, create-authoring-primitives) since the details card layout shifted.
- Fixed a latent bug surfaced here: edit previously sent `tags: announcement.tags` (read-only) — tags are now actually editable on edit.
- Gates: `bun run check-types` ✓, `bun run check` ✓ (1 pre-existing symlink warning), targeted server + web unit ✓, Playwright affected specs ✓. Note: combined-run create-contact-custom screenshot showed one transient AA diff; passes deterministically in isolation (matches handoff's known font-AA flakiness). `-dashboard-analytics.test.tsx` remains red on clean tree (pre-existing bun ESM `redirect` import error + stale removed-prop assertions from T-17-02/03; not touched).

---

<!-- INDEX SYNC: After completing a sub-task, run
.plan/helper-scripts/sync-state.sh and update the parent epic.md checklist and
.plan/index.md in the same turn. -->
