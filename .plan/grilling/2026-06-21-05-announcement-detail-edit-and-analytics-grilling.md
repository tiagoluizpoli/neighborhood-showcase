# Grilling Session: Announcement Detail, Edit, and Analytics

Date: 2026-06-21
Status: complete
Source Skill: grill-with-docs
Scope: Packet 05 — provider announcement detail-page composition, view-vs-edit IA, hero image dominance, and analytics block placement/height. Tag-edit and debug-log defects are already fixed in code; this grilling targets the remaining layout/IA decisions.

## Starting Context

- User prompt: "go to that README again and pick up the next task so we can continue our bug fix" → README queue selected packet 05 as the next `queued` item.
- Initial reasoning:
  - Packet evidence dated 2026-06-18 predates commit d42373d (structured category/tags/money primitives). Verified current code first.
  - Already FIXED in code: issue 6 (debug `console.log` removed) and issue 4 (`tags: form.tags` now saved; edit form has `tags` prop + `onTagsChange`). Tags are now fully editable end-to-end.
  - Still LIVE (all layout/IA): issue 1 (composition/alignment), issue 2 (chart `h-[320px]` too tall), issue 3 (edit-same-page IA), issue 5 (hero image too dominant / pushes facts below fold).
  - Current layout: outer grid `lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]`. Left = Card with full-width `aspect-[4/3]` image hero, then header (status/verified/title/subtitle), then nested grid `lg:grid-cols-[minmax(0,1fr)_320px]` (details list + description + contact + tags on left, "summary" mini-card on right). Right outer column = edit form WHEN editing, else the analytics panel. So edit and analytics are already mutually exclusive.
  - Tension: the page mixes showcase, management detail, inline edit, and analytics. The decomposition question (issue 3) is the bullseye and gates the layout questions.

## Process note (added after Q2)
- User rule: surface up to 5 questions per turn, but ONLY mutually independent ones (non-conflicting, non-dependent, non-overlapping). Dependent/overlapping questions stay queued until their gating answer lands. Tracked in memory `grilling-batch-independent-questions`.

## Current Question

(none — grilling complete; all decisions locked, handoff written.)

## Future Questions

(none)

## Answered Questions

### QD
Exact question:
"Analytics chart is a fixed 320px block ('too tall'). Shrink to ~200–220px, keep 320px but collapsible, or keep as-is?"
User answer: "Shrink to ~200px, metrics stay."
Decision / takeaway:
- LOCKED: shrink chart to ~200–220px; keep the 3 metric cards (impressions/interactions/conversion) always visible above it. Resolves issue 2.

### QE
Exact question:
"Right-rail 'summary' mini-card repeats status/contact-count/tag-count. Keep, drop, or repurpose?"
User answer: "Drop it."
Decision / takeaway:
- LOCKED: remove the summary mini-card. Status badge, tag chips, and contact card already carry that info; counts are redundant. Reclaims space for single-column facts-first flow. Resolves the composition half of issue 1.

### QF
Exact question:
"Demoted announcement image cover beside the facts — 4:3 capped ~280–320px, square/16:9 thumbnail, or full-width but short?"
Clarification during answer:
- User asked whether this concerns the provider MANAGEMENT view or the PUBLIC view. Confirmed SEPARATE surfaces: provider management view = `panel.provider.announcements.$id.tsx` (analytics + edit, the subject of this packet); public view = `_portal.anuncios.$id.tsx` (no analytics/edit, OUT OF SCOPE for packet 05). All packet-05 decisions apply to the provider management view only. Also confirmed the "image" here = the per-announcement photo (`announcement.imageUrl`, cropper output), NOT the provider profile cover.
User answer: "Lock on your pick."
Decision / takeaway:
- LOCKED: keep 4:3 aspect (matches create-form cropper output, no re-crop), constrain to ~280–320px max width, rounded, object-cover. Scoped to the provider management view.

### QA
Exact question:
"On the read-only detail (view) page — what's the layout/priority shape? (a) facts-first, image as constrained cover, analytics below; (b) balanced two-column; (c) keep hero-first but shrink."
User answer: "(a) Facts-first, image as cover."
Decision / takeaway:
- LOCKED: facts-first. Title + key facts at top, full-width 4:3 hero demoted to a constrained cover beside/above facts, analytics below the primary block.
- Resolves issue 5 (hero dominance) and the placement half of issue 1/issue 2.
Queue impact:
- Old Q4 (image beside facts) resolved by this choice → pruned.
- Old Q5 placement resolved (analytics below) → only chart height/weight remained (became QD).

