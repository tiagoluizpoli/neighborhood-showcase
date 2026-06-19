---
type: future-grilling-session
date: 2026-06-18
status: queued
group: moderation-condo-context-and-reporting
source_session: ./00-umbrella-intake-and-audit.md
---

# Future Grilling Session 08 — Moderation Condo Context and Reporting

## Why this exists
This packet keeps moderation IA separate from provider/dashboard work so the grill can focus on moderator workflows instead of capability architecture in general.

## Scope boundary
In scope:
- moderator condo-context switching UX
- duplication between global and local condo selectors
- where reported users / reports should live in moderation
- early shape of reporting workflow as needed to place it in the UI

Out of scope for this packet:
- provider-route namespace except where the current overlap creates moderation confusion
- broader admin/system-manager IA
- provider-profile/public-page design

## Included issues

### 1) Moderator condo selector hierarchy is confusing
Issue:
- The user described the selector as acting like a parent of moderation items while also being a sibling, instead of clearly living under moderation.
Why it matters:
- This is a navigation-structure problem, not merely a dropdown styling issue.
Source:
- User intake batch 5.
Likely code references:
- `apps/web/src/routes/panel.tsx`

### 2) Moderation currently has duplicated condo-context controls
Issue:
- Overnight audit A-009 confirmed two condo context surfaces:
  - `CondoSelector` in the sidebar moderation group
  - a second `<select>` in `apps/web/src/routes/panel.moderation.tsx` header for multi-condo moderators
Why it matters:
- This makes the moderation context model ambiguous and easy to desynchronize conceptually.
Likely code references:
- `apps/web/src/routes/panel.tsx`
- `apps/web/src/routes/panel.moderation.tsx`

### 3) Reported users / reports likely need their own dedicated section
Issue:
- The user said reports should likely have their own section.
- They also stressed that the reporting model itself still needs deeper understanding, not just a nav entry.
Why it matters:
- Placement and workflow are coupled here; nav cannot be finalized in isolation.
Source:
- User intake batch 5.

## Context the grilling session should assume
- This packet is moderation-specific, not a general permission packet.
- The user has already distinguished moderation condo-context problems from the broader provider route problem.
- The reporting workflow is intentionally not fully known yet; the point of grilling is to ask good boundary questions, not assume a complete reports product already exists.

## Evidence summary
- User intake batch 5 captured the moderation hierarchy complaint and the need for a dedicated reports section.
- Autonomous audit A-009 confirmed a concrete duplicated-control implementation.

## Exact code excerpt references

### Excerpt A — the sidebar moderation group already embeds a condo selector as a lead item above the moderation links
File:
- `apps/web/src/routes/panel.tsx`
Relevant lines:
- 139-160
Excerpt:
```ts
const GROUP_MODERACAO: SidebarGroupConfig = {
  i18nGroupKey: 'sidebar.group.moderacao',
  Icon: ShieldAlert,
  condition: false,
  leadItem: <CondoSelector />,
  items: [
    {
      i18nKey: 'sidebar.item.condominium_info',
      icon: Building2,
      href: '/panel/moderation/condominium',
    },
    {
      i18nKey: 'sidebar.item.anuncios',
      icon: Megaphone,
      href: '/panel/moderation/announcements',
    },
```
Why this excerpt matters:
- It directly grounds the user's complaint that condo context feels half-parent, half-sibling to moderation navigation.
- The moderation selector is structurally attached to the sidebar group before you even enter the moderation route.

### Excerpt B — the moderation page itself creates a second condo selector in the header for multi-condo moderators
File:
- `apps/web/src/routes/panel.moderation.tsx`
Relevant lines:
- 222-253
Excerpt:
```ts
<main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
  <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
    <div>
      <h1 className="font-bold text-3xl text-foreground tracking-tight">
        {t('moderation.title')}
      </h1>
      <p className="mt-1 text-muted-foreground text-sm">
        {currentCondo?.name || t('moderation.subtitle')}
      </p>
    </div>
    {moderatorAssignments.length > 1 && activeSubTab !== 'reports' && (
      <select
        value={selectedCondoId}
        onChange={(e) => {
          setSelectedCondoId(e.target.value);
```
Why this excerpt matters:
- This is the second live condo-context control.
- Future grilling should not waste tokens proving duplication exists; the code is explicit.

