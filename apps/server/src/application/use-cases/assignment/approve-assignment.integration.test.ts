import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { db } from '@neighborhood-showcase/db';
import { user } from '@neighborhood-showcase/db/schema/auth';
import {
  providerLocation as assignment,
  condominium,
} from '@neighborhood-showcase/db/schema/showcase';
import { eq } from 'drizzle-orm';
import { DrizzleAssignmentRepository } from '../../../infrastructure/db/assignment-repository';
import { ApproveAssignment } from './approve-assignment';
import { RejectAssignment } from './reject-assignment';

describe('Approve and Reject Assignment Integration Test', () => {
  const assignmentRepo = new DrizzleAssignmentRepository();
  const approveUseCase = new ApproveAssignment(assignmentRepo);
  const rejectUseCase = new RejectAssignment(assignmentRepo);

  const testUserId = 'test-resident-id-3';
  const testCondoId = 'test-condo-id-3';
  const pendingAssignId = 'pending-assign-id';
  const approvedAssignId = 'approved-assign-id';

  beforeAll(async () => {
    await db.delete(assignment);
    await db.delete(condominium);
    await db.delete(user);

    // Create resident user
    await db.insert(user).values({
      id: testUserId,
      name: 'Resident John',
      email: 'john@example.com',
      emailVerified: true,
      role: 'PROVIDER',
      status: 'ACTIVE',
    });

    // Create condo
    await db.insert(condominium).values({
      id: testCondoId,
      name: 'Residencial Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      cep: '01311200',
      createdBy: testUserId,
      status: 'APPROVED',
    });

    // Create a pending assignment
    await db.insert(assignment).values({
      id: pendingAssignId,
      providerId: testUserId,
      condominiumId: testCondoId,
      type: 'RESIDENT',
      status: 'PENDING',
      unitInfo: 'Block C, Apt 104',
    });

    // Create an approved assignment
    await db.insert(assignment).values({
      id: approvedAssignId,
      providerId: testUserId,
      condominiumId: testCondoId,
      type: 'RESIDENT',
      status: 'APPROVED',
      unitInfo: 'Block C, Apt 105',
    });
  });

  afterAll(async () => {
    await db.delete(assignment);
    await db.delete(condominium);
    await db.delete(user);
  });

  test('successfully approves a pending assignment', async () => {
    const res = await approveUseCase.execute({ id: pendingAssignId });

    expect(res).toBeDefined();
    expect(res.id).toBe(pendingAssignId);
    expect(res.status).toBe('APPROVED');

    // Verify db status
    const [dbAssignment] = await db
      .select()
      .from(assignment)
      .where(eq(assignment.id, pendingAssignId))
      .limit(1);

    expect(dbAssignment).toBeDefined();
    if (!dbAssignment) throw new Error('dbAssignment must be defined');
    expect(dbAssignment.status).toBe('APPROVED');
  });

  test('fails approval if assignment does not exist', async () => {
    expect(approveUseCase.execute({ id: 'non-existing' })).rejects.toThrow(
      'Solicitação de associação não encontrada.',
    );
  });

  test('fails approval if assignment is already processed', async () => {
    expect(approveUseCase.execute({ id: approvedAssignId })).rejects.toThrow(
      'Esta solicitação já foi processada.',
    );
  });

  test('successfully rejects a pending assignment', async () => {
    const rejectAssignId = 'pending-assign-to-reject';
    await db.insert(assignment).values({
      id: rejectAssignId,
      providerId: testUserId,
      condominiumId: testCondoId,
      type: 'RESIDENT',
      status: 'PENDING',
      unitInfo: 'Block C, Apt 106',
    });

    const res = await rejectUseCase.execute({
      id: rejectAssignId,
      reason: 'Comprovante ilegível',
    });

    expect(res).toBeDefined();
    expect(res.id).toBe(rejectAssignId);
    expect(res.status).toBe('REJECTED');

    // Verify db status
    const [dbAssignment] = await db
      .select()
      .from(assignment)
      .where(eq(assignment.id, rejectAssignId))
      .limit(1);

    expect(dbAssignment).toBeDefined();
    if (!dbAssignment) throw new Error('dbAssignment must be defined');
    expect(dbAssignment.status).toBe('REJECTED');
  });

  test('fails rejection if reason is empty', async () => {
    expect(
      rejectUseCase.execute({ id: pendingAssignId, reason: '   ' }),
    ).rejects.toThrow('O motivo da rejeição é obrigatório.');
  });
});
