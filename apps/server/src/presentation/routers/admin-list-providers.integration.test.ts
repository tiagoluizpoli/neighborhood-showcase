import { beforeAll, describe, expect, test } from 'bun:test';
import { db } from '@neighborhood-showcase/db';
import { user } from '@neighborhood-showcase/db/schema/auth';
import {
  address,
  condominium,
  providerAssignment,
  providerProfile,
} from '@neighborhood-showcase/db/schema/showcase';
import { appRouter } from './index';

describe('Admin listProviders Integration Tests', () => {
  // IDs
  const adminId = 'alp-admin-id';
  const providerResidentId = 'alp-provider-resident-id';
  const providerExternalId = 'alp-provider-external-id';
  const systemManagerProviderId = 'alp-sysmanager-provider-id';
  const invisibleProviderId = 'alp-invisible-provider-id';
  const condoId = 'alp-condo-id';
  const addressAId = 'alp-addr-a-id';
  const addressBId = 'alp-addr-b-id';
  const locationResidentId = 'alp-loc-resident-id';
  const locationExternalId = 'alp-loc-external-id';
  const locationSysManagerId = 'alp-loc-sysmanager-id';

  beforeAll(async () => {
    // Clean up
    await db.delete(providerAssignment);
    await db.delete(providerProfile);
    await db.delete(condominium);
    await db.delete(address);
    await db.delete(user);

    // Insert addresses
    await db.insert(address).values([
      {
        id: addressAId,
        cep: '88010001',
        street: 'Rua A',
        neighborhood: 'Centro',
        city: 'Florianópolis',
        state: 'SC',
      },
      {
        id: addressBId,
        cep: '88050002',
        street: 'Rua B',
        neighborhood: 'Trindade',
        city: 'Florianópolis',
        state: 'SC',
      },
    ]);

    // Insert admin user (SYSTEM_MANAGER, not a provider)
    await db.insert(user).values({
      id: adminId,
      name: 'Admin User',
      email: 'admin@alp.test',
      emailVerified: true,
      role: 'SYSTEM_MANAGER',
      status: 'ACTIVE',
    });

    // Insert condominium (created by admin)
    await db.insert(condominium).values({
      id: condoId,
      name: 'Residencial Alpha',
      city: 'Florianópolis',
      state: 'SC',
      cep: '88000000',
      createdBy: adminId,
      status: 'APPROVED',
    });

    // Resident provider (PROVIDER role, location type RESIDENT, condo-linked)
    await db.insert(user).values({
      id: providerResidentId,
      name: 'Resident Provider',
      email: 'resident@alp.test',
      emailVerified: true,
      role: 'USER',
      status: 'ACTIVE',
    });
    await db.insert(providerProfile).values({
      providerId: providerResidentId,
      displayName: 'Resident Provider',
      socialLinks: {},
      isProviderVisible: true,
    });
    await db.insert(providerAssignment).values({
      id: locationResidentId,
      providerId: providerResidentId,
      type: 'RESIDENT',
      status: 'APPROVED',
      condominiumId: condoId,
    });

    // External provider (PROVIDER role, location type EXTERNAL, address-linked)
    await db.insert(user).values({
      id: providerExternalId,
      name: 'External Provider',
      email: 'external@alp.test',
      emailVerified: true,
      role: 'USER',
      status: 'ACTIVE',
    });
    await db.insert(providerProfile).values({
      providerId: providerExternalId,
      displayName: 'External Provider',
      socialLinks: {},
      isProviderVisible: true,
    });
    await db.insert(providerAssignment).values({
      id: locationExternalId,
      providerId: providerExternalId,
      type: 'EXTERNAL',
      status: 'APPROVED',
      addressId: addressBId,
    });

    // SYSTEM_MANAGER who is also a provider (has providerLocation)
    await db.insert(user).values({
      id: systemManagerProviderId,
      name: 'Manager Provider',
      email: 'manager@alp.test',
      emailVerified: true,
      role: 'SYSTEM_MANAGER',
      status: 'ACTIVE',
    });
    await db.insert(providerProfile).values({
      providerId: systemManagerProviderId,
      displayName: 'Manager Provider',
      socialLinks: {},
      isProviderVisible: true,
    });
    await db.insert(providerAssignment).values({
      id: locationSysManagerId,
      providerId: systemManagerProviderId,
      type: 'EXTERNAL',
      status: 'APPROVED',
      addressId: addressAId,
    });

    // Provider who opted out of directory
    await db.insert(user).values({
      id: invisibleProviderId,
      name: 'Invisible Provider',
      email: 'invisible@alp.test',
      emailVerified: true,
      role: 'USER',
      status: 'ACTIVE',
    });
    await db.insert(providerProfile).values({
      providerId: invisibleProviderId,
      displayName: 'Invisible Provider',
      socialLinks: {},
      isProviderVisible: false,
    });
  });

  const createAdminCaller = () =>
    appRouter.createCaller({
      auth: null,
      session: {
        session: {
          id: 'sess-admin-alp',
          userId: adminId,
          token: 'tok-admin-alp',
          expiresAt: new Date(Date.now() + 3600000),
          createdAt: new Date(),
          updatedAt: new Date(),
          userAgent: null,
          ipAddress: null,
        },
        user: {
          id: adminId,
          name: 'Admin User',
          email: 'admin@alp.test',
          emailVerified: true,
          role: 'SYSTEM_MANAGER' as const,
          status: 'ACTIVE' as const,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    });

  test('returns all users with providerLocation entries, excluding opted-out users', async () => {
    const caller = createAdminCaller();
    const result = await caller.admin.listProviders({});

    // Should include: resident provider, external provider, sysmanager provider
    // Should NOT include: admin (no providerLocation), invisible provider (opted out)
    const ids = result.map((p) => p.id);
    expect(ids).toContain(providerResidentId);
    expect(ids).toContain(providerExternalId);
    expect(ids).toContain(systemManagerProviderId);
    expect(ids).not.toContain(adminId);
    expect(ids).not.toContain(invisibleProviderId);
  });

  test('filters by condominiumId showing only condo-linked providers', async () => {
    const caller = createAdminCaller();
    const result = await caller.admin.listProviders({ condominiumId: condoId });

    const ids = result.map((p) => p.id);
    expect(ids).toContain(providerResidentId);
    expect(ids).not.toContain(providerExternalId);
    expect(ids).not.toContain(systemManagerProviderId);
  });

  test('filters by city showing only providers in that city', async () => {
    const caller = createAdminCaller();
    // All providers are in Florianópolis via address or condo
    const result = await caller.admin.listProviders({ city: 'Florianópolis' });

    const ids = result.map((p) => p.id);
    // Resident is linked via condo.city
    expect(ids).toContain(providerResidentId);
    // External linked via address.city (Trindade in Florianópolis)
    expect(ids).toContain(providerExternalId);
  });

  test('filters by neighborhood', async () => {
    const caller = createAdminCaller();
    const result = await caller.admin.listProviders({
      neighborhood: 'Trindade',
    });

    const ids = result.map((p) => p.id);
    // Only external provider is in Trindade via address
    expect(ids).toContain(providerExternalId);
    expect(ids).not.toContain(providerResidentId);
  });

  test('search by name filters correctly', async () => {
    const caller = createAdminCaller();
    const result = await caller.admin.listProviders({ search: 'External' });

    const ids = result.map((p) => p.id);
    expect(ids).toContain(providerExternalId);
    expect(ids).not.toContain(providerResidentId);
  });

  test('rejects non-SYSTEM_MANAGER callers', async () => {
    const providerCaller = appRouter.createCaller({
      auth: null,
      session: {
        session: {
          id: 'sess-prov-alp',
          userId: providerResidentId,
          token: 'tok-prov-alp',
          expiresAt: new Date(Date.now() + 3600000),
          createdAt: new Date(),
          updatedAt: new Date(),
          userAgent: null,
          ipAddress: null,
        },
        user: {
          id: providerResidentId,
          name: 'Resident Provider',
          email: 'resident@alp.test',
          emailVerified: true,
          role: 'USER' as const,
          status: 'ACTIVE' as const,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    });

    expect(providerCaller.admin.listProviders({})).rejects.toThrow();
  });
});
