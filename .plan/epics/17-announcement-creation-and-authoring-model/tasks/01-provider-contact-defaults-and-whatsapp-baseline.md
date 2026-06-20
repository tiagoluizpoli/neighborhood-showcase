---
type: task
id: T-17-01
epic: E-17
status: ready
blocked-by: []
default-model: medium
---

## What to Build

Replace the loose provider `socialLinks` / announcement `contactLinks` arrangement with one canonical contact contract centered on a required primary WhatsApp number, an optional same-number direct-call action, provider-level defaults, and explicit announcement contact mode (`inherit` versus `custom`). This slice owns the contract seam end to end so later create/edit/public work stops layering UI on top of the wrong business rules.

## Context

The current provider configuration route `apps/web/src/routes/panel/provider/-configuration-contact-channels-section.tsx` edits a broad social-links object, while announcement create/edit still validate against "any one contact link" and store a flat `contactLinks` payload. The PRD locks a stricter model: WhatsApp is the publishable baseline, direct call is a separate toggle on the same number, and inherited-versus-custom contact state is part of the product contract rather than a local form trick. This task should establish the DTO/domain/persistence vocabulary and expose provider defaults through the existing provider configuration surface without expanding scope into CTA or category/tag widget redesign yet.

## Acceptance Criteria

- [ ] Provider configuration stores the canonical default contact contract with one primary WhatsApp-capable number and an optional same-number direct-call action.
- [ ] Announcement create/update/public contract surfaces can represent inherited-versus-custom contact behavior without collapsing back into a flat arbitrary links bucket.
- [ ] Domain/application validation switches from "any contact link" to the locked WhatsApp-baseline rule for publishable behavior.
- [ ] Existing provider/announcement mappings are updated coherently enough that later slices can read/write the new contract through one stable seam.
- [ ] Integration/domain tests cover provider defaults, same-number call behavior, and the new validation boundary.

## Sub-Tasks

### ST-01 - Define the canonical contact contract in domain, DTO, and persistence seams

status: ready
model: medium
escalate-if:
- Existing database shape or repository assumptions make inherited-versus-custom contact state impossible to represent without a migration strategy broader than this packet.

blocked-by: []

what-to-do:
- Define the provider-default and announcement-contact-mode vocabulary in the server domain/use-case/repository seams.
- Preserve the locked business rule that WhatsApp is mandatory baseline contact and direct call is a separate action on the same number.
- Keep CTA concepts out of this task except where placeholder typing is needed to avoid future contract collisions.

files-to-touch:
- `apps/server/src/domain/entities/announcement.entity.ts`
- `apps/server/src/domain/entities/provider-profile.entity.ts`
- `apps/server/src/domain/repositories/`
- `apps/server/src/application/use-cases/announcement/`
- `apps/server/src/application/use-cases/provider-profile/`
- `apps/server/src/infrastructure/db/`
- `apps/server/src/presentation/routers/`

verification:
- `bun run check`
- `bun run check-types`
- announcement/provider contract tests covering default-versus-custom contact state

#### Execution Notes

- No execution notes yet.

### ST-02 - Expose provider default contact settings through the existing configuration surface

status: ready
model: medium
escalate-if:
- The existing provider configuration page cannot host the new default-contact controls without a UI change that exceeds the PRD scope.

blocked-by:
- ST-01

what-to-do:
- Adapt the provider configuration contact section to edit the canonical default-contact model rather than a generic links dump.
- Keep the UI focused on the locked scope: primary WhatsApp number plus optional same-number call behavior, with only the remaining supported contact fields that still make sense as supporting metadata.
- Reuse the current provider configuration route rather than inventing a parallel settings surface.

files-to-touch:
- `apps/web/src/routes/panel/provider/-configuration-contact-channels-section.tsx`
- `apps/web/src/routes/panel/provider/configuration.tsx`
- `apps/web/src/utils/trpc.ts`
- provider-profile translation files used by the configuration screen

verification:
- `bun run check`
- `bun run check-types`
- provider configuration route/component tests for canonical default-contact save behavior

#### Execution Notes

- No execution notes yet.

### ST-03 - Lock the contract with domain, router, and integration tests

status: ready
model: medium
escalate-if: []
blocked-by:
- ST-01
- ST-02

what-to-do:
- Add tests proving the new provider-default contract persists correctly and that announcement validation no longer accepts the old arbitrary-contact rule.
- Cover the same-number call toggle semantics explicitly.
- Keep the tests at the highest useful seams: domain/application plus router/integration where the contract enters and exits the system.

files-to-touch:
- `apps/server/src/application/use-cases/provider-profile/*.integration.test.ts`
- `apps/server/src/application/use-cases/announcement/*.integration.test.ts`
- `apps/server/src/presentation/routers/*.integration.test.ts`
- `apps/web/src/routes/` (provider configuration tests)

verification:
- `bun run check`
- `bun run check-types`
- targeted provider/announcement integration suites pass

#### Execution Notes

- No execution notes yet.

---

<!-- INDEX SYNC: After completing a sub-task, run
.plan/helper-scripts/sync-state.sh and update the parent epic.md checklist and
.plan/index.md in the same turn. -->
