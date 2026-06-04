---
issueId: auto
---

# MANDATORY CONTEXT

Read `AGENTS.md`, then `agents.local.md`, then `PRD.md`.
Review the last 10 recent commits if they are provided in the run context.

# PRD

Use `PRD.md` as the source of truth.
Inspect `.specify/memory/issues/` for the active issue that matches the next task.

# TASK BREAKDOWN

Break the PRD into the smallest possible tasks. Do not outrun your headlights.

# TASK SELECTION

Pick the next task.

If there are no more tasks, emit `<promise>NO MORE TASKS</promise>`.

# EXPLORATION

Inspect the repo only as far as needed to complete the selected task.

# EXECUTION

Complete only the selected task.

If anything blocks completion, emit `<promise>ABORT</promise>`.

# FEEDBACK LOOPS

Before committing, run:

- `bun run test`
- `bun run check-types`
- `bun run check`

# COMMIT

Make a git commit immediately after the task is complete.

The commit message must:

1. Follow Conventional Commits: `<type>(<scope>): <description>`
2. Use an appropriate scope for the area touched
3. Include the completed task and PRD reference in the description or body
4. Include the key decisions made
5. Include the files changed
6. Include blockers or notes for the next iteration

Keep it concise.

# FINAL RULES

ONLY WORK ON A SINGLE TASK.
Keep the worktree clean after each task.
Update `/progress.txt` and the active issue markdown with checked tasks and notes.
Follow the Karpathy Guidelines, caveman communication, and the clean-architecture rules in `agents.local.md`.
