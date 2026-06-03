# Slice 13: Announcement Detail Page

## Parent

PRD-v2-backlog-overhaul (Item 13)

## What to build

Create a dedicated, SEO-friendly detail page for each announcement at `/anuncios/:id`, showing full information, all contact options, and a link to the provider's profile.

1. **Route**: Create a new public route at `/anuncios/:id` (under the portal layout).
2. **Content**: Display:
   - Full-size cover image
   - Title, subtitle, description (rendered as rich text if applicable)
   - Category and tags
   - Price (if set)
   - Verified badge and location context (condominium or neighborhood)
   - All contact channels: WhatsApp, Phone, Email, Instagram, TikTok, Facebook, Website (showing only those the provider has configured)
   - Provider identity card: avatar, name, link to `/prestadores/:id`
3. **SEO**: Proper `<title>` tag, `<meta description>`, and `<h1>` heading structure for each announcement.
4. **Share-friendly**: The URL should be directly shareable and generate a meaningful preview (Open Graph meta tags).
5. **Analytics**: Record an `IMPRESSION` event when the detail page is viewed.

## Acceptance criteria

- [ ] `/anuncios/:id` route exists under the portal layout
- [ ] Detail page shows all announcement fields (image, title, description, price, category, tags)
- [ ] All configured contact channels are displayed as interactive buttons
- [ ] Provider identity card links to `/prestadores/:id`
- [ ] Verified badge renders conditionally
- [ ] SEO: proper title, meta description, h1 structure
- [ ] IMPRESSION analytics event recorded on page view
- [ ] 404 handling for non-existent announcement IDs

## Blocked by

- #48 (Announcement Card Redesign)
