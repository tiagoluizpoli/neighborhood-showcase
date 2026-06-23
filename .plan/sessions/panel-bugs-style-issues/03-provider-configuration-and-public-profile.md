---
type: future-grilling-session
date: 2026-06-18
status: completed
group: provider-configuration-and-public-profile
source_session: ./00-umbrella-intake-and-audit.md
---

# Future Grilling Session 03 — Provider Configuration and Public Profile

## Why this exists
This packet groups provider-branding and public-profile issues that share the same domain model, image UX, and public presentation logic.

## Scope boundary
In scope:
- provider configuration page organization
- profile/logo/banner image management UX
- helper/subtitle translation correctness in provider configuration
- public visibility control placement/weight
- public provider-page composition and identity block structure

Out of scope for this packet:
- provider capability gating / route architecture
- detailed announcement card density rules
- announcement authoring model

## Included issues

### 1) Provider configuration page feels poorly organized overall
Issue:
- The user said the page appears to contain the necessary information, but the overall organization is weird and not well thought out.
Why it matters:
- If the IA is wrong, fixing individual fields will not produce a coherent provider settings surface.
Source:
- User intake batch 1.

### 2) Image management for profile/logo/banner feels awkward and visually weak
Issue:
- Upload opens a centered crop flow, but the post-selection result is described as weirdly stacked.
- The image, URL, and remove button do not feel like a robust system.
Why it matters:
- The page manages provider identity assets, so weak media UX undercuts the public presence itself.
Source:
- User intake batch 1.
Likely code references:
- `apps/web/src/routes/panel/dashboard/configuration.tsx`
- `apps/web/src/components/image-upload-field.tsx`

### 3) Helper subtitles are leaking i18n keys instead of text
Issue:
- The user explicitly saw helper/subtitle raw keys instead of real text.
Why it matters:
- This is a concrete correctness bug in a core settings surface.
Source:
- User intake batch 1.
Likely code references:
- provider configuration translations and field bindings in `apps/web/src/routes/panel/dashboard/configuration.tsx`

### 4) Public visibility control is oversized and badly placed
Issue:
- The user said the public visibility section is too broad, too big, and should be smaller and placed nearer the top.
Why it matters:
- This is a structural information-priority problem, not just spacing polish.
Source:
- User intake batch 1.

### 5) Public provider page feels stretched and compositionally weak
Issue:
- The user described the public provider page as stretched and awkward.
- They suggested using mature public-profile patterns as reference.
Why it matters:
- This is the public-facing provider identity surface.
Source:
- User intake batch 1.

### 6) Public provider page duplicates the identity/avatar block
Issue:
- Overnight audit A-003 confirmed a duplicated identity mark before the provider name.
Evidence already captured:
- Visual audit of `/providers/seed-provider-id` showed two circular identity marks side by side.
- `apps/web/src/routes/_portal.providers.$id.tsx` renders a large logo/avatar block and then always renders a second smaller `Avatar` after it.
Why it matters:
- This is a concrete code-level defect affecting the public hero composition.
Likely code references:
- `apps/web/src/routes/_portal.providers.$id.tsx`

### 7) Public provider page wastes desktop space when branding is minimal
Issue:
- Overnight audit A-004 found the low-branding desktop layout too sparse, with a narrow card parked left and large unused space on the right.
Why it matters:
- The fallback state matters because many providers will have incomplete branding.
Likely code references:
- `apps/web/src/routes/_portal.providers.$id.tsx`

## Context the grilling session should assume
- This packet is about provider identity, branding, and public presentation as one system.
- It should not drift into permission gating, even if public visibility and provider capability sound related.
- The user already dislikes both the provider configuration internals and the public output, which suggests the same domain model may need better presentation rules end to end.

## Evidence summary
- User intake batch 1 captured the organization, image, subtitle, and visibility complaints.
- Autonomous audit A-003 and A-004 added concrete public-page code/visual evidence.

## Exact code excerpt references

