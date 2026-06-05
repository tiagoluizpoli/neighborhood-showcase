import { beforeAll, describe, expect, test } from 'bun:test';
import { db } from '@neighborhood-showcase/db';
import { user } from '@neighborhood-showcase/db/schema/auth';
import { appRouter } from './index';

describe('Admin listUsers Integration Tests', () => {
  const adminId = 'alu-admin-id';
  const administratorId = 'alu-administrator-id';
  const userId = 'alu-user-id';
  const bannedUserId = 'alu-banned-user-id';
  const anotherManagerId = 'alu-manager2-id';

  beforeAll(async () => {
    await db.delete(user);

    await db.insert(user).values([
      {
        id: administratorId,
        name: 'Admin Root',
        email: 'root@alu.test',
        emailVerified: true,
        role: 'ADMINISTRATOR',
        status: 'ACTIVE',
      },
      {
        id: adminId,
        name: 'Admin Superuser',
        email: 'admin@alu.test',
        emailVerified: true,
        role: 'SYSTEM_MANAGER',
        status: 'ACTIVE',
      },
      {
        id: userId,
        name: 'Alice User',
        email: 'alice@alu.test',
        emailVerified: true,
        role: 'USER',
        status: 'ACTIVE',
      },
      {
        id: bannedUserId,
        name: 'Bob Banned',
        email: 'bob@alu.test',
        emailVerified: true,
        role: 'USER',
        status: 'BANNED',
      },
      {
        id: anotherManagerId,
        name: 'Carol Manager',
        email: 'carol@alu.test',
        emailVerified: true,
        role: 'SYSTEM_MANAGER',
        status: 'ACTIVE',
      },
    ]);
  });

  const createAdminCaller = () =>
    appRouter.createCaller({
      auth: null,
      session: {
        session: {
          id: 'sess-alu-admin',
          userId: adminId,
          token: 'tok-alu-admin',
          expiresAt: new Date(Date.now() + 3600000),
          createdAt: new Date(),
          updatedAt: new Date(),
          userAgent: null,
          ipAddress: null,
        },
        user: {
          id: adminId,
          name: 'Admin Superuser',
          email: 'admin@alu.test',
          emailVerified: true,
          role: 'SYSTEM_MANAGER' as const,
          status: 'ACTIVE' as const,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    });

  const createAdministratorCaller = () =>
    appRouter.createCaller({
      auth: null,
      session: {
        session: {
          id: 'sess-alu-administrator',
          userId: administratorId,
          token: 'tok-alu-administrator',
          expiresAt: new Date(Date.now() + 3600000),
          createdAt: new Date(),
          updatedAt: new Date(),
          userAgent: null,
          ipAddress: null,
        },
        user: {
          id: administratorId,
          name: 'Admin Root',
          email: 'root@alu.test',
          emailVerified: true,
          role: 'ADMINISTRATOR' as const,
          status: 'ACTIVE' as const,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    });

  test('returns all users when no filters provided', async () => {
    const caller = createAdminCaller();
    const result = await caller.admin.listUsers({});

    const ids = result.map((u) => u.id);
    expect(ids).toContain(adminId);
    expect(ids).toContain(administratorId);
    expect(ids).toContain(userId);
    expect(ids).toContain(bannedUserId);
    expect(ids).toContain(anotherManagerId);
    expect(result.length).toBeGreaterThanOrEqual(5);
  });

  test('filters by name search (case-insensitive)', async () => {
    const caller = createAdminCaller();
    const result = await caller.admin.listUsers({ search: 'alice' });

    const ids = result.map((u) => u.id);
    expect(ids).toContain(userId);
    expect(ids).not.toContain(bannedUserId);
    expect(ids).not.toContain(anotherManagerId);
  });

  test('filters by email search', async () => {
    const caller = createAdminCaller();
    const result = await caller.admin.listUsers({ search: 'carol@alu' });

    const ids = result.map((u) => u.id);
    expect(ids).toContain(anotherManagerId);
    expect(ids).not.toContain(userId);
  });

  test('filters by role SYSTEM_MANAGER', async () => {
    const caller = createAdminCaller();
    const result = await caller.admin.listUsers({ role: 'SYSTEM_MANAGER' });

    const ids = result.map((u) => u.id);
    expect(ids).toContain(adminId);
    expect(ids).toContain(anotherManagerId);
    expect(ids).not.toContain(userId);
    expect(ids).not.toContain(bannedUserId);
  });

  test('filters by role ADMINISTRATOR', async () => {
    const caller = createAdminCaller();
    const result = await caller.admin.listUsers({ role: 'ADMINISTRATOR' });

    expect(result.map((u) => u.id)).toEqual([administratorId]);
  });

  test('filters by role USER', async () => {
    const caller = createAdminCaller();
    const result = await caller.admin.listUsers({ role: 'USER' });

    const ids = result.map((u) => u.id);
    expect(ids).toContain(userId);
    expect(ids).toContain(bannedUserId);
    expect(ids).not.toContain(adminId);
  });

  test('filters by status BANNED', async () => {
    const caller = createAdminCaller();
    const result = await caller.admin.listUsers({ status: 'BANNED' });

    const ids = result.map((u) => u.id);
    expect(ids).toContain(bannedUserId);
    expect(ids).not.toContain(userId);
    expect(ids).not.toContain(adminId);
  });

  test('combines search with role filter', async () => {
    const caller = createAdminCaller();
    const result = await caller.admin.listUsers({
      search: 'alu.test',
      role: 'USER',
    });

    const ids = result.map((u) => u.id);
    expect(ids).toContain(userId);
    expect(ids).toContain(bannedUserId);
    expect(ids).not.toContain(adminId);
    expect(ids).not.toContain(anotherManagerId);
  });

  test('allows ADMINISTRATOR callers', async () => {
    const caller = createAdministratorCaller();
    const result = await caller.admin.listUsers({ role: 'ADMINISTRATOR' });

    expect(result.map((entry) => entry.id)).toEqual([administratorId]);
  });

  test('rejects non-global-admin callers', async () => {
    const userCaller = appRouter.createCaller({
      auth: null,
      session: {
        session: {
          id: 'sess-alu-user',
          userId,
          token: 'tok-alu-user',
          expiresAt: new Date(Date.now() + 3600000),
          createdAt: new Date(),
          updatedAt: new Date(),
          userAgent: null,
          ipAddress: null,
        },
        user: {
          id: userId,
          name: 'Alice User',
          email: 'alice@alu.test',
          emailVerified: true,
          role: 'USER' as const,
          status: 'ACTIVE' as const,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    });

    expect(userCaller.admin.listUsers({})).rejects.toThrow();
  });
});
