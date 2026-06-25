---
issueId: auto
---

# MANDATORY CONTEXT

Read `RULES.md` FIRST. It is the canonical rules doc (clean-architecture
boundaries, i18n, sidebar UX, PRD disambiguation, Ralph conduct). It is
loaded on every iteration before anything else.

Then read `AGENTS.md`, then `agents.local.md` (project-context only — not
rules), then `PRD.md`.
Review the last 10 recent commits if they are provided in the run context.

# SKILL DISCOVERY

After loading all mandatory context, load and use the `find-skills` skill
before planning, task selection, or implementation.

Use it to identify the best additional skills for the current task, then load
and follow the selected skills during execution.

This step is mandatory on every iteration, including development tasks where
no specialized skill has been chosen yet.

# PRD

Use `PRD.md` as the source of truth.
Read `.specify/memory/index.md` to find the next epic and task to work on.
The index points to epic files (e.g. `epics/01-auth-and-registration/epic.md`)
which in turn point to task files (e.g. `epics/01-auth-and-registration/tasks/01_auth_cpf_validation.md`).

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

- `bun run test` — unit and integration tests
- `bun run check-types` — TypeScript type check
- `bun run check` — Biome lint
- `bun run test:e2e` — Playwright e2e tests (MANDATORY for any UI change; tests must pass before committing)

Additionally, verify:
- If schema migrations were generated, ensure `<index>_snapshot.json` exists in `packages/db/src/migrations/meta/` for the new migration.
- If user passwords are created/hashed in seeds, tests, or code, ensure they are generated via the canonical `hashPassword` from `"better-auth/crypto"`.

If any step fails, fix before committing. Do not skip tests or mute failures.

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
If you come across dirty files, code smells or any other kind of things that must be addressed and it is not on the current scope (or in next tasks), save it to `.specify/memory/deferred_backlog.md` (create it if not present).
Follow the Karpathy Guidelines, caveman communication, and the clean-architecture rules in `agents.local.md`.
