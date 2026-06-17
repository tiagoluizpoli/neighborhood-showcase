# .specify/memory → .plan Migration Implementation Plan

> For Hermes: planning only. Do not execute the migration from this document without a separate implementation pass.

**Goal:** Convert the project's existing planning state from `.specify/memory/` into the new Ralph Loop `.plan/` workspace without losing PRD history, grilling context, epic/task state, backlog decisions, or the currently active execution point.

**Architecture:** Treat this as a content migration plus workflow cutover, not a blind file copy. `.specify/memory` and `.plan` have different contracts: `.specify` stores freeform planning artifacts, while `.plan` requires canonical pointers, thin PRD indexing, explicit handoff files, sub-task-driven task state, and synchronized aggregate indexes. The safest path is to migrate in layers: inventory → canonical mapping rules → PRD/handoff setup → epic/task rewrite → index/state sync → archive/compatibility.

**Tech Stack:** Markdown files, repo-local Ralph Loop workspace (`.plan/`), helper scripts in `.plan/helper-scripts/`, existing project docs in `.specify/memory/`, `agents.local.md`, root `PRD.md`.

---

## Verified Current Context

Based on repository inspection:

- The new Ralph Loop framework is installed under `.plan/` but is still on starter placeholders:
  - `.plan/PRD.md` points to `PRD-v1-replace-me.md`
  - `.plan/index.md` contains only `E-01 / T-01 Replace me`
  - `.plan/prds/.current-prd` and current handoff pointers still point at starter content
- The legacy planning corpus under `.specify/memory/` is substantial and active:
  - 13 epic files
  - 86 task files
  - 9 PRD files
  - 1 grilling session summary file
  - 9 top-level planning docs
  - 4 diagram docs
- The active legacy execution point is epic `13-provider-section-reorg`, where tasks 08/09/10 remain not done.
- The legacy planning system already encodes important rules that must survive migration:
  - thin-index PRD rule
  - full-width UI rule
  - English-in-code rule
  - no skipped Playwright tests
  - dependency-ordered task execution
- `AGENTS.md` explicitly says not to modify `AGENTS.md` and to use `agents.local.md` for local plan references.

---

## Migration Success Criteria

The migration is complete only when all of the following are true:

1. `.plan/PRD.md` reflects the real PRD history instead of starter placeholders.
2. `.plan/prds/` contains the canonical migrated PRD bodies and `.plan/prds/.current-prd` points at the true current PRD.
3. `.plan/grilling/`, `.plan/handoffs/`, and `.plan/sessions/` contain enough migrated context for Ralph Loop to continue without re-grilling already-decided work.
4. `.plan/epics/` contains real epic/task files derived from legacy `.specify/memory/epics/`, with stable dependency metadata.
5. The currently active work in epic 13 is preserved accurately in `.plan` with the correct remaining executable task/sub-task.
6. `.plan/index.md` is regenerated to reflect the migrated epics/tasks, not starter placeholders.
7. `.plan/backlog.md`, `.plan/.run-summary.md`, `.plan/.run-history.jsonl`, and `.plan/progress.txt` are initialized with truthful migrated state.
8. Helper-script pointers (`.current-prd`, `.current-grill-handoff`, `.current-prd-handoff`, `.current-session`) resolve to real files.
9. A compatibility/archive strategy exists so historical `.specify/memory/` material is not silently lost.

---

## Key Assumptions

1. `.plan` becomes the new canonical workflow surface after migration; `.specify/memory/` becomes historical/reference-only.
2. We should preserve semantic history, not necessarily preserve a 1:1 filename mapping for every old file.
3. The root `PRD.md` index remains a valid source of truth for historical PRD status, even though Ralph Loop will primarily use `.plan/PRD.md` and `.plan/prds/`.
4. We do not need to migrate placeholder/stub artifacts verbatim when better canonical equivalents can be derived.
5. The migration should prefer “current usable workflow state” over “perfect archival reproduction of every intermediate planning draft”.

---

## Core Mapping Strategy

### A. PRDs

Legacy sources:
- `.specify/memory/prds/*.md`
- root `PRD.md` index
- `agents.local.md` current-plan reference

Target:
- `.plan/PRD.md`
- `.plan/prds/PRD-vN-<slug>.md`
- `.plan/prds/.current-prd`
- `.plan/handoffs/<prd-handoff>.md`
- `.plan/handoffs/.current-prd-handoff`

Rule:
- Rebuild `.plan/PRD.md` as a thin index from the real legacy PRD set.
- Migrate only versioned PRD bodies as canonical PRDs.
- Carry deprecated/orphan PRD files into `.plan/archive/` or document them as deprecated references, not CURRENT candidates.

### B. Grilling sessions and session summaries

