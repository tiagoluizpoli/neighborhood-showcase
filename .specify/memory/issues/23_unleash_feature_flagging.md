## What to build

Integrate Unleash feature flagging SDK across the application:
1. Install client and server SDKs for Unleash (e.g. `unleash-client` on server, `@unleash/proxy-client-react` or similar on frontend).
2. Configure environment variables for Unleash proxy / API endpoints.
3. Integrate the Unleash provider in `apps/web/src/routes/__root.tsx` or main client bootstrap.
4. Implement a server-side feature toggle checker utility (or middleware).
5. Wrap new experimental features using the toggle client/server checks (e.g. enabling specific upcoming modules dynamically).

## Acceptance criteria

- [ ] Unleash dependencies are installed and configured via environment variables.
- [ ] Unleash Client SDK is initialized on the backend.
- [ ] Unleash Proxy Client React provider wraps the frontend root component.
- [ ] Feature toggle client and server helpers are tested and functional.
- [ ] No hardcoded bypasses remain for flags in production environments.

## Blocked by

- [.specify/memory/issues/19_styling_simplification.md](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/issues/19_styling_simplification.md)
