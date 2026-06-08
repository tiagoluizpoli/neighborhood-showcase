---
type: feature
epic: 03-announcements-and-payments
status: completed
blocked-by: null
---

## What to Build

Implement the announcement creation form at `/dashboard/anuncios/novo`. Allows providers to design service announcements, enforce a mandatory cover image with 4:3 cropper validation, write titles, descriptions, pricing, contact details, and save them in draft status.

## Acceptance Criteria

- [x] Form elements: Category, Title, Subtitle, Description, Price, Tags, Contact links (WhatsApp/Instagram/PDF Catalog).
- [x] Cover image upload enforces a 4:3 aspect ratio crop before submission.
- [x] Uploaded image is converted to WebP format, resized to 800x600px via `sharp`, and saved to S3.
- [x] Database record created in `announcements` with status `DRAFT`.
- [x] Option to toggle "Verified Resident" badge (available only if user has an approved resident assignment for the condo).
- [x] Unit tests for the frontend cropper bounds and sharp resizing utility; Integration tests for database save.

## Sub-Tasks

_Sub-tasks will be defined when this task is executed._

---

<!-- INDEX SYNC: After completing a sub-task, update the parent
epic.md child task checklist AND .specify/memory/index.md in the
same turn. Never skip this sync step. -->
