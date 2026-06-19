---
type: future-grilling-session
date: 2026-06-18
status: queued
group: account-security-and-preferences
source_session: ./00-umbrella-intake-and-audit.md
---

# Future Grilling Session 02 — Account, Security, and Preferences

## Why this exists
This packet isolates Conta/Account issues so the grill can define one coherent account IA instead of mixing it with provider concerns.

## Scope boundary
In scope:
- account-page information architecture
- tab/section split between profile, preferences, security, and danger zone
- avatar control lifecycle
- phone/language input behavior
- the product meaning of showing active vs placeholder sections in this page

Out of scope for this packet:
- provider profile / branding fields
- provider capability gating
- announcement authoring

## Included issues

### 1) Account page is overcrowded and likely needs tabs
Issue:
- The user explicitly said the account page feels weird because everything is under the same page.
- Preferences, Security, and Danger Zone were all called out as better candidates for separate tabs.
Why it matters:
- This is the top-level IA decision for the whole account surface.
Source:
- User intake batch 2.

### 2) Preferences should be isolated from profile editing
Issue:
- Preferences are currently mixed into the same surface instead of clearly separated.
Why it matters:
- The user wants focused, lower-cognitive-load editing surfaces.
Source:
- User intake batch 2.
Likely code references:
- `apps/web/src/routes/panel.account.tsx`
- `apps/web/src/components/account-page/profile-preferences.tsx`

### 3) Security and Danger Zone placement are wrong
Issue:
- The user asked for both Security and Danger Zone to live under separate tabs.
- Overnight audit A-005 confirmed the screen still mixes live settings, placeholders, and destructive actions in one place.
Evidence already captured:
- `/panel/account` shows working profile/preferences on the left while the right side contains `Security` cards marked `Coming soon` above `Danger Zone`.
Why it matters:
- The current page communicates an unfinished product and weak task grouping.
Likely code references:
- `apps/web/src/routes/panel.account.tsx`
- `apps/web/src/components/account-page/security-danger.tsx`

### 4) Avatar management is incomplete after upload
Issue:
- After adding an image, the user can remove it but cannot clearly replace it or re-crop it.
- The user wants at least remove, replace/upload new, and re-crop existing image.
Why it matters:
- This is not just polish; it is an incomplete state machine for a primary identity control.
Source:
- User intake batch 2.
Likely code references:
- `apps/web/src/components/image-upload-field.tsx`
- image-upload usage inside account profile section

### 5) Phone input should use a mask, and self-view should not anonymize it
Issue:
- The user wants masked formatting for phone input.
- They also explicitly do not want anonymized phone detail on self-edit screens.
Why it matters:
- This impacts both usability and trust in the account form.
Source:
- User intake batch 2.
Likely code references:
- `apps/web/src/components/account-page/profile-preferences.tsx`
- server/client DTO shape for the user profile if formatting decisions are persisted or normalized

### 6) Language selector should show human names, not raw codes
Issue:
- The selected value showing `PT-BR` was explicitly called out as wrong.
- The user wants human-readable names both in the closed state and in the dropdown options.
Why it matters:
- This is a concrete UX defect, not a vague preference.
Evidence already captured:
- `apps/web/src/components/account-page/profile-preferences.tsx` currently uses `SelectItem value="pt-BR"` and `SelectValue`, which makes the selected state a likely place for raw-code leakage depending on item rendering.
Likely code references:
- `apps/web/src/components/account-page/profile-preferences.tsx`
- i18n translation keys for account language labels

## Context the grilling session should assume
- The account page already exists and is functionally partly working.
- The user is not asking to remove security/danger-zone concepts; they are asking for a cleaner IA.
- The overnight audit already confirms the page has a “half-finished” feel even after prior cleanup.

## Evidence summary
- User intake batch 2 captured the structural complaints and concrete control problems.
- Autonomous audit A-005 validates that the current live screen still mixes active, deferred, and destructive sections in one surface.

## Exact code excerpt references

### Excerpt A — the account page is literally laid out as one big two-column surface with profile/preferences on the left and security/danger on the right
File:
- `apps/web/src/routes/panel.account.tsx`
Relevant lines:
- 138-191
Excerpt:
```ts
return (
  <div className="space-y-8">
    <header className="space-y-1">
      <h1 className="font-bold text-3xl text-foreground tracking-tight">
        {t('account.page_title')}
      </h1>
      <p className="text-muted-foreground text-sm">
        {t('account.page_subtitle')}
      </p>
    </header>

    <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
      <div className="space-y-6">
        <AccountProfileSection ... />
        <AccountPreferencesSection ... />
      </div>

      <div className="space-y-6">
        <AccountSecuritySection />
        <AccountDangerZoneSection ... />
      </div>
    </div>
```
Why this excerpt matters:
- It directly grounds the user's “everything is on one page” complaint.
- The future grilling session should not waste tokens asking whether the IA is actually mixed; the composition is explicit.

### Excerpt B — security is present as visible placeholder cards marked “coming soon” on the same page as real settings
File:
- `apps/web/src/components/account-page/security-danger.tsx`
Relevant lines:
- 28-49
- 141-149
Excerpt:
```ts
export function AccountSecuritySection() {
  ...
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('account.section_security')}</CardTitle>
        <CardDescription>{t('account.section_security_help')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <SecurityCard
          badge={t('account.coming_soon')}
          description={t('account.security_password_desc')}
          title={t('account.security_password')}
        />
        <SecurityCard
          badge={t('account.coming_soon')}
```
```ts
function SecurityCard({ badge, description, title }: SecurityCardProps) {
  return (
    <div className="rounded-lg border border-border bg-muted/50 p-4">
      <p className="font-medium text-foreground text-sm">{title}</p>
      <p className="mt-1 text-muted-foreground text-xs">{description}</p>
      <span className="mt-2 inline-block rounded bg-muted px-2 py-0.5 text-muted-foreground text-xs">
        {badge}
      </span>
    </div>
  );
}
```
Why this excerpt matters:
- It proves the page currently mixes real editable sections with explicit placeholder inventory.
- That is exactly the “half-finished” feel the user objected to.

