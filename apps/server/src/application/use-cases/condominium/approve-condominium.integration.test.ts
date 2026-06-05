import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { db } from '@neighborhood-showcase/db';
import { user } from '@neighborhood-showcase/db/schema/auth';
import {
  providerAssignment as assignment,
  condominium,
} from '@neighborhood-showcase/db/schema/showcase';
import { and, eq } from 'drizzle-orm';
import { DrizzleAssignmentRepository } from '../../../infrastructure/db/assignment-repository';
import { DrizzleCondominiumRepository } from '../../../infrastructure/db/condominium-repository';
import { DrizzleUserRepository } from '../../../infrastructure/db/user-repository';
import { ApproveCondominium } from './approve-condominium';
import { RejectCondominium } from './reject-condominium';

describe('Approve and Reject Condominium Integration Test', () => {
  const condoRepo = new DrizzleCondominiumRepository();
  const assignmentRepo = new DrizzleAssignmentRepository();
  const userRepo = new DrizzleUserRepository();
  const approveUseCase = new ApproveCondominium(condoRepo, assignmentRepo);
  const rejectUseCase = new RejectCondominium(condoRepo, userRepo);

  const testUserId = 'condo-creator-id';
  const pendingCondoId = 'pending-condo-id';
  const approvedCondoId = 'approved-condo-id';

  beforeAll(async () => {
    await db.delete(assignment);
    await db.delete(condominium);
    await db.delete(user);

    // Create creator user
    await db.insert(user).values({
      id: testUserId,
      name: 'Condo Síndico',
      email: 'sindico@example.com',
      emailVerified: true,
      role: 'USER',
      status: 'ACTIVE',
    });

    // Create a pending condominium
    await db.insert(condominium).values({
      id: pendingCondoId,
      name: 'Residencial Aurora',
      city: 'Curitiba',
      state: 'PR',
      cep: '80000000',
      createdBy: testUserId,
      status: 'PENDING_APPROVAL',
      proofUrl: 'https://mock-s3/proof.pdf',
    });

    // Create an already approved condominium
    await db.insert(condominium).values({
      id: approvedCondoId,
      name: 'Residencial Pinheiros',
      city: 'Curitiba',
      state: 'PR',
      cep: '80000001',
      createdBy: testUserId,
      status: 'APPROVED',
    });
  });

  afterAll(async () => {
    await db.delete(assignment);
    await db.delete(condominium);
    await db.delete(user);
  });

  test('successfully approves a pending condominium and creates moderator assignment', async () => {
    const res = await approveUseCase.execute({ id: pendingCondoId });

    expect(res).toBeDefined();
    expect(res.id).toBe(pendingCondoId);
    expect(res.status).toBe('APPROVED');

    // Verify database state for condominium
    const [dbCondo] = await db
      .select()
      .from(condominium)
      .where(eq(condominium.id, pendingCondoId))
      .limit(1);

    expect(dbCondo).toBeDefined();
    if (!dbCondo) throw new Error('dbCondo must be defined');
    expect(dbCondo.status).toBe('APPROVED');

    // Verify automatic assignment creation
    const [dbAssignment] = await db
      .select()
      .from(assignment)
      .where(
        and(
          eq(assignment.providerId, testUserId),
          eq(assignment.condominiumId, pendingCondoId),
        ),
      )
      .limit(1);

    expect(dbAssignment).toBeDefined();
    if (!dbAssignment) throw new Error('dbAssignment must be defined');
    expect(dbAssignment.type).toBe('MODERATOR');
    expect(dbAssignment.status).toBe('APPROVED');
  });

  test('fails approval if condominium does not exist', async () => {
    expect(approveUseCase.execute({ id: 'non-existing' })).rejects.toThrow(
      'Condomínio não encontrado.',
    );
  });

  test('fails approval if condominium is already approved', async () => {
    expect(approveUseCase.execute({ id: approvedCondoId })).rejects.toThrow(
      'Este condomínio não está pendente de aprovação.',
    );
  });

  test('successfully rejects a pending condominium and notifies creator', async () => {
    // Recreate a pending condo for testing rejection
    const rejectCondoId = 'pending-condo-to-reject';
    await db.insert(condominium).values({
      id: rejectCondoId,
      name: 'Residencial Sunset',
      city: 'Curitiba',
      state: 'PR',
      cep: '80000002',
      createdBy: testUserId,
      status: 'PENDING_APPROVAL',
      proofUrl: 'https://mock-s3/proof2.pdf',
    });

    const res = await rejectUseCase.execute({
      id: rejectCondoId,
      reason: 'Documento ilegível',
    });

    expect(res).toBeDefined();
    expect(res.id).toBe(rejectCondoId);
    expect(res.status).toBe('REJECTED');

    // Verify db status
    const [dbCondo] = await db
      .select()
      .from(condominium)
      .where(eq(condominium.id, rejectCondoId))
      .limit(1);

    expect(dbCondo).toBeDefined();
    if (!dbCondo) throw new Error('dbCondo must be defined');
    expect(dbCondo.status).toBe('REJECTED');
  });

  test('fails rejection if reason is empty', async () => {
    expect(
      rejectUseCase.execute({ id: pendingCondoId, reason: '   ' }),
    ).rejects.toThrow('O motivo da rejeição é obrigatório.');
  });
});
