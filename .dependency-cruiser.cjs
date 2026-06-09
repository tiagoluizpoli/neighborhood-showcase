/**
 * dependency-cruiser config — enforces the Clean Architecture layer boundaries
 * declared in RULES.md §1.
 *
 * Layers (innermost first):
 *   Domain          apps/server/src/domain/**
 *   Application     apps/server/src/application/use-cases/**
 *   Infrastructure  apps/server/src/infrastructure/**
 *   Presentation    apps/server/src/presentation/**
 *
 * Dependency direction (the Golden Rule):
 *   Presentation -> Application -> Domain <- Infrastructure
 *   - Infrastructure and Presentation never depend on each other.
 *   - Infrastructure and Application never depend on each other.
 *
 * External library bans per layer (see RULES.md §1.2–1.5):
 *   - Domain: NO drizzle-orm, NO @neighborhood-showcase/db, NO @trpc/server, NO fastify
 *   - Application: NO drizzle-orm, NO @neighborhood-showcase/db, NO @trpc/server, NO fastify
 *   - Infrastructure: NO @trpc/server, NO fastify
 *   - Presentation: NO drizzle-orm, NO @neighborhood-showcase/db
 *
 * Test files (*.integration.test.ts, *.test.ts) are exempted (RULES.md §1.8):
 *   they may import from any layer for test setup. The TEST_FROM_EXEMPTION
 *   pathNot is applied to every rule's `from` clause.
 *
 * Severity: 'error' so violations break the build. Ralph will see the error
 * on the next iteration and be forced to fix it before marking the task
 * complete.
 */

// Test files are exempt from layer boundary rules (RULES.md §1.8).
const TEST_FROM_EXEMPTION = '\\.integration\\.test\\.ts$|\\.test\\.ts$';

const domainPath = '^apps/server/src/domain/.*\\.ts$';
const applicationPath = '^apps/server/src/application/.*\\.ts$';
const infrastructurePath = '^apps/server/src/infrastructure/.*\\.ts$';
const presentationPath = '^apps/server/src/presentation/.*\\.ts$';