### QA
Exact question:
"On the read-only detail (view) page — what's the layout/priority shape? (a) facts-first, image as constrained cover, analytics below; (b) balanced two-column; (c) keep hero-first but shrink."
User answer: "(a) Facts-first, image as cover."
Decision / takeaway:
- LOCKED: facts-first. Title + key facts at top, full-width 4:3 hero demoted to a constrained cover beside/above facts, analytics below the primary block.
- Resolves issue 5 (hero dominance) and the placement half of issue 1/issue 2.
Queue impact:
- Old Q4 (image beside facts) resolved by this choice → pruned.
- Old Q5 placement resolved (analytics below) → only chart height/weight remains (now QD).

### QB
Exact question:
"Which of the two new-announcement forms is canonical to consolidate the shared create/edit form onto?"
User answer: "Provider namespace, extract shared."
Decision / takeaway:
- LOCKED: consolidate onto `panel.provider.*` form, extract a shared `AnnouncementForm` driven by mode/id, delete the `panel.dashboard.*` duplicate and the narrow `ProviderDashboardEditFormFields` component.
Queue impact: none new.

### QC
Exact question:
"Edit route path under the provider namespace?"
User answer: "$id view + $id/edit."
Decision / takeaway:
- LOCKED: `/panel/provider/announcements/$id` = read-only view, `/$id/edit` = edit, `/new` = create. View Edit button navigates to `/edit` child.
Queue impact: none new.

### Q2

### Q2
Exact question:
"For the shared create/edit form: is the field set identical between create and edit, or are there fields that must be locked/hidden/read-only once an announcement exists?"

User answer:
"For now leave everything editable except ID and similar. But make the blockage easy to implement later. Not sure of implications of letting user change category — could bring issues but don't want to decide now. We're MVP, so leave it all open, but make sure the implementation follows a pattern where we can easily block certain fields later without changing too much of the code."

Decision / takeaway:
- MVP: all fields editable in edit mode except identity fields (id). No fields frozen yet (category included — stays editable for now).
- LOCKED requirement: field-level lockability must be a built-in PATTERN (e.g. per-field policy/config map or mode-aware disabled flags) so a specific field can be frozen later with a minimal, localized change. Do not hardcode "always editable" assumptions that would force a wide refactor to add a lock.

Queue impact:
- No new layout questions. Confirmed shared-form needs a field-policy seam.
- Adopted user's batching rule going forward (see Process note).

### Q1
Exact question:
"View mode and edit mode already swap the right-hand column (analytics when viewing, the edit form when editing) instead of being separate routes. Do you want to keep this inline view/edit toggle on the single `$id` page, or split editing into its own dedicated route (e.g. `$id/edit`)?"

User answer:
"Rather have a separate screen just for edit. View and edit should be similar — don't want two experiences for similar things. Use the SAME form for create and update, conditional on whether the route is called with an ID (as done in other projects). Keep `new` for create, add `$id/edit` for edit, both landing on the same component; render/behave based on what's being done. If edit route with ID → fetch item by ID, wire update functions — but inputs stay in the same place, same rules. Weird to have two different experiences for the same thing."

Decision / takeaway:
- LOCKED: editing moves to a dedicated route (`.../$id/edit`); the detail `$id` page becomes a pure read-only view.
- LOCKED: create and edit share ONE form component, branching on presence of an ID (fetch-by-id + update wiring in edit mode, create wiring otherwise). Same inputs, same positions, same validation rules.
- Consequence: analytics no longer has to share a column with the edit form, so view-page layout questions are now independent of edit.

Queue impact:
- Pruned the old inline-toggle premise from later questions.
- Added Q6 (which of the two existing `new` forms is canonical to consolidate onto).
- Re-scoped Q3/Q5 to the read-only view page specifically.
- Added Q2 (field-set divergence between create and edit) as the immediate next branch the shared form needs.

## Pruned Questions

- (from packet's suggested-5) "Which fields are non-negotiable for true edit completeness, starting with tags?"
  Removed because: tags are now editable in code (commit d42373d); edit form already covers title, subtitle, category, price, image, contact, CTA, verified badge, tags. No evidence of a remaining missing field. Will re-add only if user names a specific gap.
