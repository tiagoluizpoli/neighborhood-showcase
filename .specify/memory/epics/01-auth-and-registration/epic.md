---
type: epic
name: "Auth and Registration"
status: completed
blocked-by: null
---

## About this Epic

Authentication and identity management for the platform. Handles user registration, CPF validation, login/logout, and session management.

## Context

Users register at /auth with email, password, phone, and CPF. CPF is hashed (SHA-256) and checked against a global blacklist before account creation. New users without approved assignments land on /dashboard/condo-setup.

## Child Tasks

- [x] [01_auth_cpf_validation](tasks/01_auth_cpf_validation.md)

---

<!-- INDEX SYNC: After completing or modifying any child task file,
update .specify/memory/index.md in the same turn. Keep the child
task checklist above in sync with actual file statuses. -->