### Excerpt A — provider configuration is split into three large vertical cards, with visibility isolated at the bottom
File:
- `apps/web/src/routes/panel/dashboard/configuration.tsx`
Relevant lines:
- 196-213
- 346-454
Excerpt:
```ts
return (
  <div className="w-full space-y-8 px-6 py-8">
    {/* Page Header */}
    <div>
      <h1 className="font-bold text-3xl text-foreground tracking-tight">
        {t('page_title')}
      </h1>
      <p className="mt-1 text-muted-foreground text-sm">
        {t('page_subtitle')}
      </p>
    </div>

    {/* Section 1: Public Profile */}
    <Card>
```
```ts
{/* Section 2: Contact Channels */}
<Card>
...
{/* Section 3: Public Visibility */}
<Card>
  <CardHeader className="border-b pb-4">
    <CardTitle>{t('section_public_visibility')}</CardTitle>
    <CardDescription>{t('field_publicVisibility_help')}</CardDescription>
  </CardHeader>
```
Why this excerpt matters:
- It grounds the user's complaint that visibility feels too large and too low in the page.
- The entire page is a vertical sequence of heavyweight cards, which biases the visibility control toward more visual weight than its actual product importance.

### Excerpt B — helper subtitles rely on translation keys that are currently suspect
File:
- `apps/web/src/routes/panel/dashboard/configuration.tsx`
Relevant lines:
- 208-213
- 348-353
- 451-454
Excerpt:
```ts
<CardHeader className="border-b pb-4">
  <CardTitle>{t('section_public_profile')}</CardTitle>
  <CardDescription>{t('field_publicProfile_help')}</CardDescription>
</CardHeader>
```
```ts
<CardHeader className="border-b pb-4">
  <CardTitle>{t('section_contact_channels')}</CardTitle>
  <CardDescription>{t('field_contactChannels_help')}</CardDescription>
</CardHeader>
```
```ts
<CardHeader className="border-b pb-4">
  <CardTitle>{t('section_public_visibility')}</CardTitle>
  <CardDescription>{t('field_publicVisibility_help')}</CardDescription>
</CardHeader>
```
Why this excerpt matters:
- The user's complaint was specifically about helper/subtitle text leaking raw keys.
- These are the exact binding points where the leaking helper text is sourced.
- Future grilling should not waste tokens debating where the subtitle problem comes from.

### Excerpt C — image upload UX becomes a preview + URL/apply + remove stack, with no explicit replace/re-crop path once a value exists
File:
- `apps/web/src/components/image-upload-field.tsx`
Relevant lines:
- 111-205
Excerpt:
```ts
{/* Preview */}
{value && (
  <div
    className={`relative overflow-hidden rounded-lg border border-border bg-muted ${
      circular ? 'aspect-square w-24 rounded-full' : 'aspect-video w-32'
    }`}
  >
    <img
      src={value}
      alt="Preview"
      className={`h-full w-full object-cover ${circular ? 'rounded-full' : ''}`}
    />
  </div>
)}

{/* Controls */}
<div className="space-y-1.5">
  {urlInput && (
    <div className="flex items-center gap-2">
      <Input ... />
      <Button ...>
        Apply
      </Button>
    </div>
  )}

  {value && (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleRemove}
    >
      Remove
    </Button>
  )}

  {!value && (
    <>
      <Button type="button" onClick={() => fileInputRef.current?.click()} ...>
        Upload image
      </Button>
```
Why this excerpt matters:
- It precisely matches the user's complaint about awkward stacking and weak post-upload controls.
- Once a value exists, the component favors preview + remove, not replace or re-crop.
- For logo/banner, URL input and upload mechanics are mixed into the same narrow control stack.

### Excerpt D — the crop flow is modal and generic, not asset-specific or persistent
File:
- `apps/web/src/components/image-upload-field.tsx`
Relevant lines:
- 211-279
Excerpt:
```ts
{isCroppingOpen && (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/85 p-4">
    <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-card">
      ...
      <h4 className="font-bold text-foreground text-lg">
        Adjust Image
      </h4>
      ...
      <Cropper
        image={selectedImageSrc}
        crop={crop}
        zoom={zoom}
        aspect={aspectRatio}
```
Why this excerpt matters:
- It explains the “opens a centered crop tool” part of the user feedback.
- The flow is generic and technically functional, but it does not establish a robust lifecycle for identity assets after initial upload.

