---
type: feature
epic: 06-panel-layout
status: blocked
blocked-by: null
---

## What to Build

Create a public-facing profile page for each provider at `/prestadores/:id`, showing their identity, all contact channels, and a grid of their active announcements.

1. **Route**: Create a new public route at `/prestadores/:id` (raw ID, under the portal layout).
2. **API**: Create a tRPC procedure to fetch a provider's public profile data (name, avatar, social links from `user.socialLinks`) and their active announcements.
3. **Profile content**:
   - Provider name and avatar (initials fallback)
   - Description/bio (if available)
   - All configured social/contact links: WhatsApp, Phone, Email, Instagram, TikTok, Facebook, Website
   - Verified badge (if the provider has an approved RESIDENT assignment)
4. **Active announcements grid**: List all active announcements by this provider using the redesigned card component (from Slice 12).
5. **Empty state**: If the provider has zero active announcements, show the profile with contact info and a message: "Este prestador não possui anúncios ativos no momento."

## Acceptance Criteria

- [x] `/prestadores/:id` route exists under the portal layout
- [x] Profile shows provider name, avatar (initials fallback), and verified badge
- [x] All configured social/contact links are displayed as interactive buttons/links
- [x] Active announcements grid renders using the redesigned card component
- [x] Empty state displays correctly when no active announcements exist
- [x] API returns provider profile + their active announcements
- [x] 404 handling for non-existent provider IDs
- [x] SEO: proper title and meta description for the provider page

## Sub-Tasks

_Sub-tasks will be defined when this task is executed._

---

<!-- INDEX SYNC: After completing a sub-task, update the parent
epic.md child task checklist AND .specify/memory/index.md in the
same turn. Never skip this sync step. -->
