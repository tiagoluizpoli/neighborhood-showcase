# Neighborhood Showcase Test Coverage Plan

This document establishes the comprehensive test coverage requirements across the testing pyramid (Unit, Integration, Component, E2E) based on the 4-Layer Path Discovery model. This plan serves as the verification definition of success for the implementation.

---

## 1. CPF Validation & Authentication (`provider` / `auth` Domain)

### Happy Paths
- [ ] **Valid Registration**: Registering a new provider with a mathematically valid CPF, unique email, and valid details.
  * *Expect*: Success, user record created, CPF stored as hashed `sha256(cpf)` in DB, auth session created. $\rightarrow$ **INTEGRATION**
- [ ] **Valid Login**: Authenticating with correct credentials.
  * *Expect*: Success, session token returned. $\rightarrow$ **INTEGRATION**

### Permission Matrix
- [ ] **Banned User Block**: Authenticated user with `status = 'BANNED'` makes tRPC requests.
  * *Expect*: Session rejected, HTTP 403 Forbidden / tRPC unauthorized error. $\rightarrow$ **INTEGRATION**

### Edge Cases & Validation
- [ ] **Invalid CPF Format**: Submitting registration form with structurally invalid CPF (e.g. invalid verification digits or length).
  * *Expect*: Client-side and server-side validation error: `"CPF inválido"`. $\rightarrow$ **UNIT**
- [ ] **Blacklisted CPF**: Submitting registration with a CPF whose SHA256 hash exists in the `blacklisted_identifiers` table.
  * *Expect*: Registration blocked with message: `"Este CPF está impedido de realizar novos cadastros na plataforma."` $\rightarrow$ **INTEGRATION**
- [ ] **Duplicate Email**: Submitting registration with an email that is already registered.
  * *Expect*: Validation error: `"Email já cadastrado"`. $\rightarrow$ **INTEGRATION**

### Catastrophic Failures
- [ ] **Database Connection Timeout**: Database is unreachable during blacklist validation.
  * *Expect*: Server returns a graceful HTTP 500 error: `"Serviço temporariamente indisponível. Tente novamente mais tarde."` $\rightarrow$ **INTEGRATION**

---

## 2. Condominium Setup & Assignments (`condominium` / `assignment` Domain)

### Happy Paths
- [ ] **Resident Join Request**: Provider requests to join an approved condominium.
  * *Expect*: An assignment record is created with `status = 'PENDING'` and `type = 'RESIDENT'`. $\rightarrow$ **INTEGRATION**
- [ ] **Síndico Condo Creation**: Provider requests to create a new condominium, uploading a mandatory election convenção PDF document.
  * *Expect*: Condominium record created with `status = 'PENDING_APPROVAL'`. $\rightarrow$ **INTEGRATION**
- [ ] **Síndico Auto-Promotion**: Global System Manager approves a pending condominium request.
  * *Expect*: Condominium status updated to `'APPROVED'`, and the creator user receives a `status = 'APPROVED'` and `type = 'MODERATOR'` assignment for that condominium. $\rightarrow$ **INTEGRATION**

### Permission Matrix
- [ ] **Anonymous Join Request**: Non-authenticated user attempts to request an assignment.
  * *Expect*: Unauthorized error. $\rightarrow$ **INTEGRATION**
- [ ] **Cross-Condo Moderation**: Provider attempts to approve/reject an assignment request for a condominium they do not moderate.
  * *Expect*: Unauthorized / Forbidden error. $\rightarrow$ **INTEGRATION**

### Edge Cases & Validation
- [ ] **Non-Existent Condo**: Requesting an assignment to an invalid or deleted condominium ID.
  * *Expect*: Not Found error. $\rightarrow$ **INTEGRATION**
- [ ] **Duplicate Request**: Requesting a join assignment for a condominium where the provider already has a pending or active assignment.
  * *Expect*: Validation error: `"Você já possui uma solicitação ativa para este condomínio."` $\rightarrow$ **INTEGRATION**
- [ ] **Condo Creation Without Document**: Submitting a condo creation request without the mandatory proof of office document.
  * *Expect*: Validation error: `"Ata de eleição ou convenção é obrigatória."` $\rightarrow$ **INTEGRATION**

### Catastrophic Failures
- [ ] **S3 Upload Failure**: File storage (MinIO/S3) is down during proof of residency or convenção upload.
  * *Expect*: The database transaction rolls back, no assignment or condo record is created, and the user receives a descriptive error. $\rightarrow$ **INTEGRATION**

---

## 3. Announcement Lifecycle & Payments (`announcement` / `payment` Domain)

### Happy Paths
- [ ] **Draft Creation**: Creating a new service announcement.
  * *Expect*: Announcement record created with `status = 'DRAFT'`. $\rightarrow$ **INTEGRATION**
- [ ] **Payment Intent Generation**: Requesting payment credentials for a draft announcement.
  * *Expect*: Success, AbacatePay billing created, payment record created with status `'PENDING'`, QR code and Pix Copy/Paste key returned. $\rightarrow$ **INTEGRATION**
