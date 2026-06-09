---
type: epic
name: "Panel Layout"
status: ready
blocked-by: null
---

## About this Epic

Panel sidebar/topbar redesign with 280px Radix Sidebar, nested navigation per role group, live badge counts for moderation queues (stubbed), SidebarFooter with user identity, language switcher, and theme toggle. Covers Module 23 of the root PRD.

## Context

Layout B from design session: user menu in SidebarFooter, top bar with SidebarTrigger + ModeToggle + LanguageSwitcher. Sidebar width 280px. Four nav groups: Provedor (Provider Assignment enabled=true), Moderação (approved MODERATOR), Administração (SYSTEM_MANAGER or ADMINISTRATOR), Spectrum (ADMINISTRATOR — formerly "Reports", renamed for clarity per PRD Module 23 disambiguation). PRD-v5 content merged into root PRD as Module 23.

## User Review (2026-06-09)

After iteration 37 the user walked through the panel and identified defects. Tasks 06_02, 06_03, 06_04, 06_06, and 06_07 are reopened for fixes; their YAML status is `ready` and each file has a "User Review Findings" section with the specific defects and required fixes. Task 06_09 (Spectrum) is new and replaces the broken `report.ts` router with a properly-layered implementation.

## Child Tasks

- [x] [06_01_sidebar_foundation](tasks/06_01_sidebar_foundation.md) — sidebar 280px, 4 role groups, group icons, i18n wired
- [x] [06_02_nested_navigation](tasks/06_02_nested_navigation.md) — ✅ DONE: group icons + nested items with icons
- [ ] [06_03_sidebar_footer](tasks/06_03_sidebar_footer.md) — ✅ DONE: user row clickable popover, Conta + Sair, sign-out confirms
- [ ] [06_04_top_bar_controls](tasks/06_04_top_bar_controls.md) — ✅ DONE: ThemeCycleToggle (3-state cycle), LanguageSwitcher (flag trigger + popover)
- [ ] [06_05_sidebar_persistence](tasks/06_05_sidebar_persistence.md) — localStorage persistence of collapsed/expanded
- [ ] [06_06_localization](tasks/06_06_localization.md) — ⚠️ REOPENED: sidebar i18n not working, raw paths showing
- [ ] [06_07_badge_count_stubs](tasks/06_07_badge_count_stubs.md) — ⚠️ REOPENED: must use Clean Architecture, NOT raw `db.select` from tRPC
- [ ] [06_08_visibility_tests](tasks/06_08_visibility_tests.md) — visibility rule tests per role
- [ ] [06_09_spectrum_top_level_block](tasks/06_09_spectrum_top_level_block.md) — NEW: replace bad `report.ts` with proper Spectrum sidebar block (Domain entity, repository interface, Drizzle repo, mapper, use case, tRPC procedure)

---

<!-- INDEX SYNC: After completing or modifying any child task file,
update .specify/memory/index.md in the same turn. Keep the child
task checklist above in sync with actual file statuses. -->
