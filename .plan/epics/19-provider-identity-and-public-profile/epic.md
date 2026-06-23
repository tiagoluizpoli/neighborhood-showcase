---
type: epic
id: E-19
name: "Provider Identity, Configuration IA, and Public Profile"
status: in-progress
blocked-by: []
---

## About this Epic

Model provider identity as ONE system spanning the private configuration page and the public provider page. The spine is a single identity-precedence helper (`logo → avatar → initials`; banner is background-only, never an identity mark) consumed by the config live preview, the public hero, and provider cards. On top of that, fix the image-asset lifecycle — a role-parameterized `ImageUploadField` with Replace / Re-crop / Remove and re-crop from the ORIGINAL full-resolution upload, which forces an original-retention backend slice (schema migration + storage strategy + profile contract). Then reorganize the config IA identity-first (identity & branding + live preview → compact visibility toggle row → contact) and recompose the public page (hero → announcements → contact, single identity mark, sparse fallback, max-width cap). The helper and image lifecycle (with original retention) land before the public recomposition so every consuming surface sits on a stable contract.

## Context

Canonical PRD: `.plan/prds/PRD-v12-provider-identity-and-public-profile.md`

Canonical PRD handoff: `.plan/handoffs/prd-to-issues-provider-identity-and-public-profile.md`

Current state: the public page `apps/web/src/routes/_portal.providers.$id.tsx` renders logo-OR-avatar AND then an always-on second avatar (two identity marks at once). `apps/web/src/components/image-upload-field.tsx` exposes a raw URL text input and has no first-class re-crop; image fields persist only the final cropped URL, so there is no original to re-crop from. The config page `apps/web/src/routes/panel/provider/configuration.tsx` composes `-configuration-public-profile-section.tsx` → `-configuration-contact-channels-section.tsx` → `-configuration-visibility-section.tsx` with visibility last behind a heavyweight Card. The schema `packages/db/src/schema/showcase.ts` `provider_profile` stores `avatar_url`, `logo_url`, `banner_url` only. Migrations are additive over a single base migration `0000_concerned_violations.sql`; rebuilding the base migration drops embedded postgis/seed SQL, so additive migration is required. Issue #3 (i18n leaking keys) is resolved — only a pt/en parity pass remains. The announcement-card link/grid contract is preserved; the public slice is composition/width/fallback only. Verify suspicious `bun test` failures per-file due to cross-file `mock.module` leakage.

## Child Tasks

| Task ID | Task | Status | Blocked By | File |
| --- | --- | --- | --- | --- |
| T-19-01 | Shared identity-precedence helper | done | — | `.plan/epics/19-provider-identity-and-public-profile/tasks/01-shared-identity-precedence-helper.md` |
| T-19-02 | Original-image retention backend slice | done | — | `.plan/epics/19-provider-identity-and-public-profile/tasks/02-original-image-retention-backend.md` |
| T-19-03 | Role-parameterized ImageUploadField with re-crop | done | — | `.plan/epics/19-provider-identity-and-public-profile/tasks/03-role-parameterized-image-upload-field.md` |
| T-19-04 | Configuration IA reorg, identity-first | ready | T-19-01, T-19-03 | `.plan/epics/19-provider-identity-and-public-profile/tasks/04-configuration-ia-reorg.md` |
| T-19-05 | Public page identity-hero recomposition | ready | T-19-01 | `.plan/epics/19-provider-identity-and-public-profile/tasks/05-public-page-recomposition.md` |
| T-19-06 | i18n pt/en parity and cross-surface E2E matrix | ready | T-19-04, T-19-05 | `.plan/epics/19-provider-identity-and-public-profile/tasks/06-i18n-parity-and-e2e-matrix.md` |

---

<!-- INDEX SYNC: After completing or modifying any child task file, run
.plan/helper-scripts/sync-state.sh and update .plan/index.md in the same turn. -->
