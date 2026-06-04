# Public Browsing Shell Navigation Separation

## Parent

PRD-v2-backlog-overhaul follow-up for public portal and panel separation.

## What to build

Replace the current shared app-style header/footer behavior on public browsing routes with dedicated public browsing shell navigation. The public experience must not expose private application navigation, but authenticated Providers still need an easy route back to their panel.

## Current problem

The portal layout currently renders a shared `Header` that includes authenticated application controls such as dashboard, moderation, admin links, theme/language controls, and the user menu. The footer is minimal but should align with the public shell navigation after header separation. The current shell makes the home page feel like an application shell instead of a public browsing/landing experience.

## Scope

1. Create or use a dedicated public browsing header for:
   - `/`
   - `/anuncios/:id`
   - `/prestadores/:id`
2. Treat `/auth` as a separate focused auth experience, not as part of the public browsing header experience.
3. Keep `/panel/*` fully separate with panel-specific navigation, sidebar, and header behavior.
4. Public browsing header content:
   - Brand/logo linking to `/`
   - `Explorar` link to `/#explorar`
   - `Como funciona` link to `/#como-funciona`
   - `Anunciar` link to `/#anunciar`
   - Right-side action:
     - unauthenticated users see `Entrar`
     - authenticated users see `Painel`
5. Add or preserve matching home-page section targets:
   - `#explorar`
   - `#como-funciona`
   - `#anunciar`
6. Public footer content:
   - brand/product name
   - short one-line description
   - `Explorar` link to `/#explorar`
   - `Como funciona` link to `/#como-funciona`
   - `Anunciar` link to `/#anunciar`
   - `Entrar` link to `/auth?tab=signin`
7. Footer must stay full-width, quiet, and restrained.
8. Footer must not show `Dashboard`, `Admin`, `Moderação`, user menu, or other private app navigation.
9. Do not add legal placeholder links until real legal/support pages exist.

## Out of scope

1. Private panel navigation changes.
2. Admin/moderation/dashboard behavior changes.
3. New provider directory page.
4. Full homepage redesign beyond the section anchors required by this issue.
5. Authentication flow redesign.
6. Legal/privacy/terms/support page creation.

## Acceptance criteria

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

## Blocked by

- None.
