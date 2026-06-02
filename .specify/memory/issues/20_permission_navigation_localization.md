## What to build

Localize navigation menus and enforce role-based access rules and route redirections:
1. Translate all header navigation labels and user menu options in `header.tsx` and `user-menu.tsx` to Portuguese (`Início`, `Painel`, `Moderação`, `Administração`, `Minha Conta`, `Sair`, `Entrar`).
2. Align actions: place profile settings and sign-in trigger on the right side of the navbar (aligned with the theme switch).
3. Secure visibility of menu links:
   - Hide `"Painel"` (`/dashboard`) for unauthenticated users.
   - Show `"Moderação"` (`/moderation`) only for authenticated users with an approved `MODERATOR` assignment.
   - Show `"Administração"` (`/admin`) only for authenticated users with the `SYSTEM_MANAGER` role.
4. Enforce strict route guards in `beforeLoad` functions:
   - If an **unauthenticated** user attempts to access `/dashboard/*`, `/moderation`, or `/admin` directly via URL, redirect them to `/` (Início).
   - If an **authenticated** user attempts to access `/admin` or `/moderation` without the required role/assignment, redirect them to `/dashboard` (Painel) and display a generic *"Página não encontrada"* message, hiding the page's existence.

## Acceptance criteria

- [ ] Header navbar and user menus are localized to Portuguese (pt-BR).
- [ ] Sign-in button and user dropdown are placed on the right side of the header.
- [ ] Navigation menu links dynamically render based on user role and assignment approvals.
- [ ] URL direct access redirects unauthenticated requests back to home `/`.
- [ ] URL direct access redirects unauthorized authenticated requests back to `/dashboard` rendering a generic page not found message.
- [ ] Integration tests verify the redirection guard behavior.

## Blocked by

- [.specify/memory/issues/19_styling_simplification.md](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/issues/19_styling_simplification.md)
