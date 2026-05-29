## What to build

Implement the onboarding and authentication flow (`/auth`), allowing users to register or log in. It enforces a mathematical validation of the provider's CPF and checks it against a global blacklist hash (`blacklisted_identifiers`) before completing registration.

## Acceptance criteria

- [ ] Swappable tabs ("Entrar" / "Criar Conta") on `/auth` screen.
- [ ] Registration form collects Full Legal Name, Email, Password, Phone Number, and CPF.
- [ ] Front-end CPF validation rejects structurally invalid CPFs (fails digits/format checks).
- [ ] Registration hashes the CPF via SHA-256 and blocks creation if the hash exists in `blacklisted_identifiers`.
- [ ] Redirects new registered users without condominium assignments to `/dashboard/condo-setup`.
- [ ] Unit tests for CPF structure validator and Integration tests for blacklist match registration blocks.

## Blocked by

None - can start immediately