### Excerpt C — moderation workflow is split into residents, announcements, and reports sub-tabs, with reports always present
File:
- `apps/web/src/routes/panel.moderation.tsx`
Relevant lines:
- 257-303
Excerpt:
```ts
<div className="mb-8 flex space-x-8 border-border border-b">
  {moderatorAssignments.length > 0 && (
    <>
      <button ...>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          {t('moderation.tab_residents')} ({pendingResidents.length})
        </div>
      </button>
      <button ...>
        <div className="flex items-center gap-2">
          <Megaphone className="h-4 w-4" />
          {t('moderation.tab_announcements')} ({announcements.length})
        </div>
      </button>
    </>
  )}
  <button ...>
    <div className="flex items-center gap-2">
      <ShieldAlert className="h-4 w-4" />
      {t('moderation.tab_reports')} ({reportedAnnouncements.length})
    </div>
  </button>
</div>
```
Why this excerpt matters:
- It proves reports already behave like a first-class moderation section in the current UI.
- That makes the user's “reports probably need their own section” less hypothetical and more about clarifying the final moderation IA.

### Excerpt D — reports are not just a nav label; they already imply a real workflow with detail, dismiss, suspend, and ban actions
Files:
- `apps/web/src/routes/panel.moderation.tsx`
- `apps/web/src/routes/panel/-moderation-reports-queue.tsx`
Relevant lines:
- `panel.moderation.tsx` 371-421
- `-moderation-reports-queue.tsx` 85-123
Excerpt:
```ts
{activeSubTab === 'reports' &&
  (reportedQuery.isPending ? (
    ...
  ) : (
    <ModerationReportsQueue
      ...
      onConfirmDismiss={(announcementId) =>
        dismissReportsMutation.mutate({ announcementId })
      }
      onConfirmSuspend={(announcementId) =>
        suspendMutation.mutate({ id: announcementId, reason: suspensionReason })
      }
      onOpenBan={(announcementId) => {
        setIsBanningUserId(announcementId);
```
```ts
{reportedAnnouncements.length === 0 ? (
  ...
) : (
  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
    {reportedAnnouncements.map((ad) => (
      <ModerationReportsCard
        key={ad.id}
        ad={ad}
        ...
        onConfirmDismiss={onConfirmDismiss}
        onConfirmSuspend={onConfirmSuspend}
        onOpenBan={onOpenBan}
```
Why this excerpt matters:
- It proves reporting is already an operational workflow, not merely an idea.
- Grilling should therefore focus on the right IA and scope boundaries for reports, not on whether reports exist at all.

### Excerpt E — the report cards themselves expose provider identity, reason breakdown, and disciplinary actions in one place
File:
- `apps/web/src/routes/panel/-moderation-reports-card.tsx`
Relevant lines:
- 62-119
- 223-260
Excerpt:
```ts
<Card className="flex flex-col justify-between overflow-hidden border-destructive/20 bg-destructive/5 dark:bg-destructive/10">
  <div className="relative aspect-[4/3] w-full bg-muted">
    <img src={ad.imageUrl} alt={ad.title} className="h-full w-full object-cover" />
    ...
    <span className="rounded-full ...">
      {ad.totalReports} {ad.totalReports === 1 ? 'Denúncia' : 'Denúncias'}
    </span>
  </div>

  <CardContent className="flex flex-1 flex-col justify-between space-y-4 p-5">
    <div className="space-y-3">
      <div className="border-border border-b pb-2">
        <span className="text-muted-foreground text-xs">Prestador:</span>
        <p className="font-semibold text-foreground text-sm">{ad.providerName}</p>
        <p className="text-muted-foreground text-xs">{ad.providerEmail}</p>
      </div>
```
```ts
<div className="flex flex-col gap-2">
  <div className="flex gap-2">
    <Button ...>
      {t('moderation.dismiss')}
    </Button>

    {ad.status !== 'SUSPENDED' && (
      <Button variant="destructive" onClick={() => onOpenSuspend(ad.id)} ...>
        {t('moderation.suspend')}
      </Button>
    )}
  </div>

  {isSystemManager && (
    <Button variant="destructive" onClick={() => onOpenBan(ad.id)} ...>
      {t('moderation.ban')}
    </Button>
  )}
</div>
```
Why this excerpt matters:
- It shows reports currently merge evidence summary, provider context, and moderation actions into the same card.
- That is exactly the kind of workflow complexity the user was pointing at when saying reports need deeper understanding, not just a menu item.

