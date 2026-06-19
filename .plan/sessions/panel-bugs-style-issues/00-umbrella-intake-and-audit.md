# Umbrella Reference: Panel Bugs, Style Issues, and Missed Improvements

Date: 2026-06-18
Status: archived-reference
Source Skill: grill-with-docs
Scope: Gather all bug items, style issues, and implementation/improvement items affecting the panel before starting detailed grilling.

## Umbrella role

- This file is the historical umbrella record for the original gather-only intake and overnight audit.
- It is no longer the active packet-by-packet grilling session.
- The operational entrypoint for future grilling is `README.md` in this same folder.
- Future packet grilling should start fresh from the queue index and create new files under `.plan/grilling/` per packet.

## Starting Context

- User prompt: "Need to cover some other bugs and style issues in the panel some things that were introduced in this latest update some things that were not addressed at all. So I need you to grill me first first of all I need you to gather for gather require for at least each item I will say now will be one or more items I can give you store them so you can grill me about them okay but until we finish gathering bug items and implementation items or improvement items you will just gather them nothing more"
- Initial reasoning:
  - The user explicitly wants a gather-only phase before any real grilling begins.
  - The first job is to capture a complete queue of panel issues and improvements without interrogating each one yet.
  - The current question should request the first batch of items in a low-friction format.

## Current Question

Question ID: Q-next-3
Exact question:
"Now that the findings are split into grouped session packets, which packet should we grill first?"

Why this is current:
- The user wants to avoid one massive endless grill and instead work in smaller grouped turns.
- The findings were reorganized into packet files under `.plan/sessions/panel-bugs-style-issues/`.
- The next live decision is no longer a raw item pick, but the first packet to grill.

Recommended answer:
- Name one packet filename or topic to start with.

## Future Questions

1. Q-next-4
   Exact question: "Which packet should we grill second so implementation can keep moving in parallel?"
   Why it is queued: The user wants grilling and execution to run as parallel tracks instead of a single linear funnel.
2. Q-next-5
   Exact question: "Is any packet still too broad and should be split again before we grill it?"
   Why it is queued: The grouping pass is intentionally pragmatic and may still need one more trim before deep grilling.

## Answered Questions

### Q-current
Exact question:
"Send me the first batch of panel items to capture. One per line is ideal. For each item, a short label is enough for now. I will only gather and store them until you say the gathering phase is done."

User answer:
"Well, let's start with the sidebar collapse button is not working anymore. I don't know why. That needs to be fixed. We need to come up with a better style on the sidebar header, you know, the top sidebar. It's just a text aligned on top, in the center it and top. Right now, it's, I mean, it's too simple. I don't like it.

The announcements are too big. The cards are too big. I know we have a lot of information to display, but they are too big. We need to make them smaller so we can fit more of them into the screen. Right now, I see only one and it takes like 30% of my screen. It's only one. Imagine the imagine someone pushing like loads of those announcements, you know? It would be devastating. I mean, it would be a pain in the ass to see, you know? We need to make them more compact.

If you check the dashboard against the my announcements and configurations, both of them, my announcements and configurations have extra padding on the sides. I mean, it's weird, you know? The dashboard has a perfect not only padding but it has a perfect sizing, you know, spacing, I mean, everything. You can use it as a as a reference. All of them should follow the same format.

Regarding the configuration, provider configuration, it's it has a I mean, I think it has every every information we need, but it's too weird, you know? It wasn't well uh needs to be better organized. The uploaded the upload image, for example, you can upload an image, it's it opens a centered uh uh crop tool or something. But once we select it, it's I don't know, it's weirdly stacked, you know? The image, the URL, and the remove button. I think we should work with a I don't know, more robust and well-thought way of dealing with those images, both the profile, the logo, and the banner. They are all weird. Uh we need to make them like better-looking, better, with a better experience and all.

