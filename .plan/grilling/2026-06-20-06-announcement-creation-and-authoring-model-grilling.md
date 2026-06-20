# Grilling Session: Announcement Creation and Authoring Model

Date: 2026-06-20
Status: complete
Source Skill: grill-with-docs (persisted via luna-grill-with-docs)
Handoff: `.plan/handoffs/grill-to-prd-announcement-creation-and-authoring-model.md`
Packet: `.plan/sessions/panel-bugs-style-issues/06-announcement-creation-and-authoring-model.md`
Scope: Canonical announcement authoring model for create/edit flows: contact channels vs destination targets, provider defaults vs per-announcement overrides, and the UI primitives needed once the create page is treated as a serious panel surface.

## Starting Context

- User prompt: "lets start grilling the next item in that list. grab the next item using /home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.plan/sessions/panel-bugs-style-issues/README.md instructions"
- Initial reasoning:
  - The queue index says resume any `in-progress` packet; otherwise start the first `queued` packet by queue order.
  - No packet was `in-progress` in the queue index. Packets 07 and 01 are already `completed`.
  - The first `queued` packet by queue order was `06-announcement-creation-and-authoring-model.md`, so it became the active packet and was marked `in-progress` in both the queue index and packet frontmatter.
  - The packet is already hardened with concrete evidence: the create page uses a narrow centered shell, categories are database-fed but rendered as a button grid, price/tags are plain text inputs, and the create DTO only supports a narrow `contactLinks` model.
  - Therefore the first question should decide the canonical announcement authoring model before drilling into specific input widgets, because the layout/input complaints are downstream of the domain contract.
- Operational format preference:
  - Ask up to 5 questions at a time only when they are independent and do not depend on unanswered questions.
  - Every question shown must include: number, context, options, and a recommended option.
  - If only one question is safe without dependency drift, ask only one.
  - Synchronize this file after every question and every answer.
- Fresh grounding after Q1:
  - I re-checked `apps/web/src/routes/panel.dashboard.announcements.new.tsx` after the user's note about recent visual improvements.
  - The current file still shows an outer `mx-auto max-w-4xl space-y-6 p-4 md:p-8` wrapper at lines 214-216, plus a `md:grid-cols-3` two-column form layout with the main form in `md:col-span-2`.
  - So the current code suggests partial interior layout improvement may exist, but the outer shell is still centered in source. This matters for how Q5 is interpreted: the target contract can still be hybrid/C even if some local visual improvements already reduced the pain.

## Current Question

Session complete.

## Future Questions

None.

## Answered Questions

### Q20 — Completion gate
Exact question:
"20. Completion gate
Context:
- We have now locked the canonical authoring model, contact-vs-CTA separation, WhatsApp mandatory baseline, optional CTA policy, live inherited contact defaults, same-number optional direct-call behavior, tag semantics/normalization direction, v1 CTA target set, and the create/edit UI inheritance affordance.
- At this point the packet seems strong enough to drive PRD/task work, but the right move is to check whether you think a meaningful edge case is still missing before I write the handoff and mark this packet complete.
Options:
A. This packet is complete and ready for handoff.
B. There is still one missing decision/edge case; we should resolve it before handoff.
C. The packet is mostly complete, but I want a brief recap of the locked decisions before deciding whether to hand off.
D. Another completion state you prefer."

User answer:
"A"

Decision / takeaway:
- The packet is complete and stable enough for PRD generation.
- Write the official grill-to-PRD handoff.
- Mark the packet complete in the queue index and packet file.

Queue impact:
- Closed the live grilling queue for packet 06.
- Promoted the packet from in-progress to completed and recorded its handoff path.

### Q18–Q19 batch
Exact questions:
- Q18: Tag normalization rules
- Q19: Scope of direct-call exposure control

User answer:
"Both, as recommended, please."

Decision / takeaway:
- Q18 locked as A:
  - apply automatic baseline normalization only
  - case-folding/lowercasing, trimming, deduping, and accent folding are acceptable
  - do not auto-singularize/plural-collapse or rewrite meaning
- Q19 locked as C:
  - provider sets direct-call exposure default globally
  - each announcement can keep or override that default

Queue impact:
- Locked the tag-normalization floor for the future tag UI/data contract.
- Completed the direct-call exposure model so it now matches the broader default-plus-override philosophy used elsewhere in the packet.

### Q16–Q17 batch
Exact questions:
- Q16: Inheritance visibility in create/edit UI
- Q17: v1 CTA target type set

User answer:
"Both, as recommended, please."

Decision / takeaway:
- Q16 locked as C:
  - inheritance should be visible, but lightly
  - use a lightweight inherited badge/label plus a simple customize affordance
  - avoid turning the form into a heavy state-machine/settings surface
