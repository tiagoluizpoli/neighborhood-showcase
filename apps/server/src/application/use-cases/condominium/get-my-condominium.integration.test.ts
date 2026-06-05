import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { db } from '@neighborhood-showcase/db';
import { user } from '@neighborhood-showcase/db/schema/auth';
import { condominium } from '@neighborhood-showcase/db/schema/showcase';
import { DrizzleCondominiumRepository } from '../../../infrastructure/db/condominium-repository';
import { GetMyCondominium } from './get-my-condominium';
import { ListApprovedCondominiums } from './list-approved-condominiums';
import { ListPendingCondominiums } from './list-pending-condominiums';

describe('Condominium Queries Integration Tests', () => {
  const condoRepo = new DrizzleCondominiumRepository();
  const getMyCondo = new GetMyCondominium(condoRepo);
  const listApproved = new ListApprovedCondominiums(condoRepo);
  const listPending = new ListPendingCondominiums(condoRepo);

  const creatorId = 'condo-creator-id';
  const approvedCondoId = 'approved-condo-id';
  const pendingCondoId = 'pending-condo-id';

  beforeAll(async () => {
    await db.delete(condominium);
    await db.delete(user);

    await db.insert(user).values({
      id: creatorId,
      name: 'Condo Creator',
      email: 'creator@condo.com',
      emailVerified: true,
      role: 'USER',
      status: 'ACTIVE',
    });

    await db.insert(condominium).values({
      id: approvedCondoId,
      name: 'Residencial Alameda',
      city: 'Florianópolis',
      state: 'SC',
      cep: '88000001',
      createdBy: creatorId,
      status: 'APPROVED',
    });

    await db.insert(condominium).values({
      id: pendingCondoId,
      name: 'Residencial Plaza',
      city: 'São José',
      state: 'SC',
      cep: '88100002',
      createdBy: creatorId,
      status: 'PENDING_APPROVAL',
    });
  });

  afterAll(async () => {
    await db.delete(condominium);
    await db.delete(user);
  });

  test("GetMyCondominium returns creator's condominium", async () => {
    const result = await getMyCondo.execute({ userId: creatorId });
    expect(result).not.toBeNull();
    expect(result?.id).toBe(approvedCondoId);
  });

  test('ListApprovedCondominiums returns only approved condominiums matching search', async () => {
    const allApproved = await listApproved.execute({});
    expect(allApproved.length).toBe(1);
    expect(allApproved[0]?.id).toBe(approvedCondoId);

    const searchMatch = await listApproved.execute({ query: 'Alameda' });
    expect(searchMatch.length).toBe(1);

    const noMatch = await listApproved.execute({ query: 'NonExistent' });
    expect(noMatch.length).toBe(0);
  });

  test('ListPendingCondominiums returns pending condominiums', async () => {
    const pending = await listPending.execute();
    expect(pending.length).toBe(1);
    expect(pending[0]?.id).toBe(pendingCondoId);
  });
});
