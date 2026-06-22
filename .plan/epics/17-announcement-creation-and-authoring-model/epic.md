---
type: epic
id: E-17
name: "Announcement Creation and Authoring Model"
status: in-progress
blocked-by: []
---

## About this Epic

Establish one canonical announcement authoring contract spanning provider-level contact defaults, announcement-level inherited-versus-custom contact behavior, separate CTA targets, scalable category/tag/price primitives, and public fallback behavior. The work must land as thin vertical slices that keep create, edit, persistence, and public rendering aligned instead of letting one surface outrun the others again.

## Context

Canonical PRD: `.plan/prds/PRD-v10-announcement-creation-and-authoring-model.md`

Canonical PRD handoff: `.plan/handoffs/prd-to-issues-announcement-creation-and-authoring-model.md`

Current implementation still mixes two mismatched models: provider configuration stores a broad `socialLinks` object, while announcement create/edit flows still operate on a narrower flat `contactLinks` DTO and public surfaces treat CTA/contact behavior as essentially the same outbound-links concept. This epic serializes the contract work so later UI tasks do not build on the wrong persistence and validation assumptions. Playwright visual/e2e coverage is mandatory for every UI-facing slice, and seeded data is part of the implementation contract rather than a reason to skip coverage.

## Child Tasks

| Task ID | Task | Status | Blocked By | File |
| --- | --- | --- | --- | --- |
| T-17-01 | Provider contact defaults and WhatsApp baseline | ready | — | `.plan/epics/17-announcement-creation-and-authoring-model/tasks/01-provider-contact-defaults-and-whatsapp-baseline.md` |
| T-17-02 | Create flow inherited contact authoring | done | T-17-01 | `.plan/epics/17-announcement-creation-and-authoring-model/tasks/02-create-flow-inherited-contact-authoring.md` |
| T-17-03 | Edit flow contact parity and live inheritance | done | T-17-02 | `.plan/epics/17-announcement-creation-and-authoring-model/tasks/03-edit-flow-contact-parity-and-live-inheritance.md` |
| T-17-04 | Bounded CTA authoring and public fallback | done | T-17-02, T-17-03 | `.plan/epics/17-announcement-creation-and-authoring-model/tasks/04-bounded-cta-authoring-and-public-fallback.md` |
| T-17-05 | Structured category, tags, and money primitives | done | T-17-03 | `.plan/epics/17-announcement-creation-and-authoring-model/tasks/05-structured-category-tags-and-money-primitives.md` |
| T-17-06 | Authoring surface regression and seeded Playwright matrix | ready | T-17-04, T-17-05 | `.plan/epics/17-announcement-creation-and-authoring-model/tasks/06-authoring-surface-regression-and-seeded-playwright-matrix.md` |

---

<!-- INDEX SYNC: After completing or modifying any child task file, run
.plan/helper-scripts/sync-state.sh and update .plan/index.md in the same turn. -->
