---
type: refactor
epic: 08-architecture-and-quality
status: completed
blocked-by: null
---

## What to Build

Finish the public browsing shell so the visitor experience stays separate from the private panel experience and the public routes remain easy to navigate.

This slice should ensure that:

- public browsing routes render the public header/footer only
- authenticated users still get a clear `Painel` entry point
- logged-out users get a clear `Entrar` entry point
- private navigation never leaks into the public shell
- `/auth` remains a focused auth experience
- `/panel/*` remains fully separate

## Acceptance Criteria

- [x] Public browsing routes render the public shell, not the private panel shell.
- [x] The public header shows only public links plus `Entrar` or `Painel` depending on auth state.
- [x] The public footer shows only public browsing links and no private navigation.
- [x] `/auth` uses the focused auth experience.
- [x] `/panel/*` remains separate from public browsing routes.
- [x] Route/component tests verify logged-in and logged-out public shell behavior.
- [x] No private navigation items leak into public browsing surfaces.

## Sub-Tasks

_Sub-tasks will be defined when this task is executed._

---

<!-- INDEX SYNC: After completing a sub-task, update the parent
epic.md child task checklist AND .specify/memory/index.md in the
same turn. Never skip this sync step. -->
