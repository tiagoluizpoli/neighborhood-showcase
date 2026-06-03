# Slice 5: Account Page & Avatar Menu

## Parent

PRD-v2-backlog-overhaul (Item 7)

## What to build

Create a dedicated account management page and replace the current name/email text in the panel header with an avatar-based popover menu.

1. **Avatar in panel header**: Replace the current name/email text with a shadcn `Avatar` component. Use user's initials as fallback (e.g., "TP" for Tiago Poli). No custom avatar upload yet.
2. **Popover menu**: Clicking the avatar opens a shadcn `Popover` showing the user's name and email, with links to "Minha Conta" and a "Sair" (Sign Out) button.
3. **Account page route**: Create `/panel/conta` nested under the panel layout (inherits sidebar). Contains:
   - Editable "Display Name" form field
   - "Delete Account" action (moved from the dashboard — remove from `dashboard.index.tsx`)
4. **User update API**: Add or update a tRPC procedure to allow the user to update their display name.

## Acceptance criteria

- [ ] Panel header shows `Avatar` component with initials fallback
- [ ] Clicking avatar opens a popover with name, email, "Minha Conta" link, and "Sair" button
- [ ] `/panel/conta` route exists and inherits the panel sidebar layout
- [ ] Account page has a working "Edit Display Name" form
- [ ] "Delete Account" action is on the account page and removed from the dashboard
- [ ] User name update persists to the database
- [ ] Integration test for user update procedure

## Blocked by

- #40 (Panel Sidebar Navigation)
