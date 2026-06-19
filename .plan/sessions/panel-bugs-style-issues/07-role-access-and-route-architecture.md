---
type: future-grilling-session
date: 2026-06-18
status: completed
group: role-access-and-route-architecture
source_session: ./00-umbrella-intake-and-audit.md
---

# Future Grilling Session 07 — Role Access and Route Architecture

## Why this exists
This packet isolates capability gating and route architecture. It is likely the highest-risk structural packet because the current issues are not just UI polish; they reveal mismatched product semantics and tests.

## Scope boundary
In scope:
- provider capability gating
- provider route namespace semantics
- default landing destinations by role/capability
- direct-URL protection and route-group guards
- legacy tests that currently encode product-wrong behavior
- open question of where provider capability is managed/represented

Out of scope for this packet:
- detailed provider configuration IA
- moderation reporting workflow except where route boundaries overlap
- announcement form UX

## Included issues

### 1) Users without provider capability should not see provider areas
Issue:
- The user said non-providers should not see the provider section at all.
- They experienced visible provider entries that then fail at runtime.
Why it matters:
- This is the canonical user-facing symptom of the architecture mismatch.
Source:
- User intake batch 3.
Likely code references:
- `apps/web/src/routes/panel.tsx`

### 2) Hidden navigation does not equal blocked access
Issue:
- Overnight audit A-001 confirmed that a moderator can land on `/panel/dashboard` and see `Painel do Provedor` while the sidebar only shows Moderation.
- The route guard currently accepts any user with some approved assignment, not specifically provider capability.
Evidence already captured:
- `apps/web/src/routes/panel.dashboard.tsx` checks `assignments.some((a) => a.status === 'APPROVED')`.
- `apps/web/tests/dashboard.spec.ts` encodes the mismatch by allowing the moderator to reach `/panel/dashboard` while only deeper provider routes redirect away.
Why it matters:
- This is not a subjective concern; it is a verified route-boundary bug.

### 3) Provider dashboard namespace is acting like a generic panel home
Issue:
- Overnight audit A-002 found that `/panel/dashboard` behaves like a generic authenticated landing instead of a provider-scoped area.
- `panel.moderation.tsx` redirects unauthorized users to `/panel/dashboard`, reinforcing the wrong semantic meaning.
Why it matters:
- This appears to be the architectural root of several user-facing permission weirdness reports.
Likely code references:
- `apps/web/src/routes/panel.dashboard.tsx`
- `apps/web/src/routes/panel.moderation.tsx`

### 4) Admin and system-manager default landings are wrong or underdesigned
Issue:
- The user said admins currently land on the provider dashboard even though the correct destination should be an administration dashboard.
- They also said the current admin/system-manager IA is too generic and not aligned to the role model.
Why it matters:
- This broadens the issue from “provider gating bug” to “panel entry architecture by role.”
Source:
- User intake batch 2.

### 5) The provider capability toggle / state exposure is still unresolved
Issue:
- The user explicitly said there is still no settled decision about where the “is provider” / provider capability control should live visually.
Why it matters:
- Grilling cannot finalize provider-area gating without clarifying where that capability is represented or managed.
Source:
- User intake batch 3.

### 6) Existing tests are partially protecting legacy behavior
Issue:
- Overnight audit A-012 found that `apps/web/tests/dashboard.spec.ts` currently validates part of the mismatch the user wants removed.
Why it matters:
- This packet must treat tests as evidence of current system behavior, not evidence of correct product behavior.
Likely code references:
- `apps/web/tests/dashboard.spec.ts`

## Context the grilling session should assume
- This is not just a UI packet. It may require route renaming, guard redesign, and test rewrites.
- The user has already floated a stronger provider-scoped route namespace such as `panel/provider/dashboard`.
- The packet should explicitly separate “role” from “capability/state” because the user keeps pointing to provider access as state-based rather than purely role-based.

## Evidence summary
- User intake batches 2, 3, and 5 flagged role landing, provider visibility, and direct-URL access problems.
- Autonomous audit A-001, A-002, and A-012 confirmed concrete runtime/code/test mismatches.

## Exact code excerpt references

