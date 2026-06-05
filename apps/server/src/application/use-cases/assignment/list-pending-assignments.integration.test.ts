import { beforeAll, describe, expect, test } from 'bun:test';
import { db } from '@neighborhood-showcase/db';
import { user } from '@neighborhood-showcase/db/schema/auth';
import {
  condominium,
  providerAssignment,
} from '@neighborhood-showcase/db/schema/showcase';
import { DrizzleAssignmentRepository } from '../../../infrastructure/db/assignment-repository';
import { ListPendingAssignments } from './list-pending-assignments';

describe('ListPendingAssignments use case', () => {
  const moderatorId = 'list-pending-moderator-id';
  const pendingProviderId = 'list-pending-provider-id';
  const approvedProviderId = 'list-approved-provider-id';
  const condoId = 'list-pending-condo-id';

  const assignmentRepo = new DrizzleAssignmentRepository();
  const listPendingAssignments = new ListPendingAssignments(assignmentRepo);

  beforeAll(async () => {
    await db.delete(providerAssignment);
    await db.delete(condominium);
    await db.delete(user);

    await db.insert(user).values([
      {
        id: moderatorId,
        name: 'Moderator User',
        email: 'moderator@example.com',
        emailVerified: true,
        role: 'USER',
        status: 'ACTIVE',
      },
      {
        id: pendingProviderId,
        name: 'Pending User',
        email: 'pending@example.com',
        emailVerified: true,
        role: 'USER',
        status: 'ACTIVE',
      },
      {
        id: approvedProviderId,
        name: 'Approved User',
        email: 'approved@example.com',
        emailVerified: true,
        role: 'USER',
        status: 'ACTIVE',
      },
    ]);

    await db.insert(condominium).values({
      id: condoId,
      name: 'Pending Condo',
      city: 'Florianopolis',
      state: 'SC',
      cep: '88000000',
      createdBy: moderatorId,
      status: 'APPROVED',
    });

    await db.insert(providerAssignment).values([
      {
        id: 'list-pending-moderator-assignment-id',
        providerId: moderatorId,
        condominiumId: condoId,
        type: 'MODERATOR',
        status: 'APPROVED',
      },
      {
        id: 'list-pending-assignment-id',
        providerId: pendingProviderId,
        condominiumId: condoId,
        type: 'RESIDENT',
        status: 'PENDING',
        unitInfo: 'Apto 202',
      },
      {
        id: 'list-approved-assignment-id',
        providerId: approvedProviderId,
        condominiumId: condoId,
        type: 'RESIDENT',
        status: 'APPROVED',
        unitInfo: 'Apto 303',
      },
    ]);
  });

  test('returns only pending assignments for condominium with provider data preserved', async () => {
    const assignments = await listPendingAssignments.execute({
      condominiumId: condoId,
    });

    expect(assignments).toHaveLength(1);
    expect(assignments[0]?.id).toBe('list-pending-assignment-id');
    expect(assignments[0]?.status).toBe('PENDING');
    expect(assignments[0]?.provider).toMatchObject({
      name: 'Pending User',
      email: 'pending@example.com',
    });
  });
});