Both the public profile section and the oh, all sections, actually, um I think there's something missing or something's missing, I don't know, regarding the subtitle, you know, for each section in this config in the configuration, provider configuration. For example, right now I see in the perfil público, it's Portuguese because I have Portuguese set up as my language right now, um below it I see field_public_profile_helper, help, sorry. If I go to contacts channel, uh I see under it field_contact_channels_help, you know? The same goes to the visibility, to public visibility: field_public_visibility_help. I'm seeing the internationalization internationalization code instead of the actual language specific language text.

This is also this visibility, this public visibility is too broad. It's too big for something that is like rather simple, you know? This should be on top, somewhere on top, and it should be a smaller section, you know? I don't like this. It's important for us to use the whole page, the whole available space, but we don't have to like stretch everything to cover, you know, the whole thing. I think that's the start.

Also, when you oh, going back to the announcements, when we click the announcement, it shows us a new details page. We have some misalignments there and yeah, for example, the chart, it's it's not aligned with the above items. Also, the chart, the the metrics part of it, it's it's taking like the whole uh height of the available details. And let me check something. When we click to update the announcement, it replaces the it replaces the metrics, and they seem to be incomplete, you know? For example, we have tags. That's that's one item that probably we should be able to alter, remove, add more items, I don't know. And it's not available for update, you know? I think the update shouldn't be the same page, you know? Details is details. This details, it's it's good to be like this, I mean, I like the idea of having all this information at the same in the same place.

But once again, the announcement information are too big. We don't have we don't need that picture taking the whole page, you know? I mean, I see the picture and I have to scroll to see the information. A picture should be something like it doesn't need to be a miniature or something, miniature or something, but it shouldn't be it shouldn't take the whole screen, you know? Also, the information should be the first thing we see at the top, probably the image could be on the side and the metrics right below. Or yeah, that's it. But all of them probably should be somewhat available, you know, visible right from from the start.

Also, the provider test, uh sorry, the provider page, the public provider page, definitely weird as hell with that, you know, stretched uh informations. I mean, try to use some, I don't know, Facebook or whatever profile as as example, you know, for this. Uh also, the announcements are huge, and they are different from the other places. Probably probably we should have a a unified component for this and use it everywhere, you know? Uh they it seems we are creating a new component for this each place, and each place has a has a different weird way of displaying the announcement, and I don't really like them, you know? Any of them. Uh there are ones that are less ugly, less problematic, but all of them are problematic, ugly, and all. So, we probably need to uh make them better visible, better-looking.

I think I covered most of it for us to start. There are some behavioral uh weird things as well regarding the the user's permissions, but well, you can grill me on that, you can ask me about that in a moment. For now, let's just register what I just said. I mean, I said a lot right now."

Decision / takeaway:
- Captured the first batch of panel issues and improvements:
  - Sidebar collapse button no longer works.
  - Sidebar header/top area styling is too simple and needs redesign.
  - Announcement cards are too large and need a more compact layout.
  - Dashboard spacing should be the visual reference; My Announcements and Configurations have incorrect extra side padding.
  - Provider configuration page is poorly organized overall.
  - Image upload/crop/result UX for profile/logo/banner is awkward and visually weak.
  - Provider configuration section helper subtitles are showing i18n keys instead of translated text.
  - Public visibility section is oversized and should be smaller and positioned higher.
  - Announcement details page has misalignment issues; chart does not align with content above.
  - Metrics/chart area on announcement details consumes too much vertical height.
  - Announcement update flow is incomplete; editable fields like tags appear missing.
  - Announcement update should likely be separate from details view.
  - Announcement details hero/image is too large; key info should be visible immediately, likely with image beside or subordinate to primary info.
  - Public provider page layout feels stretched and poorly structured.
  - Announcement presentation is inconsistent across surfaces; likely needs a unified reusable component.
- The user also flagged additional permission-related behavioral issues to capture later.

Queue impact:
- The gathering phase remained open.
- A permissions-related follow-up was added to the queue for when the user was ready to register those items.

### Q-next-1
Exact question:
"Are there any more panel items to add before we start grilling them? You can send another batch the same way, and I will keep only gathering."

