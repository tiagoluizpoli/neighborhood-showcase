---
type: future-grilling-session
date: 2026-06-18
status: completed
group: panel-shell-layout-and-navigation
source_session: ./00-umbrella-intake-and-audit.md
---

# Future Grilling Session 01 — Panel Shell, Layout, and Navigation Polish

## Why this exists
This packet isolates cross-panel shell problems that affect many pages at once. The point is to define the shared frame rules first, instead of re-deciding spacing, sidebar chrome, and language consistency in every later grill.

## Scope boundary
In scope:
- sidebar behavior and sidebar header/top treatment
- canonical panel width, padding, and frame consistency across provider surfaces
- cross-surface language/style consistency where it affects the shell and navigation feel
- shared announcement/card primitives only at the level needed to keep the shell visually coherent

Out of scope for this packet:
- deep announcement authoring model
- account-page IA
- provider-profile branding decisions
- moderation reporting workflow

## Included issues

### 1) Sidebar collapse button is broken
Issue:
- The user reported the sidebar collapse button no longer works.
Why it matters:
- This is a shell-level regression, not a page-local annoyance.
Source:
- User intake batch 1.
Likely surfaces:
- global panel shell
Likely code references:
- `apps/web/src/routes/panel.tsx`

### 2) Sidebar header/top area is too weak visually
Issue:
- The top/sidebar header is described as too simple and underdesigned.
Why it matters:
- The user experiences this on every authenticated panel route, so weak shell chrome drags the whole panel down.
Source:
- User intake batch 1.
Likely code references:
- `apps/web/src/routes/panel.tsx`

### 3) Dashboard spacing is the reference, but sibling provider pages drift from it
Issue:
- The dashboard is considered the correct reference for spacing/padding.
- My Announcements and Configurations were called out as having extra side padding and worse use of space.
Why it matters:
- This is the user's explicit canonical reference rule for later visual remediation.
Source:
- User intake batch 1.
Likely code references:
- `apps/web/src/routes/panel.dashboard.*`
- provider routes under the dashboard namespace

### 4) Cross-surface announcement presentation is inconsistent
Issue:
- The user called out multiple different announcement displays across dashboard, detail, and public profile surfaces.
- The user suspects the app is effectively creating a different component or different display logic in each place.
Why it matters:
- Even before detailed card redesign, grilling needs a decision on whether one shared primitive should exist and where variant boundaries actually are.
Source:
- User intake batch 1.
Likely related packets:
- `04-provider-dashboard-and-announcement-cards.md`
- `05-announcement-detail-edit-and-analytics.md`
- `03-provider-configuration-and-public-profile.md`

### 5) Mixed PT/EN language/style strata still leak through some journeys
Issue:
- The overnight audit found that some panel/public surfaces still feel partially localized, partially hardcoded.
Evidence already captured:
- Autonomous audit A-011:
  - several provider/public strings are hardcoded in Portuguese inside route components
  - sidebar/public navigation mixes PT and EN labels in visible surfaces
Why it matters:
- This is a shell-quality issue because it affects the coherence of the navigation and cross-route experience.
Likely code references:
- `apps/web/src/routes/panel.tsx`
- `apps/web/src/routes/_portal.providers.$id.tsx`
- route components with hardcoded labels

## Context the grilling session should assume
- The dashboard is the user-declared visual benchmark for panel spacing.
- The user is not asking for decorative redesign in isolation; they want shell consistency that supports later implementation work.
- This packet should avoid accidentally re-solving announcement authoring or provider-profile domain questions.

## Evidence summary
- User intake batch 1 established the shell complaints and the dashboard-as-reference rule.
- Autonomous audit A-011 confirmed localization/style inconsistency beyond raw perception.

## Exact code excerpt references

### Excerpt A — the shell owns both sidebar state and the top-bar trigger, so the collapse problem almost certainly lives in the shared panel layout
File:
- `apps/web/src/routes/panel.tsx`
Relevant lines:
- 344-365
- 471-486
Excerpt:
```ts
const [sidebarOpen, setSidebarOpen] = React.useState(
  localStorage.getItem('sidebar:state') !== 'false',
);

return (
  <SidebarProvider
    defaultOpen={sidebarOpen}
    onOpenChange={(open) => {
      setSidebarOpen(open);
      localStorage.setItem('sidebar:state', String(open));
    }}
  >
```
```ts
<header className="flex h-14 items-center justify-between border-b bg-card px-4">
  <div className="flex items-center gap-2">
    <SidebarTrigger />
  </div>
  <div className="flex items-center gap-2">
    <ThemeCycleToggle />
    <LanguageSwitcher />
  </div>
</header>

<main className="flex-1 overflow-y-auto bg-background p-6">
  <Outlet />
</main>
```
Why this excerpt matters:
- It proves the collapse interaction is centralized in the shared shell, not scattered across child pages.
- It also grounds the user's complaint that the top area is visually thin: the header is basically trigger + two tiny controls.

### Excerpt B — the sidebar brand/header area is currently just text with no stronger information hierarchy or utility
File:
- `apps/web/src/routes/panel.tsx`
Relevant lines:
- 370-378
Excerpt:
```ts
<Sidebar collapsible="icon">
  <SidebarHeader className="flex h-14 items-center border-b px-4">
    <span className="truncate font-bold text-sm group-data-[collapsible=icon]:hidden">
      Neighborhood Showcase
    </span>
    <span className="hidden font-bold text-sm group-data-[collapsible=icon]:block">
      NS
    </span>
  </SidebarHeader>
```
Why this excerpt matters:
- It gives a concrete anchor for the “too simple / underdesigned” complaint.
- There is almost no hierarchy, context, or visual richness in the sidebar header beyond brand text.

