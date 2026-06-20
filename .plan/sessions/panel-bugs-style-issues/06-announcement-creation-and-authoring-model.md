---
type: future-grilling-session
date: 2026-06-18
status: completed
group: announcement-creation-and-authoring-model
source_session: ./00-umbrella-intake-and-audit.md
---

# Future Grilling Session 06 — Announcement Creation and Authoring Model

## Why this exists
This packet groups new-announcement form UX with deeper announcement-domain questions. The key point is that layout complaints here are tied to data-model limitations, not just field styling.

## Scope boundary
In scope:
- create-page layout and width
- scalable category selection
- structured tags interaction
- price/money input behavior
- contact-channel model
- destination/target model for announcements
- create/edit parity only where it affects authoring completeness

Out of scope for this packet:
- detail-page analytics layout except where parity matters
- provider-profile branding
- role/route gating

## Included issues

### 1) New announcement page is out of pattern with the rest of the panel
Issue:
- The user said the create page should visually align with the other sections and use the whole page instead of a weird centralized form.
- Overnight audit A-010 confirmed the page uses a narrower `mx-auto max-w-4xl` pattern while sibling pages use broader panel layouts.
Why it matters:
- This is both a shell mismatch and a strong signal that the form was designed more like a standalone wizard than a first-class panel page.
Likely code references:
- `apps/web/src/routes/panel.dashboard.announcements.new.tsx`

### 2) Category selection should be database-driven and scalable
Issue:
- The user does not want category selection to stay as a button-only static UI.
- They expect category volume to exceed 100 and therefore require searchable selection behavior.
- Overnight audit A-010 confirmed the page is still using a button grid.
Why it matters:
- This is a domain scalability concern, not just a widget preference.
Likely code references:
- `apps/web/src/routes/panel.dashboard.announcements.new.tsx`
- category fetch/query logic for announcement creation

### 3) Price input should use money semantics, not a plain text field
Issue:
- The user explicitly wants a money mask for the initial price/value field.
- Overnight audit A-010 confirmed price is still a plain input on the create page.
Why it matters:
- Currency is a meaning-rich field; a raw free-text box leaks implementation detail into UX.

### 4) Tags need a richer structured interaction
Issue:
- The user wants a pill/token style input, more space, and a more deliberate interaction model.
- They explicitly referenced the kind of component where chips live inside a textbox.
Why it matters:
- This is both a UX problem and a signal that tags may be first-class authoring metadata, not a throwaway string.

### 5) Contact channels should support both provider defaults and announcement-specific overrides
Issue:
- The user wants all provider-supported channels exposed.
- They also want the announcement to be able to inherit defaults or override them per item.
Why it matters:
- This is a real authoring model question that directly affects DTOs and edit parity.

### 6) Announcement targets should be more flexible than a profile link
Issue:
- The user wants to point an announcement not only to a provider profile, but potentially to a specific Instagram post, TikTok video, website, or similar destination.
Why it matters:
- This changes the meaning of “contact channel” and “call to action” in the announcement system.

### 7) WhatsApp/contact phone is considered primary and mandatory
Issue:
- The user explicitly treated WhatsApp/contact phone as mandatory as the main path between clients and providers.
Why it matters:
- This affects validation and the baseline authoring contract.

### 8) Create/edit capability mismatch is already visible
Issue:
- Overnight audit A-008 confirmed edit fields are much narrower than the implied creation requirements: only category, price, description, image, WhatsApp, Instagram, website, and verified badge.
Why it matters:
- If grilling defines a richer authoring model, it also needs a decision on whether edit parity is required in the same pass.
Likely code references:
- `apps/web/src/routes/panel.dashboard.announcements.new.tsx`
- `apps/web/src/routes/panel.dashboard.announcements.$id.tsx`
- `apps/web/src/routes/panel/-provider-dashboard-edit-form-fields.tsx`

