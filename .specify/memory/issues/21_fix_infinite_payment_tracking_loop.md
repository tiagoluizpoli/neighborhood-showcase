## What to build

Fix the infinite loop of API requests from the frontend to the backend when generating Pix payment intents and tracking impressions:
1. Destructure the referentially stable `mutate` function from the payment details and event tracking mutations.
2. Replace the unstable mutation objects with the stable `mutate` callbacks in the dependency arrays of the `useEffect` hooks.

## Acceptance criteria

- [x] Accessing `/dashboard/anuncios/:id/pagamento` triggers only one payment intent generation call on component mount.
- [x] Accessing `/anuncios/:id` triggers only one tracking impression event call on component mount (once data is loaded).
- [x] Both components compile, pass linting/formatting checks, and all test suites remain completely green.

## Blocked by

- [.specify/memory/issues/20_permission_navigation_localization.md](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/issues/20_permission_navigation_localization.md)
