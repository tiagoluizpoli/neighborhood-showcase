import { beforeAll, beforeEach, describe, expect, test } from 'bun:test';
import { db } from '@neighborhood-showcase/db';
import { user } from '@neighborhood-showcase/db/schema/auth';
import {
  assignment,
  condominium,
  roleChangeLog,
} from '@neighborhood-showcase/db/schema/showcase';
import { eq } from 'drizzle-orm';
import { appRouter } from './index';

describe('Admin role management Integration Tests', () => {
  const adminId = 'arm-admin-id';
  const providerId = 'arm-provider-id';
  const provider2Id = 'arm-provider2-id';
  const condoId = 'arm-condo-id';

  beforeAll(async () => {
    await db.delete(roleChangeLog);
    await db.delete(assignment);
    await db.delete(condominium);
    await db.delete(user);

    await db.insert(user).values([
      {
        id: adminId,
        name: 'Admin One',
        email: 'admin1@arm.test',
        emailVerified: true,
        role: 'SYSTEM_MANAGER',
        status: 'ACTIVE',
      },
      {
        id: providerId,
        name: 'Provider One',
        email: 'provider1@arm.test',
        emailVerified: true,
        role: 'PROVIDER',
        status: 'ACTIVE',
      },
      {
        id: provider2Id,
        name: 'Provider Two',
        email: 'provider2@arm.test',
        emailVerified: true,
        role: 'PROVIDER',
        status: 'ACTIVE',
      },
    ]);

    await db.insert(condominium).values({
      id: condoId,
      name: 'Condo Alpha',
      city: 'Florianópolis',
      state: 'SC',
      cep: '88000000',
      createdBy: adminId,
      status: 'APPROVED',
    });
  });

  beforeEach(async () => {
    // Reset audit log and provider roles between tests for clean assertions
    await db.delete(roleChangeLog);
    await db.delete(assignment);
    await db
      .update(user)
      .set({ role: 'PROVIDER', isProviderVisible: true })
      .where(eq(user.id, providerId));
    await db
      .update(user)
      .set({ role: 'PROVIDER', isProviderVisible: true })
      .where(eq(user.id, provider2Id));
  });

  const createAdminCaller = () =>
    appRouter.createCaller({
      auth: null,
      session: {
        session: {
          id: 'sess-arm-admin',
          userId: adminId,
          token: 'tok-arm-admin',
          expiresAt: new Date(Date.now() + 3600000),
          createdAt: new Date(),
          updatedAt: new Date(),
          userAgent: null,
          ipAddress: null,
        },
        user: {
          id: adminId,
          name: 'Admin One',
          email: 'admin1@arm.test',
          emailVerified: true,
          role: 'SYSTEM_MANAGER' as const,
          status: 'ACTIVE' as const,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    });

  const createProviderCaller = () =>
    appRouter.createCaller({
      auth: null,
      session: {
        session: {
          id: 'sess-arm-provider',
          userId: providerId,
          token: 'tok-arm-provider',
          expiresAt: new Date(Date.now() + 3600000),
          createdAt: new Date(),
          updatedAt: new Date(),
          userAgent: null,
          ipAddress: null,
        },
        user: {
          id: providerId,
          name: 'Provider One',
          email: 'provider1@arm.test',
          emailVerified: true,
          role: 'PROVIDER' as const,
          status: 'ACTIVE' as const,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    });

  // --- promoteToSystemManager ---

  test('promoteToSystemManager: promotes PROVIDER to SYSTEM_MANAGER', async () => {
    const caller = createAdminCaller();
    const result = await caller.admin.promoteToSystemManager({
      targetUserId: providerId,
    });
    expect(result.success).toBe(true);

    const [updated] = await db
      .select()
      .from(user)
      .where(eq(user.id, providerId))
      .limit(1);
    expect(updated).toBeDefined();
    // biome-ignore lint/style/noNonNullAssertion: guarded by toBeDefined above
    expect(updated!.role).toBe('SYSTEM_MANAGER');
  });

  test('promoteToSystemManager: writes audit log entry', async () => {
    const caller = createAdminCaller();
    await caller.admin.promoteToSystemManager({ targetUserId: providerId });

    const logs = await db.select().from(roleChangeLog);
    expect(logs.length).toBe(1);
    const log = logs[0];
    expect(log).toBeDefined();
    // biome-ignore lint/style/noNonNullAssertion: guarded by toBeDefined above
    expect(log!.actorId).toBe(adminId);
    expect(log?.targetUserId).toBe(providerId);
    expect(log?.previousRole).toBe('PROVIDER');
    expect(log?.newRole).toBe('SYSTEM_MANAGER');
    expect(log?.condominiumId).toBeNull();
  });

  test('promoteToSystemManager: rejects non-SYSTEM_MANAGER callers', async () => {
    const caller = createProviderCaller();
    expect(
      caller.admin.promoteToSystemManager({ targetUserId: provider2Id }),
    ).rejects.toThrow();
  });

  test('promoteToSystemManager: returns NOT_FOUND for unknown user', async () => {
    const caller = createAdminCaller();
    expect(
      caller.admin.promoteToSystemManager({ targetUserId: 'nonexistent-id' }),
    ).rejects.toThrow();
  });

  // --- assignModerator ---

  test('assignModerator: creates approved MODERATOR assignment for target user', async () => {
    const caller = createAdminCaller();
    const result = await caller.admin.assignModerator({
      targetUserId: providerId,
      condominiumId: condoId,
    });
    expect(result.success).toBe(true);

    const [created] = await db
      .select()
      .from(assignment)
      .where(eq(assignment.providerId, providerId))
      .limit(1);
    expect(created).toBeDefined();
    // biome-ignore lint/style/noNonNullAssertion: guarded by toBeDefined above
    expect(created!.type).toBe('MODERATOR');
    expect(created?.status).toBe('APPROVED');
  });

  test('assignModerator: writes audit log with condominiumId', async () => {
    const caller = createAdminCaller();
    await caller.admin.assignModerator({
      targetUserId: providerId,
      condominiumId: condoId,
    });

    const logs = await db.select().from(roleChangeLog);
    expect(logs.length).toBe(1);
    const log = logs[0];
    expect(log).toBeDefined();
    // biome-ignore lint/style/noNonNullAssertion: guarded by toBeDefined above
    expect(log!.actorId).toBe(adminId);
    expect(log?.targetUserId).toBe(providerId);
    expect(log?.previousRole).toBe('PROVIDER');
    expect(log?.newRole).toBe('MODERATOR');
    expect(log?.condominiumId).toBe(condoId);
  });

  test('assignModerator: rejects non-SYSTEM_MANAGER callers', async () => {
    const caller = createProviderCaller();
    expect(
      caller.admin.assignModerator({
        targetUserId: provider2Id,
        condominiumId: condoId,
      }),
    ).rejects.toThrow();
  });

  test('assignModerator: returns NOT_FOUND for unknown user', async () => {
    const caller = createAdminCaller();
    expect(
      caller.admin.assignModerator({
        targetUserId: 'nonexistent-id',
        condominiumId: condoId,
      }),
    ).rejects.toThrow();
  });

  test('assignModerator: returns NOT_FOUND for unknown condominium', async () => {
    const caller = createAdminCaller();
    expect(
      caller.admin.assignModerator({
        targetUserId: providerId,
        condominiumId: 'nonexistent-condo',
      }),
    ).rejects.toThrow();
  });

  // --- toggleProviderVisibility ---

  test('toggleProviderVisibility: flips isProviderVisible to false then back', async () => {
    const caller = createAdminCaller();

    const result = await caller.admin.toggleProviderVisibility({
      targetUserId: providerId,
    });
    expect(result.isProviderVisible).toBe(false);

    const result2 = await caller.admin.toggleProviderVisibility({
      targetUserId: providerId,
    });
    expect(result2.isProviderVisible).toBe(true);
  });

  test('toggleProviderVisibility: rejects non-SYSTEM_MANAGER callers', async () => {
    const caller = createProviderCaller();
    expect(
      caller.admin.toggleProviderVisibility({ targetUserId: provider2Id }),
    ).rejects.toThrow();
  });
});
