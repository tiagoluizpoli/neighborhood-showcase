# Manual Test Guide — Epic 19 (Provider Identity, Config IA, Public Profile)

Step-by-step walkthrough to **visually validate** everything shipped in E-19. No code knowledge needed. Follow in order; each step says exactly what to click and what you should SEE. Check the box if it matches, note it if it doesn't.

---

## 0. Setup (once)

1. Start DB (skip if already up): `bun run db:start`
2. Seed test data: `bun run db:seed`
3. Start the app: `bun run dev`
4. Open the web app in a browser (Vite prints the URL, usually `http://localhost:3001`).

**Login (provider account):**
- Go to `/auth`
- Tab: **Sign in**
- Email: `provider@test.com`
- Password: `Test@1234`

**Key URLs you'll use:**
- Config page: `/panel/provider/configuration`
- Your public page (no branding yet → initials): `/providers/seed-provider-id`
- Pre-branded example page (logo + banner + description, already seeded): `/providers/seed-branding-id`

Run the **public** and **config** checks once in **Portuguese** and once in **English** (language switcher in the app header). Section 7 is the dedicated language pass.

---

## 1. Config page — identity-first layout (T-19-04)

Go to `/panel/provider/configuration`.

- [ ] **1.1 Section order top→bottom is:** ① **Public Profile** (name, description, images + a live preview) → ② **Public Visibility** (a compact toggle row) → ③ **Contact Channels**.
  PASS if visibility sits BETWEEN profile and contact, and the visibility control is a slim toggle row, not a big heavy card.

- [ ] **1.2 Live preview is present** inside the Public Profile section (shows the identity mark + name as it will appear publicly).

- [ ] **1.3 Live preview reacts to edits.** Change the **Display name** field. PASS if the preview text updates immediately as you type (no save needed).

---

## 2. Image lifecycle — Replace / Re-crop / Remove (T-19-03 / T-19-02)

Still on the config page, in **Public Profile**. There are three image slots: **avatar**, **logo**, **banner**. Do this for the **logo** first, then repeat for **avatar**.

**Empty slot:**
- [ ] **2.1** An empty slot shows an **Upload image** button only.

**Upload + crop:**
- [ ] **2.2** Click **Upload image**, pick any image. An **Adjust Image** crop dialog opens with a zoom slider and a framing hint ("Drag to adjust the … framing").
- [ ] **2.3** Adjust, click **Crop and Save**. Slot now shows the cropped preview plus three actions: **Replace**, **Re-crop**, **Remove**.

**Replace:**
- [ ] **2.4** Click **Replace**, pick a DIFFERENT image → crop dialog opens on the NEW image → **Crop and Save**. PASS if preview now shows the new image.

**Re-crop (the important one):**
- [ ] **2.5** Click **Re-crop**. PASS if the crop dialog reopens on the **original full-resolution upload** — i.e. you can zoom OUT and reveal area that was cropped away, NOT just re-frame the already-cropped thumbnail. This is the key behavior: re-crop works from the original, not the cropped result.

**Remove:**
- [ ] **2.6** Click **Remove** → slot returns to the **Upload image** empty state.

**Persistence:**
- [ ] **2.7** Set a logo and an avatar, save, then **reload the page**. PASS if both images are still there (originals retained on the backend).

---

## 3. Public visibility toggle (T-19-04)

In the **Public Visibility** row:

- [ ] **3.1** Toggle it. PASS if it **auto-saves** (toast "Visibility preference saved!") with no separate Save button, and the label flips between **Visible** / **Hidden**.
- [ ] **3.2** Set it back to **Visible / Show in public directory** so later steps work.

---

## 4. Contact channels (T-19-04)

In **Contact Channels**:

- [ ] **4.1** Edit a phone / channel and save (toast "Contact channels updated!").
- [ ] **4.2** Open your public page `/providers/seed-provider-id` → the edited contact appears under the **Contact channels** block.

---

## 5. Public page — single identity mark + precedence (T-19-01 / T-19-05)

This is the core visual rule: **logo → avatar → initials**, and the **banner is background only, never an identity mark**. There must be **exactly ONE** identity mark (the old always-on second avatar is gone).

Use the config page to set/clear assets, then refresh your public page `/providers/seed-provider-id` after each.

- [ ] **5.1 Logo wins:** set BOTH a logo and an avatar → public page shows the **logo** as the single identity mark.
- [ ] **5.2 Avatar fallback:** remove the logo (keep avatar) → public page shows the **avatar**.
- [ ] **5.3 Initials fallback:** remove BOTH → public page shows **initials** of the name.
- [ ] **5.4 Banner is background only:** set a banner → it renders as the hero **background**, and does NOT count as the identity mark (mark is still logo/avatar/initials per above).
- [ ] **5.5 Only one mark:** in every case above there is exactly ONE identity mark on the page — no duplicate avatar lower down.

(Shortcut: `/providers/seed-branding-id` is pre-seeded with logo + banner + description for a quick look at the fully-branded hero.)

---

## 6. Public page — composition, fallback, width (T-19-05)

- [ ] **6.1 Order:** top→bottom is **hero → active announcements (main body) → contact (secondary)**.
- [ ] **6.2 Width cap:** content is capped in a centered max-width container — it does NOT stretch edge-to-edge on a wide screen.
- [ ] **6.3 Sparse-branding fallback:** view a provider with minimal branding (`/providers/seed-provider-id` with images removed) → hero collapses to a **compact centered band** (initials + name + description) with a **full-width announcement grid** below.
- [ ] **6.4 Full-branding hero:** view `/providers/seed-branding-id` → richer hero with banner background + logo.
- [ ] **6.5 Announcement cards still work:** click an announcement card → it navigates to the announcement detail (grid + links unchanged from before).

---

## 7. Language parity — pt / en (T-19-06)

Switch language in the header, then re-walk the main screens.

- [ ] **7.1 Config page** in **pt** and **en** → all labels are real translated text. No raw keys like `configuracoes.section_public_profile` showing literally.
- [ ] **7.2 Image actions** (Replace / Re-crop / Remove / Upload image / Crop and Save) read correctly in both languages.
- [ ] **7.3 Public page** (hero, "About", "Active announcements", "Contact channels", not-found state) reads correctly in both languages — no raw keys.

---

## Result

Mark each box. Anything unchecked = a finding to discuss (right / wrong / needs change). Bring the list back and we go over them.
