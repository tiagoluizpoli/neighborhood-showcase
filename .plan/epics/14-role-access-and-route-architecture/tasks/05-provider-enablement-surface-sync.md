---
type: task
id: T-14-05
epic: E-14
status: ready
blocked-by: [T-14-02]
default-model: medium
---

## What to Build

Align the non-Provider discovery/activation surface and the canonical Provider management surface so both write the same backend source of truth for Provider-enabled state and keep navigation visibility, route authorization, and user guidance synchronized.

## Context

PRD-v8 keeps two coordinated Provider enablement surfaces: a primary discovery/activation path for non-Providers outside the active Provider namespace, and a canonical management surface in account/settings/provider configuration. Both must update the same backend source of truth so the UI never drifts from authorization.

## Acceptance Criteria

- [ ] A non-Provider discovery/activation surface exists outside the active Provider namespace.
- [ ] The canonical management/configuration surface writes the same backend source of truth as the discovery surface.
- [ ] Enabling or disabling Provider capability updates navigation visibility and route authorization coherently.
- [ ] Touched user guidance clearly explains the state instead of dropping users into half-working Provider pages.
- [ ] Automated coverage proves capability transitions with real seeded states and visual assertions where relevant.

## Sub-Tasks

### ST-01 - Implement the non-Provider discovery and activation path

status: ready
model: medium
escalate-if: []
blocked-by: [T-14-02]

what-to-do:
- Build or adapt the primary discovery/activation surface for users who are not currently Provider-enabled.
- Keep that surface outside the active `/panel/provider/*` namespace.
- Ensure the surface explains how to activate Provider capability without leaking Provider pages prematurely.

files-to-touch:
- `apps/web/src/routes/`
- touched onboarding/account/provider-related surfaces
- related i18n locale files

verification:
- `bun run check`
- `bun run check-types`
- browser/test verification that non-Providers get guidance instead of half-working Provider pages

#### Execution Notes

- UI work here is architectural/product-contract work, not a broad visual redesign.

### ST-02 - Synchronize the management surface to the same source of truth

status: ready
model: medium
escalate-if: []
blocked-by: [T-14-02]

what-to-do:
- Align the account/settings/provider configuration management surface with the canonical Provider-enabled backend source of truth.
- Ensure both enablement surfaces produce the same downstream nav and authorization outcomes.
- Remove touched drift between settings state and actual route access behavior.

files-to-touch:
- `apps/web/src/routes/panel/dashboard/configuration.tsx`
- touched account/settings/provider configuration files
- related server endpoints or DTO seams

verification:
- `bun run check`
- `bun run check-types`
- touched tests prove settings-state and route-access coherence

#### Execution Notes

- The user-visible surface can differ; the backend write target must not.

### ST-03 - Add executable coverage for Provider capability transitions

status: ready
model: medium
escalate-if: []
blocked-by: [T-14-02]

what-to-do:
- Add E2E coverage for discovery-surface activation, management-surface updates, navigation visibility changes, and route-authorization changes after capability transitions.
- Add screenshot assertions where they materially protect the onboarding/configuration visual contract.
- Use real seeded capability states and transition flows.

files-to-touch:
- `apps/web/tests/`
- relevant snapshot files
- relevant seed/setup files

verification:
- `bun run test:e2e`
- `bun run check`
- `bun run check-types`

#### Execution Notes

- The acceptance bar is synchronized behavior across activation, nav, and route access.


---

<!-- INDEX SYNC: After completing a sub-task, run
.plan/helper-scripts/sync-state.sh and update the parent epic.md checklist and
.plan/index.md in the same turn. -->
