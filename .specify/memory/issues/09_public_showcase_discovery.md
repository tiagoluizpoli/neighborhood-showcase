## What to build

Implement the public showcase discovery interface at `/` (Vitrine). It automatically requests browser geolocation to sort and prioritize nearby listings, displays them in a rich grid with filtering options, and supports detail previews with click-tracking.

## Acceptance criteria

- [ ] Vitrine requests geolocation on first load; fallback displays a manual condominium/city selector modal.
- [ ] Sorts active announcements based on proximity to the user's geolocated or selected condominium.
- [ ] Grid filters include text search, category tabs, and a "Verified Residents Only" badge toggle.
- [ ] Clicking a listing opens a detail drawer (mobile) or modal (desktop) displaying all ad fields and syncs the URL to `/anuncios/:id`.
- [ ] Clicking contact actions (WhatsApp/Instagram/PDF Catalog) calls a backend tracking endpoint (`/api/analytics/track`) to increment analytics clicks before routing.
- [ ] Component tests for geolocation mock states, grid sorting, and detail modal visibility.

## Blocked by

- [.specify/memory/issues/08_webhook_payment_resolution.md](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/issues/08_webhook_payment_resolution.md)
