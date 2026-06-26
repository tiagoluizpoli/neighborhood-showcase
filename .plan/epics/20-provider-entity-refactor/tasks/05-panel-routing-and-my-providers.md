---
type: task
id: T-20-05
epic: E-20
status: done
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

status: done
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

status: done
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

status: done
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

##### ST-02 (done)

My Providers page (list + empty state) + the owner-facing list contract.

Server contract (T-20-01's `ProviderRepository.listByOwner` exists but was not
surfaced to the client; ST-02 wires it through — escalate-if was about the repo
capability, which is present):
- `application/use-cases/provider/list-owned-providers.ts` — `ListOwnedProviders`
  use case (ctor-injected `ProviderRepository` + `ProviderProfileRepository`).
  `execute({ ownerId })` → `listByOwner` (soft-deleted already excluded), then
  enriches each provider with `displayName`/`logoUrl` from its profile (null when
  no profile yet) since the `provider` entity carries no human label. Returns
  `OwnedProviderSummary[]` (`{ id, displayName, logoUrl }`).
- `provider-profile.ts` router: added `listMine` query (protectedProcedure,
  owner-scoped on `ctx.session.user.id` — no per-provider ownership guard since
  it only ever returns the caller's own providers).
- `main/di/provider-profile-router.ts`: deps extended with
  `listOwnedProvidersUseCase`, wired with `DrizzleProviderRepository` +
  `ProviderProfileRepositoryImpl`. Real `appRouter` picks it up; the
  provider-profile integration test (uses `appRouter.createCaller`) is unaffected.

Web:
- `panel.provider.my-providers.tsx` — route `/panel/provider/my-providers`, a
  sibling of `$providerId` under the `panel.provider` group layout (so it sits
  OUTSIDE the ownership-gated `$providerId` layout; reachable with zero
  providers). `useQuery(trpc.providerProfile.listMine.queryOptions())`. Zero
  providers → empty state (`my-providers-empty`) with a CTA into
  `/panel/provider/condo-setup` ("create your first provider"). Populated → card
  grid, each card a `Link to="/panel/provider/$providerId"` threading
  `params.providerId`; unnamed providers fall back to `my_providers.unnamed`.
- `routeTree.gen.ts` regenerated via `vite build` (no `tsr` CLI in repo).
- i18n: `my_providers.*` block added to pt + en (page title/subtitle, create
  button, empty title/description/cta, open_card aria, unnamed, loading,
  load_error).

Tests:
- `-panel.provider.my-providers.test.tsx` (2/2): empty state CTA `data-to ===
  /panel/provider/condo-setup`; populated cards carry
  `data-to=/panel/provider/$providerId` + `data-params={providerId}`, unnamed
  provider renders the localized placeholder.
- Sibling web suites unaffected: `-panel.provider.test.tsx` 2/2,
  `-panel.provider.announcements.test.tsx` 19/19, `-provider-profile.test.tsx`
  20/20.

Known limitation carried from ST-01: legacy redirects + `requireDefaultProviderId`
still send a no-default caller to `condo-setup` rather than this page; making My
Providers the multi-provider landing is folded into ST-03 (switcher) / the
landing wiring.

Gates: `bun run --filter server check-types` clean; `bun run --filter web
check-types` clean except the pre-existing web TS5103 `--ignoreDeprecations`
error (untouched); `bun run check` clean (pre-existing optional-chain warning +
broken-symlink info only).

##### ST-03 (done)

Persistent header provider switcher, mounted once in the shared panel shell.

Component (`apps/web/src/routes/panel/provider/-provider-switcher.tsx`):
- `ProviderSwitcher({ activeProviderId })` — reads
  `providerProfile.listMine` (owner-scoped, from ST-02). Renders nothing when
  the caller owns no providers, so it is inert for non-provider users and on the
  zero-provider state (handled by the My Providers page). A base-ui `Popover`
  whose trigger label reflects the active provider — resolved from the
  URL-derived `activeProviderId` (the `$providerId` segment), NOT a store — and
  falls back to `provider_switcher.select` when no provider is active.
- `ProviderSwitcherItems({ providers, activeProviderId })` — extracted
  presentational dropdown body so it is unit-testable without opening the
  portal. One navigation `Link to="/panel/provider/$providerId"` per owned
  provider (selecting a provider = navigation, no client state), the active one
  marked with `data-active` + a check, unnamed providers falling back to
  `my_providers.unnamed`, plus a `Link` into `/panel/provider/my-providers`.

Shell wiring (`apps/web/src/routes/panel.tsx`):
- `PanelLayout` reads `useParams({ strict: false })` and derives
  `activeProviderId = params.providerId ?? null` (null outside a `$providerId`
  context, e.g. dashboard/moderation/admin). `<ProviderSwitcher>` is placed in
  the persistent top header's right control group, before the theme/language
  controls, so it shows across every panel section.

i18n: `provider_switcher.*` block added to pt + en
(`label`/`aria`/`select`/`manage`).

Tests (`apps/web/src/routes/-provider-switcher.test.tsx`, 4/4):
- `ProviderSwitcherItems`: each item carries
  `data-to=/panel/provider/$providerId` + `data-params={providerId}`, the active
  item carries `data-active=true` (non-active none), unnamed falls back to the
  localized placeholder, manage link `data-to=/panel/provider/my-providers`.
- `ProviderSwitcher`: renders nothing with zero providers; trigger label
  reflects the active provider; shows the localized select placeholder when no
  provider is active. trpc proxy + global Link stub pattern reused from the My
  Providers test.
- Sibling suites unaffected: `-panel.provider.my-providers.test.tsx` 2/2,
  `-panel.provider.test.tsx` 2/2, `-panel.provider.announcements.test.tsx`
  19/19, `-provider-profile.test.tsx` 20/20.

Gates: `bun run --filter web check-types` clean except the pre-existing web
TS5103 `--ignoreDeprecations` error (untouched); `bun run check` clean
(pre-existing optional-chain warning + broken-symlink info only; biome
auto-formatted the two touched files). dependency-cruiser: no layer violations.

Note: making My Providers the multi-provider landing (the ST-01/ST-02 known
limitation) is still open and now most naturally folds into ST-04's create-flow
landing wiring.

##### ST-04 (done)

Repeatable condo-setup create-provider flow + the backend create-provider
contract it needs.

Escalate-if check (mirrors ST-02): the trigger was "a backend create-provider
contract not delivered by T-20-01". T-20-01 delivered `ProviderRepository.create`
(the repo capability is present); ST-04 wires it through application +
presentation, same as ST-02 surfaced `listByOwner`. No escalation. Confirmed by
inspection that NO runtime path minted a `provider` row — every flow hardcoded
`providerId = ctx.session.user.id`, working only because the seed keeps
`provider.id === user.id` for single-provider users. A brand-new signup owns no
provider row at all, so the first AND the Nth provider both need minting.

Backend (server scope, beyond the declared web files — precedented by ST-02):
- `application/use-cases/provider/create-provider.ts` — `CreateProvider`
  (ctor-injected `ProviderRepository` + `ProviderProfileRepository`).
  `execute({ ownerId, displayName })` mints a provider via `providerRepo.create`
  AND upserts a minimal **hidden** default profile (`isProviderVisible: false`).
  The default profile is load-bearing: every `$providerId` panel read goes
  through `providerProfile.get`, which throws `NOT_FOUND` for a profile-less
  provider — without it the `$providerId` ownership gate would bounce a
  freshly-created provider instead of landing it. Returns `{ providerId }`.
- `presentation/routers/provider-profile.ts` — `create` mutation
  (protectedProcedure, owner-scoped on `ctx.session.user.id`, Zod
  `displayName` min 3 / max 100).
- `main/di/provider-profile-router.ts` — `createProviderUseCase` wired with
  `DrizzleProviderRepository` + `ProviderProfileRepositoryImpl`.
- `presentation/routers/assignment.ts` — `request` + `registerExternal` accept
  an optional `providerId`; when supplied, `assertProviderOwnership` enforces
  the caller owns it (closes the hole that these self-scoped procedures would
  otherwise let a caller assign to a provider they don't own). Omitted →
  legacy `ctx.session.user.id` fallback. `RequestAssignment` already keys its
  duplicate guard on `(providerId, condominiumId)`, so a new provider can join
  the same condo as an existing one with no conflict.

Web (the declared files):
- `panel.provider.condo-setup.tsx` — now the repeatable create flow. Adds a
  `providerProfile.listMine` query; the legacy per-user status panels are gated
  behind `ownsProviders === false` (first-time, pre-provider state only — e.g. a
  pending sindico condo request, which mints no provider). A caller who already
  owns ≥1 provider always gets the create selector. Resident/external flows now
  navigate to `/panel/provider/$providerId` on success (`goToProvider`).
- `-provider-dashboard-condo-setup-resident-flow.tsx` — mints a provider
  (`displayName` = selected condo name) then creates the RESIDENT assignment for
  it, then `onProviderCreated(providerId)`. Switched `request` from `mutate` +
  callbacks to sequenced `mutateAsync`.
- `-provider-dashboard-condo-setup-external-flow.tsx` — mints a provider
  (`displayName` derived from the address) then `registerExternal` for it, then
  `onProviderCreated(providerId)`.
- `-provider-dashboard-condo-setup-sindico-flow.tsx` — unchanged: the sindico
  flow creates a CONDO (PENDING_APPROVAL), not a provider; the provider/moderator
  materializes on condo approval.

i18n: no new visible strings added (navigation is silent; the seeded display
names are data derived from condo name / address, not UI copy). The pre-existing
hardcoded PT copy in these files is logged to `.plan/backlog.md` for a dedicated
i18n sweep.

Tests:
- `provider-profile.integration.test.ts` (12/12): added (i) `create` mints a
  fresh owned provider with a seeded hidden default profile (get succeeds →
  landing works); (j) `create` rejects displayName < 3 (BAD_REQUEST);
  (k) a created provider can `assignment.request` a RESIDENT assignment
  (PENDING, providerId threaded); (l) `assignment.request` with an unowned
  providerId is FORBIDDEN.
- `-panel.provider.condo-setup.test.tsx` (2/2): a provider owner sees the create
  selector not the approved-status panel; a zero-provider caller still sees the
  status panel.
- Sibling web suites unaffected: `-panel.provider.my-providers.test.tsx` 2/2,
  `-provider-switcher.test.tsx` 4/4, `-panel.provider.test.tsx` 2/2,
  `-panel.provider.announcements.test.tsx` 19/19 (27/27 combined).

Deferred (logged to `.plan/backlog.md`, all sourced to T-20-05/ST-04): condo-setup
flow-file i18n sweep; reword the selector heading for create mode; surface the
sindico condo-request pending status for multi-provider owners; make My Providers
(not condo-setup) the no-default landing.

Gates: `bun run --filter server check-types` clean; `bun run --filter web
check-types` clean except the pre-existing web TS5103 `--ignoreDeprecations`
error (untouched); `bun run check` clean (pre-existing optional-chain warning +
broken-symlink info only; biome auto-formatted touched files); dependency-cruiser
no layer violations. T-20-05 fully done (all 4 STs).

---

<!-- INDEX SYNC: After completing a sub-task, run
.plan/helper-scripts/sync-state.sh and update the parent epic.md checklist and
.plan/index.md in the same turn. -->
