# Project-Specific Runtime Instructions

This file contains project-specific runtime instructions, verification commands, and constraints. It acts as an extension of the main `.plan/prompt.md`.

## Feedback Loops

## Skill Discovery

After the base prompt finishes loading required context, execution must load
and use the `find-skills` skill before planning or implementation.

Use `find-skills` to identify the best task-specific skills for the current
work, then load and follow those selected skills for the rest of the run.

This requirement applies even when the task is ordinary development work and
no other skill has been picked yet.

## Feedback Loops

Before committing, run:
- `bun run test` — unit and integration tests
- `bun run check-types` — TypeScript type check
- `bun run check` — Biome lint
- `bun run test:e2e` — Playwright e2e tests (MANDATORY for any UI change; tests must pass before committing)

Additionally, verify:
- If schema migrations were generated, ensure `<index>_snapshot.json` exists in `packages/db/src/migrations/meta/` for the new migration.
- If user passwords are created/hashed in seeds, tests, or code, ensure they are generated via the canonical `hashPassword` from `"better-auth/crypto"`.

If any step fails, fix before committing. Do not skip tests or mute failures.

## Commit Guidelines

When staging and committing changes, the commit message must:
1. Follow Conventional Commits: `<type>(<scope>): <description>`
2. Use one of the allowed scopes:
   - `root` (Root-level configuration and repository scripts)
   - `multiple` (Changes spanning multiple workspaces/packages)
   - `desktop`, `fumadocs`, `server`, `web`, `pkg-api`, `pkg-auth`, `pkg-config`, `pkg-db`, `pkg-env`, `pkg-feature-flags`, `pkg-ui`
3. Include the completed task and PRD reference in the description or body.
4. Include key decisions made, files changed, and blockers or notes for the next iteration.

## Deferred Backlog

If you come across dirty files, code smells, or any other issues that must be addressed but are not in the current scope, log them to `.specify/memory/deferred_backlog.md` (create it if not present) or add a deferred entry in `.specify/memory/backlog.md`.
