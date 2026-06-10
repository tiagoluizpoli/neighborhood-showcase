/**
 * Dev seed: creates test users + condos + assignments directly via Drizzle.
 * Bypasses better-auth API (which queries bad columns on drifted schema).
 *
 * Run: cd apps/server && bun run src/infrastructure/db/seed.ts
 * @ts-nocheck — drizzle schema types drift from live DB; runtime is correct.
 */
import { db } from '@neighborhood-showcase/db';
import { account, user } from '@neighborhood-showcase/db/schema/auth';
import {
  condominium,
  providerAssignment,
} from '@neighborhood-showcase/db/schema/showcase';

async function seed() {
  console.log('Seeding test users directly via Drizzle...');

  // Wipe all test data — order matters (foreign keys first)
  await db.delete(providerAssignment);
  await db.delete(condominium);
  await db.delete(account);
  await db.delete(user);

  // Insert users directly (bypasses better-auth which has a bad query on old schema)
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const [providerUser] = (await db
    .insert(user)
    .values({
      id: 'seed-provider-id',
      name: 'Provider Test',
      email: 'provider@test.com',
      emailVerified: true,
      role: 'USER',
      status: 'ACTIVE',
      cpfHash: 'cpf-hash-provider',
      phone: '+551****9999',
    })
    .returning()) as [typeof user.$inferInsert];

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const [adminUser] = (await db
    .insert(user)
    .values({
      id: 'seed-admin-id',
      name: 'Admin Test',
      email: 'admin@test.com',
      emailVerified: true,
      role: 'ADMINISTRATOR',
      status: 'ACTIVE',
      cpfHash: 'cpf-hash-admin',
      phone: '+551****9998',
    })
    .returning()) as [typeof user.$inferInsert];

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const [moderatorUser] = (await db
    .insert(user)
    .values({
      id: 'seed-moderator-id',
      name: 'Moderator Test',
      email: 'moderator@test.com',
      emailVerified: true,
      role: 'USER',
      status: 'ACTIVE',
      cpfHash: 'cpf-hash-moderator',
      phone: '+551****9997',
    })
    .returning()) as [typeof user.$inferInsert];

  // Insert account records — schema has extra columns (providerAccountId, idToken)
  // that don't exist in the live DB. Cast to any to bypass the type mismatch.
  const providerPw = await hashPassword('Test@1234');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.insert(account).values as any)({
    id: 'seed-account-provider',
    accountId: 'provider@test.com',
    userId: providerUser.id,
    providerId: 'email',
    providerAccountId: 'provider@test.com',
    password: providerPw,
  });

  const adminPw = await hashPassword('Test@1234');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.insert(account).values as any)({
    id: 'seed-account-admin',
    accountId: 'admin@test.com',
    userId: adminUser.id,
    providerId: 'email',
    providerAccountId: 'admin@test.com',
    password: adminPw,
  });

  const moderatorPw = await hashPassword('Test@1234');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.insert(account).values as any)({
    id: 'seed-account-moderator',
    accountId: 'moderator@test.com',
    userId: moderatorUser.id,
    providerId: 'email',
    providerAccountId: 'moderator@test.com',
    password: moderatorPw,
  });

  // Create test condos
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const [condo1] = (await db
    .insert(condominium)
    .values({
      id: 'moderator-condo-1',
      name: 'Condomínio Teste Moderador',
      city: 'São Paulo',
      state: 'SP',
      cep: '01001000',
      createdBy: moderatorUser.id,
      status: 'APPROVED',
    })
    .returning()) as [typeof condominium.$inferInsert];

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const [condo2] = (await db
    .insert(condominium)
    .values({
      id: 'moderator-condo-2',
      name: 'Segundo Condomínio',
      city: 'Rio de Janeiro',
      state: 'RJ',
      cep: '20000000',
      createdBy: moderatorUser.id,
      status: 'APPROVED',
    })
    .returning()) as [typeof condominium.$inferInsert];

  // Assign moderator@test.com to both condos as APPROVED MODERATOR
  await db.insert(providerAssignment).values([
    {
      id: 'moderator-assignment-1',
      providerId: moderatorUser.id,
      condominiumId: condo1.id,
      type: 'MODERATOR',
      status: 'APPROVED',
      unitInfo: 'Unit 101',
    },
    {
      id: 'moderator-assignment-2',
      providerId: moderatorUser.id,
      condominiumId: condo2.id,
      type: 'MODERATOR',
      status: 'APPROVED',
      unitInfo: 'Unit 202',
    },
  ]);

  console.log(
    '✅ Seed complete: provider@test.com, admin@test.com, moderator@test.com (password: Test@1234)',
  );
  console.log(
    '   moderator@test.com has APPROVED MODERATOR assignments for 2 condos.',
  );
}

// Minimal password hasher using Web API (available in Bun)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'neighborhood-showcase-dev-salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

seed().catch(console.error);
