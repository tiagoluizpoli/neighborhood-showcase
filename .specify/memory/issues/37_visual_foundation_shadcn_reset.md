# Slice 1: Visual Foundation — shadcn Reset & Semantic Tokens

## Parent

PRD-v2-backlog-overhaul (Item 1)

## What to build

Establish the visual foundation for the entire overhaul by resetting all shadcn components to pristine registry state and adding missing semantic design tokens.

1. **Reinstall existing shadcn components**: List the 8 currently installed components and reinstall them fresh from the official registry under the `base-lyra` style, overwriting any local modifications.
2. **Batch-install new components**: Install all anticipated components in one pass: `sidebar`, `avatar`, `chart`, `dialog`, `popover`, `tabs`, `select`, `badge`, `separator`, `sheet`, `tooltip`, `table`, `alert-dialog`, `scroll-area`, `textarea`, `command`, `navigation-menu`.
3. **Add semantic tokens to `globals.css`**: Add `--success`, `--success-foreground`, `--warning`, `--warning-foreground`, `--info`, `--info-foreground` CSS custom properties for both light and dark modes.
4. **Normalize border radius**: Ensure all radius usage references the `--radius` token system exclusively.
5. **Route audit**: Scan all route files and strip hardcoded Tailwind color classes (`bg-slate-*`, `bg-emerald-*`, `bg-indigo-*`, etc.), replacing them with semantic token references (`bg-background`, `text-foreground`, `bg-primary`, etc.).

## Acceptance criteria

- [ ] All previously installed shadcn components are reinstalled fresh (no local overrides remain)
- [ ] All new shadcn components are installed and importable
- [ ] `globals.css` contains `--success`, `--warning`, `--info` (+ foreground variants) for light and dark modes
- [ ] Zero hardcoded Tailwind color utility classes remain in route files — all use semantic tokens
- [ ] Border radius uses `--radius` token system exclusively
- [ ] Application builds and renders without visual regressions

## Blocked by

None — can start immediately.
