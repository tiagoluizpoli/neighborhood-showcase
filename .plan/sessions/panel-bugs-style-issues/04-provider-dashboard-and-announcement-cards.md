---
type: future-grilling-session
date: 2026-06-18
status: queued
group: provider-dashboard-and-announcement-cards
source_session: ./00-umbrella-intake-and-audit.md
---

# Future Grilling Session 04 — Provider Dashboard and Announcement Cards

## Why this exists
This packet isolates the visual density and reusable card-system problems on provider overview/list/public-announcement surfaces.

## Scope boundary
In scope:
- card density and compactness
- information hierarchy within announcement cards
- shared card primitive vs per-surface variants
- dashboard/list/public consistency at the card level

Out of scope for this packet:
- detail-page hero/analytics composition
- announcement form fields and authoring model
- provider-profile identity layout

## Included issues

### 1) Announcement cards are too large for the density the product needs
Issue:
- The user said the cards are too big and only one visible card can eat a large portion of the screen.
Why it matters:
- This directly affects browseability and future scalability when the number of announcements grows.
Source:
- User intake batch 1.

### 2) The product needs a more compact browsing surface for heavy announcement volume
Issue:
- The user explicitly framed the current density as something that will be painful when providers push many announcements.
Why it matters:
- This packet should preserve the scale requirement, not just “make the cards prettier.”
Source:
- User intake batch 1.

### 3) Announcement cards are inconsistent across surfaces
Issue:
- The user dislikes the announcement presentation in multiple places and suspects too many one-off displays.
Why it matters:
- Without an explicit decision on shared vs variant card primitives, later implementation will fragment again.
Source:
- User intake batch 1.
Related evidence:
- public provider page and provider routes were both called out as having huge/weird announcement presentation.

## Context the grilling session should assume
- The user wants better density first, not merely decorative restyling.
- This packet is only about list/overview card systems, not the detail-page composition.
- Later packets will handle creation/edit/detail semantics.

## Evidence summary
- User intake batch 1 contains the strongest complaint here: too little information density and too much card size across multiple surfaces.
- The public provider page complaints reinforce that the card inconsistency is not isolated to the private dashboard.

## Exact code excerpt references

### Excerpt A — provider list screens currently use a roomy 3-column grid with large gaps
Files:
- `apps/web/src/routes/panel.dashboard.announcements.index.tsx`
- `apps/web/src/routes/panel/-provider-dashboard-announcement-list.tsx`
Relevant lines:
- `panel.dashboard.announcements.index.tsx` 249-287
- `-provider-dashboard-announcement-list.tsx` 195-218
Excerpt:
```ts
return (
  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
    {items.map((announcement) => (
      <div
        key={announcement.id}
        className="relative"
        data-testid={`meus-anuncios-card-${activeTab}-${announcement.id}`}
      >
        ...
        <ProviderDashboardAnnouncementCard
          ad={announcement}
```
Why this excerpt matters:
- It grounds the density problem in exact layout code.
- A 3-column grid with `gap-6` plus large cards quickly creates the “one card eats the screen” feeling the user described.

### Excerpt B — the provider dashboard card itself is a tall, image-heavy card with large paddings and stacked metadata
File:
- `apps/web/src/routes/panel/-provider-dashboard-announcement-card.tsx`
Relevant lines:
- 37-115
Excerpt:
```ts
<div className="flex flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm">
  <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
    <img
      src={ad.imageUrl}
      alt={ad.title}
      className="h-full w-full object-cover"
    />
    ...
  </div>

  <div className="flex flex-1 flex-col p-5">
    <div className="mb-3">
      <p className="font-semibold text-primary text-xs uppercase tracking-wider">
        {ad.category}
      </p>
      <h4 className="line-clamp-1 font-bold text-foreground text-lg">
        {ad.title}
      </h4>
    </div>

    <p className="mb-4 line-clamp-2 text-muted-foreground text-sm">
      {ad.description}
    </p>

    <div className="mt-auto space-y-2 border-t pt-4">
```
Why this excerpt matters:
- It proves the current card is visually generous by construction: large image, `p-5`, multiple vertical blocks, border-top meta zone.
- The future grill should not waste tokens asking why the cards feel oversized.

