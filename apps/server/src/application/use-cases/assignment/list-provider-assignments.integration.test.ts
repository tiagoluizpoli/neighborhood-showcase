import { beforeAll, describe, expect, test } from 'bun:test';
import { db } from '@neighborhood-showcase/db';
import { user } from '@neighborhood-showcase/db/schema/auth';
import {
  condominium,
  providerAssignment,
} from '@neighborhood-showcase/db/schema/showcase';
import { DrizzleAssignmentRepository } from '../../../infrastructure/db/assignment-repository';
import { ListProviderAssignments } from './list-provider-assignments';

describe('ListProviderAssignments use case', () => {
  const providerId = 'list-assignments-provider-id';
  const otherProviderId = 'list-assignments-other-provider-id';
  const condoId = 'list-assignments-condo-id';

  const assignmentRepo = new DrizzleAssignmentRepository();
  const listProviderAssignments = new ListProviderAssignments(assignmentRepo);

  beforeAll(async () => {
    await db.delete(providerAssignment);
    await db.delete(condominium);
    await db.delete(user);

    await db.insert(user).values([
      {
        id: providerId,
        name: 'Assignments Provider',
        email: 'assignments-provider@example.com',
        emailVerified: true,
        role: 'USER',
        status: 'ACTIVE',
      },
      {
        id: otherProviderId,
        name: 'Other Provider',
        email: 'other-provider@example.com',
        emailVerified: true,
        role: 'USER',
        status: 'ACTIVE',
      },
    ]);

    await db.insert(condominium).values({
      id: condoId,
      name: 'Assignments Condo',
      city: 'Florianopolis',
      state: 'SC',
      cep: '88000000',
      createdBy: providerId,
      status: 'APPROVED',
    });

    await db.insert(providerAssignment).values([
      {
        id: 'list-assignments-resident-id',
        providerId,
        condominiumId: condoId,
        type: 'RESIDENT',
        status: 'APPROVED',
        unitInfo: 'Apto 101',
      },
      {
        id: 'list-assignments-external-id',
        providerId,
        addressId: null,
        type: 'EXTERNAL',
        status: 'APPROVED',
      },
      {
        id: 'list-assignments-other-id',
        providerId: otherProviderId,
        condominiumId: condoId,
        type: 'MODERATOR',
        status: 'APPROVED',
      },
    ]);
  });

  test('returns only assignments from requested provider with condominium data preserved', async () => {
    const assignments = await listProviderAssignments.execute({ providerId });

    expect(assignments).toHaveLength(2);
    expect(
      assignments.every((assignment) => assignment.providerId === providerId),
    ).toBe(true);

    const residentAssignment = assignments.find(
      (assignment) => assignment.id === 'list-assignments-resident-id',
    );

    expect(residentAssignment?.condominium).toMatchObject({
      name: 'Assignments Condo',
      city: 'Florianopolis',
      state: 'SC',
    });
  });
});