### Excerpt C — My Announcements uses a broad full-width shell with `px-6 py-8`
File:
- `apps/web/src/routes/panel.dashboard.announcements.index.tsx`
Relevant lines:
- 130-146
Excerpt:
```ts
return (
  <div className="w-full space-y-8 px-6 py-8">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 className="font-bold text-3xl text-foreground tracking-tight">
          {t('meus_anuncios.page_title')}
        </h1>
        <p className="mt-1 text-muted-foreground text-sm">
          {t('meus_anuncios.page_subtitle')}
        </p>
      </div>
```
Why this excerpt matters:
- It anchors one of the user-called routes in a concrete frame pattern.
- This can be compared directly against other provider routes when deciding the canonical shell rule.

### Excerpt D — New Announcement uses a completely different centered `max-w-4xl` shell
File:
- `apps/web/src/routes/panel.dashboard.announcements.new.tsx`
Relevant lines:
- 214-237
Excerpt:
```ts
return (
  <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-8">
    <div className="flex items-center space-x-4">
      <Button
        variant="outline"
        size="icon"
        onClick={() => navigate({ to: '/panel/dashboard' })}
      >
```
Why this excerpt matters:
- It is direct evidence of shell drift relative to sibling provider pages.
- The future grill should not waste tokens debating whether shell inconsistency is real.

### Excerpt E — the dashboard wrapper itself is minimal, meaning route-level pages are deciding their own shells
File:
- `apps/web/src/routes/panel.dashboard.tsx`
Relevant lines:
- 61-66
Excerpt:
```ts
function DashboardLayoutComponent() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Outlet />
    </div>
  );
}
```
Why this excerpt matters:
- It shows there is no stronger shared dashboard content container enforcing width/padding consistency.
- That helps explain why sibling routes drift into different layout idioms.

### Excerpt F — language/style inconsistency is real because visible route copy is still hardcoded in Portuguese in multiple surfaces
Files:
- `apps/web/src/routes/panel.dashboard.announcements.new.tsx`
- `apps/web/src/routes/_portal.providers.$id.tsx`
Relevant lines:
- `panel.dashboard.announcements.new.tsx` 225-229
- `_portal.providers.$id.tsx` 159-160, 198, 261-264
Excerpt:
```ts
<h1 className="flex items-center gap-2 font-bold text-2xl text-foreground tracking-tight">
  Novo Anúncio <Sparkles className="h-5 w-5 text-warning" />
</h1>
<p className="text-muted-foreground text-sm">
  Crie um rascunho da sua oferta e publique para seus vizinhos.
</p>
```
```ts
<p className="text-muted-foreground text-sm">
  Carregando perfil do prestador...
</p>
...
<span>Voltar para a vitrine</span>
```
Why this excerpt matters:
- It pins the audit finding to exact visible strings.
- This is not merely “some translation debt in the repo”; it reaches user-facing shell and navigation-adjacent copy.

## Bullseye context for the future grilling session
- The real problem is not one broken button or one page with bad padding.
- The real problem is that the shared shell is visually weak and too permissive, so child routes invent their own width, padding, and copy conventions.
- The code already proves there is a central shell for sidebar/header behavior but no strong content-shell rule for dashboard children.
- Future grilling should focus on defining the canonical shell contract, not rediscovering that inconsistency exists.

## Likely code areas to inspect during grilling
- `apps/web/src/routes/panel.tsx`
- `apps/web/src/routes/panel.dashboard.tsx`
- `apps/web/src/routes/panel.dashboard.announcements.index.tsx`
- `apps/web/src/routes/panel.dashboard.announcements.new.tsx`
- configuration route component under the provider dashboard namespace

## Risks / ambiguity to resolve in grilling
- Whether the card inconsistency belongs mostly here or mostly in the card-specific packet.
- Whether shell fixes can be done by shared layout primitives alone or require route-level restructuring.
- Whether mixed-language cleanup should be treated as a shell cleanup or a broader codebase sweep.
- Whether the sidebar collapse bug is state wiring, component API drift, or something visual that only appears broken.

## Suggested first 5 grilling questions
1. What is the canonical provider-panel shell contract for width, padding, header treatment, and content framing?
2. Should the dashboard namespace own a shared content container so child pages stop inventing their own layout shells?
3. What should the sidebar header and top bar communicate visually beyond the bare minimum they do today?
4. Which announcement surfaces must share the same frame/card primitives, and where are variant boundaries actually allowed?
5. How strict do we want to be about eliminating raw hardcoded PT/EN visible strings from panel/public shell-adjacent surfaces in this pass?

## What grilling should decide
- The canonical frame rule for provider routes: width, padding, and layout constraints.
- Whether sidebar/header chrome needs polish only or a stronger redesign.
- Which announcement/card surfaces must share the same primitive to keep the panel visually coherent.
- How much localization consistency must be enforced immediately vs later.

## Grilling completion
- Completed on: 2026-06-19
- Live grilling file: `.plan/grilling/2026-06-19-01-panel-shell-layout-and-navigation-grilling.md`
- Handoff file: `.plan/handoffs/grill-to-prd-panel-shell-layout-and-navigation.md`
- Outcome summary:
  - One canonical shared content container owns provider-route width/padding; child routes stop inventing their own shells.
  - Container is one primitive with explicit variants: `default/list`, `centered-form`, `full-bleed`.
  - Stronger (not redesigned) sidebar/top-bar chrome: header gains section/condo context + utility; top bar gains section title/breadcrumb.
  - One shared announcement primitive now (`dashboard-card`/`detail-header`/`public-card`); deep tuning deferred to packets 04/05/03.
  - Localization scoped to shell/nav-adjacent surfaces this pass; full PT/EN sweep deferred to a dedicated i18n task.
  - Sidebar collapse regression handled as an implementation-level fix captured in the handoff.