User answer:
"Okay, let's let's hit it some more. the user profile configuration. it looks weird because every session it's under the same page, you know. or example,   think we can use a tab segregation there. another thing it's weird that's weird, it's the avatar configuration. We can add an image, but once he add them, once we add it, we can only remove, we cannot add it, you know, or alter. magine  want you to replace the image. here should be a button for that, right? Like replace or upload something new, whatever. And also I should be able to re-crop it. I mean using the same image, I should be able to crop it better. maybe somehow I I crop it, I corrupt it, I don't know, in a weird way. Cut in I don't know, cut in someone's head. I don't know. I should be able to crop it in a better way. So I should be able to do those three things, you know, remove replace or update somehow, change it somehow visually. What else? The phone should have a mask. And since we're talking about I mean it's the user change it his changing his own information, we don't need what's the name? We don't need a well don't need to anonymize the detail of the user phone number. Probably the the preference block should be in the under a different tab. also the language combo box displays the language code. For example, right now I see PT dash BR. And when I click it to show the options only then I can see Portuguese and English as words, you know. I think we should display only that word, those words and both the selected combo box or the options the danger zone should be in another tab as well. The same goes to the security."

Decision / takeaway:
- Captured the second batch of panel/profile configuration issues and improvements:
  - User profile configuration page is overcrowded; sections likely need tab-based segregation.
  - Preferences block should live under a separate tab.
  - Danger zone should live under a separate tab.
  - Security should live under a separate tab.
  - Avatar configuration is incomplete after upload.
  - Avatar controls should support at least: remove, replace/upload new, and re-crop existing image.
  - Phone input should use a mask.
  - On self-edit screens, the user's own phone number should not be anonymized.
  - Language combobox should display localized language names instead of raw codes like PT-BR, both in the selected state and in the dropdown options.

Queue impact:
- The intake list expanded further in the profile/settings area.
- No detailed grilling started yet because the user was still supplying raw items.

### Q-next-1-2
Exact question:
"Are there any more panel items to add before we start grilling them? You can send another batch the same way, and I will keep only gathering."

User answer:
"If I'm an admin, the first thing I first thing I see when I land in the authenticated panel it's the provider dashboard, and well the first thing that's an admin that should see is the administration dashboard, I guess. it doesn't exist yet. It it's something that must be constructed, and we're not talking about this right now, but that's a mistake, you know. We shouldn't see the pro the providers dashboard right now. Not just yet. also well we should probably talk about these information information's all those sections within the administration as well. For example, right now we have general vision users. We have providers, and we have condominiums. those are very generic and don't even closed shouldn't call doesn't come into doesn't come even closed to abide with everything that is already said regarding those roles, you know. The admin role the same go to the system manager, you know. I I think this is the system manager should have a similar view, of course, with less things, but still."

Decision / takeaway:
- Captured admin/system-manager dashboard and navigation issues:
  - Admin users currently land on the provider dashboard, which is the wrong default destination.
  - Admin users should land on an administration dashboard instead.
  - The administration dashboard does not exist yet and must be designed/built later.
  - Existing administration sections/taxonomy are too generic (e.g. general vision, users, providers, condominiums) and do not reflect the already-defined role model well.
  - System manager should likely have a similar administration-oriented view, with reduced scope compared to full admin.

Queue impact:
- Intake now includes role-based landing/default-view problems plus admin IA/taxonomy concerns.
- Still gathering only; no prioritization or solution shaping yet.

### Q-next-1-3
Exact question:
"Are there any more panel items to add before we start grilling them? You can send another batch the same way, and I will keep only gathering."

User answer:
"I think we already talked about this, but people a person who doesn't who's who's not a provider, who doesn't have a provider active related to him sh shouldn't be able to see the provider section, you know? Right now, I don't I don't remember which one, but I think it was the administrator or the moderator, I don't know. I had a moderator that was not a provider. So and I tried to see my announcements, I mean the the menu was there, and I I got an error saying that a user who's not a provider doesn't have access to the my announcements. You know, you see what I'm saying? The announcements block should not only the announcement but the provider block shouldn't be available at all, you know. Or we could only like add the configuration. I I don't think when where we I don't remember where we choose to be the place to display the button to enable or disable the cap capability of the user being a provider, you know. Not sure if it's tied to the user itself or the configuration would be under the I mean that flag visually should be under the provider configuration flag. I don't know, we need to come up with a good place for this."

