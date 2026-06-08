---
type: feature
epic: 05-public-browsing-ui
status: completed
blocked-by: null
---

## What to Build

Replace the current shared app-style header/footer behavior on public browsing routes with dedicated public browsing shell navigation. The public experience must not expose private application navigation, but authenticated Providers still need an easy route back to their panel.

## Acceptance Criteria

- [x] Public browsing routes render a public header, not the current shared app header.
- [x] Public header never shows `Dashboard`, `Admin`, `Moderação`, or the user avatar/menu.
- [x] Public footer never shows `Dashboard`, `Admin`, `Moderação`, or the user avatar/menu.
- [x] Logged-out users see an `Entrar` action in the public header.
- [x] Logged-in users see a `Painel` action in the public header.
- [x] `Explorar`, `Como funciona`, and `Anunciar` links exist and resolve to real home-page section targets.
- [x] Footer includes public shell links for `Explorar`, `Como funciona`, `Anunciar`, and `Entrar`.
- [x] Footer does not include dead legal/support placeholder links.
- [x] `/auth` uses a focused auth layout/header instead of the public browsing header.
- [x] `/panel/*` remains separate from public browsing routes.
- [x] Tests or route assertions cover logged-in and logged-out public header behavior.

## Sub-Tasks

_Sub-tasks will be defined when this task is executed._

---

<!-- INDEX SYNC: After completing a sub-task, update the parent
epic.md child task checklist AND .specify/memory/index.md in the
same turn. Never skip this sync step. -->
