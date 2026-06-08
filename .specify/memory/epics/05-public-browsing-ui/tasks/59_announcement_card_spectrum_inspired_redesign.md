---
type: feature
epic: 05-public-browsing-ui
status: completed
blocked-by: null
---

## What to Build

Redesign the public announcement card using the Spectrum UI Product Card as a visual reference, adapted for neighborhood announcements instead of ecommerce products.

Reference: https://ui.spectrumhq.in/docs/product-card

## Acceptance Criteria

- [x] `AnnouncementCard` is extracted from the home route into a reusable component.
- [x] Card uses a Spectrum-inspired image-led layout adapted for announcements.
- [x] Offer/title hierarchy appears before administrative metadata.
- [x] Provider identity is visible and links to `/prestadores/:id`.
- [x] Verified trust signal appears near provider identity and is not duplicated as noisy image badges.
- [x] Card shows exactly one primary action: WhatsApp, phone, email, or details fallback.
- [x] Price/value is visually prominent when present and absent gracefully when missing.
- [x] Whole-card detail navigation works and is keyboard-accessible.
- [x] Contact and provider links do not trigger detail navigation.
- [x] Location/proximity text follows Issue 57 confidence rules.
- [x] Card avoids warning-style treatment for external providers.
- [x] Focused tests cover card navigation, provider link, primary contact fallback, and contact click tracking.

## Sub-Tasks

_Sub-tasks will be defined when this task is executed._

---

<!-- INDEX SYNC: After completing a sub-task, update the parent
epic.md child task checklist AND .specify/memory/index.md in the
same turn. Never skip this sync step. -->
