---
type: task
id: T-15-01
epic: E-15
status: ready
blocked-by: []
default-model: medium
---

## What to Build

A detailed manual testing walkthrough outlining the changes in E-13 and E-14, detailing mock user credentials, step-by-step instructions, and expected behaviors.

## Context

To ensure the live application performs correctly under manual verification, the tester needs explicit test cases detailing the old vs. new behavior, seeded credentials, and specific environment requirements.

## Seeded Test Users & Credentials

Ensure the database is seeded by running:
```bash
# In project root
bun run db:seed
```

All seeded test users share the password: **`Test@1234`**

| Role / State | Email | Expected Destination | Notes |
| --- | --- | --- | --- |
| **Provider (Active)** | `provider@test.com` | `/panel/provider` | Has assignments and active profile |
| **Moderator (Multi-Condo)** | `moderator@test.com` | `/panel/moderation` | Has moderation assignments in 2 condos |
| **Administrator** | `admin@test.com` | `/panel/admin` | Platform Admin |
| **System Manager** | `system.manager@test.com` | `/panel/admin` | System level manager |
| **Non-Provider (No Scope)** | `nonprovider@test.com` | `/panel/dashboard/condo-setup` | Signed in user with no assignments |
| **Unverified User** | `unverified@test.com` | — | `emailVerified` is false |
| **Banned User** | `banned@test.com` | — | User status is `BANNED` |

---

## Test Cases for Manual Verification

### Case 1: Provider Sign-in Landing & Main Dashboard
- **Context**: Formerly, providers landed on `/panel/dashboard` which mixed general and provider-specific components.
- **New Behavior**: Logging in as a Provider must land the user at `/panel/provider`. The dashboard should show KPI metrics (Views, Impressions, Overall Performance).
- **Test Steps**:
  1. Open `/auth` in the browser.
  2. Log in with `provider@test.com` and `Test@1234`.
  3. Verify the browser URL changes to `/panel/provider`.
  4. Verify the page displays views, impressions, and conversions metric cards.

### Case 2: Legacy `/panel/dashboard` Redirect Shim
- **Context**: `/panel/dashboard` was previously a real page where all users landed. It is now retired and acts only as a redirect shim.
- **New Behavior**: Direct visits to `/panel/dashboard` must evaluate the user's role and immediately redirect them to their section-correct dashboard.
- **Test Steps**:
  1. Log in with a role from the credentials table.
  2. Navigate directly to `/panel/dashboard` in the address bar.
  3. Verify the redirect destination matches the **Expected Destination** in the credentials table.
  4. Repeat for:
     - `provider@test.com` (redirects to `/panel/provider`)
     - `moderator@test.com` (redirects to `/panel/moderation`)
     - `admin@test.com` (redirects to `/panel/admin`)
     - `nonprovider@test.com` (redirects to `/panel/dashboard/condo-setup`)

### Case 3: Provider Route Group Access Guards
- **Context**: Accessing Provider routes should fail closed for non-provider roles.
- **New Behavior**: Visiting `/panel/provider` or any subroute (e.g. `/panel/provider/announcements`) with a non-provider account must reject the request and redirect to the correct role dashboard.
- **Test Steps**:
  1. Log in as a moderator (`moderator@test.com`) or admin (`admin@test.com`).
  2. Navigate directly to `/panel/provider` or `/panel/provider/announcements`.
  3. Verify you are redirected away (e.g., moderator goes to `/panel/moderation`).
  4. Navigate to `/panel/provider` unauthenticated (in incognito). Verify you are redirected to `/`.

### Case 4: Public Provider Directory Pages & Not-Found Paths
- **Context**: Conflation of user profile and provider profile fields has been removed. Provider identity uses public branding.
- **New Behavior**: Public provider directories must display correct branding data and handle banned/missing IDs gracefully.
- **Test Steps**:
  1. Open `/providers/seed-provider-id` or `/providers/seed-provider-other-id`.
  2. Verify page displays correct public branding (display name, description, active announcements).
  3. Open `/providers/seed-banned-id` (Banned Provider) or `/providers/nonexistent-id`.
  4. Verify the page displays "Prestador não encontrado" (Provider not found) and provides a "Voltar para o início" (Back to home) button.

### Case 5: Moderation Condo Context Selector
- **Context**: Multi-condo moderators had no way to switch context, and selection was not persisted.
- **New Behavior**: Moderators with multiple assignments will see a dropdown selector in the Moderation sidebar group. The selection must persist across page loads.
- **Test Steps**:
  1. Log in with `moderator@test.com`.
  2. In the Moderation section sidebar, find the condo context selector (first element of the moderation group).
  3. Open the dropdown and select `Segundo Condomínio`. Verify the context updates.
  4. Open developer tools, check `localStorage.getItem("mod_ctx__cndo")`. It must contain the selected condominium ID.
  5. Refresh the page. Verify the selection persists.

### Case 6: Split Settings Pages (Configurações vs. Conta e Segurança)
- **Context**: Previously, public branding fields were mixed with account details.
- **New Behavior**: Under the Provider section navigation, settings are split:
  - "Configurações" edits Provider Profile fields (displayName, tradeName, banner, etc.).
  - "Conta e Segurança" edits User Account fields (name, email, phone, etc.).
- **Test Steps**:
  1. Log in as a Provider.
  2. Navigate to Configurações (Settings). Verify it handles only public branding fields.
  3. Navigate to Conta e Segurança (Account and Security). Verify it handles user details and changes are stored on the User row, not mirrored to the provider profile.

---

<!-- INDEX SYNC: After completing or modifying any child task file, run
.plan/helper-scripts/sync-state.sh and update the parent epic.md checklist and
.plan/index.md in the same turn. -->
