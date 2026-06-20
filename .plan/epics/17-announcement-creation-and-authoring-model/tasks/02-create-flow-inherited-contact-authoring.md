---
type: task
id: T-17-02
epic: E-17
status: done
blocked-by: [T-17-01]
default-model: medium
---

## What to Build

Rebuild the announcement create flow around inherited provider contact defaults with a lightweight customize affordance. A provider should be able to create a draft using live provider defaults, understand when contact behavior is inherited, and opt into announcement-specific overrides without the form turning into a settings console.

## Context

`apps/web/src/routes/panel.provider.announcements.new.tsx` currently collects raw WhatsApp/Instagram/website fields, enforces the old "one contact link required" rule, and normalizes tags/price inline. The PRD requires a lighter but more explicit inheritance model: provider defaults are visible, WhatsApp is the guaranteed baseline, and announcement-level override mode is intentional rather than implicit. This slice should produce a serious panel-authoring surface while staying inside the existing create route and preserving the current direction of improved spacing/padding.

## Acceptance Criteria

- [x] The create route reads provider contact defaults and shows inherited contact state clearly with a lightweight badge/label plus simple customize affordance.
- [x] A provider can save a new announcement using inherited contact defaults without re-entering baseline contact information.
- [x] A provider can switch the draft into custom contact mode and edit the allowed override fields without losing the canonical contract.
- [x] Create-route validation and payload shape align with the new contract from T-17-01.
- [x] Route/component/integration tests cover both inherited and customized create flows.

## Sub-Tasks

### ST-01 - Build the inherited-contact create authoring section

status: done
model: medium
escalate-if:
- The current create-page composition cannot host the inherited/default state affordance without a broader shell/layout change outside the PRD.

blocked-by:
- T-17-01

what-to-do:
- Replace the raw create-form contact inputs with a section that displays provider defaults, inheritance state, and a lightweight path into custom mode.
- Preserve the improved panel spacing/padding direction while moving toward a serious authoring rail composition.
- Keep the override UI intentionally light; do not invent a complex settings workflow.

files-to-touch:
- `apps/web/src/routes/panel.provider.announcements.new.tsx`
- `apps/web/src/components/` (shared authoring/contact section if needed)
- announcement create translation files

verification:
- `bun run check`
- `bun run check-types`
- create-route component tests for inherited badge/customize affordance

#### Execution Notes

- Extracted controlled `AnnouncementContactSection` to `apps/web/src/routes/panel/provider/-announcement-contact-section.tsx` (inherit badge + live baseline display + lightweight customize affordance; custom mode exposes phone + callEnabled).
- Route reads `trpc.providerProfile.get` -> `contactDefaults`; replaced raw whatsapp/instagram/website inputs and the old "one contact link required" rule.
- Added `new_announcement.contact_card.*` + two toast keys to en + pt.

### ST-02 - Wire create mutation and persistence to the canonical inherited/custom model

status: done
model: medium
escalate-if: []
blocked-by:
- ST-01

what-to-do:
- Send the canonical contact-mode payload from the create route.
- Ensure saved announcements preserve whether they inherit provider defaults or carry explicit overrides.
- Keep create behavior aligned with the contract established in T-17-01 so edit/public slices can consume the same stored state.

files-to-touch:
- `apps/web/src/routes/panel.provider.announcements.new.tsx`
- `apps/server/src/presentation/routers/announcement/provider.ts`
- `apps/server/src/application/use-cases/announcement/create-announcement.ts`
- `apps/server/src/infrastructure/db/announcement-repository/`

verification:
- `bun run check`
- `bun run check-types`
- create-announcement integration tests for inherited and custom contact payloads

#### Execution Notes

- Provider router `create` now accepts structured `contact {mode, custom}` (canonical); `contactLinks` kept optional as fallback for the untouched legacy dashboard create route + edit flow (T-17-03). Renamed flat adapter to `flatLinksToContactSettings`; new `toContactSettings` maps structured input and normalizes the phone.
- create use-case already consumed `AnnouncementContactSettings`; inherit persists `contact_mode='inherit'`/null, custom persists normalized `contact_custom`.

### ST-03 - Lock create-flow behavior with route-level and integration coverage

status: done
model: medium
escalate-if: []
blocked-by:
- ST-01
- ST-02

what-to-do:
- Add tests covering create with inherited defaults, create with custom override, and rejection of malformed contact state.
- Prefer route-level/component integration tests on the web side and use-case/router integration tests on the server side.
- Keep assertions focused on user-visible behavior and persisted contract state.

files-to-touch:
- `apps/web/src/routes/` (announcement create tests)
- `apps/server/src/application/use-cases/announcement/create-announcement.integration.test.ts`
- `apps/server/src/presentation/routers/announcement*.integration.test.ts`

verification:
- `bun run check`
- `bun run check-types`
- create-route and server integration suites pass

#### Execution Notes

- Web unit: `-announcement-contact-section.test.tsx` (4) + fixed stale `centered-form` assertion to `default` (RULES §5 full-width) in `-panel.provider.announcements.test.tsx` (6).
- Server integration: 3 caller-based create tests (inherit persists, custom normalizes phone, malformed rejects WhatsApp baseline).
- E2E: `announcement-create-contact.spec.ts` (2, with screenshots) — inherit badge+baseline, customize reveals override + restores inherit. All gates green.

---

<!-- INDEX SYNC: After completing a sub-task, run
.plan/helper-scripts/sync-state.sh and update the parent epic.md checklist and
.plan/index.md in the same turn. -->
