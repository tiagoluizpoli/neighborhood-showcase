# Engineering Rules (starter aligned with manifest contract)

> Read this file first on every Ralph Loop iteration.

This file is the consumer repository's canonical rules document.

## Contract

- Put repo-specific engineering rules here.
- `agents.local.md` is optional repo-local context. Read it only if present.
- Keep task selection, workflow state, and execution history under `.plan/`.
- Treat current pointer files and current handoff pointers under `.plan/` as
  canonical selectors for cross-session planning phases.
- Respect blocked state. Do not select blocked work unless an explicit unblock
  transition has been recorded.
- Work at the sub-task level. A task or epic status is derived, not invented.
- Pick one executable sub-task per iteration.
- Use `.plan/helper-scripts/sync-state.sh` after atomic state changes.
- Update `.plan/progress.txt` during the run, not only at the end.
- Persist current machine state in `.plan/.run-state.json`.
- Persist structured history in `.plan/.run-history.jsonl`.
- Persist durable carry-forward context in `.plan/.run-summary.md`.
- Use `.plan/helper-scripts/retrieve-history.sh` before implementation when the
  current work touches previously-worked areas.
- Historical retrieval is bounded to three rounds. If still insufficient, block
  the sub-task and continue only with other dependency-safe executable work.

## Consumer note

Replace this starter content with the repository's actual rules before using Ralph Loop in production work.
