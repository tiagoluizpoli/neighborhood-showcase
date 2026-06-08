---
type: epic
name: "Panel Layout"
status: ready
blocked-by: null
---

## About this Epic

Panel sidebar/topbar redesign with 280px Radix Sidebar, nested navigation per role group, live badge counts for moderation queues (stubbed), SidebarFooter with user identity, language switcher, and theme toggle. Covers Module 23 of the root PRD.

## Context

Layout B from design session: user menu in SidebarFooter, top bar with SidebarTrigger + ModeToggle + LanguageSwitcher. Sidebar width 280px. Four nav groups: Provedor (Provider Assignment enabled=true), Moderação (approved MODERATOR), Administração (SYSTEM_MANAGER or ADMINISTRATOR), Reports (ADMINISTRATOR). PRD-v5 content merged into root PRD as Module 23.

## Child Tasks

- [ ] [06_01_sidebar_foundation](tasks/06_01_sidebar_foundation.md)
- [ ] [06_02_nested_navigation](tasks/06_02_nested_navigation.md)
- [ ] [06_03_sidebar_footer](tasks/06_03_sidebar_footer.md)
- [ ] [06_04_top_bar_controls](tasks/06_04_top_bar_controls.md)
- [ ] [06_05_sidebar_persistence](tasks/06_05_sidebar_persistence.md)
- [ ] [06_06_localization](tasks/06_06_localization.md)
- [ ] [06_07_badge_count_stubs](tasks/06_07_badge_count_stubs.md)
- [ ] [06_08_visibility_tests](tasks/06_08_visibility_tests.md)

---

<!-- INDEX SYNC: After completing or modifying any child task file,
update .specify/memory/index.md in the same turn. Keep the child
task checklist above in sync with actual file statuses. -->
