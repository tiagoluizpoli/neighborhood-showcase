---
type: epic
name: "i18n Namespace Fix and Navigation Hierarchy"
status: ready
blocked-by:10-playwright-setup
---

## About this Epic

Fix i18n namespace mismatch, remove hardcoded Portuguese strings, flatten Provider navigation, and fix Spectrum item hierarchy. All UI changes under this epic require Playwright tests.

## Context

PRD-v6. Ralph Loop iteration 37 left defects: `useTranslation('sidebar')` requests non-existent namespace, hardcoded strings in announcements.tsx and configuration.tsx, wrong Provider nav hierarchy (SidebarMenuSub vs flat siblings), and Spectrum item at root level.

## Child Tasks

- [ ] 01_i18n_namespace_fix.md
- [ ] 02_provider_navigation_flatten.md
- [ ] 03_spectrum_item_hierarchy_fix.md

---

<!-- INDEX SYNC: After completing or modifying any child task file, update .specify/memory/index.md in the same turn. Keep the child task checklist above in sync with actual file statuses.</!-->
