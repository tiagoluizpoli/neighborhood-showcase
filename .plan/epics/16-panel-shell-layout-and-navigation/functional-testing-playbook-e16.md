# Functional Testing Playbook: Epic 16 (Panel Shell, Layout, & Navigation)

This playbook outlines the manual testing scenarios to verify the changes implemented in **Epic 16 (E-16: Panel Shell, Layout, and Navigation)**. Use these steps to approve completed items or identify issues for the backlog.

---

## Scenario 1: Sidebar Collapse Toggle & Reload Persistence (T-16-03)
Verify that the sidebar state collapses/expands properly and persists across page reloads.

### Steps to Test:
1. Access the application and log in as a provider (e.g., `provider@test.com` / `Test@1234`).
2. Navigate to the panel (e.g., `/panel/account` or `/panel/provider/announcements`).
3. Click the sidebar toggle button in the top bar to **collapse** the sidebar.
4. Verify the sidebar visually collapses.
5. Reload the page (F5 or browser refresh).
6. **Expected Behavior**: The sidebar must remain **collapsed** after the reload.
7. Click the toggle button again to **expand** the sidebar.
8. Reload the page.
9. **Expected Behavior**: The sidebar must remain **expanded** after the reload.

---

## Scenario 2: Canonical Content Container & Layout Spacing (T-16-01 & T-16-02)
Verify that pages render inside the new canonical layout containers without layout drift or bespoke width/padding overrides.

### Steps to Test:
1. Navigate to **My Announcements** (`/panel/provider/announcements`):
   * **Expected Behavior**: The list should use the `default/list` layout (full width container matching the dashboard's margins).
2. Navigate to **New Announcement** (`/panel/provider/announcements/new`):
   * **Expected Behavior**: The page must render in a centered form frame (`centered-form` variant) with a maximum width of `max-w-2xl` and be horizontally centered.
3. Navigate to **Condo Setup** (`/panel/provider/condo-setup`):
   * **Expected Behavior**: The page must render centered inside the `centered-form` container.
4. Navigate to **Payment** (`/panel/provider/anuncios/:id/pagamento`):
   * **Expected Behavior**: The page must render centered inside the `centered-form` container.

---

## Scenario 3: Strengthened Shell Chrome & Context (T-16-04)
Verify the visual reinforcement and context rendering in the sidebar and top bar.

### Steps to Test:
1. Log in as a moderator or administrator.
2. Select a condominium context (setting the `mod_ctx__cndo` state/cookie/local storage context).
3. Observe the sidebar header:
   * **Expected Behavior**: It should render the logo/brand name via the localized keys, and the active condominium name should be visible under the brand header.
4. Observe the top bar:
   * **Expected Behavior**: It should show dynamic context (eyebrow text or route-derived breadcrumbs matching the active sidebar page and selected condo context).

---

## Scenario 4: Announcement Presentation Primitive Variants (T-16-05)
Verify that the `AnnouncementPresentationPrimitive` renders correctly in all three contexts.

### Steps to Test:
1. Navigate to the **Public Vitrine (Showcase)** (public homepage):
   * **Expected Behavior**: Announcement cards render using the `public-card` variant (standard customer-facing layout).
2. Navigate to the **Provider Dashboard** (`/panel/provider`):
   * **Expected Behavior**: Active announcements render using the `dashboard-card` variant.
3. Navigate to an **Announcement Detail page** (`/panel/provider/announcements/:id`):
   * **Expected Behavior**: The header rendering at the top of the detail page separates title, actions, and content appropriately using the `detail-header` variant.

---

## Scenario 5: Shell-Adjacent Localization (T-16-06)
Verify that English and Portuguese localization keys resolve correctly on all changed screens.

### Steps to Test:
1. Locate the Language Switcher in the top bar.
2. Toggle between **PT** (Portuguese) and **EN** (English).
3. **Verify the Brand Name**:
   * **Expected Behavior**: The sidebar brand name changes between "Showcase do Bairro" / "NS" (PT) and "Neighborhood Showcase" / "NS" (EN) based on the localization keys.
4. **Verify the New Announcement Form** (`/panel/provider/announcements/new`):
   * **Expected Behavior**: Switch languages and confirm all form fields, placeholders, helper text, and validation error messages translate cleanly (no raw dots or missing strings like `new_announcement.*`).
5. **Verify Public Provider Profile** (`/provedor/:id`):
   * **Expected Behavior**: Verify that the loading state text and the "Voltar para Vitrine" / "Back to Showcase" button translate correctly when toggled.