- Q17 locked as A:
  - v1 CTA targets should include provider profile, website/menu URL, Instagram post/profile, TikTok video/profile, and WhatsApp deep link
  - keep the v1 target set controlled rather than unbounded

Queue impact:
- Locked the authoring affordance for inherited contact state.
- Locked a concrete, bounded v1 CTA target set so later design/DTO work has a real target list.

### Q13–Q15 batch
Exact questions:
- Q13: Tag semantics
- Q14: Provider-level CTA defaults vs announcement-only CTAs
- Q15: Missing or broken CTA behavior on the public listing

User answer:
"You can go with the recommended option for all of them."

Decision / takeaway:
- Q13 locked as C:
  - tags are a mixed system
  - provider-authored discovery tags remain flexible
  - platform/editorial/system labels may exist too, but should stay distinct from normal provider tags
- Q14 locked as A:
  - CTA targets are announcement-level only
  - provider config may influence suggestions, but CTA inheritance itself should not exist
- Q15 locked as A:
  - when no valid CTA exists, the public listing falls back cleanly to primary contact actions
  - WhatsApp remains the guaranteed baseline action, with optional call if enabled

Queue impact:
- Clarified that tags carry both discovery and platform-label roles without collapsing them into one undifferentiated field.
- Prevented CTA inheritance from becoming another surprising provider-level default system.
- Locked a resilient runtime fallback behavior aligned with the product's direct-connection business model.

### Q10–Q12 batch
Exact questions:
- Q10: CTA requirement at publish time
- Q11: Inheritance propagation behavior
- Q12: WhatsApp number and optional direct-call behavior

User answer:
"For the question 10, I say we don't make it mandatory because I mean otherwise we would have to control which kind of category demands CTA, you know. I don't want that kind of control to lay on our hands, you know. At the end of the day, the provider should know whether he has or not a CTA, you know? It's his choice. It's important. If he does add a CTA, we need to treat it as important as it is, but we shouldn't enforce it, you know. 

11: A

12: A"

Decision / takeaway:
- Q10 locked effectively as B:
  - explicit CTA target is important but not mandatory for publish.
  - the platform should not own per-category enforcement logic for whether CTA is required.
  - providers decide whether a given announcement has a CTA.
  - when present, CTA should be treated as a first-class/high-importance element.
- Q11 locked as A: live inheritance for announcements that are still marked as inheriting provider defaults.
- Q12 locked as A:
  - one mandatory primary phone number stored once
  - WhatsApp is always enabled on that number
  - direct call is a separate provider-controlled boolean on the same number

Queue impact:
- Closed the major ambiguity around publish rules: WhatsApp is the hard requirement; explicit CTA target is optional.
- Locked the longitudinal behavior of inherited contact defaults as live, not frozen.
- Locked the same-number WhatsApp/call model, which will shape provider settings, DTOs, and public action rendering.

### Q6–Q9 batch
Exact questions:
- Q6: UI grouping of contacts vs CTA targets
- Q7: Publish-time validation contract
- Q8: CTA target multiplicity and shape
- Q9: Category cardinality

User answer:
"I'm not sure about that. At the end of the day, if we use a CTA, I mean CTA is important. I'm not saying that... Oh, this is regarding the question 7, okay? At the end of the day, the CTA, it's pretty important, I know that. But at the end of the day, when we push the user to a CTA, he will probably need a contact info. So WhatsApp is still mandatory, you know? I know it's a kind of a CTA at the end of the day, but WhatsApp is mandatory. And also, I didn't think of that before, but we probably need to allow the user both to open on WhatsApp the number of WhatsApp as WhatsApp and to send it to the phone, you know. Most of the user will see our website through the phone, so he should be able to click button to call, and this should be activated by the provider, you know? Like, allow users to call me, like something like that, you know, through the WhatsApp number. So the user can either open the WhatsApp or call directly. I mean, at the end of the day, it's the same number, right? I mean, there's no problem on that, I guess. But it should be something that the provider decides. I want the final user to be able to call me directly through the application or not. If it doesn't, it's just WhatsApp. But WhatsApp is a mandatory thing. It must be there. It's part of our business, you know. It's the main part of our business because we don't sell anything, you know? We just... We're just a vitrini. I'm not sure the word in English, but we're just a place where the final user will search for it and be connected directly to the client, you know. Our goal here is not to gain on how much the clients or the client are selling. It's to earn some money on the client's announcement and that's it. The idea is for the project to live by itself, you know? 

For the other i for the other questions, you can go with a recommended one."

Decision / takeaway:
- Q6 locked as A: contact channels and CTA targets should be two explicit sections.
- Q8 locked as A: one required primary target shape plus optional secondary targets from a small fixed supported set remains the preferred starting model, but its publish-time requirement is still being refined separately.
- Q9 locked as A: exactly one structural category per announcement.
- Q7 is partially resolved, with these hard rules now explicit:
  - WhatsApp is mandatory.
  - The product is a marketplace/vitrine layer whose core job is connecting the user directly to the provider, not processing the sale.
  - The same primary number should support WhatsApp by default.
  - Direct phone call should be an optional provider-controlled exposure on that same number.
