import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { db } from '@neighborhood-showcase/db';
import { user } from '@neighborhood-showcase/db/schema/auth';
import {
  address,
  providerLocation as assignment,
} from '@neighborhood-showcase/db/schema/showcase';
import { eq } from 'drizzle-orm';
import { DrizzleAddressRepository } from '../../../infrastructure/db/address-repository';
import { DrizzleAssignmentRepository } from '../../../infrastructure/db/assignment-repository';
import { RegisterExternalLocation } from './register-external-location';

describe('Register External Location Integration Test', () => {
  const assignmentRepo = new DrizzleAssignmentRepository();
  const addressRepo = new DrizzleAddressRepository();
  const useCase = new RegisterExternalLocation(assignmentRepo, addressRepo);

  const testUserId = 'test-provider-external-1';

  beforeAll(async () => {
    // Clean up first
    await db.delete(assignment);
    await db.delete(address);
    await db.delete(user);

    // Create test user
    await db.insert(user).values({
      id: testUserId,
      name: 'Test External Provider',
      email: 'external@example.com',
      emailVerified: true,
      role: 'PROVIDER',
      status: 'ACTIVE',
    });
  });

  afterAll(async () => {
    await db.delete(assignment);
    await db.delete(address);
    await db.delete(user);
  });

  test('successfully registers an external provider location with a new address', async () => {
    const input = {
      providerId: testUserId,
      cep: '88015-000',
      street: 'Rua Principal',
      neighborhood: 'Centro',
      city: 'Florianópolis',
      state: 'SC',
      number: '123',
      complement: 'Sala 402',
    };

    const res = await useCase.execute(input);

    expect(res).toBeDefined();
    expect(res.id).toBeDefined();
    expect(res.providerId).toBe(testUserId);
    expect(res.condominiumId).toBeNull();
    expect(res.type).toBe('EXTERNAL');
    expect(res.status).toBe('APPROVED');
    expect(res.number).toBe(input.number);
    expect(res.unitInfo).toBe(input.complement);

    // Verify address in DB
    const [dbAddress] = await db
      .select()
      .from(address)
      .where(eq(address.cep, '88015000'))
      .limit(1);

    expect(dbAddress).toBeDefined();
    if (!dbAddress) throw new Error('dbAddress must be defined');
    expect(dbAddress.street).toBe(input.street);
    expect(dbAddress.neighborhood).toBe(input.neighborhood);
    expect(dbAddress.city).toBe(input.city);
    expect(dbAddress.state).toBe('SC');
  });

  test('successfully reuses existing address if CEP already exists', async () => {
    // Address for CEP 88015000 already exists from previous test
    const input = {
      providerId: testUserId,
      cep: '88015000',
      street: 'Another Street Name But Same CEP',
      neighborhood: 'Centro',
      city: 'Florianópolis',
      state: 'SC',
      number: '999',
    };

    const res = await useCase.execute(input);

    expect(res).toBeDefined();
    expect(res.type).toBe('EXTERNAL');
    expect(res.number).toBe('999');

    // Count of addresses with this CEP should still be 1 (reused)
    const dbAddresses = await db
      .select()
      .from(address)
      .where(eq(address.cep, '88015000'));

    expect(dbAddresses.length).toBe(1);
  });

  test('fails registration if CEP is invalid', async () => {
    const input = {
      providerId: testUserId,
      cep: '123', // Invalid
      street: 'Rua Principal',
      neighborhood: 'Centro',
      city: 'Florianópolis',
      state: 'SC',
      number: '123',
    };

    expect(useCase.execute(input)).rejects.toThrow('CEP inválido.');
  });
});
