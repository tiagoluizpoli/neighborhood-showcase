/**
 * Dev seed: creates test users via the better-auth sign-up API so both
 * user and account records are properly linked with correct password hashes.
 *
 * Run: cd apps/server && bun run src/infrastructure/db/seed.ts
 */
import { auth } from '@neighborhood-showcase/auth';
import { hashCPF } from '@neighborhood-showcase/auth/utils/cpf';
import { db } from '@neighborhood-showcase/db';
import { account, user } from '@neighborhood-showcase/db/schema/auth';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('Seeding test users via better-auth API...');

  // Delete any existing test accounts so we start clean
  await db.delete(account).where(eq(account.accountId, 'provider@test.com'));
  await db.delete(account).where(eq(account.accountId, 'admin@test.com'));
  await db.delete(user).where(eq(user.email, 'provider@test.com'));
  await db.delete(user).where(eq(user.email, 'admin@test.com'));

  // Create users via sign-up API (handles password hashing + account creation).
  // The before-hook expects cpfHash, role, and status in the body — pre-hash
  // the CPF here so it arrives in the shape the hook's Zod schema requires.
  const users: Array<{ email: string; name: string; cpf: string }> = [
    { email: 'provider@test.com', name: 'Provider Test', cpf: '11144477735' },
    { email: 'admin@test.com', name: 'Admin Test', cpf: '12345678909' },
  ];
  for (const u of users) {
    await auth.api.signUpEmail({
      body: {
        email: u.email,
        password: 'Test@1234',
        name: u.name,
        cpfHash: hashCPF(u.cpf),
        role: 'USER',
        status: 'ACTIVE',
        phone: '+5511999999999',
      },
    });
    console.log(`✅ Created ${u.email}`);
  }

  // Promote admin to ADMINISTRATOR role
  await db
    .update(user)
    .set({ role: 'ADMINISTRATOR' })
    .where(eq(user.email, 'admin@test.com'));
  console.log(
    '✅ Seed complete: provider@test.com and admin@test.com (password: Test@1234)',
  );
}

seed().catch(console.error);