### Excerpt C — danger zone is also visible in the same surface, creating active + placeholder + destructive mixing
File:
- `apps/web/src/components/account-page/security-danger.tsx`
Relevant lines:
- 53-80
Excerpt:
```ts
export function AccountDangerZoneSection({
  onOpenDelete,
}: AccountDangerZoneSectionProps) {
  ...
  return (
    <Card className="border-destructive/20">
      <CardHeader>
        <CardTitle>{t('account.section_danger_zone')}</CardTitle>
        <CardDescription>
          {t('account.section_danger_zone_help')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-xs/relaxed">
          {t('account.danger_zone_lgpd')}
        </p>
        <Button
          className="w-full"
          onClick={onOpenDelete}
          type="button"
          variant="destructive"
        >
```
Why this excerpt matters:
- It sharpens the IA complaint: the same page contains primary profile editing, preferences, placeholder security, and destructive account deletion.
- Future grilling should focus on the right split, not on whether the page currently feels crowded.

### Excerpt D — phone is currently just a plain input with no mask or special self-view treatment
File:
- `apps/web/src/components/account-page/profile-preferences.tsx`
Relevant lines:
- 93-100
Excerpt:
```ts
<div className="space-y-2">
  <Label htmlFor="account-phone">{t('account.field_phone')}</Label>
  <Input
    id="account-phone"
    onChange={(event) => onPhoneChange(event.target.value)}
    placeholder={t('account.field_phone_placeholder')}
    value={phone}
  />
</div>
```
Why this excerpt matters:
- It grounds the user's request for a phone mask in exact current code.
- There is no sign here of formatting, masking, or special handling for self-view.

### Excerpt E — language selection uses raw values `pt-BR` and `en`, with a generic `SelectValue` trigger
File:
- `apps/web/src/components/account-page/profile-preferences.tsx`
Relevant lines:
- 172-191
Excerpt:
```ts
<Select
  value={language}
  onValueChange={(value) =>
    onLanguageChange(value as AccountLanguage)
  }
>
  <SelectTrigger className="w-full md:w-56">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="pt-BR">
      {t('account.preference_language_pt')}
    </SelectItem>
    <SelectItem value="en">
      {t('account.preference_language_en')}
    </SelectItem>
  </SelectContent>
</Select>
```
Why this excerpt matters:
- It gives an exact anchor for why `PT-BR` may leak into the closed-state display.
- The future grill does not need to speculate; the value model itself uses raw codes.

### Excerpt F — avatar/image control in account profile is delegated to the generic image field component
Files:
- `apps/web/src/components/account-page/profile-preferences.tsx`
- `apps/web/src/components/image-upload-field.tsx`
Relevant lines:
- `profile-preferences.tsx` 69-77
- `image-upload-field.tsx` 197-223, 237-250
Excerpt:
```ts
<ImageUploadField
  aspectRatio={1}
  circular
  helpText={t('account.field_avatar_help')}
  label={t('account.field_avatar')}
  onChange={onImageChange}
  value={image}
/>
```
```ts
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
```ts
{isCroppingOpen && (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/85 p-4">
    ...
    <h4 className="font-bold text-foreground text-lg">
      Adjust Image
    </h4>
```
Why this excerpt matters:
- It proves account avatar behavior inherits the same generic image-field lifecycle discussed elsewhere.
- That lifecycle currently emphasizes upload/remove and a generic crop modal, not an explicit replace/re-crop experience once an image exists.

## Bullseye context for the future grilling session
- The real problem is not one awkward selector or one missing phone mask.
- The real problem is that Account currently mixes too many product states and task types into one surface: real editable identity data, preferences, placeholder security, and destructive deletion.
- The code already proves this is a structural IA issue, and it also proves specific control-level defects for phone, language display, and avatar lifecycle.
- Future grilling should focus on the correct account information architecture and control contracts, not rediscovering that the page feels muddled.

## Likely code areas to inspect during grilling
- `apps/web/src/routes/panel.account.tsx`
- `apps/web/src/components/account-page/profile-preferences.tsx`
- `apps/web/src/components/account-page/security-danger.tsx`
- `apps/web/src/components/image-upload-field.tsx`

## Risks / ambiguity to resolve in grilling
- Whether tabs are definitely the final IA, or whether cards/accordions would be enough.
- Whether “Coming soon” security cards should remain visible at all.
- Whether avatar replace/re-crop should happen inline or through a dedicated modal/stepper.
- Whether phone formatting is purely presentational or should be normalized/stored in a stricter way.

## Suggested first 5 grilling questions
1. What is the correct information architecture for Account: tabs, route segments, or a simpler split with one default area and secondary areas?
2. What belongs on the default first-visible account surface, and what should be moved behind a separate tab or section?
3. Should placeholder security capabilities remain visible at all before they are implemented, or should they disappear until real?
4. What is the full expected lifecycle for avatar management: upload, preview, replace, re-crop, remove, and maybe restore?
5. What are the exact display contracts for phone and language controls so they always show human-friendly values to the user?

## What grilling should decide
- Final IA for Account: tabs, sections, or another split.
- What stays on the first/default tab.
- The exact avatar lifecycle and controls.
- Display/format rules for phone and language controls.
