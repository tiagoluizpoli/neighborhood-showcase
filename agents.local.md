# Local Agent Context

## Project Architecture
Monorepo using Turborepo and Bun.
- `apps/server`: Fastify API server running tRPC and Better Auth handlers.
- `apps/web`: React client with TanStack Router/Query, consuming the tRPC client.
- `packages/api`: Thin helper / type definition package for shared contract.
- `packages/db`: Drizzle schemas and client config.
- `packages/ui`: Shared design UI components.

## Tech Stack
- Runtime: Bun
- Package Manager: pnpm / workspace
- Framework: Fastify, React, Vite
- Styling: Tailwind CSS
- Database: Postgres with Drizzle ORM

## Specific Guidelines
- Named exports only.
- Files must be ≤ 300 lines.
- Follow Clean Architecture: domain entities and use cases live inside application services.
- Parameter Objects: Always use object parameters/interfaces for use cases and repositories functions instead of loose parameters (e.g. use CreateTodoInput/CreateTodoRepositoryInput).
- Zero Lint/Type Issues: Always run linting (`bun run check`) and type-checking (`bun run check-types`) after every task implementation. Ensure that zero warnings or errors are left behind (treat warnings as blocker errors).

## Current Plan Reference
- [Implementation Plan](file:///home/tiago/.gemini/antigravity/brain/d3901363-a61e-4ba6-b047-50c0c4b98485/implementation_plan.md)
