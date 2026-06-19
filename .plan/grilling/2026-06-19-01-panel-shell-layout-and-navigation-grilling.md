# Grilling Session: Panel Shell, Layout, and Navigation Polish

Date: 2026-06-19
Status: complete
Source Skill: grill-with-docs (persisted via luna-grill-with-docs)
Handoff: `.plan/handoffs/grill-to-prd-panel-shell-layout-and-navigation.md`
Packet: `.plan/sessions/panel-bugs-style-issues/01-panel-shell-layout-and-navigation.md`
Scope: Canonical provider-panel shell contract (width, padding, header/sidebar chrome, content framing), shared announcement primitive boundaries, and how strictly to enforce PT/EN localization in shell-adjacent surfaces.

## Starting Context

- User prompt: Grab the next item for grilling from the panel-bugs-style-issues queue. Follow `.plan/sessions/panel-bugs-style-issues/README.md`, which is the entrypoint that decides the next packet.
- Initial reasoning:
  - The queue index says resume any `in-progress` packet, else start the first `queued` packet by order.
  - No packet was `in-progress`. Packet `07-role-access-and-route-architecture.md` is already `completed`.
  - First `queued` packet by queue order is `01-panel-shell-layout-and-navigation.md`, so it became the active packet.
  - The packet is already hardened with concrete code evidence (Excerpts A–F) proving shell drift is real: `panel.tsx` centralizes sidebar/header, but `panel.dashboard.tsx` enforces no content shell, so child routes invent their own width/padding (`px-6 py-8` full-width vs `mx-auto max-w-4xl` centered).
  - Therefore the first question targets the architectural root — the canonical shell contract — not re-proving the drift exists.
- Operational format preference (carried from packet 07):
  - Ask up to 5 questions at a time only when they are independent and do not depend on unanswered questions.
  - Every question shown must include: number, context, options, and a recommended option.
  - If only one question is safe without dependency drift, ask only one.
  - Synchronize this file after every question and every answer.

## Current Question

Session complete.

## Future Questions

None.

## Answered Questions

### Q-completion
Exact question:
"Do you consider this packet complete and ready for handoff, or is there a missing edge case in panel shell / layout / navigation that still needs a decision before the grill-to-PRD handoff?"
User answer: "We're complete, write the handoff."
Decision / takeaway:
- Mark packet 01 complete.
- Core shell decisions (Q1–Q6) are sufficient for PRD/task work; remaining items are implementation/PRD detail.
Queue impact:
- Triggered handoff writing and packet completion updates.

### Q2 — Shared container variants
User answer: "b"
Decision / takeaway:
- The canonical container is ONE primitive with explicit variants: `default/list` (full-width framed), `centered-form` (focused create/edit, the New Announcement case), and `full-bleed`.
- Pages select a variant; they do not invent their own width/padding.

### Q3 — Sidebar header + top bar treatment
User answer: "b"
Decision / takeaway:
- Stronger shell chrome, not a full redesign.
- Sidebar header gains hierarchy: brand + active section/condo context + primary utility.
- Top bar gains a section title/breadcrumb beyond the bare trigger + theme/language toggles.

### Q4 — Announcement primitive sharing
User answer: "a"
Decision / takeaway:
- Define ONE shared announcement presentation primitive now, with explicit variant slots: `dashboard-card`, `detail-header`, `public-card`.
- The primitive's existence and variant boundaries are owned by this packet.
- Deep detail/edit/analytics tuning is deferred to packets 04, 05, and 03.

### Q5 — Localization strictness this pass
User answer: "a"
Decision / takeaway:
- This pass only cleans shell/nav-adjacent surfaces (sidebar, top bar, called-out route titles/copy in `new.tsx` and `providers.$id.tsx`).
- A full PT/EN codebase sweep is deferred to a dedicated i18n task, not blocking this packet.

### Q6 — Sidebar collapse bug (Issue 1)
User answer: "a"
Decision / takeaway:
- In scope as fix-intent, captured in the handoff as an implementation-level fix.
- Likely cause: localStorage init or `SidebarTrigger` API drift in `panel.tsx`; not a deep grilling topic.

### Q1 — Canonical shell contract and ownership
Exact question:
"What is the canonical provider-panel shell contract, and who owns it? The dashboard is the declared visual reference, but child routes set their own width/padding (`px-6 py-8` full-width in My Announcements vs `mx-auto max-w-4xl` centered in New Announcement), because `panel.dashboard.tsx` only renders a bare `<Outlet />` with no shared content container."

User answer:
"A — go with the centralized shared panel wrapper / shared content container."

Decision / takeaway:
- The dashboard namespace owns ONE shared content container (canonical max-width + padding).
- Every provider child route renders inside it; child routes stop setting their own width/padding.
- Dashboard-as-reference is encoded at the layout level, removing per-route drift at the source.

Queue impact:
- Opened Q2: whether that single container forces one frame or allows explicit variants (the centered New Announcement form is the motivating exception).
- Q3–Q6 remain independent and were batched together with Q2 per the user's format preference.

## Pruned Questions

None yet.
