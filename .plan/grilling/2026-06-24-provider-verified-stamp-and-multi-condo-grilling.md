# Grilling Session: Provider Verified Stamp Redesign + Multi-Condo Management Gap

Date: 2026-06-24
Status: complete
Source Skill: grill-with-docs
Scope (REVISED after Q-A + reframe answer): (1) Verified STAMP redesign — check-seal + single condo name, on provider hero (always-on) and announcement cards (hybrid gate). (2) FOUNDATIONAL provider-entity refactor — make `provider` a first-class entity owned by a user (user→many providers, provider→one condo), re-key `provider_profile`/`announcement`/`providerAssignment` from userId→providerId, add a "my providers" switcher + auth/role handling. NO data-row migration — rebuild the SEED to the new model instead (MVP, undeployed, only seed data exists).

## Starting Context

- User prompt: `/luna-grill-with-docs .plan/handoffs/2026-06-24-provider-verified-stamp-and-multi-condo-grill-seed.md`
- Initial reasoning:
  - The seed locks one decision ("honor multi-condo, do not collapse to single-condo") but Q9 explicitly asks to re-confirm that product truth because it gates everything else. So the grill must start at the root of the dependency tree: is multi-condo genuinely real?
  - Two intertwined threads: (a) small stamp visual redesign, (b) a real build — the missing multi-condo management UI. Scope split (Q1) cannot be settled until the product-truth root (Q9) is confirmed.
  - Tension already visible: the public profile is global (no condo context) but "verified resident" is inherently per-condo. If multi-condo is real, "verified resident of WHICH condo" must be answered for both the profile hero and per-announcement marks.
  - Verified facts from seed: `provider_profile` = identity only (no condo); `provider_location`/`providerAssignment` = condo membership (no unique constraint, multi allowed); `isVerified` = boolean `hasApprovedResidentAssignment`; public contract returns no condo name today.

## Grilling Mode

- As of Q2 answer: batch UP TO 5 questions per turn, but ONLY ones mutually independent (no overlap, no dependency). Fewer is fine if fewer qualify. Goal: move faster. (See memory [[grilling-batch-independent-questions]].)

## DOMAIN PIVOT (Q9 decision REVISED at Q-A)

The grill overturned the seed's locked decision. The seed framed the model as "one provider in many condos." The user's actual intent is the opposite:

- **A USER owns MANY PROVIDERS.**
- **Each PROVIDER is tied to exactly ONE condo/location.**
- Each PROVIDER has its own identity/profile, its own announcements, and its own stamp.
- Example: User U owns Provider A (condo A) and Provider B (condo B) — distinct providers, distinct announcements.

Term "provider" is overloaded. CODE TRUTH (`packages/db/src/schema/showcase.ts`):
- `provider_profile.providerId` = PK = FK→`user.id` (1:1). Provider == user today. No standalone provider entity.
- `providerAssignment.providerId` → `user.id`. Assignments hang off the user.
- `announcement.providerId` → `user.id`. Announcements hang off the user.

Implication: the user's model needs `provider` to become a FIRST-CLASS ENTITY (own id, `ownerId → user.id`, exactly one condo), and re-keying profile + announcements + assignments off it. This is a foundational schema/domain refactor — far bigger than the stamp. Seed's "no schema migration implied" is dead.

Stamp consequence: one provider = one condo ⇒ stamp NEVER needs `+N`; always a single condo name. Visual simplifies.

## Current Question

(none — grilling session COMPLETE. Handoff written to `.plan/handoffs/grill-to-prd-provider-entity-and-verified-stamp.md`. Next step: `luna-to-prd`.)

## Future Questions

(empty — after K/L/M the session is stable; next step is the grill-to-PRD handoff)

## Answered Questions

### Q-K / Q-L / Q-M (batch — uniqueness / deletion / active-provider context)
User answers (all = recommended):
- K (uniqueness): **Allow two providers in the same condo. No unique constraint** on (ownerId, condominiumId). Provider = business identity, not membership.
- L (deletion): **Soft-delete the provider** (`deletedAt`); hide it + its announcements; preserve payment/analytics history. Matches existing soft-delete convention.
- M (active provider): **URL route param `$providerId`** (`/panel/provider/$providerId/...`). Refresh-safe, deep-linkable; switcher navigates. No extra state store.

