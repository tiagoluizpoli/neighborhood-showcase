# AbacatePay Payment Error Handling & State Transitions

## Context
Integrating a payment gateway like AbacatePay requires absolute synchronization between client actions, server state, and the external payment processor. Specifically:
1. Preventing multiple payment intents for a single active or suspended announcement.
2. Securing the webhook endpoint that receives payment confirmation.
3. Ensuring transactional database transitions when updates are processed.

## Considered Options

### Option 1: Client-Only Checks
Verify the announcement state on the frontend before calling `GeneratePaymentIntent`. 
- *Pros*: Faster UI feedback.
- *Cons*: Highly vulnerable to bypasses and race conditions. Doesn't protect backend endpoints.

### Option 2: Decoupled Backend Validation (Chosen)
Implement strict domain guards on the backend use cases and repository layers. Handle error codes distinctly at the tRPC interface layer and map them to UI Toast notifications.
- *Pros*: Secure, auditable, type-safe, and robust against race conditions.
- *Cons*: Slightly higher round-trip cost for error states.

## Decision Detail & Technical Specifications

### 1. Intent Generation Guards
When payment is generated (`GeneratePaymentIntent`), the server checks the announcement status:
- If `status === 'ACTIVE'`, throws a `TRPCError` with code `BAD_REQUEST` and message containing `ANNOUNCEMENT_ALREADY_ACTIVE`.
- If `status === 'SUSPENDED'`, throws a `TRPCError` with code `BAD_REQUEST` and message containing `ANNOUNCEMENT_SUSPENDED`.
- If `status === 'EXPIRED'`, throws a `TRPCError` with code `BAD_REQUEST` and message containing `ANNOUNCEMENT_EXPIRED`.

The frontend maps these codes to distinct user alerts:
- `ANNOUNCEMENT_ALREADY_ACTIVE` shows a toast: "Este anúncio já está ativo."
- `ANNOUNCEMENT_SUSPENDED` shows a toast: "Este anúncio está suspenso. Entre em contato com o suporte."

### 2. Webhook Validation & Signature Verification
- Endpoint: `/api/webhooks/abacatepay`.
- Validates the signature header `X-Webhook-Signature` by computing an HMAC-SHA256 hash using the raw request body and the local `ABACATEPAY_WEBHOOK_SECRET`.
- Performs a timing-safe equality comparison of the signature to prevent timing attacks.

### 3. Idempotent State Transitions
- Webhook runs in a single database transaction.
- Updates payment record status to `PAID`.
- Transitions announcement status to `ACTIVE` and updates `paidAt` to current timestamp and `expiresAt` to `now + 30 days`.
- Dispatches confirmation emails via Resend (with console logs fallback in dev).
