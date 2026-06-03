# Slice 7: Geolocation Permission Modal & Client Capture

## Parent

PRD-v2-backlog-overhaul (Item 2)

## What to build

Implement the geolocation permission flow for Visitors on the home page — a user-initiated modal that requests location access, captures coordinates, and provides LGPD-compliant fallbacks.

1. **Geolocation modal**: On first home page visit, show a friendly modal explaining why the platform wants location access ("Descubra serviços perto de você"). The modal must include LGPD transparency text (location used only for personalizing nearby announcements, not shared with third parties). User clicks "Permitir" to trigger the browser prompt.
2. **Permission granted flow**: Store coordinates in client-side state (React state / localStorage). Feed these coordinates to the announcements listing API for proximity ranking.
3. **Permission denied flow**: Show all announcements in chronological order. Display a subtle, non-intrusive banner inviting the user to re-enable location. Allow manual city/neighborhood filtering via select inputs.
4. **IP-based fallback**: If location is denied, perform a one-time IP-based city estimation (via a free IP geolocation API) to show a relevant default view. The estimation is NOT stored, tracked, or linked to any profile (LGPD legitimate interest).
5. **Revocation**: User can clear their location context from within the app at any time (e.g., from the filter area or the banner).

## Acceptance criteria

- [ ] Geolocation modal appears on first visit with LGPD transparency text
- [ ] "Permitir" button triggers browser geolocation prompt
- [ ] Granted: coordinates stored in client state and passed to the API
- [ ] Denied: chronological feed with re-enable banner and manual filter dropdowns
- [ ] IP fallback: city estimated without storage
- [ ] User can revoke location context at any time
- [ ] Component test for the modal flow (grant / deny / revoke paths)

## Blocked by

- #39 (Portal/Panel Route Restructuring & Layout Separation)
