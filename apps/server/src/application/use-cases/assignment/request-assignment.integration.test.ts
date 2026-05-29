import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { db } from '@base-fullstack-template/db';
import { user } from '@base-fullstack-template/db/schema/auth';
import {
  assignment,
  condominium,
} from '@base-fullstack-template/db/schema/showcase';
import { and, eq } from 'drizzle-orm';
import { DrizzleAssignmentRepository } from '../../../infrastructure/db/assignment-repository';
import { RequestAssignment } from './request-assignment';

describe('Request Assignment Integration Test', () => {
  const assignmentRepo = new DrizzleAssignmentRepository();
  const useCase = new RequestAssignment(assignmentRepo);
  const testUserId = 'test-provider-id-2';
  const testCondoId = 'test-condo-id-2';

  beforeAll(async () => {
    // Clean up first
    await db.delete(assignment);
    await db.delete(condominium);
    await db.delete(user);

    // Create test user
    await db.insert(user).values({
      id: testUserId,
      name: 'Test Resident',
      email: 'resident@example.com',
      emailVerified: true,
      role: 'PROVIDER',
      status: 'ACTIVE',
    });

    // Create test condominium
    await db.insert(condominium).values({
      id: testCondoId,
      name: 'Residencial Sol',
      city: 'Florianópolis',
      state: 'SC',
      cep: '88000000',
      createdBy: testUserId,
      status: 'APPROVED',
    });
  });

  afterAll(async () => {
    await db.delete(assignment);
    await db.delete(condominium);
    await db.delete(user);
  });

  test('successfully requests resident assignment', async () => {
    const input = {
      providerId: testUserId,
      condominiumId: testCondoId,
      unitInfo: 'Block B, Apt 302',
      proofOfResidency: 'https://mock-s3/proof.webp',
    };

    const res = await useCase.execute(input);

    expect(res).toBeDefined();
    expect(res.id).toBeDefined();
    expect(res.providerId).toBe(testUserId);
    expect(res.condominiumId).toBe(testCondoId);
    expect(res.type).toBe('RESIDENT');
    expect(res.status).toBe('PENDING');
    expect(res.unitInfo).toBe(input.unitInfo);
    expect(res.proofOfResidency).toBe(input.proofOfResidency);

    // Verify database state
    const [dbAssignment] = await db
      .select()
      .from(assignment)
      .where(eq(assignment.id, res.id))
      .limit(1);

    expect(dbAssignment).toBeDefined();
    if (!dbAssignment) throw new Error('dbAssignment must be defined');
    expect(dbAssignment.status).toBe('PENDING');
    expect(dbAssignment.unitInfo).toBe(input.unitInfo);
  });

  test('fails if unitInfo is empty', async () => {
    const input = {
      providerId: testUserId,
      condominiumId: testCondoId,
      unitInfo: '   ',
    };

    expect(useCase.execute(input)).rejects.toThrow(
      'Informações da unidade são obrigatórias para moradores.',
    );
  });

  test('fails if unitInfo exceeds 100 characters', async () => {
    const input = {
      providerId: testUserId,
      condominiumId: testCondoId,
      unitInfo: 'a'.repeat(101),
    };

    expect(useCase.execute(input)).rejects.toThrow(
      'Informações da unidade não podem exceder 100 caracteres.',
    );
  });

  test('fails if duplicate request is PENDING', async () => {
    // The previous test already created a PENDING assignment for testUserId + testCondoId
    const input = {
      providerId: testUserId,
      condominiumId: testCondoId,
      unitInfo: 'Block C, Apt 101',
    };

    expect(useCase.execute(input)).rejects.toThrow(
      'Você já possui uma solicitação pendente para este condomínio.',
    );
  });

  test('fails if duplicate request is APPROVED', async () => {
    // Update the assignment to APPROVED to test that path
    await db
      .update(assignment)
      .set({ status: 'APPROVED' })
      .where(
        and(
          eq(assignment.providerId, testUserId),
          eq(assignment.condominiumId, testCondoId),
        ),
      );

    const input = {
      providerId: testUserId,
      condominiumId: testCondoId,
      unitInfo: 'Block C, Apt 101',
    };

    expect(useCase.execute(input)).rejects.toThrow(
      'Você já possui uma associação ativa com este condomínio.',
    );
  });
});
