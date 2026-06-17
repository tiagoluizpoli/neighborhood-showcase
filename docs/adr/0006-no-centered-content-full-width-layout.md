# Page content fills the full available width; centered narrow wrappers are forbidden

## Status

Accepted

## Context

Early UI work applied a common web pattern of centering page content inside a
`mx-auto max-w-*` container. This made pages feel narrow and wastes the
available viewport on wider screens. The pattern is appropriate for marketing
landing pages and printable documents, but it conflicts with the application's
goal of dense, efficient information display inside the panel and portal.

Problems observed before this decision:

- Panel pages (announcements list, provider dashboard, account settings) were
  rendered inside `max-w-4xl` or similar wrappers, leaving large empty margins
  on wide screens.
- The public provider page body was constrained to a centered column, preventing
  the banner image and announcement grid from using the full container width.
- Cards, tables, and grids inside those wrappers did not spread to the full
  width of their parent, wasting horizontal space the design system already
  provides.
- New contributors copied the narrow-wrapper pattern from existing pages,
  spreading the problem further.

The Tailwind utility `mx-auto` paired with a `max-w-*` class is the key
structural signal. Applying both on the same top-level page wrapper is the
forbidden pattern.

## Decision

Page content fills the entire available width of its parent container by
default.

The concrete rules are:

1. Do **not** apply `mx-auto max-w-*` (e.g. `max-w-4xl`, `max-w-5xl`,
   `max-w-7xl`) on the top-level wrapper of any page or route component.
2. Use `w-full` on the top-level wrapper. Apply internal padding via `px-4`,
   `px-6`, `py-4`, or `py-6` directly on the wrapper, not via a constrained
   inner element.
3. Cards, grids, and tables inside the wrapper spread to the full width of their
   parent automatically through standard Tailwind grid/flex utilities.
4. Sub-components inside a page may use `max-w-*` for **their own internal
   layout** (e.g. a centered form inside a full-width card), provided the outer
   page wrapper is already full-width.

### Accepted exceptions

The following surfaces are explicitly allowed to use centered `mx-auto max-w-*`
wrappers:

| Surface | Reason |
|:---|:---|
| Authentication flows (sign-in, sign-up, email verification) | Intentionally constrained single-column form UX |
| Legal and printable document layouts (terms, privacy policy) | Optimal ~60–80 character line length for readability |
| Modals and dialogs | Fixed `max-w-*` is the expected dialog container contract |
| Intentionally constrained public marketing sections | e.g. a hero caption block inside a full-width banner that needs centered text over a narrow column |

Any new exception must be approved explicitly and noted here.

## Consequences

### Positive

- Panel pages use screen real estate efficiently at all viewport widths.
- The public portal (provider page, announcements) renders banner images and
  grids at full container width without artificial constraints.
- Contributors have a single, unambiguous layout rule enforced by code review
  and documented here; no more guessing whether `max-w-4xl` is correct.
- The rule is self-consistent: exceptions are listed, predictable, and bounded.

### Negative

- Some refactoring is required for pages that already use centered wrappers and
  were not touched during the Provider Section Reorg epic; these are tracked in
  `.plan/backlog.md`.
- UI contributors accustomed to the `mx-auto max-w-*` pattern need to
  internalize the full-width default before reaching for that utility.

## Rejected alternatives

- **Keep the centered wrapper pattern with a wider `max-w-7xl`**: rejected
  because wider still wastes space on ultrawide displays and the underlying
  problem (artificial constraint) remains.
- **Use a global CSS variable for the max width and let pages opt in**: rejected
  because it adds indirection and still normalizes the wrong default.
- **Apply the full-width rule only inside the panel, not on the portal**: rejected
  because the public provider page and portal surfaces share the same design
  intent; a split rule creates confusion and inconsistency.
- **Leave the decision implicit in code style and linting**: rejected because
  Biome does not detect `mx-auto max-w-*` combinations semantically, so an
  explicit written rule and code-review check are the only reliable enforcement
  mechanisms.

## References

- `agents.local.md` §4 — "No centered content — full-width layout by default"
- `.plan/RULES.md` §5 — "No centered content — full-width layout by default"
- PRD-v7 (`.plan/prds/PRD-v7-provider-section-reorg.md`) — provider page
  full-width layout requirement
