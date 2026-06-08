---
type: feature
epic: 05-public-browsing-ui
status: completed
blocked-by: null
---

## What to Build

Unify all authenticated routes under a `/panel/*` prefix, create completely independent layouts for the public portal and the authenticated panel, and establish CSS variable scoping for future visual identity divergence.

1. **Route migration**: Move `/dashboard/*` to `/panel/dashboard`, `/admin` to `/panel/admin`, `/moderation` to `/panel/moderation`. Create a parent `/panel` route that handles the shared auth guard.
2. **Redirects**: Add redirects from old paths (`/dashboard`, `/admin`, `/moderation`) to their new `/panel/*` equivalents to prevent broken bookmarks.
3. **Independent layouts**: Create two separate layout components — one for the public portal (own header/footer), one for the panel (will receive sidebar in next slice). Zero shared layout components between them.
4. **CSS variable scoping**: Add `data-theme="portal"` wrapper on the public layout and `data-theme="panel"` wrapper on the panel layout. Define initial variable overrides in `globals.css` (can be identical for now — the infrastructure is what matters).
5. **"Become a Provider" entry point**: Add a subtle section at the bottom of the home page ("Quer anunciar seus serviços? Saiba mais") and a footer link leading to the auth/sign-up flow.

## Acceptance Criteria

- [x] All authenticated routes live under `/panel/*`
- [x] Old paths (`/dashboard`, `/admin`, `/moderation`) redirect to their `/panel/*` equivalents
- [x] Public portal and panel use completely independent layout components
- [x] `data-theme="portal"` and `data-theme="panel"` wrappers exist on their respective layouts
- [x] "Become a Provider" link exists in the home page footer and in a subtle bottom section
- [x] Unauthenticated access to `/panel/*` redirects to `/`
- [x] All existing route guard tests pass (updated for new paths)

## Sub-Tasks

_Sub-tasks will be defined when this task is executed._

---

<!-- INDEX SYNC: After completing a sub-task, update the parent
epic.md child task checklist AND .specify/memory/index.md in the
same turn. Never skip this sync step. -->
