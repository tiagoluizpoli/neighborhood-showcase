---
type: epic
name: "Announcements and Payments"
status: completed
blocked-by: null
---

## About this Epic

Announcement lifecycle from draft creation through payment (Pix via AbacatePay) to active public listing, including webhook resolution and the public showcase discovery interface.

## Context

Providers create draft announcements with mandatory 4:3 cover image (sharp/WebP). Payment at R$2.00 via AbacatePay Pix generates a billing order with QR code. Webhook transitions announcement to ACTIVE. Public showcase at / displays listings sorted by proximity.

## Child Tasks

- [x] [06_announcement_draft_creation](tasks/06_announcement_draft_creation.md)
- [x] [07_payment_intent_pix](tasks/07_payment_intent_pix.md)
- [x] [08_webhook_payment_resolution](tasks/08_webhook_payment_resolution.md)
- [x] [09_public_showcase_discovery](tasks/09_public_showcase_discovery.md)
- [x] [14_announcement_creation_auto_link](tasks/14_announcement_creation_auto_link.md)
- [x] [17_draft_announcement_publish_button](tasks/17_draft_announcement_publish_button.md)

---

<!-- INDEX SYNC: After completing or modifying any child task file,
update .specify/memory/index.md in the same turn. Keep the child
task checklist above in sync with actual file statuses. -->
