import { beforeAll, describe, expect, test } from 'bun:test';
import { db } from '@neighborhood-showcase/db';
import { user } from '@neighborhood-showcase/db/schema/auth';
import {
  condominium,
  providerAssignment,
} from '@neighborhood-showcase/db/schema/showcase';
import { eq } from 'drizzle-orm';
import { DrizzleAssignmentRepository } from '../../../infrastructure/db/assignment-repository';
import { GetUserAccessProfile } from './get-user-access-profile';

describe('GetUserAccessProfile use case', () => {
  const providerEnabledUserId = 'access-profile-provider-enabled-user-id';
  const moderatorOnlyUserId = 'access-profile-moderator-only-user-id';
  const pendingResidentUserId = 'access-profile-pending-resident-user-id';
  const condoId = 'access-profile-condo-id';

  const useCase = new GetUserAccessProfile(new DrizzleAssignmentRepository());

  beforeAll(async () => {
    await db
      .delete(providerAssignment)
      .where(eq(providerAssignment.providerId, providerEnabledUserId));
    await db
      .delete(providerAssignment)
      .where(eq(providerAssignment.providerId, moderatorOnlyUserId));
    await db
      .delete(providerAssignment)
      .where(eq(providerAssignment.providerId, pendingResidentUserId));
    await db.delete(condominium).where(eq(condominium.id, condoId));
    await db.delete(user).where(eq(user.id, providerEnabledUserId));
    await db.delete(user).where(eq(user.id, moderatorOnlyUserId));
    await db.delete(user).where(eq(user.id, pendingResidentUserId));

    await db.insert(user).values([
      {
        id: providerEnabledUserId,
        name: 'Provider Enabled User',
        email: 'provider-enabled-access@example.com',
        emailVerified: true,
        role: 'USER',
        status: 'ACTIVE',
      },
      {
        id: moderatorOnlyUserId,
        name: 'Moderator Only User',
        email: 'moderator-only-access@example.com',
        emailVerified: true,
        role: 'USER',
        status: 'ACTIVE',
      },
      {
        id: pendingResidentUserId,
        name: 'Pending Resident User',
        email: 'pending-resident-access@example.com',
        emailVerified: true,
        role: 'USER',
        status: 'ACTIVE',
      },
    ]);

    await db.insert(condominium).values({
      id: condoId,
      name: 'Access Profile Condo',
      city: 'Curitiba',
      state: 'PR',
      cep: '80000000',
      createdBy: providerEnabledUserId,
      status: 'APPROVED',
    });

    await db.insert(providerAssignment).values([
      {
        id: 'access-profile-approved-resident-assignment-id',
        providerId: providerEnabledUserId,
        condominiumId: condoId,
        type: 'RESIDENT',
        status: 'APPROVED',
        unitInfo: 'Unit 101',
      },
      {
        id: 'access-profile-approved-moderator-assignment-id',
        providerId: moderatorOnlyUserId,
        condominiumId: condoId,
        type: 'MODERATOR',
        status: 'APPROVED',
        unitInfo: 'Unit 202',
      },
      {
        id: 'access-profile-pending-resident-assignment-id',
        providerId: pendingResidentUserId,
        condominiumId: condoId,
        type: 'RESIDENT',
        status: 'PENDING',
        unitInfo: 'Unit 303',
      },
    ]);
  });

  test('returns providerEnabled=true when the user has an approved RESIDENT assignment', async () => {
    const result = await useCase.execute({ userId: providerEnabledUserId });

    expect(result.providerEnabled).toBe(true);
  });

  test('returns providerEnabled=false for a moderator-only user', async () => {
    const result = await useCase.execute({ userId: moderatorOnlyUserId });

    expect(result.providerEnabled).toBe(false);
  });

  test('returns providerEnabled=false for a pending resident assignment', async () => {
    const result = await useCase.execute({ userId: pendingResidentUserId });

    expect(result.providerEnabled).toBe(false);
  });
});
