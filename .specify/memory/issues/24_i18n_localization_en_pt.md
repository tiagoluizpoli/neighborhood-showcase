## What to build

Implement complete i18n support across the frontend client:
1. Install `i18next`, `react-i18next`, and `i18next-browser-languagedetector` in `apps/web/`.
2. Configure i18n settings to support English (`en`) and Portuguese (`pt`).
3. Set up translation resource files (e.g. `public/locales/en/translation.json` and `public/locales/pt/translation.json`).
4. Replace all user-facing hardcoded text, labels, page titles, buttons, notifications, and menus with translation keys using the `useTranslation` hook or `<Trans>` component.
5. Create a language switcher dropdown in the header next to the theme toggle.
6. Enforce that all new copy added must be added to translation files rather than inline in code.

## Acceptance criteria

- [ ] react-i18next dependencies installed and configured in frontend.
- [ ] Complete translation JSON resource folders created for `en` and `pt`.
- [ ] All header navigation options, user profiles, dashboard labels, and payment flows translate properly based on language choice.
- [ ] User can switch between English and Portuguese using a header language dropdown.
- [ ] No hardcoded user-facing strings are present in frontend views (verified via build checks/types).

## Blocked by

- [.specify/memory/issues/20_permission_navigation_localization.md](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/issues/20_permission_navigation_localization.md)