Decision / takeaway:
- Captured provider capability / menu visibility / permission-alignment issues:
  - Users without an active related provider should not see the provider section at all.
  - Current UI exposes provider-area entries (for example My Announcements) to users who cannot actually access them, leading to runtime access errors.
  - Menu visibility should be aligned with effective provider capability, not just generic authentication/role presence.
  - There is an unresolved product decision about where the "is provider" / provider capability toggle should live and be managed visually.
  - Possible nuance to resolve later: whether some limited provider configuration entry should remain visible even when broader provider sections are hidden.

Queue impact:
- The permissions/navigation portion of the intake gained a concrete case around provider capability gating.
- Still in gather mode; the placement of the provider-capability control remains intentionally unresolved for later grilling.

### Q-next-1-4
Exact question:
"Are there any more panel items to add before we start grilling them? You can send another batch the same way, and I will keep only gathering."

User answer:
"The create announcement are we didn't touch it yet, so we need to also make it look more close closely with the other sections, the other pages. whole with it of the page, you know, no centralized weird looking formula for the category should be loaded from the database and not as buttons, you know. we can leave as buttons for the first ones, but the others the other should be probably suspended list or a combo box or something that comes from the database, and especially something that can be searchable, you know. Right now we have few categories, but that's something that will definitely raise to a lot of them, you know, like I don't know, a few hundreds, I guess. Not now, but I don't know. Soon enough it will be more than one hundred, and well, that's already bad enough. we need a mask, a money mask for the initial price, if if it's well, if it's value, the tags are the cat the tags. I think I think we have I think there is I think there is a component in chat send that takes care of this, you know. Like I don't know, pills inside a text box for such things as tags. and I think it should take more than just that small field. the contact channels maybe should have all the options the that the provider are able to have, and we probably should allow the provider to just use the whatever the the provider has. Not as mandatory, but as an option, you know, as a fallback, like use providers default channel contact, contact channel, whatever, or bypass to this specific one, or all of them, whatever also we should be able to point to not only a profile, but a a post, you know. we can maybe we are proving we are advertising for I don't know a promotion of some sort, and the user just wants to point the announcement to an existing Instagram post or an existing you know tick tock video or something like that, like this, you know. Or maybe the own website of the client. So I think we should be more open with this contact channel, you know. There are some things that are mandatory. I say I talked about the I was talking about the social network, but regarding the contact like the WhatsApp number. the WhatsApp number is mandatory. It's all because it's the it's our main way of contact, you know, between our and clients and our providers."

Decision / takeaway:
- Captured create-announcement form/layout and data-model issues:
  - Create Announcement page still needs visual/layout alignment with the rest of the panel pages; should use full page width instead of a weird centralized/narrow form.
  - Category selection should come from the database rather than a static button-only UI.
  - Category selection should support scalable search/select behavior for large category counts (eventually 100+), likely via combobox/select for long-tail options.
  - Initial price/value input should use a money mask.
  - Tags input likely needs a richer token/pill-style component and more space than the current small field.
  - Contact-channel options in announcement creation should expose all channels the provider can support.
  - Announcement contact channels should support fallback to provider default channels, plus optional per-announcement override.
  - Announcement links/targets should be more flexible: not only profile-level destinations, but also direct post/video/site links (e.g. Instagram post, TikTok video, website).
  - WhatsApp/contact phone is considered mandatory as the primary contact path between clients and providers.

Queue impact:
- Intake now includes creation-form scalability, structured inputs, and announcement contact-target modeling concerns.
- Still gathering only; no solution narrowing yet.

### Q-next-1-5
Exact question:
"Are there any more panel items to add before we start grilling them? You can send another batch the same way, and I will keep only gathering."

