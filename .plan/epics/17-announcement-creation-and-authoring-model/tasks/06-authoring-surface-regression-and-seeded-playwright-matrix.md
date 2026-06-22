---
type: task
id: T-17-06
epic: E-17
status: ready
blocked-by: [T-17-04, T-17-05]
default-model: medium
---

## What to Build

Lock the new announcement authoring model behind seeded end-to-end and visual regression coverage spanning provider defaults, inherited-versus-custom contact behavior, CTA priority/fallback, and the upgraded create/edit authoring surface. This slice turns the PRD's testing rules into durable execution artifacts instead of relying on manual confidence.

## Context

The PRD explicitly requires Playwright for this UI work, seeded provider/default/announcement states, and no skipped tests as a substitute for missing setup. The repo already has Playwright coverage in `apps/web/tests/`, including `meus-anuncios.spec.ts` and public-provider flows, but not the richer authoring-model matrix. Because the new behavior spans provider configuration, create/edit routes, and public announcement rendering, this slice should add the seed states and high-seam e2e/visual assertions needed to catch contract and layout regressions.

## Acceptance Criteria

- [ ] Seed data exists for provider default contact settings, inherited announcements, customized announcements, CTA-present announcements, CTA-absent announcements, CTA-invalid-fallback cases, and call-enabled/call-disabled cases.
- [ ] Playwright covers provider configuration, create flow, edit flow, and public announcement behavior for the new contract.
- [ ] Visual assertions protect the create/edit authoring surface from layout regression.
- [ ] No coverage is skipped for missing seed data; setup is created as part of the implementation.
- [ ] The regression matrix is documented clearly enough that future slices know which scenarios must remain green.

## Sub-Tasks

### ST-01 - Add durable seed states for the full authoring-model matrix

status: done
model: medium
escalate-if:
- Existing seed/test bootstrapping cannot represent the required announcement/provider scenarios without broader fixture or migration work.

blocked-by:
- T-17-04
- T-17-05

what-to-do:
- Extend test seed data to cover provider defaults, inherited/custom announcements, CTA variants, and call toggle variants.
- Keep the seed vocabulary aligned with the canonical authoring contract introduced in earlier tasks.
- Avoid one-off per-test mutation setup when durable seeded states are the clearer contract.

files-to-touch:
- `apps/server/src/infrastructure/db/seed.ts`
- `apps/web/tests/` (shared helpers/fixtures if needed)
- supporting test bootstrapping files used by Playwright/integration suites

verification:
- `bun run check`
- `bun run check-types`
- seed-dependent test suites boot successfully with the new scenarios

#### Execution Notes

- No execution notes yet.

### ST-02 - Add Playwright coverage for provider config, create/edit, and public fallback flows

status: done
model: medium
escalate-if: []
blocked-by:
- ST-01

what-to-do:
- Add end-to-end flows covering provider default editing, create with inherited defaults, create/edit after switching to custom contact mode, CTA-present public behavior, and CTA-fallback public behavior.
- Reuse the repo's existing Playwright patterns and helpers where possible.
- Keep the assertions centered on externally visible behavior and the locked contract semantics.

files-to-touch:
- `apps/web/tests/meus-anuncios.spec.ts`
- `apps/web/tests/public-provider.spec.ts`
- `apps/web/tests/configuracoes.spec.ts`
- additional Playwright spec files if the matrix is clearer split by flow

verification:
- `bun run --filter web playwright test`
- new authoring-model e2e scenarios pass

#### Execution Notes

- No execution notes yet.

### ST-03 - Lock visual and regression expectations for the authoring surface

status: ready
model: medium
escalate-if: []
blocked-by:
- ST-01
- ST-02

what-to-do:
- Add screenshot assertions for the create and edit authoring surfaces after the richer model lands.
- Document the required regression scenarios so later slices do not weaken the matrix.
- Ensure the final test suite has no skipped scenarios standing in for missing seed/setup work.

files-to-touch:
- `apps/web/tests/meus-anuncios.spec.ts`
- `apps/web/tests/` (snapshot outputs and any supporting docs)
- `.plan/epics/17-announcement-creation-and-authoring-model/tasks/06-authoring-surface-regression-and-seeded-playwright-matrix.md`

verification:
- `bun run --filter web playwright test`
- visual regression assertions for create/edit authoring surfaces pass

#### Execution Notes

- No execution notes yet.

---

<!-- INDEX SYNC: After completing a sub-task, run
.plan/helper-scripts/sync-state.sh and update the parent epic.md checklist and
.plan/index.md in the same turn. -->
