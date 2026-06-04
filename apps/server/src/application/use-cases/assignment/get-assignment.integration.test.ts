import { beforeAll, describe, expect, test } from 'bun:test';
import { db } from '@neighborhood-showcase/db';
import { user } from '@neighborhood-showcase/db/schema/auth';
import {
  condominium,
  providerLocation,
} from '@neighborhood-showcase/db/schema/showcase';
import { DrizzleAssignmentRepository } from '../../../infrastructure/db/assignment-repository';
import { GetAssignment } from './get-assignment';

describe('GetAssignment use case', () => {
  const providerId = 'get-assignment-provider-id';
  const condoId = 'get-assignment-condo-id';
  const assignmentId = 'get-assignment-id';

  const assignmentRepo = new DrizzleAssignmentRepository();
  const getAssignment = new GetAssignment(assignmentRepo);

  beforeAll(async () => {
    await db.delete(providerLocation);
    await db.delete(condominium);
    await db.delete(user);

    await db.insert(user).values({
      id: providerId,
      name: 'Assignment User',
      email: 'assignment-user@example.com',
      emailVerified: true,
      role: 'PROVIDER',
      status: 'ACTIVE',
    });

    await db.insert(condominium).values({
      id: condoId,
      name: 'Assignment Condo',
      city: 'Florianopolis',
      state: 'SC',
      cep: '88000000',
      createdBy: providerId,
      status: 'APPROVED',
    });

    await db.insert(providerLocation).values({
      id: assignmentId,
      providerId,
      condominiumId: condoId,
      type: 'RESIDENT',
      status: 'PENDING',
      unitInfo: 'Apto 404',
    });
  });

  test('returns assignment by id', async () => {
    const assignment = await getAssignment.execute({ id: assignmentId });

    expect(assignment).not.toBeNull();
    expect(assignment?.id).toBe(assignmentId);
    expect(assignment?.condominiumId).toBe(condoId);
    expect(assignment?.status).toBe('PENDING');
  });

  test('returns null when assignment does not exist', async () => {
    const assignment = await getAssignment.execute({
      id: 'missing-assignment',
    });

    expect(assignment).toBeNull();
  });
});