- Remaining ambiguity after Q7:
  - whether an explicit non-contact CTA target is required for every published announcement, or only important/recommended depending on category/workflow.

Queue impact:
- Settled the sectioning model, target-shape model, and one-category rule.
- Created a new explicit modeling question around same-number WhatsApp plus optional direct-call exposure.
- Narrowed Q7 into a smaller follow-up about whether explicit CTA targets are universally required.

### Q2–Q5 batch
Exact questions:
- Q2: Inheritance rule for provider defaults vs per-announcement overrides
- Q3: Scalable interaction model for categories, tags, and money input
- Q4: Create/edit parity scope in the same pass
- Q5: Canonical create-page layout contract

User answer:
"All except 5 as recommended.

Well, regarding the fifth question, the question five, I already part with the create form. I mean, I didn't change much, but I improved using Claude of course, but I improved the layout, you know, the visuals. It's not a centered form anymore, but it needs tackled, you know. You should go through it, understand better. And yes, once you understand how it is, I think the C can be used to adapt it to what we need now, okay? But I mean, layout wise, I mean, spacing and padding, I mean, it's consistent with the other pages, you know? That that's what I'm trying to say."

Decision / takeaway:
- Q2 locked as A: automatic inheritance with optional per-channel override.
- Q3 locked as A: async searchable combobox for categories, token/chip input for tags, masked money input with normalized numeric storage.
- Q4 locked as B: core parity now, polish later.
- Q5 is interpreted as a nuanced C:
  - Target layout contract remains hybrid (`C`) as the adaptation direction.
  - The user believes the current page already improved materially on spacing/padding consistency and is no longer effectively the old centered-form experience.
  - Fresh source check still shows an outer `mx-auto max-w-4xl` wrapper in `panel.dashboard.announcements.new.tsx`, so there is a live mismatch between the user's perception/current local state and the packet's older evidence. Treat this as: interior/layout improvements may already exist, but the final hybrid contract still needs deliberate pass-through and verification.

Queue impact:
- Unblocked the next independent batch on UI grouping, validation contract, CTA multiplicity, and category cardinality.
- Pruned the old binary reading of Q5 as either `still narrow centered form` or `fully solved`; it is now a hybrid-target decision with a verification note.

### Q1
Exact question:
"1. Canonical authoring model
Context:
- Right now the create flow is built around a narrow DTO: title, subtitle, description, image, category, tags, price, and `contactLinks` with only WhatsApp / Instagram / website.
- Your packet says the real problem is bigger: announcements may need provider defaults, per-announcement overrides, and outbound targets that are not the same thing as contact channels.
- If we do not settle the domain model first, we risk redesigning the form around the wrong concepts.
Options:
A. Keep a single combined concept: every outbound method (WhatsApp, Instagram, website, post URL, TikTok URL, etc.) lives in one unified `links/targets` collection; some entries are contact methods, some are destination CTAs, but the model stays flat.
B. Split the model into two concepts: `contact channels` (how a client reaches the provider) and `destination targets` (where the announcement sends the client). Provider defaults apply to contact channels; destination targets are announcement-level.
C. Three-layer model: provider-level `contact defaults`, announcement-level `contact overrides`, and a separate `primary CTA target` plus optional secondary targets.
D. Another model you prefer."

User answer:
"C."

Decision / takeaway:
- Canonical model is a three-layer structure:
  - provider-level contact defaults
  - announcement-level contact overrides
  - separate primary CTA target plus optional secondary targets
- Contact channels and CTA destinations are explicitly not collapsed into one flat bucket.
- This makes announcement authoring a richer domain model problem, not just a form-restyling problem.

Queue impact:
- Unblocked a multi-question batch covering inheritance rule, scalable field primitives, create/edit parity, and create-page layout contract.
- Pruned the old ambiguity between a flat links model and a separated authoring model.

## Pruned Questions

- Q-old-contact-vs-target
  Exact question: "Should we keep one flat links model or separate contact channels from CTA targets?"
  Removed because: Q1 resolved this structurally in favor of a separated three-layer model.
- Q-old-layout-binary
  Exact question: "Is the create page still just a narrow centered form, or already solved enough that layout is no longer part of the packet?"
  Removed because: the user clarified the current page has partial layout improvement, but the target still needs a deliberate hybrid contract and source verification.
- Q-old-publish-rule-bundle
  Exact question: "Must every published announcement have both WhatsApp and an explicit primary CTA target?"
  Removed because: the user split this into finer rules—WhatsApp mandatory is locked, while universal CTA requirement remains a separate follow-up decision.