import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from 'bun:test';
import { db } from '@neighborhood-showcase/db';
import { user } from '@neighborhood-showcase/db/schema/auth';
import {
  condominium,
  provider,
  providerAssignment,
  providerProfile,
} from '@neighborhood-showcase/db/schema/showcase';
import { appRouter } from './index';

describe('ProviderProfile Router Integration Tests', () => {
  const userAId = 'ppr-user-a-id';
  const userBId = 'ppr-user-b-id';
  const providerAId = 'ppr-provider-a-id';
  const providerBId = 'ppr-provider-b-id';
  const condoId = 'ppr-condo-id';
  const assignmentId = 'ppr-assignment-id';

  beforeAll(async () => {
    // Cascade order: provider → providerProfile, providerAssignment; condo → announcement
    await db.delete(condominium);
    await db.delete(user);

    await db.insert(user).values([
      {
        id: userAId,
        name: 'Provider User A',
        email: 'usera@ppr.test',
        emailVerified: true,
        role: 'USER',
        status: 'ACTIVE',
      },
      {
        id: userBId,
        name: 'Provider User B',
        email: 'userb@ppr.test',
        emailVerified: true,
        role: 'USER',
        status: 'ACTIVE',
      },
    ]);

    // Distinct provider PKs from user IDs — the new model
    await db.insert(provider).values([
      { id: providerAId, ownerId: userAId },
      { id: providerBId, ownerId: userBId },
    ]);

    await db.insert(condominium).values({
      id: condoId,
      name: 'PPR Towers',
      city: 'Florianópolis',
      state: 'SC',
      cep: '88000000',
      createdBy: userAId,
      status: 'APPROVED',
    });

    // APPROVED RESIDENT assignment for providerA — required by assertProviderApprovedStanding
    await db.insert(providerAssignment).values({
      id: assignmentId,
      providerId: providerAId,
      condominiumId: condoId,
      type: 'RESIDENT',
      status: 'APPROVED',
      unitInfo: 'Apt 101',
    });
  });

  afterAll(async () => {
    await db.delete(condominium);
    await db.delete(user);
  });

  beforeEach(async () => {
    await db.delete(providerProfile);
  });

  const createCaller = (userId: string) =>
    appRouter.createCaller({
      auth: null,
      session: {
        session: {
          id: `sess-ppr-${userId}`,
          userId,
          token: `tok-ppr-${userId}`,
          expiresAt: new Date(Date.now() + 3600000),
          createdAt: new Date(),
          updatedAt: new Date(),
          userAgent: null,
          ipAddress: null,
        },
        user: {
          id: userId,
          name: 'Test User',
          email: `${userId}@ppr.test`,
          emailVerified: true,
          role: 'USER' as const,
          status: 'ACTIVE' as const,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    });

  // --- Owner allowed (ownership guard passes) ---

  test('(a) owner can get their own profile after update', async () => {
    const callerA = createCaller(userAId);

    await callerA.providerProfile.update({
      providerId: providerAId,
      displayName: 'Provider A Profile',
      companyName: 'Company A',
      tradeName: 'TradeA',
      publicDescription: 'This is a description for provider A.',
      primaryPhone: '5511999999999',
      contactMetadata: { email: 'contact@a.com' },
      isProviderVisible: true,
    });

    const result = await callerA.providerProfile.get({
      providerId: providerAId,
    });

    expect(result.displayName).toBe('Provider A Profile');
    expect(result.companyName).toBe('Company A');
    expect(result.tradeName).toBe('TradeA');
    expect(result.publicDescription).toBe(
      'This is a description for provider A.',
    );
    expect(result.socialLinks.whatsapp).toBe('5511999999999');
    expect(result.socialLinks.email).toBe('contact@a.com');
    expect(result.isProviderVisible).toBe(true);
  });

  test('(b) owner update persists across multiple writes', async () => {
    const callerA = createCaller(userAId);

    await callerA.providerProfile.update({
      providerId: providerAId,
      displayName: 'First Name',
    });

    const first = await callerA.providerProfile.get({
      providerId: providerAId,
    });
    expect(first.displayName).toBe('First Name');

    await callerA.providerProfile.update({
      providerId: providerAId,
      displayName: 'Updated Name',
      publicDescription: 'Updated description text.',
      isProviderVisible: false,
    });

    const second = await callerA.providerProfile.get({
      providerId: providerAId,
    });
    expect(second.displayName).toBe('Updated Name');
    expect(second.publicDescription).toBe('Updated description text.');
    expect(second.isProviderVisible).toBe(false);
    expect(second.companyName).toBeNull();
  });

  // --- Non-owner denied (ownership guard: FORBIDDEN) ---

  test('(c) non-owner get is denied with FORBIDDEN', async () => {
    const callerA = createCaller(userAId);

    await expect(
      callerA.providerProfile.get({ providerId: providerBId }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  test('(d) non-owner update is denied with FORBIDDEN', async () => {
    const callerA = createCaller(userAId);

    await expect(
      callerA.providerProfile.update({
        providerId: providerBId,
        displayName: 'Hijack Attempt',
      }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  // --- APPROVED standing guard (assertProviderApprovedStanding) ---

  test('(e) provider without APPROVED assignment is denied create announcement with FORBIDDEN', async () => {
    // providerB has no assignment — assertProviderApprovedStanding must throw FORBIDDEN
    const callerB = createCaller(userBId);

    await expect(
      callerB.announcement.create({
        providerId: providerBId,
        providerAssignmentId: 'nonexistent-assignment',
        title: 'My Announcement',
        description: 'This is a minimal test announcement description.',
        imageUrl: 'http://localhost/img.jpg',
        categoryId: 'cat-alimentacao',
        tags: [],
        showVerifiedBadge: false,
      }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  test('(f) owner with APPROVED assignment passes the standing guard and creates announcement', async () => {
    // providerA has APPROVED RESIDENT assignment — guard passes, use case runs
    const callerA = createCaller(userAId);

    const result = await callerA.announcement.create({
      providerId: providerAId,
      providerAssignmentId: assignmentId,
      title: 'My Announcement',
      description: 'This is a minimal test announcement description.',
      imageUrl: 'http://localhost/img.jpg',
      categoryId: 'cat-alimentacao',
      tags: [],
      contact: { mode: 'inherit', custom: null },
      showVerifiedBadge: false,
    });

    expect(result).toBeDefined();
    expect(result.providerId).toBe(providerAId);
  });

  // --- Input validation (Zod guard, pre-auth) ---

  test('(g) displayName with length < 3 is rejected', async () => {
    const callerA = createCaller(userAId);

    await expect(
      callerA.providerProfile.update({
        providerId: providerAId,
        displayName: 'AB',
      }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  test('(h) publicDescription with length > 500 is rejected', async () => {
    const callerA = createCaller(userAId);
    const longDesc = 'A'.repeat(501);

    await expect(
      callerA.providerProfile.update({
        providerId: providerAId,
        publicDescription: longDesc,
      }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  // --- Repeatable create-provider flow (T-20-05/ST-04) ---

  test('(i) create mints a new owned provider with a seeded default profile', async () => {
    const callerA = createCaller(userAId);

    const created = await callerA.providerProfile.create({
      displayName: 'Brand New Provider',
    });

    // A fresh providerId distinct from the caller's session id and any seed PK.
    expect(created.providerId).toBeDefined();
    expect(created.providerId).not.toBe(userAId);
    expect(created.providerId).not.toBe(providerAId);

    // The default profile must exist so the `$providerId` panel ownership gate
    // (which reads providerProfile.get) lets the caller land in the new context
    // instead of bouncing on NOT_FOUND.
    const profile = await callerA.providerProfile.get({
      providerId: created.providerId,
    });
    expect(profile.displayName).toBe('Brand New Provider');
    // Seeded hidden until the owner configures it.
    expect(profile.isProviderVisible).toBe(false);
  });

  test('(j) create rejects a displayName shorter than 3 chars', async () => {
    const callerA = createCaller(userAId);

    await expect(
      callerA.providerProfile.create({ displayName: 'AB' }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  test('(k) a created provider can request a RESIDENT assignment via assignment.request', async () => {
    const callerA = createCaller(userAId);

    const created = await callerA.providerProfile.create({
      displayName: 'Second Provider For UserA',
    });

    const assignment = await callerA.assignment.request({
      providerId: created.providerId,
      condominiumId: condoId,
      unitInfo: 'Apt 202',
    });

    expect(assignment.providerId).toBe(created.providerId);
    expect(assignment.status).toBe('PENDING');
  });

  test('(l) assignment.request with a providerId the caller does not own is FORBIDDEN', async () => {
    const callerA = createCaller(userAId);

    await expect(
      callerA.assignment.request({
        providerId: providerBId,
        condominiumId: condoId,
        unitInfo: 'Apt 303',
      }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });
});
