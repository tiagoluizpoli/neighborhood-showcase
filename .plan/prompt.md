---
issueId: auto
---

# Ralph Loop Prompt

## Mandatory Context

Read in this order:

1. `.plan/RULES.md`
2. `agents.local.md` if it exists
3. `.plan/PRD.md`
4. `.plan/index.md`
5. current pointer files under `.plan/grilling/`, `.plan/prds/`, and
   `.plan/handoffs/` when the selected phase depends on them
6. the current epic and task files for the selected work
7. `.plan/.run-summary.md`

## Work Selection

- Select only dependency-safe executable work.
- Never pick blocked work.
- Use task-file sub-task metadata as the atomic source of truth.
- Use `.plan/helper-scripts/sync-state.sh` after state mutations.

If no executable work remains, emit `<promise>NO MORE TASKS</promise>`.

## Retrieval Phase

Before implementation, determine whether the selected work touches:

- previously-worked files
- archived PRDs or epics
- existing blockers or prior failed attempts
- past decisions that should be reused instead of rediscovered

If yes, run `.plan/helper-scripts/retrieve-history.sh`.

- Retrieval is deterministic and tool-driven first.
- Up to three bounded retrieval rounds are allowed.
- If context is still insufficient after the third round, block the sub-task
  with reason `insufficient-historical-context`.

## Execution

- Complete only the selected sub-task.
- Respect `default-model`, `model`, and `escalate-if` metadata.
- Persist retries and escalation state in `.plan/.run-state.json`.
- Log meaningful progress to `.plan/progress.txt`.
- Append durable structured events to `.plan/.run-history.jsonl`.
- Update `.plan/.run-summary.md` only with durable conclusions.

If no other executable work remains after a blocker, emit `<promise>ABORT</promise>`.
