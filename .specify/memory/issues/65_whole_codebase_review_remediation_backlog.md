# Whole Codebase Review Remediation Backlog

## Parent

Whole-codebase review follow-up after `code-review` and `improve-codebase-architecture` audits.

## What to build

Convert the whole-codebase audit into a durable, risk-first remediation queue that Ralph Loop can execute one slice at a time.

This umbrella issue is not itself an implementation slice. It exists to preserve the audit context, ordering, and rationale behind the child issues created from the review.

The review found four major categories of work:

1. Correctness and access-control bugs.
2. Provider Profile seam cleanup and privacy enforcement.
3. Oversized shallow modules that need deeper seams.
4. Documentation and architecture-source-of-truth alignment.

## Child issue order

- [x] `66_admin_global_access_route_parity.md`
- [x] `67_provider_profile_public_visibility_enforcement.md`
- [ ] `68_provider_profile_explicit_provisioning_and_pure_reads.md`
- [ ] `69_announcement_server_interface_decomposition.md`
- [ ] `70_public_vitrine_route_family_decomposition.md`
- [ ] `71_provider_dashboard_route_family_decomposition.md`
- [ ] `72_moderation_admin_route_family_decomposition.md`
- [ ] `73_frontend_export_surface_and_bundle_cleanup.md`

## Audit summary to preserve

### Correctness

- `ADMINISTRATOR` is authorized in backend admin flows but blocked by at least one web route guard.
- `Provider Profile` visibility currently gates directory listing but not the full public seam.

### Backend seam friction

- `DrizzleUserRepository` currently performs write-on-read profile backfill.
- `announcement.ts` and `announcement-repository.ts` expose a broad, shallow server seam that mixes unrelated capabilities.

### Frontend seam friction

- Oversized route families include:
  - public vitrine
  - provider dashboard
  - moderation/admin
- These modules mix orchestration, storage policy, transport state, modal state, and rendering in single files.

### Performance and hygiene

- Full web build emitted a large main chunk warning.
- Web code still contains several default exports despite local named-export guidance.

### Documentation

- `ADR-0001` no longer described the intended backend architecture and required supersession.

## Acceptance criteria

- [ ] Every finding from the whole-codebase audit is represented by an executable child issue or already-resolved documentation artifact.
- [ ] Child issues are ordered by risk/correctness first, then seam cleanup, then large decomposition, then hygiene/performance cleanup.
- [ ] Each child issue is narrow enough for Ralph Loop to execute independently.
- [ ] Each child issue preserves behavior unless it explicitly documents an approved behavior change.
- [ ] Each child issue includes validation guidance.

## Blocked by

- None - umbrella can start immediately

## Progress notes

- 2026-06-05: Created from a whole-codebase audit run in full-codebase mode rather than diff-only mode. The audit reviewed backend, web, shared packages, architecture docs, and current ADRs, then converted the findings into a Ralph Loop backlog.
- 2026-06-05: `docs/adr/0004-layered-clean-architecture-supersedes-feature-sliced-backend.md` was added immediately so the repo now has a truthful architecture source of record before the remediation slices begin.