## Context the grilling session should assume
- This packet is not only about beautifying the create form.
- The user is pointing at a broader announcement-authoring model: categories, tags, defaults, overrides, and outbound targets.
- The overnight audit already proved the current implementation is narrower than the user's intended model.

## Evidence summary
- User intake batch 4 contains the strongest raw statement of the intended authoring model.
- Autonomous audit A-008 and A-010 confirm concrete implementation limits in both create and edit flows.

## Exact code excerpt references

### Excerpt A — the page is explicitly constrained to a centered `max-w-4xl` shell
File:
- `apps/web/src/routes/panel.dashboard.announcements.new.tsx`
Relevant lines:
- 214-237
Excerpt:
```ts
return (
  <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-8">
    <div className="flex items-center space-x-4">
      ...
    </div>

    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-6 md:grid-cols-3"
    >
```
Why this excerpt matters:
- It directly grounds the user's complaint that the page feels like a narrow centralized form instead of a first-class panel surface.
- The future grilling session should not waste tokens asking where the “weird centered layout” feeling comes from.

### Excerpt B — category selection is database-fed but rendered as a button grid
File:
- `apps/web/src/routes/panel.dashboard.announcements.new.tsx`
Relevant lines:
- 58-60
- 290-305
Excerpt:
```ts
const { data: backendCategories } = useQuery(
  trpc.announcement.listCategories.queryOptions(),
);
```
```ts
<div className="space-y-2">
  <Label>Categoria</Label>
  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
    {backendCategories?.map((cat) => (
      <Button
        key={cat.id}
        type="button"
        onClick={() => setCategoryId(cat.id)}
        variant={categoryId === cat.id ? 'default' : 'outline'}
        size="sm"
      >
        {cat.name}
      </Button>
    ))}
  </div>
</div>
```
Why this excerpt matters:
- It proves both halves of the issue at once: categories already come from data, but the chosen UI primitive does not scale.
- The grilling should focus on the right selection model, not on whether categories are static.

### Excerpt C — price and tags are still plain text inputs
File:
- `apps/web/src/routes/panel.dashboard.announcements.new.tsx`
Relevant lines:
- 360-385
Excerpt:
```ts
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
  <div className="space-y-2">
    <Label htmlFor="price">Preço Inicial (opcional)</Label>
    <Input
      id="price"
      type="text"
      placeholder="Ex: R$ 45,00"
      value={priceStr}
      onChange={(e) => setPriceStr(e.target.value)}
    />
  </div>

  <div className="space-y-2">
    <Label htmlFor="tags">Tags / Palavras-chave</Label>
    <Input
      id="tags"
      type="text"
      placeholder="Ex: bolo doce festa caseiro"
      value={tagsStr}
      onChange={(e) => setTagsStr(e.target.value)}
    />
    <p className="text-[10px] text-muted-foreground">
      Separe por espaço ou vírgula.
    </p>
  </div>
</div>
```
Why this excerpt matters:
- It grounds the user's request for money mask and richer pill/token input.
- The current implementation still treats both price and tags as low-structure free text.

### Excerpt D — contact model is currently just three explicit fields plus a “one of these is required” validation rule
File:
- `apps/web/src/routes/panel.dashboard.announcements.new.tsx`
Relevant lines:
- 137-140
- 390-435
- 196-200
Excerpt:
```ts
if (!whatsapp.trim() && !instagram.trim() && !website.trim()) {
  toast.error(
    'Forneça pelo menos um meio de contato (WhatsApp, Instagram ou Website).',
  );
  return;
}
```
```ts
<CardContent className="space-y-4">
  ...
  <Label htmlFor="whatsapp">WhatsApp (apenas números com DDD)</Label>
  ...
  <Label htmlFor="instagram">Perfil do Instagram</Label>
  ...
  <Label htmlFor="website">Website / Cardápio Online (link completo)</Label>
```
```ts
contactLinks: {
  whatsapp: whatsapp || undefined,
  instagram: instagram || undefined,
  website: website || undefined,
},
```
Why this excerpt matters:
- It proves the current authoring model has no notion of provider defaults, overrides, or richer outbound target types.
- The future grilling session should focus on modeling, not just field order.