### Excerpt C — action area adds even more vertical footprint and makes each card behave like a mini dashboard
File:
- `apps/web/src/routes/panel/-provider-dashboard-announcement-card.tsx`
Relevant lines:
- 126-202
Excerpt:
```ts
<div className="relative z-20 mt-5 flex flex-col gap-2">
  {ad.status === 'DRAFT' && onPay && (
    <button ... className="... py-2.5 ...">
      Publicar Anúncio
    </button>
  )}
  ...
  <div className="flex w-full gap-2">
    {ad.status === 'ACTIVE' && (
      <Link ...>
        <Eye className="h-3.5 w-3.5" />
        Ver Detalhes
      </Link>
    )}
    ...
    <button ...>
      <Edit className="h-3.5 w-3.5" />
      Editar
    </button>
  </div>
</div>
```
Why this excerpt matters:
- This is not a minimal browse card; it is a control-rich operations card.
- That may be valid, but grilling needs to decide whether overview cards should carry this much action density inline.

### Excerpt D — the public provider page uses a completely separate announcement card shape
File:
- `apps/web/src/routes/_portal.providers.$id.tsx`
Relevant lines:
- 334-395
Excerpt:
```ts
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
        <div className="relative aspect-4/3 overflow-hidden bg-muted">
          <img ... />
```
Why this excerpt matters:
- It proves there is already a second card implementation path outside the provider dashboard.
- That is strong evidence for the user's “too many one-off displays” concern.

### Excerpt E — public cards also repeat the roomy image + text-stack formula
File:
- `apps/web/src/routes/_portal.providers.$id.tsx`
Relevant lines:
- 351-393
Excerpt:
```ts
<div className="relative aspect-4/3 overflow-hidden bg-muted">
  <img
    src={announcement.imageUrl}
    alt={announcement.title}
    className="h-full w-full object-cover object-center"
  />
  ...
</div>
<div className="space-y-3 p-4">
  <div className="flex items-start justify-between gap-3">
    ...
  </div>
  {announcement.subtitle ? (
    <p className="text-muted-foreground text-sm">
      {announcement.subtitle}
    </p>
  ) : null}
  <p className="line-clamp-3 text-muted-foreground text-sm leading-6">
    {announcement.description}
  </p>
```
Why this excerpt matters:
- It shows the public card is also designed for roomy presentation rather than compact browse density.
- This helps frame the issue as systemic rather than isolated to the private dashboard card.

### Excerpt F — older provider dashboard list helper also hardcodes tab labels and shares the same large-grid assumptions
File:
- `apps/web/src/routes/panel/-provider-dashboard-announcement-list.tsx`
Relevant lines:
- 43-69
- 195-218
Excerpt:
```ts
<div className="mb-6 border-border border-b">
  <div className="flex space-x-8">
    <TabButton ... label="Ativos" ... />
    <TabButton ... label="Rascunhos & Pendentes" ... />
    <TabButton ... label="Expirados" ... />
    <TabButton ... label="Suspensos" ... />
  </div>
</div>
```
```ts
<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
  {items.length === 0 ? (
    <ProviderDashboardAnnouncementEmptyState ... />
  ) : (
    items.map((ad) => (
      <ProviderDashboardAnnouncementCard
```
Why this excerpt matters:
- It reinforces that the announcement browse system has grown through multiple related but separate layers.
- Future grilling should decide what the canonical card/list contract is instead of letting parallel implementations keep drifting.

## Bullseye context for the future grilling session
- The real problem is not just that one card feels big.
- The real problem is that the browse surfaces are built around roomy, image-first, action-heavy cards across multiple implementations, which fights the product's future announcement volume.
- The code already proves there are separate provider-dashboard and public-provider card paths with similar spacious assumptions.
- Future grilling should focus on the compactness target, canonical card contract, and allowed variants rather than rediscovering that the current cards are large.

## Likely code areas to inspect during grilling
- `apps/web/src/routes/panel/-provider-dashboard-announcement-card.tsx`
- `apps/web/src/routes/panel/-provider-dashboard-announcement-list.tsx`
- `apps/web/src/routes/panel.dashboard.announcements.index.tsx`
- announcement renderers used in public provider routes

## Risks / ambiguity to resolve in grilling
- Whether one card primitive with display variants is enough.
- Which fields are essential above the fold for a compact card.
- How much visual differentiation private vs public cards actually need.
- Whether overview cards should carry operational actions inline or hand off faster into a detail/manage surface.

## Suggested first 5 grilling questions
1. What is the target density standard for announcement browsing when a provider has many active items?
2. Which information must remain visible on a compact card, and which information can move behind detail/manage views?
3. Should private dashboard cards and public provider cards share one core primitive with variants, or are they fundamentally different enough to justify separate implementations?
4. How much inline action affordance should an overview card keep before it becomes a bloated mini-dashboard?
5. What are the allowed card variants in this product, and what responsibilities belong to each one?

## What grilling should decide
- The target compactness standard.
- The minimum viable shared card system.
- Allowed card variants and their responsibilities.
