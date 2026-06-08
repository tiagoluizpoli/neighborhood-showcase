---
type: refactor
epic: 08-architecture-and-quality
status: completed
blocked-by: null
---

## What to Build

Clean up template metadata titles and simplify layouts to standard shadcn/Tailwind spacing and components:
1. Update legacy project titles to `"Neighborhood Showcase"` in:
   - `apps/web/index.html`
   - `apps/web/src/routes/__root.tsx` (title and description)
   - `apps/web/vite.config.ts` (PWA title and short name)
   - `apps/server/tsdown.config.ts` (rename namespace regex)
   - `packages/db/docker-compose.yml` (database container and volume names)
2. Standardize theme and spacing in dashboard layouts:
   - In `apps/web/src/routes/dashboard.tsx`, replace `<div className="min-h-screen bg-slate-950 text-slate-100">` with `bg-background text-foreground flex flex-col min-h-screen` to naturally inherit theme mode context.
   - For `dashboard.index.tsx`, `dashboard.condo-setup.tsx`, `dashboard.anuncios.novo.tsx`, `dashboard.anuncios.$id.pagamento.tsx`, `auth.tsx`, `sign-in-form.tsx`, and `sign-up-form.tsx`:
     - Replace dark-only slates (`bg-slate-950`, `bg-slate-900`, `bg-slate-900/60`, `border-slate-800`) with standard theme classes (`bg-card`, `bg-background`, `border`, `text-foreground`, `text-muted-foreground`).
     - Remove background gradients, custom hover scale micro-animations (`hover:-translate-y-1`), and custom shadow offsets.
     - Enforce standard default shadcn card styling and grid spacing (`p-4` / `p-6` card content).

## Acceptance Criteria

- [x] Page document titles, PWA config, tsdown, and Docker compose namespaces are updated to `neighborhood-showcase`.
- [x] Hardcoded dark slate colors, hover scales, and background gradients are removed from dashboard, setup, checkout, and authentication forms.
- [x] Layout containers use standard themes, default borders, and standard shadcn Card/Button spacing.
- [x] Theme switching (Light / Dark) operates seamlessly on the dashboard.
- [x] Code passes checks (`bun run check`, `bun run check-types`, and `bun run test`).

## Sub-Tasks

_Sub-tasks will be defined when this task is executed._

---

<!-- INDEX SYNC: After completing a sub-task, update the parent
epic.md child task checklist AND .specify/memory/index.md in the
same turn. Never skip this sync step. -->