Decision / takeaway:
- Model stays honest to provider=business. Deletion preserves financial history. Active-provider context is URL-scoped via TanStack Router.

Queue impact:
- Final edge cases closed. Session COMPLETE → handoff written.

### Q-H / Q-I / Q-J (batch — onboarding / announcement mark / stamp copy)
User answers (all = recommended):
- H (onboarding): **condo-setup becomes the repeatable create-provider flow**, launched from My Providers; zero-provider users see a My Providers empty state → 'create your first provider'.
- I (announcement mark): **show when provider APPROVED RESIDENT AND `showVerifiedBadge` = true.** Condo-match implicit; per-announcement opt-in kept. Same check-seal + condo-name visual.
- J (stamp copy/a11y): **condo name visible only**, plus aria-label + tooltip 'Morador verificado em {condo}' / 'Verified resident at {condo}', new pt/en keys.

Decision / takeaway:
- One create-provider flow (condo-setup) reused for first + Nth provider. Announcement mark = verified-RESIDENT gate + opt-in toggle. Stamp visual clean, semantics accessible, i18n keys both locales.

Queue impact:
- Core design fully grilled. Only edge cases (K/L/M) remain, then handoff.

### Q-E / Q-F / Q-G (batch — stamp eligibility / auth / migration)
User answers (all = recommended):
- E (stamp eligibility): **RESIDENT + APPROVED only.** EXTERNAL & MODERATOR do not earn the resident stamp. `get-public-profile` returns `{condoId, condoName} | null` from the provider's single approved RESIDENT assignment.
- F (auth model): **Both, layered.** Minimal global `user.role` (admin vs user) + provider-scoped actions gated by the active provider's approved assignment; ownership = `provider.ownerId === user.id`.
- G (migration): **New incremental migration**, base untouched (avoids postgis/category re-embed hazard); hand-fix re-key SQL.

Decision / takeaway:
- Stamp = resident-only trust mark. Auth layered (platform admin + per-provider gating). Schema delivered via additive migration + manual re-key.

Queue impact:
- Unblocked onboarding (H), announcement-mark logic (I), stamp copy/a11y (J) — now the current batch. Grill nearing completion; after this, only handoff remains.

### Q-A2 / Q-B2 / Q-C2 / Q-D2 (batch — provider-entity design)
Exact questions: condo-binding table structure / profile table structure / switcher placement / seed model scope.

User answers:
- A2 (condo binding): **Keep providerAssignment separate** — provider owns exactly one; re-key providerId user→provider.id. Approval lifecycle (type/status/proof) preserved.
- B2 (profile): **Keep provider_profile separate, re-keyed to provider.id.**
- C2 (switcher): **Both** — a 'My Providers' list/management page AND a persistent header switcher.
- D2 (seed): **All three states** — user w/ 2 providers in 2 condos, single-provider verified user, and an unverified provider (no approved assignment) for stamp-absent.

Decision / takeaway:
- New `provider` entity (id, ownerId→user). `providerAssignment` (1 per provider) and `provider_profile` (1 per provider) both re-keyed to provider.id. `announcement.providerId` → provider.id too.
- Panel gets both a My Providers management page and a header switcher for active-provider context.
- Seed exercises multi-provider + verified + unverified.

Queue impact:
- Confirmed table shapes → unblocked migration-mechanics + auth + onboarding questions. Began next independent batch (E stamp source/eligibility, F auth model, G migration mechanics). Onboarding held to following turn.

### Q-reframe (model + scope — supersedes seed Q9 decision)
Exact question:
"Confirm provider as a first-class entity owned by a user (user→many providers, provider→one condo). Bundle the schema migration into THIS effort, or split into its own epic?"

User answer:
"Most of it [bundle]. Only thing I wouldn't care about right now is migrating existing rows — MVP, not deployed, only existing data is seed. Consider the seed more important than migrating existing rows."

