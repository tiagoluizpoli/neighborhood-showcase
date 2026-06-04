# TDD Plan: Public Home Browsing Completion

This plan covers PRD Modules 12–18 and Issues 56–62. It is a test planning artifact, not an instruction to write all tests before implementation. Ralph should implement this as vertical tracer bullets: one failing behavior test, minimal implementation, green, then the next behavior.

## Testing Principles

1. Test public behavior through route output, API contracts, database-backed integration paths, and browser-visible interactions.
2. Do not test private component state, helper names, internal query shape, or DOM structure that is not meaningful to a Visitor or Provider.
3. Prefer integration-style tests for backend category and feed ranking behavior.
4. Prefer component/route tests for shell, location control, card behavior, and feed states.
5. Use E2E only for cross-route journeys and responsive/browser behaviors that component tests cannot cover reliably.

## Recommended TDD Slice Order

### Slice 1: Backend-Managed Categories

Tracer bullet:
- `[ ]` Active categories can be listed from the backend and include seeded MVP categories → Integration

Next tests:
- `[ ]` Creating an Announcement requires an active backend category identity → Integration
- `[ ]` Public feed filters by category identity → Integration
- `[ ]` Omitting category filter returns all active Announcements (`Todos` UI behavior) → Integration
- `[ ]` Inactive categories do not appear in public/provider category selection → Integration
- `[ ]` Public home/feed requests do not require analytics scans for category ordering → Integration/Architecture guard

### Slice 2: Public Browsing Shell

Tracer bullet:
- `[ ]` Logged-out public home shell renders public links and `Entrar`, with no private navigation → Route/Component

Next tests:
- `[ ]` Logged-in public shell renders `Painel`, not user avatar/private app menu → Route/Component
- `[ ]` Public footer renders `Explorar`, `Como funciona`, `Anunciar`, and `Entrar` only → Route/Component
- `[ ]` Auth route does not render full public browsing header → Route/Component
- `[ ]` Panel routes keep panel navigation separate from public shell → E2E or Route

### Slice 3: Announcement Detail Source Of Truth

Tracer bullet:
- `[ ]` Clicking an Announcement card navigates to `/anuncios/:id` through router navigation → Route/Component

Next tests:
- `[ ]` Home route does not render duplicate detail preview/modal after card click → Route/Component
- `[ ]` Detail route records one `IMPRESSION` when data loads → Route/Component or Integration
- `[ ]` Card contact action does not navigate to detail and tracks contact click → Component
- `[ ]` Provider identity link navigates to Provider profile without triggering detail navigation → Component
- `[ ]` Browser back returns from detail to home/feed without custom popstate behavior → E2E

### Slice 4: Location Control And Relevance

Tracer bullet:
- `[ ]` First home visit renders feed/discovery controls without auto-opening geolocation prompt → Route/Component

Next tests:
- `[ ]` Explicit precise-location action calls browser geolocation and stores successful coordinates with `capturedAt` → Component
- `[ ]` `PERMISSION_DENIED` maps to disabled location state → Component
- `[ ]` timeout/unavailable/unsupported errors map to unavailable state, not denied → Component
- `[ ]` Fresh stored GPS is used immediately and then refreshed in background after prior grant → Component
- `[ ]` Refreshed GPS under 1 km does not visibly change ranking context; over 1 km does → Unit/Component
- `[ ]` IP fallback is session-only, transparent, and never enables radius or condominium matching → Component/Integration
- `[ ]` Manual city filter returns only matching city Announcements → Integration
- `[ ]` Manual city + neighborhood filter returns only matching neighborhood Announcements → Integration
- `[ ]` Selected Condominium context ranks matching Announcements first without filtering out others → Integration
- `[ ]` `Somente este condomínio` filters to selected Condominium only → Integration
- `[ ]` Radius appears only with fresh GPS and is capped at 25 km → Component/Integration
- `[ ]` Verified-only filters hard; verified boost applies when filter is off → Integration

### Slice 5: Home Discovery Layout And Sections

Tracer bullet:
- `[ ]` Home route contains `#explorar`, `#como-funciona`, and `#anunciar` targets → Route/Component

Next tests:
- `[ ]` Discovery controls remain grouped above the feed → Route/Component
- `[ ]` Mobile secondary filters are reachable through a sheet/drawer behavior → Component/E2E
- `[ ]` `#como-funciona` renders the three approved Visitor-first steps → Route/Component
- `[ ]` `#anunciar` CTA routes unauthenticated signup/signin actions correctly → Route/Component
- `[ ]` Authenticated Provider CTA routes to panel → Route/Component
- `[ ]` Visual screenshot check confirms first row of cards is visible quickly on common desktop viewport → E2E/Visual

### Slice 6: Announcement Card

Tracer bullet:
- `[ ]` Announcement card shows image, title, Provider identity, and one primary action → Component

Next tests:
- `[ ]` Primary action fallback order is WhatsApp, phone, email, details → Component
- `[ ]` Price is prominent when present and absent without placeholder when missing → Component
- `[ ]` Verified trust appears near Provider identity and is not duplicated as image badge copy → Component
- `[ ]` External Provider is shown neutrally with city/neighborhood context → Component
- `[ ]` Whole card is keyboard-accessible for detail navigation → Component/A11y
- `[ ]` Location/proximity copy follows confidence state supplied by the parent/feed → Component

### Slice 7: Feed Loading, Empty, And Error States

Tracer bullet:
- `[ ]` Feed loading renders skeleton cards in the feed grid while controls remain visible → Component

Next tests:
- `[ ]` Search empty state includes the search query and clear-search action → Component
- `[ ]` Category empty state includes category label and clear-category action → Component
- `[ ]` Verified-only empty state explains no verified Announcements matched → Component
- `[ ]` Selected Condominium empty state offers change/clear context → Component
- `[ ]` Region/location empty state offers location/filter adjustment → Component
- `[ ]` No-inventory empty state offers Provider CTA → Component
- `[ ]` Feed query error shows retry without raw technical details → Component
- `[ ]` IP fallback/GPS refresh does not block current feed rendering → Component

## Coverage Gaps To Watch During Implementation

1. Category migration must update Provider create/edit, public feed, cards, and detail pages together; otherwise category labels will drift.
2. Existing geolocation tests mock React internals heavily; prefer moving new behavior behind a small public hook or component interface that can be tested through observable states.
3. Public feed ranking currently lives in backend application code with database access; category/ranking work should not deepen Clean Architecture violations.
4. Card visual tests should not lock to exact DOM class names; test visible behavior, accessible names, links, and actions.
5. Responsive layout claims need at least one browser-level or screenshot check, because component tests cannot prove first-viewport fit.
6. The root PRD contains older public-home wording; the PRD supersession rule says Modules 12–18 win for public browsing behavior.
7. New public-home copy must go through the existing i18n resources. Portuguese strings in PRD/issues are product copy decisions, not permission to hardcode UI strings.

## Open Decisions To Resolve Before Coding If They Affect The Slice

1. IP fallback source: direct browser call versus backend-mediated lookup. Current product decision is session-only coarse relevance; implementation should choose the least risky approach for LGPD and reliability before writing code.
2. Category migration strategy: destructive reset versus explicit migration. The project is pre-v1, but Ralph should confirm the current migration policy before changing schema.
3. Filter URL persistence: current PRD does not require URL search params for filters. If Ralph wants shareable filter URLs, that is a scope expansion and needs approval.
