---
type: task
id: T-17-04
epic: E-17
status: ready
blocked-by: [T-17-02, T-17-03]
default-model: medium
---

## What to Build

Introduce the bounded CTA model end to end: announcement-level primary CTA plus optional secondary targets, kept explicitly separate from contact channels, with resilient public fallback to WhatsApp and optional direct call when CTA is absent or invalid. This slice owns the first-class CTA behavior across create, edit, persistence, and public rendering.

## Context

The PRD locks CTA as announcement-level only, important but not mandatory for publish, and bounded to a small target set: provider profile, website/menu URL, Instagram post/profile, TikTok video/profile, and WhatsApp deep link. Today the codebase effectively treats outbound actions as a flat links bucket. This task should establish a maintained CTA type system without turning the project into an arbitrary destination-builder system.

## Acceptance Criteria

- [ ] Create and edit flows can manage one primary CTA and optional secondary CTA targets using the bounded target set only.
- [ ] CTA state is persisted separately from contact state and validated through one canonical contract.
- [ ] Public announcement surfaces render CTA actions distinctly from contact actions.
- [ ] Missing or invalid CTA data falls back cleanly to WhatsApp and optional direct call instead of leaving a dead-end action.
- [ ] Tests cover each supported CTA family plus absent/invalid CTA fallback behavior.

## Sub-Tasks

### ST-01 - Define the bounded CTA contract and persistence seam

status: ready
model: medium
escalate-if:
- The bounded CTA target set cannot be represented cleanly without a migration or compatibility strategy more complex than this packet allows.

blocked-by:
- T-17-02
- T-17-03

what-to-do:
- Add a first-class CTA type/value contract separate from contact channels.
- Represent one primary CTA and optional secondary targets while keeping the v1 target set intentionally bounded.
- Prevent the schema from drifting into a generic arbitrary-destination builder.

files-to-touch:
- `apps/server/src/domain/entities/announcement.entity.ts`
- `apps/server/src/domain/repositories/announcement.repository.ts`
- `apps/server/src/application/use-cases/announcement/`
- `apps/server/src/infrastructure/db/announcement-repository/`
- `apps/server/src/presentation/routers/announcement/`

verification:
- `bun run check`
- `bun run check-types`
- CTA domain/router integration tests for supported and rejected target types

#### Execution Notes

- No execution notes yet.

### ST-02 - Add CTA authoring to create/edit without collapsing it into contact UI

status: ready
model: medium
escalate-if:
- The create/detail authoring surfaces need a broader redesign to host CTA controls cleanly.

blocked-by:
- ST-01

what-to-do:
- Extend create and edit authoring surfaces with bounded CTA controls that stay visually and semantically separate from contact controls.
- Support a clear primary CTA plus optional secondary targets.
- Keep the UI focused on the locked target families only.

files-to-touch:
- `apps/web/src/routes/panel.provider.announcements.new.tsx`
- `apps/web/src/routes/panel.provider.announcements.$id.tsx`
- `apps/web/src/routes/panel/-provider-dashboard-edit-form-fields.tsx`
- `apps/web/src/components/` (shared CTA authoring section if needed)
- announcement translation files

verification:
- `bun run check`
- `bun run check-types`
- create/detail route tests for CTA authoring behavior

#### Execution Notes

- No execution notes yet.

### ST-03 - Render public CTA priority and fallback behavior with full-stack tests

status: ready
model: medium
escalate-if: []
blocked-by:
- ST-01
- ST-02

what-to-do:
- Update public announcement card/detail surfaces to render CTA actions as high-importance when present.
- When CTA is absent or invalid, fall back to WhatsApp and optional direct call without exposing dead links.
- Add tests covering CTA present, CTA absent, CTA invalid, call allowed, and call disallowed.

files-to-touch:
- `apps/web/src/components/announcement-card.tsx`
- `apps/web/src/routes/_portal.anuncios.$id.tsx`
- `apps/web/src/routes/_portal.providers.$id.tsx`
- `apps/server/src/application/use-cases/announcement/get-public-announcement.integration.test.ts`
- `apps/server/src/presentation/routers/announcement-get-public.integration.test.ts`

verification:
- `bun run check`
- `bun run check-types`
- public announcement CTA/fallback tests pass

#### Execution Notes

- No execution notes yet.

---

<!-- INDEX SYNC: After completing a sub-task, run
.plan/helper-scripts/sync-state.sh and update the parent epic.md checklist and
.plan/index.md in the same turn. -->
