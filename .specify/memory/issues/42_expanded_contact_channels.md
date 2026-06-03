# Slice 6: Expanded Contact Channels Schema & Profile Form

## Parent

PRD-v2-backlog-overhaul (Items 7, 14)

## What to build

Extend the database schema to support a broader set of contact and social channels for both providers (user-level) and announcements, and build the form to manage them.

1. **Schema changes**:
   - Add a `socialLinks` JSONB column to the `user` table (or an appropriate provider-related table) supporting: `whatsapp`, `phone`, `email`, `instagram`, `tiktok`, `facebook`, `website`. All optional.
   - Extend the `contactLinks` JSONB on the `announcement` table to support the same set of channels (currently only `whatsapp`, `instagram`, `website`).
   - Add a `isProviderVisible` boolean column to the `user` table (default `true`) for provider opt-out from the directory.
2. **Profile social links form**: Add a section on the `/panel/conta` account page where the provider can edit their social/contact links.
3. **API**: Update user update and announcement create/update procedures to handle the expanded channel set with Zod validation.

## Acceptance criteria

- [ ] `user` table has a `socialLinks` JSONB column with Zod-validated shape
- [ ] `announcement.contactLinks` JSONB supports `whatsapp`, `phone`, `email`, `instagram`, `tiktok`, `facebook`, `website`
- [ ] `user` table has `isProviderVisible` boolean column (default `true`)
- [ ] Account page has a social links editing section
- [ ] Provider opt-out toggle exists on the account page
- [ ] API validates the expanded contact channels via Zod schemas
- [ ] Migration runs cleanly on existing data (new columns nullable/defaulted)

## Blocked by

- #41 (Account Page & Avatar Menu)
