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
  announcement,
  condominium,
  providerAssignment,
  providerProfile,
} from '@neighborhood-showcase/db/schema/showcase';
import { hashPassword } from 'better-auth/crypto';

async function seed() {
  console.log('Seeding test users directly via Drizzle...');

  // Wipe all test data — order matters (foreign keys first)
  await db.delete(announcement);
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
      image: null,
      role: 'USER',
      status: 'ACTIVE',
      cpfHash: 'cpf-hash-provider',
      language: 'pt-BR',
      phone: '+551****9999',
      theme: 'light',
    })
    .returning()) as [typeof user.$inferInsert];

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const [secondProviderUser] = (await db
    .insert(user)
    .values({
      id: 'seed-provider-other-id',
      name: 'Provider Other',
      email: 'provider.other@test.com',
      emailVerified: true,
      image: null,
      role: 'USER',
      status: 'ACTIVE',
      cpfHash: 'cpf-hash-provider-other',
      language: 'pt-BR',
      phone: '+551****9995',
      theme: 'light',
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

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const [avatarUser] = (await db
    .insert(user)
    .values({
      id: 'seed-avatar-id',
      name: 'Avatar Visual Test',
      email: 'avatar@test.com',
      emailVerified: true,
      image: 'http://localhost:3001/logo.png',
      role: 'USER',
      status: 'ACTIVE',
      cpfHash: 'cpf-hash-avatar',
      language: 'pt-BR',
      phone: '+551****9994',
      theme: 'light',
    })
    .returning()) as [typeof user.$inferInsert];

  // Full-branding provider — used by public-provider Playwright tests
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const [brandingUser] = (await db
    .insert(user)
    .values({
      id: 'seed-branding-id',
      name: 'Branding Visual Test',
      email: 'branding@test.com',
      emailVerified: true,
      image: null,
      role: 'USER',
      status: 'ACTIVE',
      cpfHash: 'cpf-hash-branding',
      language: 'pt-BR',
      phone: '+551****9993',
      theme: 'light',
    })
    .returning()) as [typeof user.$inferInsert];

  // Banned provider — used to verify the not-found path in public-provider tests
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const [bannedUser] = (await db
    .insert(user)
    .values({
      id: 'seed-banned-id',
      name: 'Banned Provider',
      email: 'banned@test.com',
      emailVerified: true,
      image: null,
      role: 'USER',
      status: 'BANNED',
      cpfHash: 'cpf-hash-banned',
      language: 'pt-BR',
      phone: '+551****9992',
      theme: 'light',
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
    providerId: 'credential',
    providerAccountId: 'provider@test.com',
    password: providerPw,
  });

  const secondProviderPw = await hashPassword('Test@1234');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.insert(account).values as any)({
    id: 'seed-account-provider-other',
    accountId: 'provider.other@test.com',
    userId: secondProviderUser.id,
    providerId: 'credential',
    providerAccountId: 'provider.other@test.com',
    password: secondProviderPw,
  });

  const adminPw = await hashPassword('Test@1234');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.insert(account).values as any)({
    id: 'seed-account-admin',
    accountId: 'admin@test.com',
    userId: adminUser.id,
    providerId: 'credential',
    providerAccountId: 'admin@test.com',
    password: adminPw,
  });

  const moderatorPw = await hashPassword('Test@1234');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.insert(account).values as any)({
    id: 'seed-account-moderator',
    accountId: 'moderator@test.com',
    userId: moderatorUser.id,
    providerId: 'credential',
    providerAccountId: 'moderator@test.com',
    password: moderatorPw,
  });

  const avatarPw = await hashPassword('Test@1234');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.insert(account).values as any)({
    id: 'seed-account-avatar',
    accountId: 'avatar@test.com',
    userId: avatarUser.id,
    providerId: 'credential',
    providerAccountId: 'avatar@test.com',
    password: avatarPw,
  });

  const brandingPw = await hashPassword('Test@1234');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.insert(account).values as any)({
    id: 'seed-account-branding',
    accountId: 'branding@test.com',
    userId: brandingUser.id,
    providerId: 'credential',
    providerAccountId: 'branding@test.com',
    password: brandingPw,
  });

  const bannedPw = await hashPassword('Test@1234');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.insert(account).values as any)({
    id: 'seed-account-banned',
    accountId: 'banned@test.com',
    userId: bannedUser.id,
    providerId: 'credential',
    providerAccountId: 'banned@test.com',
    password: bannedPw,
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

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const [unverifiedUser] = (await db
    .insert(user)
    .values({
      id: 'seed-unverified-id',
      name: 'Unverified Test',
      email: 'unverified@test.com',
      emailVerified: false,
      image: null,
      role: 'USER',
      status: 'ACTIVE',
      cpfHash: 'cpf-hash-unverified',
      language: 'pt-BR',
      phone: '+551****9996',
      theme: 'light',
    })
    .returning()) as [typeof user.$inferInsert];

  const unverifiedPw = await hashPassword('Test@1234');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.insert(account).values as any)({
    id: 'seed-account-unverified',
    accountId: 'unverified@test.com',
    userId: unverifiedUser.id,
    providerId: 'credential',
    providerAccountId: 'unverified@test.com',
    password: unverifiedPw,
  });

  // Assign provider@test.com as APPROVED PROVIDER (type = RESIDENT in the schema enum)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.insert(providerAssignment) as any).values([
    {
      id: 'provider-assignment-1',
      providerId: providerUser.id,
      condominiumId: condo1.id,
      type: 'RESIDENT',
      status: 'APPROVED',
      unitInfo: 'Provider HQ',
    },
    {
      id: 'provider-assignment-other-1',
      providerId: secondProviderUser.id,
      condominiumId: condo1.id,
      type: 'RESIDENT',
      status: 'APPROVED',
      unitInfo: 'Provider Other HQ',
    },
    {
      id: 'provider-assignment-branding',
      providerId: brandingUser.id,
      condominiumId: condo1.id,
      type: 'RESIDENT',
      status: 'APPROVED',
      unitInfo: 'Branding HQ',
    },
  ]);

  // Create provider_profile rows for seeded providers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.insert(providerProfile) as any).values([
    {
      providerId: providerUser.id,
      displayName: 'Provider Test',
      avatarUrl: null,
      companyName: null,
      tradeName: null,
      logoUrl: null,
      bannerUrl: null,
      publicDescription: null,
      socialLinks: {},
      isProviderVisible: true,
    },
    {
      providerId: secondProviderUser.id,
      displayName: 'Provider Other',
      avatarUrl: null,
      companyName: null,
      tradeName: null,
      logoUrl: null,
      bannerUrl: null,
      publicDescription: null,
      socialLinks: {},
      isProviderVisible: true,
    },
    {
      // Full-branding provider: banner + logo + company + social links
      providerId: brandingUser.id,
      displayName: 'Branding Visual Test',
      avatarUrl: null,
      companyName: 'Branding Ltda.',
      tradeName: 'Branding Co.',
      logoUrl: 'https://placehold.co/200x200/png',
      bannerUrl: 'https://placehold.co/1200x400/png',
      publicDescription:
        'Empresa especializada em serviços de branding para condominios.',
      socialLinks: { whatsapp: '+5511888880000', instagram: '@brandingco' },
      isProviderVisible: true,
    },
    {
      // Banned provider: profile exists but user is BANNED — page must show not-found
      providerId: bannedUser.id,
      displayName: 'Banned Provider',
      avatarUrl: null,
      companyName: null,
      tradeName: null,
      logoUrl: null,
      bannerUrl: null,
      publicDescription: null,
      socialLinks: {},
      isProviderVisible: true,
    },
  ]);

  await db.insert(announcement).values([
    {
      id: 'seed-announcement-active',
      providerId: providerUser.id,
      providerAssignmentId: 'provider-assignment-1',
      condominiumId: condo1.id,
      title: 'Bolos Caseiros Premium',
      description:
        'Bolos artesanais sob encomenda para festas e encontros do condomínio.',
      imageUrl:
        'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=80',
      categoryId: 'cat-servicos',
      tags: ['bolo', 'doces'],
      contactLinks: { whatsapp: '+5511999999999' },
      showVerifiedBadge: true,
      status: 'ACTIVE',
      expiresAt: new Date('2026-07-10T12:00:00.000Z'),
    },
    {
      id: 'seed-announcement-draft',
      providerId: providerUser.id,
      providerAssignmentId: 'provider-assignment-1',
      condominiumId: condo1.id,
      title: 'Aulas de Violão para Iniciantes',
      description:
        'Aulas presenciais para moradores com foco em repertório popular.',
      imageUrl:
        'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=1200&q=80',
      categoryId: 'cat-servicos',
      tags: ['música'],
      contactLinks: { instagram: '@provider.test' },
      showVerifiedBadge: false,
      status: 'DRAFT',
    },
    {
      id: 'seed-announcement-expired',
      providerId: providerUser.id,
      providerAssignmentId: 'provider-assignment-1',
      condominiumId: condo1.id,
      title: 'Consultoria de Organização',
      description:
        'Sessões rápidas para organizar armários, depósitos e áreas de serviço.',
      imageUrl:
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80',
      categoryId: 'cat-servicos',
      tags: ['organização'],
      contactLinks: { website: 'https://example.com/provider-test' },
      showVerifiedBadge: false,
      status: 'EXPIRED',
      expiresAt: new Date('2026-05-10T12:00:00.000Z'),
    },
    {
      id: 'seed-announcement-suspended',
      providerId: providerUser.id,
      providerAssignmentId: 'provider-assignment-1',
      condominiumId: condo1.id,
      title: 'Buffet para Eventos',
      description:
        'Buffet completo para aniversários e confraternizações com cardápio variado.',
      imageUrl:
        'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80',
      categoryId: 'cat-servicos',
      tags: ['eventos'],
      contactLinks: { whatsapp: '+551****8888' },
      showVerifiedBadge: false,
      status: 'SUSPENDED',
      suspensionReason:
        'Aguardando revisão de conteúdo pelo time de moderação.',
    },
    {
      id: 'seed-announcement-other-provider',
      providerId: secondProviderUser.id,
      providerAssignmentId: 'provider-assignment-other-1',
      condominiumId: condo1.id,
      title: 'Jardinagem Express',
      description:
        'Manutenção rápida de jardins e vasos para áreas privativas e varandas.',
      imageUrl:
        'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=1200&q=80',
      categoryId: 'cat-servicos',
      tags: ['jardim'],
      contactLinks: { instagram: '@provider.other' },
      showVerifiedBadge: false,
      status: 'ACTIVE',
      expiresAt: new Date('2026-07-20T12:00:00.000Z'),
    },
  ]);

  console.log(
    '✅ Seed complete: provider@test.com, admin@test.com, moderator@test.com, branding@test.com, banned@test.com (password: Test@1234)',
  );
  console.log(
    '   moderator@test.com has APPROVED MODERATOR assignments for 2 condos.',
  );
  console.log(
    '   branding@test.com: full-branding provider with banner/logo/social links.',
  );
  console.log(
    '   banned@test.com: BANNED user for public-provider not-found test.',
  );
}

seed().catch(console.error);