Decision / takeaway:
- Provider-entity model CONFIRMED as target.
- BUNDLE the refactor into this work (NOT a separate later epic).
- NO data-row migration. Rebuild the SEED to the new model instead. Seed > row migration.
- Project constraint: early MVP, undeployed, seed is the only data — prefer rebuilding seed over writing data migrations.

Queue impact:
- The "stamp now, refactor later" split is dead — refactor is in scope now. Former future item "provider-entity foundational epic seed" dissolved into the active design grill (Q-current batch A–D). Stamp backend source question stays but now keys off provider.id.

### Q-A / Q-B / Q-C / Q-D (batch — seed Q4/Q3/Q5/Q8)
Exact questions: profile-hero semantics / announcement-mark semantics / stamp visual / profile stamp visibility (see prior Current batch).

User answers:
- Q-A (profile semantics): **MODEL PIVOT** — rejected the multi-condo-per-provider premise. Real model = one USER owns MANY PROVIDERS, each PROVIDER tied to ONE condo, each with its own announcements. (See DOMAIN PIVOT section.)
- Q-B (announcement mark): **Hybrid** — show the verified mark only when the provider is verified in that announcement's condo AND the per-announcement `showVerifiedBadge` toggle is on.
- Q-C (stamp visual): **Check seal + condo name only** (mix of options 1+2: the check-seal icon, but condo name only, no extra label, no 'verified' word).
- Q-D (profile stamp visibility): **Always show when verified** (no provider hide toggle on the profile hero).

Decision / takeaway:
- Q9's "honor multi-condo per provider" is REVISED → provider-entity model (user→many providers, provider→1 condo). Stamp = single condo name, no `+N`, ever.
- Stamp icon = check seal; copy = condo name only.
- Announcement mark = hybrid gate (verified-in-condo AND toggle).
- Profile stamp = always shown when verified.

Queue impact:
- PRUNED the `+N`/multi-condo display + ordering questions (seed Q6) and the multi-condo-array backend shape (seed Q7 original) — single condo means no overflow rule. Reframed seed Q7 to "single condo name source." Seed Q2 reframed from "management UI" to "provider-entity foundational epic." Answered the announcement-toggle question (Q8b) implicitly via Q-B hybrid → pruned from queue.

### Q1 (seed Q1 — scope boundary)
Exact question:
"Is the multi-condo management UI in scope for THIS work, or split into its own epic — leaving this work as just the stamp redesign?"

User answer:
"As recommended" — split.

Decision / takeaway:
- SPLIT. This work = stamp redesign only (hero slot + announcement-card mark + backend condo-name field, no schema migration). Multi-condo management UI (list/add/remove assignments) becomes a follow-up epic. Stamp's multi-condo DISPLAY rules still grilled here.
- Also: user set grilling cadence to batch up to 5 mutually-independent questions per turn.

Queue impact:
- Seed Q2 (management surface) demoted to follow-up-epic seed, grilled last. Remaining stamp/backend questions stay; began batching independent ones.

### Q9 (seed Q9 — product-truth root)
Exact question:
"Is one provider operating across multiple condominiums a real, intended capability we commit to supporting in the UI, or is PRD-v3 story #3 stale and the true intent single-condo?"

User answer:
"As recommended" — commit to multi-condo as a real capability.

Decision / takeaway:
- Multi-condo is LOCKED as real. PRD-v3 story #3 stands. Schema (no unique constraint), `request-assignment.ts` different-condo allowance, and `getMyAssignments` returning an array all support it. UI is the lagging layer.

Queue impact:
- Single-condo collapse branch killed. All downstream questions (`+N` rule, management UI, global-profile "verified of which condo") stay live.

## Pruned Questions

- seed Q6 (multi-condo display rule: which name first, `+N` expand)
  Removed because: provider→1 condo means the stamp shows a single condo name; no overflow, no ordering. Dead under the new model.
- seed Q7 (original: array vs primary+list shape)
  Removed because: replaced by Q-next-1 reframed to a single `{condoId, condoName}` source.
- seed Q8b (announcement-card toggle keep/drop)
  Removed because: answered implicitly by Q-B "Hybrid" — the per-announcement `showVerifiedBadge` toggle stays AND is gated on condo verification.

