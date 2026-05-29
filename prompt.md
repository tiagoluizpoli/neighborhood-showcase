# PRD

Pull @PRD.md into your context.

You've been passed a file containing the last 10 RALPH commits (SHA, date, full message). Review these to understand what work has been done.

# TASK BREAKDOWN

You must base your task breakdown on the vertical-slice issues already defined in `.specify/memory/issues/`. Read those files to align your task breakdown with the planned scope and verification criteria.

Break down the PRD and the issues into small, fine-grained tasks. Make each task the smallest possible unit of work. We don't want to outrun our headlights. Aim for one small change per task.

# TASK SELECTION

Pick the next task.

If there are no more tasks, emit <promise>NO MORE TASKS</promise>.

# EXPLORATION

Explore the repo and fill your context window with relevant information that will allow you to complete the task.

# EXECUTION

Complete the task.

If anything blocks your completion of the task, output <promise>ABORT</promise>.

# TEST ENFORCEMENT & INTEGRITY

To ensure correctness and prevent regressions, you must follow these strict rules:

1. **Mandatory Test Implementation**: You must write corresponding test cases (unit, integration, or component as defined in the Test Coverage Plan) along with the code for the task at hand. Do not write feature code without accompanying tests.
2. **Test-Driven Integrity**: Tests must represent the correct behavior of the specification. You are strictly forbidden from modifying or deleting existing tests to make a new implementation pass.
3. **Approval for Changing Tests**: If you believe a change to an existing test is absolutely necessary, you must stop immediately, document the options, rationale, and "whys", and ask the user for approval. Do not modify existing tests without explicit instruction.
4. **Additions Allowed**: You may append new tests to existing test files to increase coverage, but the existing tests must remain unchanged.

# FRONTEND & UI IMPLEMENTATION RULES

For all frontend/UI tasks, you must strictly adhere to these rules:

1. **Base Shadcn/ui Only**: Everything must be built using the base shadcn/ui components. Check if a component exists first and use it. Do not invent new components from scratch.
2. **Prioritize Composition**: If you must build a custom component, compose it strictly using existing shadcn/ui components.
3. **Avoid Raw HTML**: Avoid using raw HTML tags unless strictly necessary (e.g. wrapper `div`s for layout positioning, or when no shadcn/ui alternative exists). Otherwise, compose with base components.
4. **Consistency**: Ensure all components match the typography, shapes, and colors of the defined design system.

# FEEDBACK LOOPS

Before committing, run the feedback loops:

- `bun run check` to check linting and formatting
- `bun run check-types` to run the type checker
- `bun run test` to run the test suite

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
