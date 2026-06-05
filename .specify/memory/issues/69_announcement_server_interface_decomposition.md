# Announcement Server Interface Decomposition

## Parent

Issue 65: Whole Codebase Review Remediation Backlog

## What to build

Deepen the backend `Announcement` seam by decomposing the oversized server interface into narrower modules grouped by domain capability.

This slice should preserve behavior while making the server easier to navigate, test, and evolve.

## Problem

The current announcement server seam is too broad. It bundles multiple capabilities into large modules, including:

- public browsing
- provider dashboard flows
- payments
- analytics
- moderation
- reports
- categories

That produces shallow interfaces and oversized files such as:

- `apps/server/src/presentation/routers/announcement.ts`
- `apps/server/src/infrastructure/db/announcement-repository.ts`

## Decomposition target

Group by shared seam rather than file count. A reasonable target split is:

- Public Announcement
- Provider Announcement Dashboard
- Moderation Queue
- Shared internal policy helpers where real reuse exists

## Acceptance criteria

- [ ] Production behavior remains unchanged unless a separately approved behavior fix is documented.
- [ ] Router and repository interfaces are decomposed by domain capability, not arbitrary helper extraction.
- [ ] Files touched in the slice move materially closer to the local 300-line rule.
- [ ] Focused tests continue to cover public announcement, provider dashboard, payment, moderation, and reporting behavior.
- [ ] `bun run check`, `bun run check-types`, and relevant focused tests pass.

## Blocked by

- Issue 68 should land first because provider-profile reads are part of the public announcement branding path.

## Progress notes

- 2026-06-05: Created from the whole-codebase architecture review. This is intentionally a seam-deepening issue, not a one-file extraction exercise.
- 2026-06-05: Iteration 2 extracted the public announcement seam into dedicated router and repository public modules. Public browse behavior stayed unchanged under focused public router and use-case coverage plus full `bun run test`, `bun run check-types`, and `bun run check`.
- 2026-06-05: Iteration 3 extracted the provider-owned announcement seam into dedicated router and repository provider modules, covering create/update, dashboard/analytics, and payment entrypoints while leaving moderation/reporting behavior unchanged. `announcement.ts` and `announcement-repository.ts` both now meet the local 300-line rule or move materially closer, and focused provider/payment tests plus full `bun run test`, `bun run check-types`, and `bun run check` passed.
- 2026-06-05: Remaining work is still provider dashboard, payment, moderation, and reporting decomposition. Issue 69 stays open.
