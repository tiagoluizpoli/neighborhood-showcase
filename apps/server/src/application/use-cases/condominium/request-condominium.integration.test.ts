import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { db } from '@neighborhood-showcase/db';
import { user } from '@neighborhood-showcase/db/schema/auth';
import { condominium } from '@neighborhood-showcase/db/schema/showcase';
import { eq } from 'drizzle-orm';
import { DrizzleCondominiumRepository } from '../../../infrastructure/db/condominium-repository';
import { storageClient } from '../../../infrastructure/storage/storage.client';
import { RequestCondominium } from './request-condominium';

describe('Request Condominium Integration Test', () => {
  const condoRepo = new DrizzleCondominiumRepository();
  const useCase = new RequestCondominium(condoRepo);
  const testUserId = 'test-provider-id';

  beforeAll(async () => {
    // Make sure a test user exists to satisfy foreign key constraint
    await db.delete(condominium);
    await db.delete(user);

    await db.insert(user).values({
      id: testUserId,
      name: 'Test Creator',
      email: 'creator@example.com',
      emailVerified: true,
      role: 'PROVIDER',
      status: 'ACTIVE',
    });
  });

  afterAll(async () => {
    await db.delete(condominium);
    await db.delete(user);
  });

  test('successfully uploads file to S3 storage client', async () => {
    const fileContent = new TextEncoder().encode('Dummy PDF content');
    const key = `test-${Date.now()}-minutes.pdf`;

    const url = await storageClient.uploadFile(
      key,
      fileContent,
      'application/pdf',
    );
    expect(url).toContain(key);
    expect(url).toContain('showcase');

    // Clean up
    await storageClient.deleteFile(key);
  });

  test('successfully creates a condominium in PENDING_APPROVAL status', async () => {
    const input = {
      name: 'Residencial Bella Vista',
      city: 'São Paulo',
      state: 'SP',
      cep: '01311-200',
      contactInfo: {
        email: 'contato@bellavista.com',
        phone: '11999998888',
      },
      createdBy: testUserId,
      proofUrl: 'https://mock-s3/minutes.pdf',
    };

    const condo = await useCase.execute(input);

    expect(condo).toBeDefined();
    expect(condo.id).toBeDefined();
    expect(condo.name).toBe(input.name);
    expect(condo.city).toBe(input.city);
    expect(condo.state).toBe(input.state);
    expect(condo.cep).toBe('01311200'); // clean cep
    expect(condo.status).toBe('PENDING_APPROVAL');
    expect(condo.createdBy).toBe(testUserId);
    expect(condo.proofUrl).toBe(input.proofUrl);

    // Verify database state
    const [dbCondo] = await db
      .select()
      .from(condominium)
      .where(eq(condominium.id, condo.id))
      .limit(1);

    expect(dbCondo).toBeDefined();
    if (!dbCondo) throw new Error('dbCondo must be defined');
    expect(dbCondo.name).toBe(input.name);
    expect(dbCondo.status).toBe('PENDING_APPROVAL');
  });

  test('fails creation with invalid CEP', async () => {
    const input = {
      name: 'Residencial Bella Vista',
      city: 'São Paulo',
      state: 'SP',
      cep: '123', // invalid
      contactInfo: {},
      createdBy: testUserId,
    };

    expect(useCase.execute(input)).rejects.toThrow('CEP inválido');
  });

  test('fails creation with invalid name', async () => {
    const input = {
      name: 'Ab', // too short
      city: 'São Paulo',
      state: 'SP',
      cep: '01311-200',
      contactInfo: {},
      createdBy: testUserId,
    };

    expect(useCase.execute(input)).rejects.toThrow(
      'Nome do condomínio deve ter pelo menos 3 caracteres',
    );
  });
});
