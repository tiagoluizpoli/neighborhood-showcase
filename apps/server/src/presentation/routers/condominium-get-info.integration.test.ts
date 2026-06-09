import { beforeAll, describe, expect, test } from 'bun:test';
import { db } from '@neighborhood-showcase/db';
import { user } from '@neighborhood-showcase/db/schema/auth';
import {
  condominium,
  providerAssignment,
} from '@neighborhood-showcase/db/schema/showcase';
import { TRPCError } from '@trpc/server';
import { appRouter } from './index';

describe('condominium.getCondominiumInfo', () => {
  const adminId = 'cgi-admin-id';
  const modId = 'cgi-mod-id';
  const residentId = 'cgi-resident-id';
  const noAccessId = 'cgi-noaccess-id';
  const condoId = 'cgi-condo-id';

  const createCaller = (userId: string, role: string) =>
    appRouter.createCaller({
      auth: null,
      session: {
        session: {
          id: `sess-${userId}`,
          userId,
          token: `tok-${userId}`,
          expiresAt: new Date(Date.now() + 3600000),
          createdAt: new Date(),
          updatedAt: new Date(),
          userAgent: null,
          ipAddress: null,
        },
        user: {
          id: userId,
          name: 'Test User',
          email: `${userId}@test.com`,
          emailVerified: true,
          role: role as
            | 'ADMINISTRATOR'
            | 'SYSTEM_MANAGER'
            | 'USER'
            | 'MODERATOR',
          status: 'ACTIVE' as const,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    });

  beforeAll(async () => {
    await db.delete(providerAssignment);
    await db.delete(condominium);
    await db.delete(user);

    await db.insert(user).values([
      {
        id: adminId,
        name: 'CGI Admin',
        email: 'cgi-admin@test.com',
        emailVerified: true,
        role: 'ADMINISTRATOR' as const,
        status: 'ACTIVE' as const,
      },
      {
        id: modId,
        name: 'CGI Moderator',
        email: 'cgi-mod@test.com',
        emailVerified: true,
        role: 'USER' as const,
        status: 'ACTIVE' as const,
      },
      {
        id: residentId,
        name: 'CGI Resident',
        email: 'cgi-resident@test.com',
        emailVerified: true,
        role: 'USER' as const,
        status: 'ACTIVE' as const,
      },
      {
        id: noAccessId,
        name: 'CGI No Access',
        email: 'cgi-noaccess@test.com',
        emailVerified: true,
        role: 'USER' as const,
        status: 'ACTIVE' as const,
      },
    ]);

    await db.insert(condominium).values([
      {
        id: condoId,
        name: 'Condomínio GetInfo',
        city: 'São Paulo',
        state: 'SP',
        cep: '01001000',
        status: 'APPROVED' as const,
        createdBy: adminId,
        contactInfo: { phone: '11999999999', email: 'condo@test.com' },
      },
    ]);

    await db.insert(providerAssignment).values([
      {
        id: 'cgi-mod-assign',
        providerId: modId,
        condominiumId: condoId,
        type: 'MODERATOR' as const,
        status: 'APPROVED' as const,
        unitInfo: 'Unit 101',
      },
      {
        id: 'cgi-resident-assign',
        providerId: residentId,
        condominiumId: condoId,
        type: 'RESIDENT' as const,
        status: 'APPROVED' as const,
        unitInfo: 'Unit 202',
      },
      {
        id: 'cgi-pending-assign',
        providerId: noAccessId,
        condominiumId: condoId,
        type: 'MODERATOR' as const,
        status: 'PENDING' as const,
        unitInfo: 'Unit 303',
      },
    ]);
  });

  test('MODERATOR with APPROVED assignment gets full condominium data', async () => {
    const caller = createCaller(modId, 'USER');
    const result = await caller.condominium.getCondominiumInfo({
      condominiumId: condoId,
    });

    expect(result.id).toBe(condoId);
    expect(result.name).toBe('Condomínio GetInfo');
    expect(result.city).toBe('São Paulo');
    expect(result.state).toBe('SP');
    expect(result.cep).toBe('01001000');
    expect(result.status).toBe('APPROVED');
    expect(result.contactInfo.phone).toBe('11999999999');
    expect(result.contactInfo.email).toBe('condo@test.com');
  });

  test('RESIDENT with APPROVED assignment gets full condominium data', async () => {
    const caller = createCaller(residentId, 'USER');
    const result = await caller.condominium.getCondominiumInfo({
      condominiumId: condoId,
    });

    expect(result.id).toBe(condoId);
    expect(result.name).toBe('Condomínio GetInfo');
    expect(result.city).toBe('São Paulo');
  });

  test('user with no assignment throws FORBIDDEN', async () => {
    const caller = createCaller(noAccessId, 'USER');
    await expect(
      caller.condominium.getCondominiumInfo({ condominiumId: condoId }),
    ).rejects.toThrow(TRPCError);

    try {
      await caller.condominium.getCondominiumInfo({ condominiumId: condoId });
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      expect((error as TRPCError).code).toBe('FORBIDDEN');
    }
  });

  test('user with PENDING assignment throws FORBIDDEN', async () => {
    const pendingUserId = 'cgi-pending-test-id';
    await db.insert(user).values({
      id: pendingUserId,
      name: 'CGI Pending',
      email: 'cgi-pending@test.com',
      emailVerified: true,
      role: 'USER' as const,
      status: 'ACTIVE' as const,
    });
    await db.insert(providerAssignment).values({
      id: 'cgi-pending-test-assign',
      providerId: pendingUserId,
      condominiumId: condoId,
      type: 'MODERATOR' as const,
      status: 'PENDING' as const,
      unitInfo: 'Unit 404',
    });

    const caller = createCaller(pendingUserId, 'USER');
    await expect(
      caller.condominium.getCondominiumInfo({ condominiumId: condoId }),
    ).rejects.toThrow();
    try {
      await caller.condominium.getCondominiumInfo({ condominiumId: condoId });
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      expect((error as TRPCError).code).toBe('FORBIDDEN');
    }
  });
});
