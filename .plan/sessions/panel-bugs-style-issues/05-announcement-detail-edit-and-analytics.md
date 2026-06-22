---
type: future-grilling-session
date: 2026-06-18
status: completed
group: announcement-detail-edit-and-analytics
source_session: ./00-umbrella-intake-and-audit.md
---

# Future Grilling Session 05 — Announcement Detail, Edit, and Analytics

## Why this exists
This packet groups provider-facing detail-page issues so layout, edit-mode scope, and analytics composition can be solved together.

## Scope boundary
In scope:
- detail-page hierarchy
- image hero sizing/placement
- analytics block placement and height
- relationship between view mode and edit mode
- missing editable fields in the current detail flow

Out of scope for this packet:
- create-page field model beyond parity decisions
- provider route gating
- dashboard/list card density

## Included issues

### 1) Detail page has composition and alignment problems
Issue:
- The user reported misalignments on the details page, especially the chart not aligning with the items above.
Why it matters:
- This breaks the visual trust of the main provider-facing management surface.
Source:
- User intake batch 1.
Likely code references:
- `apps/web/src/routes/panel.dashboard.announcements.$id.tsx`
- `apps/web/src/routes/panel/-provider-dashboard-analytics-panel.tsx`

### 2) Metrics / chart area is too tall
Issue:
- The user said the metrics part takes too much vertical space.
Evidence already captured:
- The analytics panel component uses a 320px chart/loading/error height block.
Why it matters:
- Height competition is central because the user wants key information visible immediately.
Likely code references:
- `apps/web/src/routes/panel/-provider-dashboard-analytics-panel.tsx`

### 3) Update flow feels incomplete and may not belong as the same experience as details
Issue:
- The user said “details is details” and questioned whether update should be the same page.
Why it matters:
- This is the main IA decision for the whole detail/edit surface.
Source:
- User intake batch 1.

### 4) Tags are missing from editable controls
Issue:
- The user explicitly called out tags as something they should be able to alter.
- Overnight audit A-007 confirmed the code currently sends `tags: announcement.tags` from original data and provides no tags field in edit controls.
Why it matters:
- This is a concrete edit-capability defect, not a theoretical request.
Likely code references:
- `apps/web/src/routes/panel.dashboard.announcements.$id.tsx`
- `apps/web/src/routes/panel/-provider-dashboard-edit-form-fields.tsx`

### 5) The hero image is too dominant and pushes primary information below the fold
Issue:
- The user does not want to scroll just to reach key announcement information.
- They suggested the image could be beside the information and the metrics below.
Why it matters:
- This is the strongest above-the-fold priority rule for this page.
Source:
- User intake batch 1.

### 6) Debug logging still exists in the production route code
Issue:
- Overnight audit A-006 found `console.log('DEBUG ANNOUNCEMENT DETAIL:', ...)` in the route file.
Why it matters:
- This is a concrete update-quality regression and should color the grilling with a maintenance/polish lens, not only UI taste.
Likely code references:
- `apps/web/src/routes/panel.dashboard.announcements.$id.tsx`

## Context the grilling session should assume
- This page is already trying to do too many things at once: view, analytics, and editing.
- The user likes the idea of having rich information in one place, but not at the cost of hierarchy and edit completeness.
- Tag editing is already proven broken by code inspection.

## Evidence summary
- User intake batch 1 established the layout, image, and edit incompleteness complaints.
- Autonomous audit A-006 and A-007 supplied concrete code evidence.

## Exact code excerpt references

### Excerpt A — debug log still present in the page route
File:
- `apps/web/src/routes/panel.dashboard.announcements.$id.tsx`
Relevant lines:
- 54-58
Excerpt:
```ts
console.log('DEBUG ANNOUNCEMENT DETAIL:', {
  id,
  announcement,
  announcements: dashboardQuery.data?.announcements,
});
```
Why this excerpt matters:
- It proves the route still contains debug residue from the latest update.
- This is a grounded quality/polish defect, not just a taste complaint.

### Excerpt B — route-level provider guard is local and late
File:
- `apps/web/src/routes/panel.dashboard.announcements.$id.tsx`
Relevant lines:
- 79-86
Excerpt:
```ts
useEffect(() => {
  if (
    !assignmentsQuery.isLoading &&
    assignmentsQuery.data &&
    !hasProviderAssignment
  ) {
    void navigate({ to: '/panel/account' });
  }
}, [
```
Why this excerpt matters:
- This page still defends access locally after the route is already entered.
- It reinforces the broader architecture smell: provider scoping is not enforced high enough in the route tree.

### Excerpt C — save path hardcodes original tags instead of editable state
File:
- `apps/web/src/routes/panel.dashboard.announcements.$id.tsx`
Relevant lines:
- 157-173
Excerpt:
```ts
updateMutation.mutate({
  categoryId: form.categoryId,
  contactLinks: {
    instagram: form.instagram || undefined,
    website: form.website || undefined,
    whatsapp: form.whatsapp || undefined,
  },
  description: form.description,
  id: announcement.id,
  imageUrl: form.imageUrl,
  priceCents:
    form.price === '' ? null : Math.round(Number(form.price) * 100),
  showVerifiedBadge: form.showVerifiedBadge && canVerify,
  subtitle: form.subtitle || null,
  tags: announcement.tags,
  title: form.title,
});
```
Why this excerpt matters:
- This is the strongest proof that tags are not really editable.
- Even if a tags field existed visually, this mutation currently ignores editable tag state and preserves old tags.

