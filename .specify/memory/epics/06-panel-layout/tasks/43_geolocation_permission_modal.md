---
type: feature
epic: 06-panel-layout
status: blocked
blocked-by: null
---

## What to Build

Implement the geolocation permission flow for Visitors on the home page — a user-initiated modal that requests location access, captures coordinates, and provides LGPD-compliant fallbacks.

1. **Geolocation modal**: On first home page visit, show a friendly modal explaining why the platform wants location access ("Descubra serviços perto de você"). The modal must include LGPD transparency text (location used only for personalizing nearby announcements, not shared with third parties). User clicks "Permitir" to trigger the browser prompt.
2. **Permission granted flow**: Store coordinates in client-side state (React state / localStorage). Feed these coordinates to the announcements listing API for proximity ranking.
3. **Permission denied flow**: Show all announcements in chronological order. Display a subtle, non-intrusive banner inviting the user to re-enable location. Allow manual city/neighborhood filtering via select inputs.
4. **IP-based fallback**: If location is denied, perform a one-time IP-based city estimation (via a free IP geolocation API) to show a relevant default view. The estimation is NOT stored, tracked, or linked to any profile (LGPD legitimate interest).
5. **Revocation**: User can clear their location context from within the app at any time (e.g., from the filter area or the banner).

## Acceptance Criteria

- [x] Geolocation modal appears on first visit with LGPD transparency text
- [x] "Permitir" button triggers browser geolocation prompt
- [x] Granted: coordinates stored in client state and passed to the API
- [x] Denied: chronological feed with re-enable banner and manual filter dropdowns
- [x] IP fallback: city estimated without storage
- [x] User can revoke location context at any time
- [x] Component test for the modal flow (grant / deny / revoke paths)

## Sub-Tasks

_Sub-tasks will be defined when this task is executed._

---

<!-- INDEX SYNC: After completing a sub-task, update the parent
epic.md child task checklist AND .specify/memory/index.md in the
same turn. Never skip this sync step. -->