### Excerpt E — tags are flattened from one raw string into a simple parsed array
File:
- `apps/web/src/routes/panel.dashboard.announcements.new.tsx`
Relevant lines:
- 171-175
Excerpt:
```ts
const tags = tagsStr
  .split(/[,\s]+/)
  .map((t) => t.trim().toLowerCase())
  .filter((t) => t.length > 0);
```
Why this excerpt matters:
- It gives an exact anchor for how lightweight the current tags model is in the UI layer.
- This is useful when grilling whether tags are search metadata, display chips, CTA hints, or something richer.

### Excerpt F — create flow currently uploads an image and submits a fairly narrow DTO
File:
- `apps/web/src/routes/panel.dashboard.announcements.new.tsx`
Relevant lines:
- 187-202
Excerpt:
```ts
createMutation.mutate({
  providerAssignmentId: selectedLocationId,
  title,
  subtitle: subtitle || null,
  description,
  priceCents,
  imageUrl,
  categoryId,
  tags,
  contactLinks: {
    whatsapp: whatsapp || undefined,
    instagram: instagram || undefined,
    website: website || undefined,
  },
  showVerifiedBadge: showVerifiedBadge && canVerify,
});
```
Why this excerpt matters:
- It shows the exact current contract the form is designed around.
- This is the core evidence for the user's bigger complaint: the authoring model is narrower than the product they want.

## Bullseye context for the future grilling session
- The real issue is not “the create form needs prettier inputs.”
- The real issue is that the current page reflects a simplified announcement contract: narrow layout, button-grid categories, free-text tags, minimal contact links, and no richer destination/default model.
- The code already proves the page is architected around that narrow contract.
- Future grilling should spend almost no tokens rediscovering that the current model is limited; it should decide what the true announcement authoring model needs to be.

## Likely code areas to inspect during grilling
- `apps/web/src/routes/panel.dashboard.announcements.new.tsx`
- `apps/web/src/routes/panel.dashboard.announcements.$id.tsx`
- `apps/web/src/routes/panel/-provider-dashboard-edit-form-fields.tsx`
- announcement DTOs / server procedures for create and update

## Risks / ambiguity to resolve in grilling
- Whether “contact channels” and “target links” are the same concept or two separate concepts.
- Whether category selection needs a true async combobox now or a staged fallback strategy.
- Whether tags are display metadata, search metadata, or CTA metadata.
- Whether provider defaults should be inherited automatically, opt-in per announcement, or copied into editable local state.

## Suggested first 5 grilling questions
1. What is the canonical announcement authoring model: what entities or concepts should the form really capture beyond title/description/image/category?
2. Are contact channels and destination targets the same thing in this product, or should they be modeled separately?
3. Should announcement contact info inherit provider defaults by default, with optional override, or require explicit per-announcement configuration every time?
4. What is the scalable UX for categories, tags, and money input once this page is treated as a serious authoring surface rather than a simple draft form?
5. How much create/edit parity is mandatory in the same pass if we expand the announcement authoring model now?

## What grilling should decide
- The canonical announcement authoring domain model.
- Required vs optional contact/target types.
- The create-page layout and selection primitives.
- How much create/edit parity must land in the same pass.

## Grilling completion
- Completed on: 2026-06-20
- Live grilling file: `.plan/grilling/2026-06-20-06-announcement-creation-and-authoring-model-grilling.md`
- Handoff file: `.plan/handoffs/grill-to-prd-announcement-creation-and-authoring-model.md`
- Outcome summary:
  - Locked a three-layer authoring model: provider contact defaults, announcement-level contact overrides, and separate CTA targets.
  - Locked WhatsApp as mandatory baseline contact infrastructure, with optional direct-call exposure on the same number and default-plus-override behavior.
  - Locked scalable authoring primitives, core create/edit parity, and an announcement-level optional CTA system with resilient public fallback to contact actions.