module.exports = {
  forbidden: [
    // ─── Domain layer ────────────────────────────────────────────────────
    {
      name: 'no-domain-importing-application',
      severity: 'error',
      comment: 'Domain layer must not depend on Application.',
      from: { path: domainPath, pathNot: TEST_FROM_EXEMPTION },
      to: { path: '^apps/server/src/application/' },
    },
    {
      name: 'no-domain-importing-infrastructure',
      severity: 'error',
      comment: 'Domain layer must not depend on Infrastructure.',
      from: { path: domainPath, pathNot: TEST_FROM_EXEMPTION },
      to: { path: '^apps/server/src/infrastructure/' },
    },
    {
      name: 'no-domain-importing-presentation',
      severity: 'error',
      comment: 'Domain layer must not depend on Presentation.',
      from: { path: domainPath, pathNot: TEST_FROM_EXEMPTION },
      to: { path: '^apps/server/src/presentation/' },
    },
    {
      name: 'no-domain-importing-drizzle-orm',
      severity: 'error',
      comment: 'Domain layer must not import any ORM.',
      from: { path: domainPath, pathNot: TEST_FROM_EXEMPTION },
      to: { path: 'drizzle-orm' },
    },
    {
      name: 'no-domain-importing-db-package',
      severity: 'error',
      comment: 'Domain layer must not import the db client package.',
      from: { path: domainPath, pathNot: TEST_FROM_EXEMPTION },
      to: { path: '@neighborhood-showcase/db' },
    },
    {
      name: 'no-domain-importing-trpc',
      severity: 'error',
      comment: 'Domain layer must not import any transport framework.',
      from: { path: domainPath, pathNot: TEST_FROM_EXEMPTION },
      to: { path: '@trpc/server' },
    },
    {
      name: 'no-domain-importing-fastify',
      severity: 'error',
      comment: 'Domain layer must not import any HTTP framework.',
      from: { path: domainPath, pathNot: TEST_FROM_EXEMPTION },
      to: { path: 'fastify' },
    },

    // ─── Application layer (use-cases) ───────────────────────────────────
    {
      name: 'no-application-importing-infrastructure',
      severity: 'error',
      comment: 'Application layer must not depend on Infrastructure.',
      from: { path: applicationPath, pathNot: TEST_FROM_EXEMPTION },
      to: { path: '^apps/server/src/infrastructure/' },
    },
    {
      name: 'no-application-importing-presentation',
      severity: 'error',
      comment: 'Application layer must not depend on Presentation.',
      from: { path: applicationPath, pathNot: TEST_FROM_EXEMPTION },
      to: { path: '^apps/server/src/presentation/' },
    },
    {
      name: 'no-application-importing-drizzle-orm',
      severity: 'error',
      comment: 'Application layer must not import any ORM.',
      from: { path: applicationPath, pathNot: TEST_FROM_EXEMPTION },
      to: { path: 'drizzle-orm' },
    },
    {
      name: 'no-application-importing-db-package',
      severity: 'error',
      comment: 'Application layer must not import the db client package.',
      from: { path: applicationPath, pathNot: TEST_FROM_EXEMPTION },
      to: { path: '@neighborhood-showcase/db' },
    },
    {
      name: 'no-application-importing-trpc',
      severity: 'error',
      comment: 'Application layer must not import any transport framework.',
      from: { path: applicationPath, pathNot: TEST_FROM_EXEMPTION },
      to: { path: '@trpc/server' },
    },
    {
      name: 'no-application-importing-fastify',
      severity: 'error',
      comment: 'Application layer must not import any HTTP framework.',
      from: { path: applicationPath, pathNot: TEST_FROM_EXEMPTION },
      to: { path: 'fastify' },
    },

    // ─── Infrastructure layer ────────────────────────────────────────────
    {
      name: 'no-infrastructure-importing-application',
      severity: 'error',
      comment: 'Infrastructure layer must not depend on Application.',
      from: { path: infrastructurePath, pathNot: TEST_FROM_EXEMPTION },
      to: { path: '^apps/server/src/application/' },
    },
    {
      name: 'no-infrastructure-importing-presentation',
      severity: 'error',
      comment: 'Infrastructure layer must not depend on Presentation.',
      from: { path: infrastructurePath, pathNot: TEST_FROM_EXEMPTION },
      to: { path: '^apps/server/src/presentation/' },
    },
    {
      name: 'no-infrastructure-importing-trpc',
      severity: 'error',
      comment: 'Infrastructure layer must not import any transport framework.',
      from: { path: infrastructurePath, pathNot: TEST_FROM_EXEMPTION },
      to: { path: '@trpc/server' },
    },
    {
      name: 'no-infrastructure-importing-fastify',
      severity: 'error',
      comment: 'Infrastructure layer must not import any HTTP framework.',
      from: { path: infrastructurePath, pathNot: TEST_FROM_EXEMPTION },
      to: { path: 'fastify' },
    },

    // ─── Presentation layer ──────────────────────────────────────────────
    {
      name: 'no-presentation-importing-infrastructure',
      severity: 'error',
      comment:
        'Presentation layer must not depend on Infrastructure. Use use cases from the application layer instead.',
      from: { path: presentationPath, pathNot: TEST_FROM_EXEMPTION },
      to: { path: '^apps/server/src/infrastructure/' },
    },
    {
      name: 'no-presentation-importing-drizzle-orm',
      severity: 'error',
      comment:
        'Presentation layer must not import any ORM. Use repository interfaces from the domain layer instead.',
      from: { path: presentationPath, pathNot: TEST_FROM_EXEMPTION },
      to: { path: 'drizzle-orm' },
    },
    {
      name: 'no-presentation-importing-db-package',
      severity: 'error',
      comment:
        'Presentation layer must not import the db client. Use use cases from the application layer instead.',
      from: { path: presentationPath, pathNot: TEST_FROM_EXEMPTION },
      to: { path: '@neighborhood-showcase/db' },
    },
  ],
  options: {},
};
