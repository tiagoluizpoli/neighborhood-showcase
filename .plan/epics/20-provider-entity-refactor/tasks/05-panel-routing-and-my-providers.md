---
type: task
id: T-20-05
epic: E-20
status: in-progress
blocked-by: [T-20-01, T-20-04]
default-model: high
---

## What to Build

Rework the panel so the active provider is a first-class, URL-encoded context, and a user can see, switch, and create providers. Add a `$providerId` route segment (`/panel/provider/$providerId/...`) so active-provider context is refresh-safe and deep-linkable with NO session/localStorage store — the switcher just navigates. Build a "My Providers" management page that lists all providers the user owns (with a zero-provider empty state inviting "create your first provider"), and a persistent header switcher to change the active provider. Turn `condo-setup` into the REPEATABLE create-provider flow — one flow for the first and the Nth provider, launched from My Providers. Handle redirects for old `/panel/provider/...` links that lack the `$providerId` segment.

## Context

Panel provider routes: `apps/web/src/routes/panel/provider/` (`announcements.tsx`, `configuration.tsx`, the `-*-section.tsx` partials, `-announcement-form.tsx`) and flat routes `apps/web/src/routes/panel.provider.*.tsx` (incl. `panel.provider.condo-setup.tsx`, `panel.provider.announcements.$id.index.tsx`). Condo-setup flow partials: `apps/web/src/routes/panel/-provider-dashboard-condo-setup-*.tsx` (resident/sindico/external flows + status panels + resident-proof-upload). TanStack-router file-based routing — adding `$providerId` is a routing refactor across these routes plus their internal links. Provider list comes from the `Provider` repository (T-20-01, list-by-owner excluding soft-deleted). Provider-scoped routes must sit behind the T-20-04 gating (owner + standing). No-hardcoded-UI-text: any new strings go through i18next `t()` with keys in BOTH pt + en locale files (`apps/web/src/locales/{pt,en}/translation.json`).

## Acceptance Criteria