### Excerpt E — public provider hero literally renders two identity blocks side by side
File:
- `apps/web/src/routes/_portal.providers.$id.tsx`
Relevant lines:
- 213-236
Excerpt:
```ts
<div className="flex items-center gap-4">
  {provider.logoUrl ? (
    <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-border bg-card p-3">
      <img
        src={provider.logoUrl}
        alt={`Logo de ${provider.displayName}`}
        className="h-full w-full object-contain"
      />
    </div>
  ) : (
    <Avatar className="h-24 w-24 border border-border">
      <AvatarImage src={provider.avatarUrl ?? undefined} />
      <AvatarFallback className="text-xl">
        {getInitials(provider.displayName)}
      </AvatarFallback>
    </Avatar>
  )}
  <Avatar className="h-14 w-14 border border-border">
    <AvatarImage src={provider.avatarUrl ?? undefined} />
    <AvatarFallback>
      {getInitials(provider.displayName)}
    </AvatarFallback>
  </Avatar>
</div>
```
Why this excerpt matters:
- This is direct proof of the duplicated identity mark problem.
- Future grilling does not need to ask whether duplication exists; it should decide which identity strategy is correct.

### Excerpt F — announcement list on the public page uses a centered card grid that can feel sparse in low-branding layouts
File:
- `apps/web/src/routes/_portal.providers.$id.tsx`
Relevant lines:
- 327-398
Excerpt:
```ts
{announcements.length === 0 ? (
  <Card className="border-dashed">
    ...
  </Card>
) : (
  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
    {announcements.map((announcement) => {
      ...
      return (
        <Link
          key={announcement.id}
          to="/anuncios/$id"
          params={{ id: announcement.id }}
          className="overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/40"
        >
```
Why this excerpt matters:
- It gives the future grill an exact anchor for the public-page density/layout discussion.
- Combined with the hero/header composition, this helps explain why the page can feel stretched when branding is sparse.

## Bullseye context for the future grilling session
- The real problem is not “one helper key is wrong” or “one image button is ugly”.
- The real problem is that provider identity is spread across a weak internal configuration experience and a weak public composition, so the same domain feels underdesigned in both private and public contexts.
- The code already proves two hard defects: subtitle/help binding points are exactly where the issue manifests, and the public hero literally duplicates identity UI.
- Future grilling should focus on the correct identity model, hierarchy, and control lifecycle rather than rediscovering symptoms.

## Likely code areas to inspect during grilling
- `apps/web/src/routes/panel/dashboard/configuration.tsx`
- `apps/web/src/components/image-upload-field.tsx`
- `apps/web/src/routes/_portal.providers.$id.tsx`
- provider-related translation keys

## Risks / ambiguity to resolve in grilling
- Whether image UX can be fixed by interaction polish alone or needs data-model changes.
- Whether public visibility should stay a section, become a compact top-level toggle, or move elsewhere.
- Whether the public provider page should follow a marketplace profile pattern, a social profile pattern, or something narrower.
- Whether avatar/logo/banner should be treated as separate identity roles with different UX, rather than one generic image-field system.

## Suggested first 5 grilling questions
1. What is the intended identity model here: when should the provider be represented by avatar, logo, banner, or some combination of them?
2. How should the provider configuration page be reorganized so public profile, contact channels, and visibility match their true priority and weight?
3. What should the complete image-asset lifecycle be for avatar, logo, and banner: upload, preview, replace, re-crop, remove, and possibly URL usage?
4. Should public visibility remain a full section, or should it become a compact high-priority control near the top of the page?
5. What should the public provider page optimize for first on desktop: identity/branding, contact conversion, active announcements, or some balanced hybrid?

## What grilling should decide
- Final section order and density for provider configuration.
- Image-management interaction model for identity assets.
- Correct weight and placement of public visibility.
- Public provider-page composition rules, including fallback layout behavior.

## Grilling completion
- Completed on: 2026-06-23
- Live grilling file: `.plan/grilling/2026-06-23-03-provider-configuration-and-public-profile-grilling.md`
- Handoff file: `.plan/handoffs/grill-to-prd-provider-configuration-and-public-profile.md`
- Outcome summary:
  - Identity precedence rule (logo→avatar→initials, banner = background only) in one shared helper; removes the duplicated public-hero mark.
  - Image lifecycle: Replace + Re-crop (no re-upload) + Remove; drop URL input; retain ORIGINAL upload for re-crop (backend/schema change).
  - Config IA: identity-first + live identity preview + compact visibility toggle promoted near top.
  - Public page: identity hero → announcements (full-width) → contact; max-width container + compact fallback for sparse branding.
  - i18n leaking-keys issue (#3) closed as already-fixed by the dashboard→provider refactor.
