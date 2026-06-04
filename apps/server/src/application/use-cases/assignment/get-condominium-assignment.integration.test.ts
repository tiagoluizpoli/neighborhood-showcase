import { beforeAll, describe, expect, test } from 'bun:test';
import { db } from '@neighborhood-showcase/db';
import { user } from '@neighborhood-showcase/db/schema/auth';
import {
  address,
  condominium,
  providerLocation,
} from '@neighborhood-showcase/db/schema/showcase';
import { DrizzleAssignmentRepository } from '../../../infrastructure/db/assignment-repository';
import {
  AssignmentNotFoundError,
  AssignmentWithoutCondominiumError,
  GetCondominiumAssignment,
} from './get-condominium-assignment';

describe('GetCondominiumAssignment use case', () => {
  const providerId = 'get-condo-assignment-provider-id';
  const condoId = 'get-condo-assignment-condo-id';
  const addressId = 'get-condo-assignment-address-id';
  const residentAssignmentId = 'get-condo-assignment-id';
  const externalAssignmentId = 'get-condo-assignment-external-id';

  const assignmentRepo = new DrizzleAssignmentRepository();
  const getCondominiumAssignment = new GetCondominiumAssignment(assignmentRepo);

  beforeAll(async () => {
    await db.delete(providerLocation);
    await db.delete(condominium);
    await db.delete(address);
    await db.delete(user);

    await db.insert(user).values({
      id: providerId,
      name: 'Condo Assignment User',
      email: 'condo-assignment-user@example.com',
      emailVerified: true,
      role: 'PROVIDER',
      status: 'ACTIVE',
    });

    await db.insert(address).values({
      id: addressId,
      cep: '88010001',
      street: 'Rua Teste',
      neighborhood: 'Centro',
      city: 'Florianopolis',
      state: 'SC',
    });

    await db.insert(condominium).values({
      id: condoId,
      name: 'Condo Assignment Condo',
      city: 'Florianopolis',
      state: 'SC',
      cep: '88000000',
      createdBy: providerId,
      status: 'APPROVED',
    });

    await db.insert(providerLocation).values([
      {
        id: residentAssignmentId,
        providerId,
        condominiumId: condoId,
        type: 'RESIDENT',
        status: 'PENDING',
        unitInfo: 'Apto 505',
      },
      {
        id: externalAssignmentId,
        providerId,
        addressId,
        type: 'EXTERNAL',
        status: 'APPROVED',
      },
    ]);
  });

  test('returns assignment when linked to condominium', async () => {
    const assignment = await getCondominiumAssignment.execute({
      id: residentAssignmentId,
    });

    expect(assignment.id).toBe(residentAssignmentId);
    expect(assignment.condominiumId).toBe(condoId);
  });

  test('throws AssignmentNotFoundError when assignment is missing', async () => {
    await expect(
      getCondominiumAssignment.execute({ id: 'missing-assignment-id' }),
    ).rejects.toBeInstanceOf(AssignmentNotFoundError);
  });

  test('throws AssignmentWithoutCondominiumError when assignment has no condominium', async () => {
    await expect(
      getCondominiumAssignment.execute({ id: externalAssignmentId }),
    ).rejects.toBeInstanceOf(AssignmentWithoutCondominiumError);
  });
});