### Excerpt A — `/panel/dashboard` currently grants access based on broad approved-state checks
File:
- `apps/web/src/routes/panel.dashboard.tsx`
Relevant lines:
- 18-42
Excerpt:
```ts
try {
  if (
    session.data.user.role === 'SYSTEM_MANAGER' ||
    session.data.user.role === 'ADMINISTRATOR'
  ) {
    return;
  }

  // Check if they created an approved condo
  const myCondo = await trpcClient.condominium.myCreated.query();
  if (myCondo && myCondo.status === 'APPROVED') {
    return;
  }

  // Check if they have an approved assignment
  const assignments = await trpcClient.assignment.getMyAssignments.query();
  const hasApprovedAssignment = assignments.some(
    (a) => a.status === 'APPROVED',
  );

  if (!hasApprovedAssignment) {
    throw redirect({
      to: '/panel/dashboard/condo-setup',
    });
  }
}
```
Why this excerpt matters:
- This is the key proof that `/panel/dashboard` is not actually provider-scoped.
- Any approved assignment can satisfy the guard, which matches the user's moderator/direct-URL complaint.

### Excerpt B — moderation fallback redirects to provider dashboard namespace
File:
- `apps/web/src/routes/panel.moderation.tsx`
Relevant lines:
- 31-43
Excerpt:
```ts
if (
  session.data.user.role !== 'SYSTEM_MANAGER' &&
  session.data.user.role !== 'ADMINISTRATOR' &&
  moderatorAssignments.length === 0
) {
  throw redirect({
    to: '/panel/dashboard',
    search: {
      message: 'Página não encontrada',
    },
  });
}
```
Why this excerpt matters:
- It shows the app already treats `/panel/dashboard` like a generic fallback destination.
- That directly reinforces the semantic confusion between “panel home” and “provider area”.

### Excerpt C — tests currently encode the same mismatch
File:
- `apps/web/tests/dashboard.spec.ts`
Relevant lines:
- 76-124
Excerpt:
```ts
test.describe('Sidebar gating', () => {
  test('non-provider does not see the Provedor sidebar group', async ({
    page,
  }) => {
    await signInViaUI(page, MODERATOR_EMAIL, MODERATOR_PASSWORD);
    await page.waitForSelector('[data-sidebar]', { timeout: 10_000 });

    await expect(
      getSidebar(page).getByText(/moderação|moderation/i),
    ).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      getSidebar(page).getByText('Provedor', { exact: true }),
    ).toHaveCount(0);
  });
});

test.describe('Route guards — non-provider redirect', () => {
  test('visiting /panel/dashboard/configuration redirects to /panel/account', async ({
    page,
  }) => {
```
Why this excerpt matters:
- The test suite validates hidden-nav behavior and only guards deeper provider subroutes.
- It never rejects `/panel/dashboard` itself for a non-provider moderator, so the current mismatch is effectively normalized in test coverage.

## Bullseye context for the future grilling session
- The core issue is not “why does one button show up.”
- The core issue is that the app lacks a clean concept of provider-scoped area versus generic panel home.
- The user also wants role defaults corrected: admin/system-manager landings should not piggyback on provider semantics.
- The grilling should avoid wasting tokens on asking whether the problem is real; the code and test evidence already prove it is.

## Likely code areas to inspect during grilling
- `apps/web/src/routes/panel.tsx`
- `apps/web/src/routes/panel.dashboard.tsx`
- `apps/web/src/routes/panel.moderation.tsx`
- `apps/web/tests/dashboard.spec.ts`

## Risks / ambiguity to resolve in grilling
- Whether provider access is a pure capability/state model, a role model, or a hybrid.
- Whether `/panel/dashboard` should remain as an alias, redirect, or disappear entirely.
- Whether admin/system-manager landing design can be deferred while still fixing provider-route semantics cleanly.
- Whether provider capability should be inferred from assignment/provider state only, or also surfaced as an explicit managed flag.

## Suggested first 5 grilling questions
1. What is the canonical semantic meaning of `/panel/dashboard`: generic authenticated home, provider home, or something else entirely?
2. For provider access, do we want a pure state/capability model, a role-based model, or a hybrid rule set?
3. Should non-providers be blocked from the entire provider route group at the top boundary, even when they can guess URLs directly?
4. What should the default landing routes be for administrator, system manager, moderator, and provider-capable user?
5. Where should provider capability be represented and managed so both navigation and route guards can rely on one source of truth?

## What grilling should decide
- Canonical provider capability model.
- Final route namespace and default panel landings.
- Guard rules for route groups vs individual routes.
- Which tests should be rewritten because they encode legacy semantics.

## Grilling completion
- Completed on: 2026-06-18
- Live grilling file: `.plan/grilling/2026-06-18-07-role-access-and-route-architecture-grilling.md`
- Handoff file: `.plan/handoffs/grill-to-prd-role-access-and-route-architecture.md`
- Outcome summary:
  - `/panel/dashboard` is no longer product-canonical; explicit section dashboards are the target architecture.
  - Provider access is a hard-blocked section-scoped capability model backed by one canonical provider-enabled state.
  - Legacy tests and redirects must be rewritten to match the new route semantics and default landings.
