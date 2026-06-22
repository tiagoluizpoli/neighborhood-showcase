---
type: grilling-session-queue
date: 2026-06-18
source_session: ./00-umbrella-intake-and-audit.md
status: queued
entrypoint: true
---

# Panel Bugs / Style Issues — Grilling Queue Index

This file is the single entrypoint for future grilling runs on this topic.

Use this file when starting or resuming any grilling session for the panel bug/style packet backlog.

## Why this exists
- keep the packet backlog in one ordered queue
- let a future agent start from one file only
- prevent token waste from reopening all packets blindly
- enforce packet-by-packet status tracking
- make packet completion visible in both the queue index and the packet file itself

## Critical operating rule
Do not inline all 8 packet files at once.

Read in this order:
1. this index file
2. the first packet marked `in-progress`, if one exists
3. otherwise the first packet marked `queued` in the ordered queue below
4. only read additional packet files if the chosen packet explicitly needs cross-reference

Reason:
- the packet files are already hardened
- loading all of them together would waste tokens
- the right order should control selection, not force full preload

## Required behavior for any future grilling run
When the user points an agent to this file and asks to start grilling:

1. Load and follow `luna-grill-with-docs` and `grill-with-docs`.
2. Read this index file first.
3. Determine the active packet:
   - if any packet is `in-progress`, resume that packet
   - else pick the first `queued` packet by queue order
   - if all packets are `completed`, stop and tell the user the queue is exhausted
4. Inline/read the chosen packet file.
5. Immediately mark the chosen packet as `in-progress` in BOTH places:
   - this index file
   - the chosen packet file frontmatter (`status: in-progress`)
6. Create or resume a live grilling session file under `.plan/grilling/` for that packet.
7. Run the grilling normally using the standard `luna-grill-with-docs` behavior.
8. After every user answer, keep the live grilling file synchronized per the skill rules.
9. When the packet grilling is explicitly finished and stable enough to stop:
   - mark the packet `completed` in this index file
   - mark the packet `completed` in the packet file frontmatter
   - add a short completion note to the packet file
   - if a handoff file was created, record its path in the packet file and in this index
10. On the next grilling request, start again from this index and pick the next packet.

## Packet status contract
Allowed packet statuses:
- `queued` = not started yet
- `in-progress` = currently being grilled or waiting to be resumed
- `completed` = grilling for this packet is done

Status sync rule:
- the index and the packet file must always agree
- do not leave the index saying `queued` while the packet file says `in-progress`
- do not start a second packet while another packet is still `in-progress` unless the user explicitly overrides that behavior

## Packet completion rule
A packet is only `completed` when:
- the grilling session for that packet is explicitly finished
- the key decisions for that packet are captured well enough to support PRD/task work
- the packet file has been updated to reflect that completion

Do not mark a packet completed just because one or two questions were asked.

## Recommended live grilling file naming
For a selected packet, create or resume a grilling file under `.plan/grilling/` using a name like:
- `.plan/grilling/2026-06-18-07-role-access-and-route-architecture-grilling.md`
- `.plan/grilling/2026-06-18-03-provider-configuration-and-public-profile-grilling.md`

Then set the canonical pointer with:
- `.plan/helper-scripts/set-current-grill.sh .plan/grilling/<that-file>.md`

## Queue order
Default order unless the user explicitly reprioritizes:
1. 07-role-access-and-route-architecture.md
2. 01-panel-shell-layout-and-navigation.md
3. 06-announcement-creation-and-authoring-model.md
4. 05-announcement-detail-edit-and-analytics.md
5. 03-provider-configuration-and-public-profile.md
6. 04-provider-dashboard-and-announcement-cards.md
7. 02-account-security-and-preferences.md
8. 08-moderation-condo-context-and-reporting.md

