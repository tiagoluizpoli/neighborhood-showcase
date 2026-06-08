---
type: bug
epic: 08-architecture-and-quality
status: completed
blocked-by: null
---

## What to Build

Fix the infinite loop of API requests from the frontend to the backend when generating Pix payment intents and tracking impressions:
1. Destructure the referentially stable `mutate` function from the payment details and event tracking mutations.
2. Replace the unstable mutation objects with the stable `mutate` callbacks in the dependency arrays of the `useEffect` hooks.

## Acceptance Criteria

- [x] Accessing `/dashboard/anuncios/:id/pagamento` triggers only one payment intent generation call on component mount.
- [x] Accessing `/anuncios/:id` triggers only one tracking impression event call on component mount (once data is loaded).
- [x] Both components compile, pass linting/formatting checks, and all test suites remain completely green.

## Sub-Tasks

_Sub-tasks will be defined when this task is executed._

---

<!-- INDEX SYNC: After completing a sub-task, update the parent
epic.md child task checklist AND .specify/memory/index.md in the
same turn. Never skip this sync step. -->