Legacy sources:
- `.specify/memory/grilling_history.md`
- `.specify/memory/sessions/*.md`

Target:
- `.plan/grilling/<dated-session>.md`
- `.plan/grilling/.current-session`
- `.plan/summaries/` for condensed summaries if needed
- `.plan/handoffs/<grill-handoff>.md`
- `.plan/handoffs/.current-grill-handoff`

Rule:
- Promote the latest actionable grilling session into canonical `.plan/grilling/` form.
- Do not dump the entire 900-line `grilling_history.md` into the hot path. Instead, preserve it as an archive/reference and extract phase-relevant summaries/handoffs.

### C. Epics and tasks

Legacy sources:
- `.specify/memory/epics/*/epic.md`
- `.specify/memory/epics/*/tasks/*.md`
- `.specify/memory/index.md`

Target:
- `.plan/epics/<num>-<slug>/epic.md`
- `.plan/epics/<num>-<slug>/tasks/<num>-<slug>.md`
- `.plan/index.md`

Rule:
- Rewrite each task into Ralph Loop schema.
- Preserve dependency order and completion state.
- Convert old “sub-task prose” into explicit `ST-01`, `ST-02`, etc. blocks with `status`, `blocked-by`, `what-to-do`, `files-to-touch`, and `verification`.
- Do not rely on old aggregate statuses alone; task internals must become the new atomic truth.

### D. Backlog / blockers / decisions

Legacy sources:
- `.specify/memory/backlog.md`
- `.specify/memory/deferred_backlog.md`
- `.specify/memory/ui-decision-log.md`

Target:
- `.plan/backlog.md`
- `.plan/.run-summary.md`
- `.plan/archive/` or `.plan/summaries/` for non-hot-path references

Rule:
- Put active/deferred future work into `.plan/backlog.md`.
- Put still-relevant execution blockers into either `.plan/backlog.md` or current task notes.
- Preserve UI decision history as a reference artifact, not necessarily as a first-class Ralph Loop execution file.

### E. General planning docs and diagrams

Legacy sources:
- `.specify/memory/plan.md`
- `.specify/memory/improvements_plan.md`
- `.specify/memory/test_coverage_plan.md`
- `.specify/memory/diagrams/*.md`
- `.specify/memory/constitution.md`

Target:
- Mostly archive/reference under `.plan/archive/` or `.plan/summaries/`
- Pull only still-operative constraints into `.plan/.run-summary.md`, epic/task context, or `agents.local.md`

Rule:
- Do not let old plan documents compete with the new canonical task tree.
- Preserve them as research/history inputs, not live workflow state.
- The placeholder constitution should not be migrated as-is; it is a template, not authoritative project policy.

---

## Proposed Phased Execution Plan

### Phase 1: Freeze the migration contract

**Objective:** Define what is canonical, what is archival, and what gets rewritten.

Steps:
1. Enumerate every `.specify/memory/` artifact class and assign one of: `canonical`, `derived`, `archive`, `discard-placeholder`.
2. Decide whether legacy `.specify/memory/` remains untouched after migration or gets marked deprecated.
3. Record the cutover rule in `agents.local.md`:
   - `.plan` is canonical for ongoing execution
   - `.specify/memory/` is historical reference only after migration
4. Define naming policy for `.plan` migrated artifacts:
   - PRDs keep version numbers/slugs where possible
   - epics become `NN-slug`
   - tasks become `NN-slug.md`
   - grilling/handoff files get dated descriptive names

Likely files to change:
- `agents.local.md`
- `.plan/PRD.md`
- `.plan/index.md`
- `.plan/backlog.md`

### Phase 2: Build the artifact inventory and migration table

**Objective:** Produce a deterministic map from every legacy file class to its new home.

Steps:
1. Generate an inventory table covering:
   - all PRDs
   - all epics
   - all tasks
   - all top-level docs
   - all sessions/diagrams
2. Add columns:
   - `legacy path`
   - `artifact type`
   - `target path`
   - `migration mode` (`copy`, `rewrite`, `summarize`, `archive`, `ignore`)
   - `canonical?`
3. Flag ambiguous items that need judgment:
   - deprecated PRDs
   - `grilling_history.md` vs per-session grilling summaries
   - `deferred_backlog.md` blocker content
   - placeholder `constitution.md`
4. Verify there is exactly one current PRD and one current active execution branch.

Likely files to create/update:
- temporary migration worksheet under `.hermes/plans/` or `.plan/archive/`

### Phase 3: Migrate PRD history first

**Objective:** Make Ralph Loop point at the real PRD history before touching tasks.

Steps:
1. Read root `PRD.md` and all versioned legacy PRDs.
2. Recreate `.plan/prds/` with migrated versioned PRD files.
3. Rebuild `.plan/PRD.md` thin index:
   - preserve chronological versions
   - mark only one `CURRENT`
   - include canonical record path for each row