## Queue table
| Order | Packet | Status | Purpose | Live grilling file | Handoff |
| --- | --- | --- | --- | --- | --- |
| 1 | `07-role-access-and-route-architecture.md` | completed | Capability gating, provider-route namespace, default landings, direct-URL protection, legacy-test mismatch | `.plan/grilling/2026-06-18-07-role-access-and-route-architecture-grilling.md` | `.plan/handoffs/grill-to-prd-role-access-and-route-architecture.md` |
| 2 | `01-panel-shell-layout-and-navigation.md` | completed | Cross-panel visual shell consistency, collapse behavior, header treatment, spacing/padding, language/style drift | `.plan/grilling/2026-06-19-01-panel-shell-layout-and-navigation-grilling.md` | `.plan/handoffs/grill-to-prd-panel-shell-layout-and-navigation.md` |
| 3 | `06-announcement-creation-and-authoring-model.md` | completed | New announcement form layout, scalable category selection, money/tags/contact/target model | `.plan/grilling/2026-06-20-06-announcement-creation-and-authoring-model-grilling.md` | `.plan/handoffs/grill-to-prd-announcement-creation-and-authoring-model.md` |
| 4 | `05-announcement-detail-edit-and-analytics.md` | completed | Detail-page composition, edit-mode scope, analytics alignment, missing editable fields | `.plan/grilling/2026-06-21-05-announcement-detail-edit-and-analytics-grilling.md` | `.plan/handoffs/grill-to-prd-announcement-detail-edit-and-analytics.md` |
| 5 | `03-provider-configuration-and-public-profile.md` | queued | Provider config IA, branding/image UX, public visibility placement, public provider page structure | — | — |
| 6 | `04-provider-dashboard-and-announcement-cards.md` | queued | Dashboard/list visual density, shared card system, cross-surface card consistency | — | — |
| 7 | `02-account-security-and-preferences.md` | queued | Account IA, avatar controls, preference UI, security/danger-zone placement | — | — |
| 8 | `08-moderation-condo-context-and-reporting.md` | queued | Moderator condo context UX, duplicated controls, reports/reported-users workflow shape | — | — |

## Packet files
- `07-role-access-and-route-architecture.md`
- `01-panel-shell-layout-and-navigation.md`
- `06-announcement-creation-and-authoring-model.md`
- `05-announcement-detail-edit-and-analytics.md`
- `03-provider-configuration-and-public-profile.md`
- `04-provider-dashboard-and-announcement-cards.md`
- `02-account-security-and-preferences.md`
- `08-moderation-condo-context-and-reporting.md`

## Exact workflow for the next agent
If you are the next agent starting the grill, do this exactly:

1. Read this file.
2. Find the first `in-progress` packet in the queue table.
3. If none exists, find the first `queued` packet in the queue table.
4. Open that packet file.
5. Patch this file so that packet becomes `in-progress`.
6. Patch the packet file frontmatter so `status: in-progress`.
7. Create/resume the matching `.plan/grilling/<date>-<packet>-grilling.md` file.
8. Set current grill pointer.
9. Grill only that packet.
10. When the user explicitly finishes that packet:
   - patch this file to `completed`
   - patch the packet file to `completed`
   - write a short completion note in the packet file
   - record the grilling file path
   - record the handoff path if one exists
11. Stop there. Do not automatically jump into the next packet in the same turn unless the user explicitly asks.

## Completion note format for packet files
When a packet is completed, append a short section like:

```md
## Grilling completion
- Completed on: YYYY-MM-DD
- Live grilling file: `.plan/grilling/<file>.md`
- Handoff file: `.plan/handoffs/<file>.md` or `none`
- Outcome summary:
  - <decision 1>
  - <decision 2>
  - <decision 3>
```

## Notes
- This folder behaves like a grilling backlog, not a PRD folder.
- The master intake context still lives at `./00-umbrella-intake-and-audit.md`.
- The packet files are hardened enough that future grilling should begin from the actual issue, not from generic rediscovery.
- If the user changes priority order, update this index before starting the next packet.
