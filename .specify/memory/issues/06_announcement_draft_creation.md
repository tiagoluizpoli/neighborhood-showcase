## What to build

Implement the announcement creation form at `/dashboard/anuncios/novo`. Allows providers to design service announcements, enforce a mandatory cover image with 4:3 cropper validation, write titles, descriptions, pricing, contact details, and save them in draft status.

## Acceptance criteria

- [ ] Form elements: Category, Title, Subtitle, Description, Price, Tags, Contact links (WhatsApp/Instagram/PDF Catalog).
- [ ] Cover image upload enforces a 4:3 aspect ratio crop before submission.
- [ ] Uploaded image is converted to WebP format, resized to 800x600px via `sharp`, and saved to S3.
- [ ] Database record created in `announcements` with status `DRAFT`.
- [ ] Option to toggle "Verified Resident" badge (available only if user has an approved resident assignment for the condo).
- [ ] Unit tests for the frontend cropper bounds and sharp resizing utility; Integration tests for database save.

## Blocked by

- [.specify/memory/issues/03_condo_joining_resident.md](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/issues/03_condo_joining_resident.md)
- [.specify/memory/issues/05_resident_approval_moderator.md](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/issues/05_resident_approval_moderator.md)