4. Set `.plan/prds/.current-prd` to the true current PRD.
5. Create a PRD handoff file summarizing the current PRD into Ralph Loop continuation context.
6. Set `.plan/handoffs/.current-prd-handoff` to that file.

Verification:
- `.plan/helper-scripts/get-current-prd.sh` resolves a real current PRD
- `.plan/helper-scripts/get-current-prd-handoff.sh` resolves a real PRD handoff
- `.plan/PRD.md` no longer contains starter placeholders

### Phase 4: Migrate grilling/session continuity

**Objective:** Preserve the decision trail Ralph Loop needs to continue current work.

Steps:
1. Promote the latest actionable grilling session (`2026-06-10-provider-section-reorg-grilling.md`) into `.plan/grilling/`.
2. Create a concise grill handoff file focused on what implementation still depends on.
3. Set `.plan/grilling/.current-session` and `.plan/handoffs/.current-grill-handoff`.
4. Decide how to preserve `grilling_history.md`:
   - archive whole file under `.plan/archive/`, or
   - summarize by session into `.plan/summaries/`
5. Preserve references to earlier major design decisions that still matter for unfinished work.

Verification:
- Current grilling/session pointer files resolve correctly
- Active epic 13 decisions are reachable through the new `.plan` path without consulting `.specify`

### Phase 5: Rewrite epics and tasks into Ralph Loop schema

**Objective:** Convert executable planning state, not just documents.

Steps:
1. Migrate epic directories in dependency-safe order, starting with the active area first:
   - epic 13 first
   - then earlier epics for historical completeness
2. For each legacy epic:
   - assign Ralph Loop epic ID (`E-01`, `E-02`, etc.)
   - write `.plan/epics/<num>-<slug>/epic.md`
   - reconstruct child task table
3. For each legacy task:
   - assign Ralph Loop task ID (`T-01`, etc.) within the global index strategy
   - rewrite frontmatter to new schema
   - convert prose subtasks into `ST-01+` blocks
   - translate legacy `blocked-by` references into new Ralph Loop task references
   - preserve verification commands and file-touch lists
4. For incomplete tasks, ensure exactly one next executable sub-task can be derived.
5. For completed tasks, mark all sub-tasks completed and keep concise execution notes only if still useful.

Important tradeoff:
- This is the highest-risk part because the old task schema is not atomically equivalent to Ralph Loop sub-task state.
- Do not mass-convert all 86 tasks blindly. Pilot on epic 13 first, validate the schema, then batch the rest.

Verification:
- Epic 13 alone should be runnable by Ralph Loop from `.plan` with no placeholder leakage.
- Each migrated task has explicit sub-task blocks.
- Blocked/current statuses still match reality.

### Phase 6: Rebuild `.plan/index.md` from migrated truth

**Objective:** Replace the starter index with a real derived navigation surface.

Steps:
1. Populate `Current Run Family` with the true current pointers.
2. Add real grilling session entries.
3. Add full PRD history table.
4. Add epic table using migrated epic IDs and statuses.
5. Add task table using migrated task IDs and statuses.
6. Run `.plan/helper-scripts/sync-state.sh` after task/epic content is in place.

Verification:
- `.plan/index.md` matches the migrated task files
- no starter “Replace me” rows remain

### Phase 7: Initialize Ralph Loop runtime state

**Objective:** Give the new framework enough run-state context to resume work safely.

Steps:
1. Seed `.plan/.run-summary.md` with durable carry-forward context:
   - current epic/task focus
   - major rules that affect unfinished work
   - known blocker state (if any)
2. Seed `.plan/.run-state.json` with a minimal truthful state object rather than placeholder values.
3. Seed `.plan/.run-history.jsonl` with either:
   - a compact migration event only, or
   - a compact imported history baseline plus migration event
4. Update `.plan/progress.txt` to reflect migration completion and the next executable item.

Verification:
- Ralph Loop can start from `.plan/prompt.md` and understand what to do next without reading `.specify`

### Phase 8: Archive and compatibility pass

**Objective:** Preserve research/history without letting it hijack the new workflow.

Steps:
1. Move or copy non-canonical legacy docs into `.plan/archive/` or `.plan/summaries/` with a clear status header.
2. Add deprecation headers to legacy `.specify/memory/` entrypoints if desired, but only after the new `.plan` is verified.
3. Update `agents.local.md` “Current Plan Reference” section to point to `.plan`, not `.specify/memory`.
4. Keep root `PRD.md` and other non-`.plan` canonical docs aligned where project rules require cross-file persistence.

Verification:
- No ambiguity remains about whether `.specify/memory` or `.plan` is canonical.

---

## Recommended Migration Order