- [ ] **Webhook Payment Resolution**: AbacatePay webhook receives a valid signature and `billing.paid` event.
  * *Expect*: Payment status set to `'PAID'`, Announcement status set to `'ACTIVE'`, expiration date set to `now + 30 days`, and notification email dispatched. $\rightarrow$ **INTEGRATION**

### Permission Matrix
- [ ] **Unauthorized Edit**: User attempts to update or delete an announcement belonging to another provider.
  * *Expect*: Unauthorized / Forbidden error. $\rightarrow$ **INTEGRATION**
- [ ] **Invalid Webhook Signature**: Receiving an AbacatePay webhook callback with a missing or invalid signature header.
  * *Expect*: Verification fails, returns HTTP 401 Unauthorized, and database records remain unchanged. $\rightarrow$ **INTEGRATION**

### Edge Cases & Validation
- [ ] **Missing Cover Image**: Trying to create an announcement without a cover image.
  * *Expect*: Validation error: `"Imagem de capa é obrigatória."` $\rightarrow$ **UNIT**
- [ ] **Webhook Idempotency**: Webhook receives duplicate `billing.paid` callback for an already paid billing ID.
  * *Expect*: Return HTTP 200 OK immediately, preventing duplicate extension of the expiration date. $\rightarrow$ **INTEGRATION**
- [ ] **Expired Billing Payment**: Webhook payment arrives after the payment is expired or marked refunded.
  * *Expect*: Payment status updated to `'REFUNDED'`, announcement remains `'DRAFT'`. $\rightarrow$ **INTEGRATION**

### Catastrophic Failures
- [ ] **AbacatePay Down**: Payment gateway is unreachable when requesting payment QR code.
  * *Expect*: Graceful fallback message to user: `"Erro ao contatar o gateway de pagamento. Tente novamente em instantes."` $\rightarrow$ **INTEGRATION**
- [ ] **Email Dispatch Failure**: Resend API fails during webhook processing.
  * *Expect*: Transaction successfully commits, announcement becomes `'ACTIVE'`, and error is captured in backend logs for retry. $\rightarrow$ **INTEGRATION**

---

## 4. Local Moderation Controls (`/moderation` Portal)

### Happy Paths
- [ ] **Resident Approval**: Condo Moderator approves a resident request.
  * *Expect*: Resident assignment set to `'APPROVED'`. $\rightarrow$ **INTEGRATION**
- [ ] **Resident Rejection**: Condo Moderator rejects request with a reason.
  * *Expect*: Assignment set to `'REJECTED'`, reason stored. $\rightarrow$ **INTEGRATION**
- [ ] **Ad Suspension**: Condo Moderator suspends a local ad with a reason.
  * *Expect*: Announcement status set to `'SUSPENDED'`, hidden from public vitrine, reason logged. $\rightarrow$ **INTEGRATION**

### Permission Matrix
- [ ] **Non-Moderator Access**: Standard Resident attempts to hit `/moderation` procedures.
  * *Expect*: Forbidden / Unauthorized error. $\rightarrow$ **INTEGRATION**

### Edge Cases & Validation
- [ ] **Empty Rejection Reason**: Moderator attempts to reject a resident without entering a reason.
  * *Expect*: Validation error: `"Motivo de rejeição é obrigatório."` $\rightarrow$ **UNIT**

---

## 5. System Manager Actions (`/admin` Portal)

### Happy Paths
- [ ] **CPF Ban**: System manager inputs a violator's CPF and bans them.
  * *Expect*: User account banned, all active ads removed, and CPF hash added to `blacklisted_identifiers`. $\rightarrow$ **INTEGRATION**

### Permission Matrix
- [ ] **Unauthorized Admin Access**: Standard Provider attempts to access admin procedures.
  * *Expect*: Unauthorized / Forbidden error. $\rightarrow$ **INTEGRATION**

---

## 6. Frontend Components & E2E Journeys

### Happy Paths
- [ ] **Geolocation Sort**: Visitor enters the app and grants geolocation permission.
  * *Expect*: Vitrine automatically sorts and shows advertisements from the nearest condominium. $\rightarrow$ **E2E**
- [ ] **Mobile Detail Drawer**: Visitor on mobile clicks an announcement card.
  * *Expect*: A Drawer slides up, details render, and URL changes to `/anuncios/:id`. $\rightarrow$ **COMPONENT**
- [ ] **Desktop Detail Modal**: Visitor on desktop clicks an announcement card.
  * *Expect*: A Modal Dialog opens, details render, and URL changes to `/anuncios/:id`. $\rightarrow$ **COMPONENT**
- [ ] **4:3 Aspect Ratio Cropper**: Provider uploads an image in the announcement form.
  * *Expect*: Cropper utility enforces a 4:3 viewport selection before upload submission. $\rightarrow$ **COMPONENT**
- [ ] **Payment Polling Transition**: Provider pays QR Code; status changes.
  * *Expect*: Page transitions to confetti success screen without manual reload. $\rightarrow$ **E2E**

### Edge Cases & Validation
- [ ] **Geolocation Denied**: Visitor denies browser location access.
  * *Expect*: Manual city/condo selection modal is automatically presented. $\rightarrow$ **COMPONENT**
