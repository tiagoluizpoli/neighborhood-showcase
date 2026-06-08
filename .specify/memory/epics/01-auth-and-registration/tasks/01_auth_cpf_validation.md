---
type: feature
epic: 01-auth-and-registration
status: completed
blocked-by: null
---

## What to Build

Implement the onboarding and authentication flow (`/auth`), allowing users to register or log in. It enforces a mathematical validation of the provider's CPF and checks it against a global blacklist hash (`blacklisted_identifiers`) before completing registration.

## Acceptance Criteria

- [x] Swappable tabs ("Entrar" / "Criar Conta") on `/auth` screen.
- [x] Registration form collects Full Legal Name, Email, Password, Phone Number, and CPF.
- [x] Front-end CPF validation rejects structurally invalid CPFs (fails digits/format checks).
- [x] Registration hashes the CPF via SHA-256 and blocks creation if the hash exists in `blacklisted_identifiers`.
- [x] Redirects new registered users without condominium assignments to `/dashboard/condo-setup`.
- [x] Unit tests for CPF structure validator and Integration tests for blacklist match registration blocks.

## Sub-Tasks

_Sub-tasks will be defined when this task is executed._

---

<!-- INDEX SYNC: After completing a sub-task, update the parent
epic.md child task checklist AND .specify/memory/index.md in the
same turn. Never skip this sync step. -->
