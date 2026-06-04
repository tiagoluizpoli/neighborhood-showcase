# Public Browsing Shell Navigation Completion

## Parent

PRD-v2-backlog-overhaul follow-up for public portal and panel separation.

## What to build

Finish the public browsing shell so the visitor experience stays separate from the private panel experience and the public routes remain easy to navigate.

This slice should ensure that:

- public browsing routes render the public header/footer only
- authenticated users still get a clear `Painel` entry point
- logged-out users get a clear `Entrar` entry point
- private navigation never leaks into the public shell
- `/auth` remains a focused auth experience
- `/panel/*` remains fully separate

## Acceptance criteria

- [ ] Public browsing routes render the public shell, not the private panel shell.
- [ ] The public header shows only public links plus `Entrar` or `Painel` depending on auth state.
- [ ] The public footer shows only public browsing links and no private navigation.
- [ ] `/auth` uses the focused auth experience.
- [ ] `/panel/*` remains separate from public browsing routes.
- [ ] Route/component tests verify logged-in and logged-out public shell behavior.
- [ ] No private navigation items leak into public browsing surfaces.

## Blocked by

- None - can start immediately
