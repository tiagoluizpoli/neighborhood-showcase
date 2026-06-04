---
issueId: 62_backend_managed_announcement_categories.md
---

# MANDATORY CONTEXT

Before starting ANY work, you MUST read and internalize the following files in this exact order:

1. **`AGENTS.md`** (project root) — Global agent protocol, behavioral rules, and Karpathy Guidelines.
2. **`agents.local.md`** (project root) — Project-specific architecture rules, tech stack, file structure, and **Clean Architecture layer boundary enforcement**. Section 9 is CRITICAL and NON-NEGOTIABLE.

These files define the architectural laws of this codebase. Every line of code you write, refactor, or review MUST comply with them. If a task requires violating any rule in `agents.local.md`, you MUST stop and emit `<promise>ABORT</promise>` with a detailed explanation.

# SPECKIT BYPASS

This project uses the **Ralph Loop** for task execution, NOT SpecKit workflows. The following SpecKit-specific elements referenced in `AGENTS.md` are **IGNORED**:

- SpecKit commands (`/speckit.specify`, `/speckit.plan`, `/speckit.tasks`, etc.)
- SpecKit folders (`.specify/workflows`, `.specify/scripts`, `.specify/templates`, `.specify/extensions`)
- SpecKit-specific enforcement rules (e.g., "invoke prompt-enhancer protocol before processing any feature description")
- The Task-by-Task Implementation Flow (replaced by the Ralph Loop's own RED → GREEN → REFACTOR cycle below)

The following concepts and skills referenced in `AGENTS.md` **ARE still active and MUST be followed**:

- **Karpathy Guidelines** — Think before coding, simplicity first, surgical changes.
- **UI Red Flag Protocol** — Stop, log, and prompt before any out-of-scope UI change.
- **Backend Specialist** — SOLID enforcement, 4-layer Clean Architecture, ARBC security model.
- **Testing Skills** (`test-coverage`, `test-backend`, `test-frontend`, `test-e2e`, `test-master`) — Exhaustive test scenario coverage.
- **Code Review** (`code-review`) — Spec alignment, architecture, SOLID enforcement.
- **Karpathy Guidelines**, **Diagnose**, **TDD** — Core behavioral and debugging protocols.
- **Clean Architecture layer boundary rules** in `agents.local.md` Section 9 — **ALWAYS enforced, on every iteration, no exceptions.**

# COMMUNICATION PROTOCOL

You MUST load and follow the [caveman skill](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.agents/skills/caveman/SKILL.md) for EVERY response. Smart caveman style (terse, no fluff/pleasantries, fragments OK, technical accuracy kept). This rule is active for every single turn.


# PRD

Pull @PRD.md into your context. (Make sure to verify if PRD.md, prod.md, PROD.md, or prd.md is present in the repository root and pull the correct one).

You've been passed a file containing the last 10 RALPH commits (SHA, date, full message). Review these to understand what work has been done.

# TASK BREAKDOWN

You must base your task breakdown on the vertical-slice issues already defined in `.specify/memory/issues/`. Read those files to align your task breakdown with the planned scope and verification criteria.

Break down the PRD and the issues into small, fine-grained tasks. Make each task the smallest possible unit of work. We don't want to outrun our headlights. Aim for one small change per task.

# TASK SELECTION

Pick the next task. Prioritize tasks in this order:

1. Critical bugfixes
2. Development infrastructure
   Getting development infrastructure like tests and types and dev scripts ready is an important precursor to building features.
3. Tracer bullets for new features
   A tracer bullet is a small, end-to-end slice of functionality that goes through all layers of the system (database, backend, frontend, presentation), allowing you to test and validate your approach early. Build a tiny, end-to-end slice of the feature first, then expand it out.
4. Polish and quick wins
5. Refactors

If there are no more tasks, emit <promise>NO MORE TASKS</promise>.

# EXPLORATION

Explore the repo and fill your context window with relevant information that will allow you to complete the task.

# EXECUTION: RED

First, write tests that fail because the feature is not yet implemented.

Run the tests to check that they fail using `bun run test`.

Tests should focus on the publicly accessible interface of the system. They should test user behavior, not internal implementation details.

### Test Integrity Rules:
1. **Mandatory Test Implementation**: You must write corresponding test cases (unit, integration, or component as defined in the Test Coverage Plan) along with the code for the task at hand. Do not write feature code without accompanying tests.
2. **Test-Driven Integrity**: Tests must represent the correct behavior of the specification. You are strictly forbidden from modifying or deleting existing tests to make a new implementation pass.
3. **Approval for Changing Tests**: If you believe a change to an existing test is absolutely necessary, you must stop immediately, document the options, rationale, and "whys", and ask the user for approval. Do not modify existing tests without explicit instruction.
4. **Additions Allowed**: You may append new tests to existing test files to increase coverage, but the existing tests must remain unchanged.

# EXECUTION: GREEN

Next, implement the minimum amount of code necessary to make the tests pass.

# EXECUTION: REFACTOR

Finally, ALWAYS refactor the code to improve its structure. Adhere to the following guidelines:

- Code is clear and readable
- Functions and variables are well-named
- No duplicated code
- Proper error handling
- No exposed secrets or API keys
- Input validation implemented
- Good test coverage
- Performance considerations addressed

### Frontend & UI Implementation Rules (if applicable):
1. **Base Shadcn/ui Only**: Everything must be built using the base shadcn/ui components. Check if a component exists first and use it. Do not invent new components from scratch.
2. **Prioritize Composition**: If you must build a custom component, compose it strictly using existing shadcn/ui components.
3. **Avoid Raw HTML**: Avoid using raw HTML tags unless strictly necessary (e.g. wrapper `div`s for layout positioning, or when no shadcn/ui alternative exists). Otherwise, compose with base components.
4. **Consistency**: Ensure all components match the typography, shapes, and colors of the defined design system.

If anything blocks your completion of the task, output <promise>ABORT</promise>.

# FEEDBACK LOOPS

Before committing, run the feedback loops:

- `bun run check` to check linting and formatting
- `bun run check-types` to run the type checker
- `bun run test` to run the test suite

# PROGRESS LOGGING

After completing your task (or if you are aborting/blocking), you MUST:
1. Append a single-line log entry to `/progress.txt` in this exact format:
   `[YYYY-MM-DD HH:MM:SS] Iteration X | Worked: [list what was implemented/passed] | Failed: [list any errors, failures, warnings, or write 'None'] | Status: [Y]% Complete. [If finished: "Loop Terminated. <promise>NO MORE TASKS</promise>", If aborted: "Loop Terminated. <promise>ABORT</promise>"]`
2. Update the active issue markdown file in `.specify/memory/issues/` by marking the completed tasks as checked (`[x]`) and adding any relevant notes regarding failed attempts or current status.

# COMMIT

Make a git commit. The commit message must:

1. Start with `RALPH:` prefix
2. Include task completed + PRD reference
3. Key decisions made
4. Files changed
5. Blockers or notes for next iteration

Keep it concise.

# FINAL RULES

ONLY WORK ON A SINGLE TASK.