1. Framework contract + cutover note
2. PRD history and current PRD pointers
3. Latest grilling session + handoffs
4. Active epic 13 only
5. `.plan/index.md` + runtime state
6. Validate Ralph Loop can continue epic 13
7. Migrate completed/historical epics in batches
8. Archive old planning docs

Reason: this minimizes risk and gets you back to useful execution fastest. Migrating every historical artifact before the current unfinished epic would burn time without helping the active workflow.

---

## Files Likely To Change During the Real Migration

### Definitely
- `agents.local.md`
- `.plan/PRD.md`
- `.plan/index.md`
- `.plan/backlog.md`
- `.plan/prds/.current-prd`
- `.plan/grilling/.current-session`
- `.plan/handoffs/.current-grill-handoff`
- `.plan/handoffs/.current-prd-handoff`
- `.plan/.run-state.json`
- `.plan/.run-history.jsonl`
- `.plan/.run-summary.md`
- `.plan/progress.txt`

### New migrated content
- `.plan/prds/PRD-v*.md`
- `.plan/grilling/*.md`
- `.plan/handoffs/*.md`
- `.plan/epics/*/epic.md`
- `.plan/epics/*/tasks/*.md`
- `.plan/archive/*` and/or `.plan/summaries/*`

### Probably untouched
- `AGENTS.md`
- framework-managed helper scripts under `.plan/helper-scripts/`
- `.plan/shared/*.md` templates unless a genuine template bug is discovered

---

## Validation Checklist For The Migration Pass

After implementation, run these checks in order:

1. Structural checks
   - confirm no starter placeholder rows remain in `.plan/PRD.md` and `.plan/index.md`
   - confirm all pointer files resolve to existing non-placeholder files
2. Content checks
   - confirm current PRD in `.plan` matches legacy current PRD
   - confirm epic 13 status matches legacy reality
   - confirm remaining unfinished tasks are preserved accurately
3. Workflow checks
   - run `.plan/helper-scripts/get-current-prd.sh`
   - run `.plan/helper-scripts/get-current-prd-handoff.sh`
   - run `.plan/helper-scripts/get-current-grill.sh`
   - run `.plan/helper-scripts/get-current-grill-handoff.sh`
   - run `.plan/helper-scripts/sync-state.sh`
4. Human checks
   - open `.plan/index.md` and verify the next executable work is obvious
   - verify `agents.local.md` no longer points operators at stale `.specify` paths
5. Safety checks
   - verify archival material is still reachable before deprecating legacy entrypoints

---

## Major Risks / Tradeoffs

### Risk 1: False 1:1 conversion of task state
Old task files are not structurally identical to Ralph Loop task files. A naive mechanical conversion will produce misleading sub-task state.

Mitigation:
- pilot on epic 13 first
- derive sub-task state manually/semantically where needed
- validate next executable task by inspection

### Risk 2: Duplicated sources of truth
If `.specify/memory` and `.plan` both look current, future agents will split state again.

Mitigation:
- explicit cutover note in `agents.local.md`
- clear deprecation/archive headers
- only one canonical current pointer family

### Risk 3: Over-migrating historical noise
Not every legacy planning document deserves live workflow status.

Mitigation:
- preserve as archive/reference, not canonical `.plan` state
- prioritize active PRD + active epic + current grilling context

### Risk 4: Breaking project-specific cross-file rules
This project expects important decisions to persist across multiple files.

Mitigation:
- keep `agents.local.md` aligned
- keep root `PRD.md` semantics respected
- avoid changing `AGENTS.md`

---

## Open Questions To Resolve Before The Actual Migration Pass

1. Do you want `.specify/memory/` left intact as a read-only archive, or should we add deprecation headers/cross-links after cutover?
2. Should earlier completed epics be fully rewritten into Ralph Loop task schema now, or do you want a pragmatic cutover that migrates epic 13 first and archives older epics until needed?
3. For `grilling_history.md`, do you want:
   - full archival copy under `.plan/archive/`, or
   - curated per-session summaries only?
4. Do you want the root `PRD.md` kept as a cross-checking index in parallel with `.plan/PRD.md`, or should `.plan/PRD.md` become the only active PRD index for workflow purposes while root `PRD.md` remains historical/project-level?

---

## Recommended Next Move

Do the migration in two implementation passes, not one:

1. Pass A: make `.plan` truly usable for the current unfinished work only
   - migrate PRDs
   - migrate current grilling/handoffs
   - migrate epic 13
   - rebuild `.plan/index.md`
   - verify Ralph Loop can continue

2. Pass B: backfill historical epics/docs
   - migrate older completed epics if you still want them in native Ralph Loop format
   - archive non-canonical planning docs
   - deprecate `.specify/memory` entrypoints

That gets you unstuck fastest while still preserving the full planning estate.