- [ ] Panel provider routes carry a `$providerId` segment (`/panel/provider/$providerId/...`); refreshing or deep-linking keeps the correct provider context with no extra client store.
- [ ] Old `/panel/provider/...` links (no `$providerId`) redirect sensibly (e.g. to My Providers or the user's sole/most-recent provider).
- [ ] A "My Providers" page lists all providers the user owns; a zero-provider user sees an empty state routing into "create your first provider".
- [ ] A persistent header switcher changes the active provider by navigating to its `$providerId` route.
- [ ] `condo-setup` is the repeatable create-provider flow, launched from My Providers, used for the first and every subsequent provider.
- [ ] All new UI strings are localized in pt + en (no hardcoded text).
- [ ] Gates pass; component tests for My Providers empty/populated states and the switcher.

## Sub-Tasks

### ST-01 - `$providerId` route segment + redirects

status: done
model: high
escalate-if:
- The file-based routing refactor forces a breaking change to a route contract consumed outside the panel (e.g. public links) beyond redirect handling.

blocked-by: []

what-to-do:
- Introduce the `$providerId` segment across `/panel/provider/...` routes; resolve active-provider context from the URL param (no session/localStorage).
- Add redirect handling for legacy `/panel/provider/...` links lacking the segment.
- Guard provider-scoped routes with the T-20-04 ownership/standing gating.

files-to-touch:
- `apps/web/src/routes/panel/provider/`
- `apps/web/src/routes/panel.provider.announcements.$id.index.tsx`

verification:
- `bun run check-types`
- refresh + deep-link a `$providerId` route keeps context; a legacy link redirects

### ST-02 - My Providers page (list + empty state)

status: ready
model: high
escalate-if:
- Listing owned providers needs a server contract not delivered by T-20-01's provider repository.

blocked-by:
- ST-01

what-to-do:
- Build a My Providers page listing all providers the user owns (excluding soft-deleted), each linking to its `$providerId` context.
- Add a zero-provider empty state inviting "create your first provider" → condo-setup.
- Localize all strings in pt + en.

files-to-touch:
- `apps/web/src/routes/panel/provider/`
- `apps/web/src/locales/pt/translation.json`
- `apps/web/src/locales/en/translation.json`

verification:
- `bun run check-types`
- component test: empty state routes into condo-setup; populated list links into `$providerId`

### ST-03 - Persistent header provider switcher

status: ready
model: high
escalate-if:
- The header shell cannot host a persistent switcher without a layout change beyond this slice.

blocked-by:
- ST-02

what-to-do:
- Add a persistent header switcher listing the user's providers; selecting one navigates to its `$providerId` route.
- Reflect the active provider (from the URL param) in the switcher.
- Localize all strings in pt + en.

files-to-touch:
- `apps/web/src/routes/panel/provider/`
- `apps/web/src/locales/pt/translation.json`
- `apps/web/src/locales/en/translation.json`

verification:
- `bun run check-types`
- component test: switching updates the `$providerId` route

### ST-04 - Repeatable condo-setup create-provider flow

status: ready
model: high
escalate-if:
- Making condo-setup repeatable requires a backend create-provider contract not delivered by T-20-01.

blocked-by:
- ST-03

what-to-do:
- Turn `condo-setup` into the repeatable create-provider flow launched from My Providers; the same flow serves the first and the Nth provider, creating a new `provider` and its assignment/profile.
- Ensure the flow lands the user in the new provider's `$providerId` context on completion.
- Localize any new strings in pt + en.

files-to-touch:
- `apps/web/src/routes/panel.provider.condo-setup.tsx`
- `apps/web/src/routes/panel/-provider-dashboard-condo-setup-resident-flow.tsx`
- `apps/web/src/routes/panel/-provider-dashboard-condo-setup-external-flow.tsx`
- `apps/web/src/routes/panel/-provider-dashboard-condo-setup-sindico-flow.tsx`

verification:
- `bun run check-types`
- creating a 2nd provider in the same/another condo succeeds and lands in its `$providerId` context

#### Execution Notes

##### ST-01 (done)

`$providerId` segment + redirects + ownership gate.

New URL-encoded provider context (NO session/localStorage store):
- `panel.provider.$providerId.tsx` — layout route. `beforeLoad` ownership gate:
  calls `providerProfile.get({ providerId })` (resolves only providers the caller
  owns; throws otherwise) and, on throw, redirects to the caller's default
  provider via `requireDefaultProviderId` (or the create flow when they own
  none). Renders `ActiveProviderIdProvider` seeded from the URL param.
- `panel/provider/-active-provider-context.tsx` — `ActiveProviderIdProvider` +
  `useActiveProviderId()` (throws outside provider; value derived from URL every
  render, so switching is just navigation, refresh-safe + deep-linkable).
- Full content moved off the legacy routes into the `$providerId` variants:
  `$providerId/` (index), `$providerId/configuration`, `$providerId/announcements`
  (+ `/`, `/new`, `/$id/`, `/$id/edit`), `$providerId/anuncios/$id/pagamento`.
  Internal `Link`/`navigate` targets thread `params: { providerId }`.
- `-announcement-form.tsx` reads `useActiveProviderId()` and feeds it into
  `providerProfile.get` / `announcement.getDashboardData` queries and
  `announcement.create`/`update` mutations + all navigation.

Legacy redirect handling (segment-less `/panel/provider/...` links keep working):
- `-resolve-active-provider.ts`: `resolveDefaultProviderId()` (no-input
  `providerProfile.get` → caller's default provider id, `null` on failure) +
  `requireDefaultProviderId()` (throws a redirect into `condo-setup` when none).
- Each legacy leaf route (`panel.provider.index`, `panel/provider/configuration`,
  `panel.provider.announcements.{index,new,$id.index,$id.edit}`,
  `panel.provider.anuncios.$id.pagamento`) is now a `beforeLoad`-only redirect
  into its `$providerId` variant, forwarding `id`/`message` where present.
- `condo-setup` left as-is (ST-04 makes it the repeatable create flow).
- Multi-provider callers without a usable default land in `condo-setup` until the
  My Providers page (ST-02) becomes the landing — documented limitation, no loop.

Ownership/standing enforcement is the T-20-04 server guard on every provider
procedure; the layout `beforeLoad` adds a client-edge redirect so a deep-link to
an unowned provider never renders a broken page.

Tests fixed (broken by the legacy→redirect move + the form's new context dep):
- `-panel.provider.announcements.test.tsx` (19/19): imports repointed to
  `$providerId` routes, `Route.useParams` stubs carry `providerId`, `renderRoute`
  wraps in `ActiveProviderIdProvider`.
- `-provider-profile.test.tsx` (20/20): config render repointed to
  `$providerId.configuration` + wrapped in `ActiveProviderIdProvider`.
- `-panel.test.tsx` (8/8) unaffected.

Gates: `bun run --filter web check-types` clean except the pre-existing web
TS5103 `--ignoreDeprecations` error (untouched); `bun run check` clean
(pre-existing optional-chain warning + broken-symlink info only).

---

<!-- INDEX SYNC: After completing a sub-task, run
.plan/helper-scripts/sync-state.sh and update the parent epic.md checklist and
.plan/index.md in the same turn. -->