User answer:
"For the moderator view in the sidebar, the condominium selector when the user has multiple condominiums are weird because it's it's like a a parent of the items of the information information condominium information announcement and and residence. And also you know the idea is for it to be a different item, but it's still a sibling item of the other's other items, you know. And it should also be a child of moderation, you know. We should have a better UI UX for this.

the reports. when I say reports I'm talking about the users reported. Reported users, sorry. There should it should be in a it should have its own section because probably the well I'm we need to understand better which wo how it would this will work, not only the section but also the reporting as as a whole

even though the moderator in the the moderator is not a provider. I mean not not every moderator, but I'm I'm I'm happy I I happen to be authenticated in the moderator that is not a provider. if we check for the moderator, there's no provider section, but if you go through the URL, you can hit the panel slash dashboard and see provided and see the provider dashboard. I guess this is I guess this dashboard shouldn't be something for the panel, you know. I guess this should be a panel slash provider slash dashboard, you know. And it should be hidden under the permission system, you know. We should probably we should have a guard or something in the routes that check if the user has access to that route, not only based on authenticated or not, but on the role, if a user has not only role, but you know if user has access to that specific route or routing group, like for example having access to a provider, it's it's not based on an actual permission, but actual state, you know, a user is a provider, he has access to the provider group. He's not a provider. There's no point letting him see the provider section, you know. Any of the provider section. But that should be implemented, that that feature of controlling if when slash if a user either has or not access to a specific route or or things like that."

Decision / takeaway:
- Captured moderator navigation / reports / route-guard issues:
  - Moderator sidebar condominium selector UX is structurally wrong when the user has multiple condominiums.
  - The condominium selector should be nested more coherently under moderation instead of behaving like a confusing peer/parent among moderation items.
  - Reported users / reports likely need their own dedicated section.
  - The reporting model/workflow itself still needs deeper product clarification later, not just a sidebar entry.
  - A non-provider moderator can still access the provider dashboard by typing the URL directly.
  - Provider dashboard routing is likely too global/generic today; it may need a provider-scoped route group such as panel/provider/dashboard.
  - Route access must be guarded by actual access state/capability, not only by generic authentication.
  - The app needs route/group-level access control so users cannot access areas merely by guessing URLs.

Queue impact:
- Intake now includes sidebar IA problems for moderators plus a broader route-authorization architecture gap.
- Still in gather mode; no design resolution yet.

### Q-next-1-6
Exact question:
"Are there any more panel items to add before we start grilling them? You can send another batch the same way, and I will keep only gathering."

User answer:
"Oh there are more. But I think on top of that you can devise or use a tool or something that reads all of the code base. I don't know. Probably give me you you probably can give me more weird, wrong or poor implementing items, so we can grill after this. But I for now. I I think I covered a lot of them. So I'll stop giving you more items for now, but you can do this. You can find more by going through the code, you know, by running the application in the in a browser or something, taking pictures, navigating through the through everything, you know, checking spaces, checking you know paddings and all through cats yen existing components. suggesting better components to resolve weird looking things, you know. I I'll sleep now because it's late, but first thing in the morning we'll start grilling on everything. I just we just I just give you right now. And also in right now you can run free while I'm away doing this validation I just told you. you don't have to require any permission, you just can just run free, okay? your since you are just checking, running and you know, taking pictures and all, you are allowed to do whatever you need. If you have, if the system requires you to to prompt me for permission, please gather every permission you will need and ask me now, so I can give you a ready and you can run free. Go ahead."

Decision / takeaway:
- The user has paused manual item intake for now.
- The user explicitly authorized autonomous investigation while away: codebase inspection, running the app, browser navigation, screenshots, spacing/padding review, and surfacing additional weird/wrong/poor implementations for tomorrow's grilling.
- No extra permission was requested by the user before leaving beyond prompting now only if the system truly requires it.
- The next live user step is no longer more gathering right now, but prioritization and grilling using both the captured list and autonomous audit findings.

