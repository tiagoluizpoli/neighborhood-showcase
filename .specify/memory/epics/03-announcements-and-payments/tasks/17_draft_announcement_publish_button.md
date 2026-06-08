---
type: feature
epic: 03-announcements-and-payments
status: completed
blocked-by: null
---

## What to Build

Expose a publish action for draft announcements and implement backend safeguards to prevent duplicate payment intents:
1. In the provider dashboard (`apps/web/src/routes/dashboard.index.tsx`), render a `"Publicar Anúncio"` action button on cards that are in `DRAFT` status.
2. Direct this action to the `onPay` callback, which navigates the user to `/dashboard/anuncios/:id/pagamento`.
3. In `apps/server/src/application/use-cases/payment/generate-payment-intent.ts`, validate the announcement status before processing:
   - If the status is already `ACTIVE`, throw a `TRPCError` with code `BAD_REQUEST` (e.g. `"Este anúncio já está ativo e publicado."`).
   - If the status is `SUSPENDED`, throw a `TRPCError` with code `BAD_REQUEST` (e.g. `"Anúncios suspensos não podem receber pagamentos."`).

## Acceptance Criteria

- [x] `AnnouncementCard` displays a `"Publicar Anúncio"` button when `ad.status === 'DRAFT'`.
- [x] Clicking `"Publicar Anúncio"` successfully redirects the provider to `/dashboard/anuncios/:id/pagamento`, triggering checkout generation.
- [x] Backend use case `GeneratePaymentIntent` rejects payment generation if the announcement is already `ACTIVE` or `SUSPENDED`.
- [x] Integration tests verify the backend guards throw the expected bad request tRPC errors.

## Sub-Tasks

_Sub-tasks will be defined when this task is executed._

---

<!-- INDEX SYNC: After completing a sub-task, update the parent
epic.md child task checklist AND .specify/memory/index.md in the
same turn. Never skip this sync step. -->