### Excerpt D — edit form fields omit tags and use a narrow field model
File:
- `apps/web/src/routes/panel/-provider-dashboard-edit-form-fields.tsx`
Relevant lines:
- 13-42 and 73-233
Excerpt summary:
- Props include `categoryId`, `description`, `imageUrl`, `instagram`, `price`, `showVerifiedBadge`, `subtitle`, `title`, `website`, and `whatsapp`.
- The rendered form includes image, title, subtitle, category, price, description, contact fields, and verified badge.
- There is no tags field at all.
Concrete excerpt:
```ts
interface ProviderDashboardEditFormFieldsProps {
  backendCategories: ...
  canVerify: boolean;
  categoryId: string;
  description: string;
  imageUrl: string;
  instagram: string;
  isUploading: boolean;
  price: number | '';
  showVerifiedBadge: boolean;
  subtitle: string;
  title: string;
  website: string;
  whatsapp: string;
  ...
}
```
Why this excerpt matters:
- It proves the edit model is structurally narrower than the user expects.
- Tags absence is not accidental rendering; it is absent from the component contract itself.

### Excerpt E — layout currently gives the image hero and analytics a lot of space
Files:
- `apps/web/src/routes/panel.dashboard.announcements.$id.tsx`
- `apps/web/src/routes/panel/-provider-dashboard-analytics-panel.tsx`
Relevant lines:
- detail route 221-249
- analytics panel 86-101
Excerpts:
```ts
<section className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
  <Card className="overflow-hidden">
    <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
      <img
        src={isEditing ? form.imageUrl : announcement.imageUrl}
        alt={announcement.title}
        className="h-full w-full object-cover"
      />
    </div>
```
```ts
{analyticsQuery.isLoading ? (
  <div className="flex h-[320px] ...">
) : analyticsQuery.isError ? (
  <div className="flex h-[320px] ...">
) : (
  <div className="h-[320px] w-full">
```
Why these excerpts matter:
- They give exact code anchors for the user's “image too dominant” and “metrics too tall” complaints.
- The current composition bakes in a large hero and a fixed-tall analytics block.

## Bullseye context for the future grilling session
- The real question is not “should we tweak some spacing.”
- The real question is whether this page is trying to combine too many responsibilities at once: showcase, management detail, inline editing, and analytics.
- The code already proves two hard defects: debug residue and non-editable tags.
- The future grilling should spend almost no tokens rediscovering whether the page is overloaded; assume it is, and decide how to decompose it.

## Likely code areas to inspect during grilling
- `apps/web/src/routes/panel.dashboard.announcements.$id.tsx`
- `apps/web/src/routes/panel/-provider-dashboard-edit-form-fields.tsx`
- `apps/web/src/routes/panel/-provider-dashboard-analytics-panel.tsx`

## Risks / ambiguity to resolve in grilling
- Whether edit mode should be split into a dedicated route or remain inline.
- Whether analytics should be subordinate, collapsible, or moved elsewhere.
- Which fields are mandatory for true edit parity.
- Whether the page should optimize first for “reading the announcement” or “editing/managing the announcement”.

## Suggested first 5 grilling questions
1. Should announcement details and announcement editing remain the same page, or should editing move to its own dedicated route/surface?
2. What are the exact above-the-fold priorities on this page: primary facts, image, status, actions, metrics, or something else?
3. Which fields are non-negotiable for true edit completeness on this screen, starting with tags?
4. Should analytics be always visible here, visually subordinate, collapsible, or moved to a separate analytics surface?
5. Is this page fundamentally a “showcase/details page with edit affordances” or an “editing workspace with preview/details affordances”?

## What grilling should decide
- One-page vs split-page strategy for details and editing.
- Above-the-fold hierarchy for image, primary facts, and analytics.
- Minimum complete editable field set.
- How analytics should coexist with editing.

## Grilling completion
- Completed on: 2026-06-22
- Live grilling file: `.plan/grilling/2026-06-21-05-announcement-detail-edit-and-analytics-grilling.md`
- Handoff file: `.plan/handoffs/grill-to-prd-announcement-detail-edit-and-analytics.md`
- Already-fixed before grilling (commit d42373d): issue 6 debug log removed; issue 4 tags now fully editable.
- Outcome summary:
  - Split view from edit: `$id` = read-only view, `$id/edit` = edit, `new` = create (provider namespace).
  - One shared `AnnouncementForm` for create + edit, branching on `id`; consolidate onto `panel.provider.*`, delete the `panel.dashboard.*` duplicate and the narrow `ProviderDashboardEditFormFields`.
  - All fields editable in MVP except identity; field-lockability built as a pattern for cheap future freezing (category deferred, stays editable now).
  - View page is facts-first: key facts above the fold, announcement image demoted to a 4:3 cover capped ~280–320px, redundant summary mini-card removed.
  - Analytics below the fold; keep 3 metric cards, shrink chart from 320px to ~200–220px.
  - Provider management view vs public `_portal.anuncios.$id` confirmed separate; public page out of scope.