Queue impact:
- Promoted tomorrow's prioritization question to Current Question.
- Added a future question to integrate autonomous audit findings into the grilling order.

### Q-next-2
Exact question:
"Once we start tomorrow, which item should we grill first?"

User answer:
"Well, this will probably be a huge grilling session, so we can start doing it by I don't know five questions at a time. So before we start it, I think we should split those findings and the things I mentioned in sections, you know, by context by page or whatever, I don't know. So then we can grill in an ordered way, you know. What what what's the what's my idea here? I know it I know I started a grilling session with like a lot of it, lot of items. And if we do this in in just one grill, we will be like in year, you know, grilling about this until we actually hit the code. So my proposal here is to do this by turn, by turns, you know. So maybe you can we can split into like I said, into sections and to sections and things that belong together. I don't know, everything from the dashboard, everything from the I don't know, provider configuration screen, you know. like atomic, not atomic, but small groups of things that belong together. Then we can create handoffs for each one of them. And we can leave them in a we don't I mean the handoffs doesn't have to follow the path, you know. that kinda just make I don't know, maybe this kind of just can behave like a backlog, you know, of issues to grill on, you know. You know what I mean? So the idea here, Would be to first of all split all those findings into the groups I just mentioned. Without grilling, you know, just the findings and the evidence and whatever else we gathered, you know. You can you can research the code base to make to understand which of them belong together, you know. But that's it. Where in the well there is no there are no backlog. Oh sessions, yeah. I'm not sure. I mean I think we have a duplicated folder here, sessions and grilling kinda means the same, right? But anyway, we can use sessions, create a folder inside sessions, and inside sessions each group inside session inside that folder you create will means one of the well future grilling we will do, okay. So the idea is to while while an execution runs I'll do a grilling session in parallel, you know, so we can save time."

Decision / takeaway:
- The user does not want to start from one raw item or one giant monolithic grill.
- Before detailed grilling, the findings should be split into smaller context-based packets grouped by page, feature area, or architectural concern.
- The grouped packets should live under `.plan/sessions/` in a dedicated folder for this intake, acting like a backlog of future grilling sessions.
- The grouped packets do not need to mirror implementation order.
- Future grilling should happen in turns, capped at roughly five questions at a time, so implementation can proceed in parallel.

Queue impact:
- Raw-item prioritization was replaced by packet-level prioritization.
- The next question became: which grouped packet should be grilled first?

## Autonomous Audit Findings (overnight)

### A-001 — Moderator can land on provider dashboard despite hidden provider navigation
Evidence:
- Browser audit with moderator@test.com lands on `http://localhost:3001/panel/dashboard` and renders `Painel do Provedor` while the sidebar shows only the Moderation group.
- `src/routes/panel.dashboard.tsx` currently allows `/panel/dashboard` whenever the user has any approved assignment (`assignments.some((a) => a.status === 'APPROVED')`), not specifically provider capability.
- `tests/dashboard.spec.ts` codifies the mismatch: it asserts moderators do NOT see the provider sidebar group, while separate tests still accept redirects only for `/panel/dashboard/configuration` and `/panel/dashboard/announcements`.
Takeaway:
- Access control is currently inconsistent at the route-group boundary: hidden nav != blocked entry.

### A-002 — Provider route namespace is acting like a generic panel home, not a capability-scoped area
Evidence:
- The provider dashboard lives at `/panel/dashboard`.
- Moderation route rejects unauthorized users by redirecting to `/panel/dashboard` (`src/routes/panel.moderation.tsx`), which reinforces provider dashboard as a generic fallback even for non-providers.
- Provider-only subroutes then do ad hoc client-side redirects to `/panel/account`.
Takeaway:
- The route tree currently mixes "panel home" and "provider area" semantics, which is the architectural root of the permission weirdness.