### Excerpt F — tests already treat reports as a meaningful moderation surface with reported titles, counts, reasons, and role-gated ban actions
File:
- `apps/web/src/routes/-moderation.test.tsx`
Relevant lines:
- 157-227
Excerpt:
```ts
mockReportedData = [
  {
    id: 'rep-ad-1',
    title: 'Reported Ad Title',
    ...
    providerName: 'John Spam',
    providerEmail: 'john@spam.com',
    totalReports: 5,
    reasonBreakdown: {
      FRAUDE_GOLPE: 3,
      ASSEDIO_OFENSIVO: 2,
```
```ts
test('displays reported announcements with counts and reasons in reports view', () => {
  ...
  expect(findElementByText(tree, 'Reported Ad Title')).not.toBeNull();
  expect(findElementByText(tree, 'John Spam')).not.toBeNull();
  expect(findElementByText(tree, 'john@spam.com')).not.toBeNull();
  expect(findElementByText(tree, 'Denúncias')).not.toBeNull();
});

test('ban provider button is visible to SYSTEM_MANAGER and hidden from PROVIDER', () => {
  ...
  expect(findElementByText(tree, 'moderation.ban')).not.toBeNull();
```
Why this excerpt matters:
- It proves the codebase already encodes expectations around reports as a real moderation feature.
- Future grilling should use that as a constraint when deciding how reports and reported users should live in moderation.

## Bullseye context for the future grilling session
- The real problem is not only that there are two condo selectors.
- The real problem is that moderation currently mixes context selection, triage navigation, and disciplinary reporting workflow without a clearly declared source of truth for condo context or a clearly settled reports IA.
- The code already proves both duplication of condo-context controls and meaningful existing reports workflow complexity.
- Future grilling should focus on defining the single-source moderation context model and the right home/scope for reports, not rediscovering whether those issues exist.

## Likely code areas to inspect during grilling
- `apps/web/src/routes/panel.tsx`
- `apps/web/src/routes/panel.moderation.tsx`
- `apps/web/src/routes/panel/-moderation-reports-queue.tsx`
- `apps/web/src/routes/panel/-moderation-reports-card.tsx`
- moderation reporting surfaces/components if any exist

## Risks / ambiguity to resolve in grilling
- Whether the sidebar should hold the only condo selector or whether moderation needs a local secondary control for legitimate reasons.
- Whether reports should be one section, multiple sections, or a broader moderation sub-area.
- How much of the reporting workflow must be understood before IA decisions can be made.
- Whether reports should stay announcement-centric, expand to provider/user-centric reporting, or explicitly separate those concerns.

## Suggested first 5 grilling questions
1. What should be the single source of truth for moderator condo context: sidebar-level, page-level, or something else entirely?
2. If a moderator manages multiple condos, where should context switching happen so it feels structurally part of moderation instead of duplicated beside it?
3. What exactly is the information architecture of moderation: residents, announcements, reports, and possibly reported users as separate areas or nested flows?
4. Is the reports workflow fundamentally announcement-centric, provider-centric, or mixed, and how should that shape the UI structure?
5. What minimum reporting-domain understanding do we need before we can safely turn the current reports surface into a stable implementation plan?

## What grilling should decide
- Single-source condo context UX for moderators.
- Placement and scope of reports/reported-users in moderation.
- Minimum reporting-workflow assumptions needed before implementation starts.
