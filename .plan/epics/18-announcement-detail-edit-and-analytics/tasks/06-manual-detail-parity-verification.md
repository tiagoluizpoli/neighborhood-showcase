---
type: task
id: T-18-06
epic: E-18
status: done
blocked-by: [manual-execution-only]
default-model: medium
---

## What to Build

A manual testing walkthrough for the provider announcement surface delivered by
E-18: the read-only detail page (`/panel/provider/announcements/$id`), the shared
create/edit form, and the create↔edit↔detail **field parity** contract. Every
property a provider can author (create or edit) MUST surface on the detail page.

## Context

E-18 split view from edit and rebuilt the detail page facts-first. A defect was
found: the **CTA** was authorable on create and edit but invisible on the detail
page. The fix reuses `AnnouncementCtaActions` on the detail surface. This task is
the manual gate proving the CTA is now visible AND that no other authorable field
silently drops off the detail page. The public surface
(`/anuncios/$id` → `_portal.anuncios.$id`) is out of scope here.

## Seeded Test Users & Credentials

Ensure the database is seeded by running:
```bash
# In project root
bun run db:seed
```

All seeded test users share the password: **`Test@1234`**

| Role / State | Email | Notes |
| --- | --- | --- |
| **Provider (Active)** | `provider@test.com` | Has approved assignments; can create/edit announcements |

Run the app with `bun run dev` and sign in at `/auth`.

---

## Field Parity Matrix (the core contract)

Every row is authorable on **create** and **edit**. Each MUST render on the
**detail** page. This is the single most important table in this task.

| # | Authorable field | Where to set it (form) | Where to verify it (detail) |
| --- | --- | --- | --- |
| 1 | Location / Condo | Location select (when >1 approved) | "Condomínio" fact |
| 2 | Category | Category combobox | "Categoria" fact |
| 3 | Title | Title input | `<h1>` header |
| 4 | Subtitle | Subtitle input | Muted line under the title |
| 5 | Description | Description textarea | "Descrição" block (preserves line breaks) |
| 6 | Price | Price input | "Preço" fact (or "sob consulta" when empty) |
| 7 | Tags | Tags input | "Tags" block as `#tag` badges |
| 8 | Contact mode | Contact section (inherit / custom) | Contact card mode badge |
| 9 | Custom phone + call toggle | Contact custom fields | Phone + calls-on/off line in contact card |
| 10 | **CTA primary + secondary** | CTA section (type + **name** + URL) | **CTA summary block**: each target shows type, name, destination + an "open" link |
| 11 | Cover image | Image card cropper | 4:3 cover on the right |
| 12 | Verified badge | Trust card checkbox | "Verificado" badge near status |

---

## Test Cases for Manual Verification

### Case 1: CTA name + provider info-view round-trip (the fixed defect)
- **Context**: CTA was authorable but never rendered on detail, and a target had
  no author-given name. CTA targets now carry an optional **name**; the provider
  detail shows each target as inspectable facts (type + name + destination) plus
  an "open" link — NOT a generic sell button.
- **Steps**:
  1. Create a new announcement. In the CTA section add a **primary** target of
     type **Website** with name `Cardápio` and a valid URL
     (e.g. `https://example.com`), and one **secondary** target of type
     **WhatsApp** with no name and no value.
  2. Save, then open the announcement's detail page.
  3. Verify the CTA summary shows the primary row with: the **type** (Site /
     Cardápio), the **name** "Cardápio", the **destination** URL as text, and an
     "Abrir destino" link that opens the URL. The provider can read the config
     without clicking.
  4. Verify the secondary WhatsApp row shows "Sem nome personalizado" and a
     destination that resolves to the inherited contact number ("Usa seu número
     de contato"), with a working open link.
  5. Edit, change the primary name to `Ver Instagram` + type Instagram + valid
     URL, remove the secondary, save. Re-open detail and confirm the row reflects
     the new name/type/URL and the secondary is gone.
  6. Edit again, remove the primary entirely, save. Verify the CTA summary block
     disappears cleanly (no empty heading, no error).

### Case 2: Each CTA target type resolves + name fallback
- **Steps**: For each primary type — `provider_profile`, `website`, `instagram`,
  `tiktok`, `whatsapp` — set it (leave name empty for some, fill it for others),
  save, open detail, and confirm:
  - When a **name** is set, the row and the open link reflect it.
  - When the name is empty, the row falls back to the type word.
  - `provider_profile` destination → `/providers/<id>`.
  - `website` / `instagram` / `tiktok` open the entered URL in a new tab.
  - `whatsapp` (no explicit value) resolves to `wa.me/...` using the inherited
    contact phone as fallback.

### Case 2b: Public surface uses the configured name
- **Context**: Everything configured in the provider view is what the public
  view renders. On the public surface the CTA is just a button.
- **Steps**:
  1. Configure a primary CTA with name `Cardápio` and publish/activate it.
  2. Open the public announcement page (`/anuncios/<id>`).
  3. Verify the public CTA **button text** reads `Cardápio` (not "Acessar site").
     Clearing the name later makes the public button fall back to the type word.

### Case 3: Contact parity (inherit vs custom)
- **Steps**:
  1. Create with contact mode **inherit**. On detail, confirm the contact card
     shows the "herdado" badge and the provider's default phone.
  2. Edit to **custom** with a different phone and toggle calls ON. On detail,
     confirm the "personalizado" badge, the custom phone, and "ligações ativas".
  3. Toggle calls OFF, save, confirm the detail flips to calls-off copy.

### Case 4: Full non-CTA field sweep
- **Steps**: Walk the Field Parity Matrix rows 1–9, 11, 12. For each, set a
  distinctive value on create, verify it on detail, then change it on edit and
  verify the detail reflects the change. Confirm:
  - Empty subtitle / empty price / empty tags render gracefully (hidden block or
    "sob consulta"), not as blank labels or `undefined`.
  - Description line breaks are preserved.
  - Verified badge only available when the assignment type is `RESIDENT`.

### Case 5: i18n parity
- **Steps**: Toggle the app language between PT and EN. Re-open a detail page with
  a configured CTA + custom contact. Verify every label (facts, contact card, CTA
  buttons, section headings) is translated with no raw key strings showing.

### Case 6: Not-found / fail-closed
- **Steps**: Navigate to `/panel/provider/announcements/does-not-exist`. Verify a
  not-found toast fires and you are redirected to the announcements list.

---

## Acceptance

- [ ] Every row of the Field Parity Matrix is verified present on detail.
- [ ] CTA primary, secondary, and "no CTA" states all render correctly.
- [ ] Create→detail and edit→detail produce identical, consistent values.
- [ ] PT/EN both clean (no raw i18n keys).

---

## Sub-Tasks

### ST-01 - Detail field-parity manual sign-off

status: done

what-to-do:
- Execute the Field Parity Matrix and all cases above, including CTA name +
  provider info-view and public name behavior.

verification:
- Tester confirmed CTA visibility fix and full create/edit→detail parity
  (functional verification complete, 2026-06-23).

<!-- INDEX SYNC: After completing or modifying any child task file, run
.plan/helper-scripts/sync-state.sh and update the parent epic.md checklist and
.plan/index.md in the same turn. -->