### A-003 — Public provider page has a duplicated identity/avatar block
Evidence:
- Visual audit of `/providers/seed-provider-id` shows two circular identity marks side by side before the provider name.
- `src/routes/_portal.providers.$id.tsx` renders either a large logo/avatar block AND then always renders a second smaller `Avatar` immediately after it (lines 215-236).
Takeaway:
- This is not just taste; the code literally duplicates the identity chip, producing an awkward header and weak fallback branding.

### A-004 — Public provider page wastes a large amount of horizontal space when branding is minimal
Evidence:
- Visual audit of `/providers/seed-provider-id` at desktop width shows one narrow announcement card parked on the left with a large empty black area to the right.
- The page feels vertically stacked but not compositionally balanced for desktop.
Takeaway:
- The no-banner / low-content fallback layout needs a denser desktop strategy, especially around active announcements.

### A-005 — Account page still feels half-finished because live settings and placeholders are mixed in the same surface
Evidence:
- Visual audit of `/panel/account` shows working profile/preferences on the left but `Security` cards on the right that are only `Coming soon`, right above `Danger Zone`.
- The layout is technically clean, but the information architecture still mixes active controls, deferred features, and destructive actions in one screen.
Takeaway:
- Even after translation cleanup, the account page still has an unfinished-product feel and remains a good grilling candidate for sectionalization/tabs.

### A-006 — Provider announcement detail still contains debug logging in production route code
Evidence:
- `src/routes/panel.dashboard.announcements.$id.tsx` contains `console.log('DEBUG ANNOUNCEMENT DETAIL:', ...)`.
Takeaway:
- This is a concrete polish/discipline bug from the latest update, not just a subjective UI complaint.

### A-007 — Announcement detail edit flow cannot truly edit tags
Evidence:
- In `src/routes/panel.dashboard.announcements.$id.tsx`, `handleSave()` sends `tags: announcement.tags` instead of editable form state.
- `src/routes/panel/-provider-dashboard-edit-form-fields.tsx` has no tags field at all.
Takeaway:
- The detail/edit page presents itself as editable, but tags are effectively locked and silently excluded from meaningful editing.

### A-008 — Announcement detail edit flow is structurally narrower than the creation requirements
Evidence:
- Edit form fields support only category, price, description, image, WhatsApp, Instagram, website, and verified badge.
- There is no richer target model, no provider-default-contact fallback model, and no scalable structured tags input.
Takeaway:
- The create/edit announcement model is split across two different capability levels instead of one coherent announcement-authoring system.

### A-009 — Moderator experience has duplicated condo-context controls
Evidence:
- Sidebar already includes `CondoSelector` inside the moderation group (`src/routes/panel.tsx`).
- `src/routes/panel.moderation.tsx` also renders a second `<select>` for condo switching in the page header when the moderator has multiple condos.
Takeaway:
- The IA problem is bigger than the sidebar item styling: the product currently has two separate condo-switching surfaces in the same moderation experience.

### A-010 — New announcement page is still objectively out of pattern with the rest of the panel
Evidence:
- `src/routes/panel.dashboard.announcements.new.tsx` uses `mx-auto max-w-4xl ...`, while list/detail pages use broader `w-full` panel layouts.
- Category selection is still a button grid.
- Price, tags, and contact fields are still plain text inputs.
Takeaway:
- This independently confirms the user's criticism from code, not just perception from one render.

### A-011 — Public/provider and panel routes still contain inconsistent language/style strata
Evidence:
- Several provider/public strings are hardcoded in Portuguese inside route components.
- Sidebar/public navigation mixes PT and EN labels in the same visible surfaces during the audit.
Takeaway:
- The app still has a partial-localization feel in some cross-surface journeys, even where raw i18n keys are no longer leaking.

### A-012 — Existing automated tests currently protect some behaviors that are themselves product-problematic
Evidence:
- `tests/dashboard.spec.ts` explicitly expects non-provider moderators to be able to reach `/panel/dashboard` after sign-in, while only deeper provider subroutes redirect away.
- Current tests therefore validate the exact mismatch the user called out.
Takeaway:
- Tomorrow's grilling should treat some current tests as codified legacy behavior, not as product truth.

## Pruned Questions
