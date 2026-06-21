---
type: task
id: T-17-04
epic: E-17
status: done
blocked-by: [T-17-02, T-17-03]
default-model: medium
---

## What to Build

Introduce the bounded CTA model end to end: announcement-level primary CTA plus optional secondary targets, kept explicitly separate from contact channels, with resilient public fallback to WhatsApp and optional direct call when CTA is absent or invalid. This slice owns the first-class CTA behavior across create, edit, persistence, and public rendering.

## Context

The PRD locks CTA as announcement-level only, important but not mandatory for publish, and bounded to a small target set: provider profile, website/menu URL, Instagram post/profile, TikTok video/profile, and WhatsApp deep link. Today the codebase effectively treats outbound actions as a flat links bucket. This task should establish a maintained CTA type system without turning the project into an arbitrary destination-builder system.

## Acceptance Criteria

- [x] Create and edit flows can manage one primary CTA and optional secondary CTA targets using the bounded target set only.
- [x] CTA state is persisted separately from contact state and validated through one canonical contract.
- [x] Public announcement surfaces render CTA actions distinctly from contact actions.
- [x] Missing or invalid CTA data falls back cleanly to WhatsApp and optional direct call instead of leaving a dead-end action.
- [x] Tests cover each supported CTA family plus absent/invalid CTA fallback behavior.

## Sub-Tasks

### ST-01 - Define the bounded CTA contract and persistence seam

status: done
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

- New domain module `apps/server/src/domain/entities/cta.ts` owns the bounded
  contract: `CTA_TARGET_TYPES` (provider_profile, website, instagram, tiktok,
  whatsapp), `AnnouncementCta { primary, secondary[] }`, `MAX_SECONDARY_CTA_TARGETS = 3`,
  `validateCta`, `resolveCtaTarget`, and `sanitizeCta`. Kept separate from
  `contact.ts`; reuses `isValidPrimaryPhone` for whatsapp targets.
- Persistence: added `cta jsonb NOT NULL DEFAULT '{"primary":null,"secondary":[]}'`
  to the `announcement` table; mapper helper `announcement-cta.ts` (`rowToCta`/`ctaToRow`)
  defensively drops unknown target types. Wired through entity, repository DTOs/inputs,
  create/update use cases, and the provider router (Zod `cta` input + `toCta` mapper +
  `InvalidCtaTargetError`/`TooManyCtaTargetsError` → BAD_REQUEST translation).
- Public DTO builders sanitize CTA against effective contact so dead links never
  reach the client; provider/dashboard DTOs carry the raw authored CTA for editing.
- Migration rebuilt per §8 (`0000_concerned_violations.sql`): regenerated base +
  re-added `CREATE EXTENSION postgis`, unquoted geography columns, and category seed
  by hand (drizzle drops them). Test/dev DBs got the column via direct ALTER (db:push
  blocks on the postgis `spatial_ref_sys` drop prompt).
- Tests: `cta.test.ts` (validate/resolve/sanitize families), create-flow router CTA
  accept/reject cases.

### ST-02 - Add CTA authoring to create/edit without collapsing it into contact UI

status: done
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

- Shared authoring section `apps/web/src/routes/panel/provider/-announcement-cta-section.tsx`
  renders a primary target + up to 3 secondary targets, each a bounded type select
  plus a value input (hidden for provider_profile, optional for whatsapp). Visually a
  separate card from the contact section. Exposes `ctaHasIncompleteTarget` to gate submit.
- Wired into create (`panel.provider.announcements.new.tsx`) and both edit surfaces
  (`panel.provider.announcements.$id.tsx`, `panel.dashboard.announcements.$id.tsx`) via the
  shared `ProviderDashboardEditFormFields`. `cta` added to the web dashboard item type and
  to the `get-provider-dashboard-data` use-case DTO so the edit form round-trips authored CTA.
- i18n: `new_announcement.cta_card.*` + `announcement_cta.*` keys added to pt and en.
- Tests: Playwright `announcement-create-cta.spec.ts` (empty + authored states, with
  screenshots); regenerated `announcement-create-contact` baselines (create page now hosts CTA).

### ST-03 - Render public CTA priority and fallback behavior with full-stack tests

status: done
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

- Shared public presentation `apps/web/src/components/announcement-cta.tsx` mirrors the
  domain resolver (`resolveCtaHref`), exposes `AnnouncementCtaActions` (prominent primary +
  secondary), `CtaIcon`, and analytics-target mapping. CTA renders as a distinct block
  above the contact section on the public detail page (`_portal.anuncios.$id.tsx`).
- The public card (`announcement-card.tsx`) leads with the primary CTA when present and
  falls back to the existing WhatsApp/call contact action otherwise. Provider public tiles
  are pure navigation links to the detail page, so no CTA action surface was added there.
- Backend already sanitizes the public CTA payload (`sanitizeCta`) so absent/invalid CTA
  data degrades to contact without dead links.
- Tests: extended `get-public-announcement.integration.test.ts` (absent/present/whatsapp-
  fallback/invalid) and `announcement-get-public.integration.test.ts` (router CTA payload);
  added card component tests for CTA priority vs. WhatsApp fallback.
- Gates: `bun run check-types`, `bun run check`, the announcement server test slice (43
  pass), web card/route component tests, and Playwright `announcement-create-cta` +
  regenerated `announcement-create-contact` + full `meus-anuncios` (9 pass) all green.
- Pre-existing/out-of-scope: `dashboard.spec.ts` slim snapshot diffs on header font AA +
  a login toast (confirmed failing on the clean tree; unrelated to CTA). `-provider-profile.test.tsx`
  has 3 pre-existing failures (confirmed via stash). Required `bun --hot` server restart so the
  running dev server picked up the new `packages/db` schema column.

---

<!-- INDEX SYNC: After completing a sub-task, run
.plan/helper-scripts/sync-state.sh and update the parent epic.md checklist and
.plan/index.md in the same turn. -->
