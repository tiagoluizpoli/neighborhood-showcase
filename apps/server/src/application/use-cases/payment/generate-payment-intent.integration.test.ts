import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { db } from '@neighborhood-showcase/db';
import { user } from '@neighborhood-showcase/db/schema/auth';
import {
  announcement,
  providerLocation as assignment,
  condominium,
  payment,
} from '@neighborhood-showcase/db/schema/showcase';
import { eq } from 'drizzle-orm';
import { DrizzleAnnouncementRepository } from '../../../infrastructure/db/announcement-repository';
import { DrizzlePaymentRepository } from '../../../infrastructure/db/payment-repository';
import { AbacatePayClient } from '../../../infrastructure/payment/abacatepay.client';
import { GeneratePaymentIntent } from './generate-payment-intent';

describe('Generate Payment Intent Integration Test', () => {
  const announcementRepo = new DrizzleAnnouncementRepository();
  const paymentRepo = new DrizzlePaymentRepository();
  const abacatePayClient = new AbacatePayClient();
  const useCase = new GeneratePaymentIntent(
    announcementRepo,
    paymentRepo,
    abacatePayClient,
  );

  const testUserId = 'test-provider-id-7';
  const testCondoId = 'test-condo-id-7';
  const testAnnId = 'test-ann-id-7';

  beforeAll(async () => {
    // Clear tables
    await db.delete(payment);
    await db.delete(announcement);
    await db.delete(assignment);
    await db.delete(condominium);
    await db.delete(user);

    // Create user
    await db.insert(user).values({
      id: testUserId,
      name: 'John Payment Provider',
      email: 'john-payment@example.com',
      emailVerified: true,
      role: 'PROVIDER',
      status: 'ACTIVE',
    });

    // Create condo
    await db.insert(condominium).values({
      id: testCondoId,
      name: 'Oasis Residence',
      city: 'Curitiba',
      state: 'PR',
      cep: '80000000',
      createdBy: testUserId,
      status: 'APPROVED',
    });

    // Create approved assignment
    await db.insert(assignment).values({
      id: 'assign-id-7',
      providerId: testUserId,
      condominiumId: testCondoId,
      type: 'RESIDENT',
      status: 'APPROVED',
      unitInfo: 'Block A, Apt 101',
    });

    // Create draft announcement
    await db.insert(announcement).values({
      id: testAnnId,
      providerId: testUserId,
      condominiumId: testCondoId,
      title: 'Delicious Ice Cream',
      description: 'Handmade delicious ice cream in curitiba block A.',
      imageUrl: 'http://localhost:9000/showcase/icecream.jpg',
      category: 'Alimentação',
      status: 'DRAFT',
    });
  });

  afterAll(async () => {
    await db.delete(payment);
    await db.delete(announcement);
    await db.delete(assignment);
    await db.delete(condominium);
    await db.delete(user);
  });

  test('successfully generates a new payment intent and updates announcement status', async () => {
    const res = await useCase.execute({
      announcementId: testAnnId,
      providerId: testUserId,
      customerName: 'John Payment Provider',
      customerEmail: 'john-payment@example.com',
    });

    expect(res).toBeDefined();
    expect(res.id).toBeDefined();
    expect(res.status).toBe('PENDING');
    expect(res.billingId).toContain('bill_mock_');
    expect(res.pixCopyPaste).toBeDefined();
    expect(res.pixQrCode).toBeDefined();

    // Verify DB payment record
    const [dbPay] = await db
      .select()
      .from(payment)
      .where(eq(payment.id, res.id))
      .limit(1);

    expect(dbPay).toBeDefined();
    if (!dbPay) throw new Error('dbPay must be defined');
    expect(dbPay.status).toBe('PENDING');
    expect(dbPay.announcementId).toBe(testAnnId);

    // Verify announcement transitioned to PENDING_PAYMENT
    const [dbAnn] = await db
      .select()
      .from(announcement)
      .where(eq(announcement.id, testAnnId))
      .limit(1);

    expect(dbAnn).toBeDefined();
    if (!dbAnn) throw new Error('dbAnn must be defined');
    expect(dbAnn.status).toBe('PENDING_PAYMENT');
  });

  test('returns existing pending payment on subsequent calls', async () => {
    const firstRes = await paymentRepo.findByAnnouncementId(testAnnId);
    expect(firstRes).toBeDefined();
    if (!firstRes) throw new Error('firstRes must be defined');

    const res = await useCase.execute({
      announcementId: testAnnId,
      providerId: testUserId,
      customerName: 'John Payment Provider',
      customerEmail: 'john-payment@example.com',
    });

    // Should return the exact same payment ID
    expect(res.id).toBe(firstRes.id);
    expect(res.billingId).toBe(firstRes.billingId);
  });

  test('fails if announcement does not exist', async () => {
    expect(
      useCase.execute({
        announcementId: 'non-existent',
        providerId: testUserId,
        customerName: 'John Payment Provider',
        customerEmail: 'john-payment@example.com',
      }),
    ).rejects.toThrow('Anúncio não encontrado.');
  });

  test('fails if user is not the owner of the announcement', async () => {
    expect(
      useCase.execute({
        announcementId: testAnnId,
        providerId: 'some-other-provider',
        customerName: 'Other Provider',
        customerEmail: 'other@example.com',
      }),
    ).rejects.toThrow(
      'Acesso negado. Você não é o proprietário deste anúncio.',
    );
  });

  test('fails if announcement is already ACTIVE', async () => {
    // Update status to ACTIVE
    await db
      .update(announcement)
      .set({ status: 'ACTIVE' })
      .where(eq(announcement.id, testAnnId));

    expect(
      useCase.execute({
        announcementId: testAnnId,
        providerId: testUserId,
        customerName: 'John Payment Provider',
        customerEmail: 'john-payment@example.com',
      }),
    ).rejects.toThrow('Este anúncio já está ativo e publicado.');
  });

  test('fails if announcement is SUSPENDED', async () => {
    // Update status to SUSPENDED
    await db
      .update(announcement)
      .set({ status: 'SUSPENDED' })
      .where(eq(announcement.id, testAnnId));

    expect(
      useCase.execute({
        announcementId: testAnnId,
        providerId: testUserId,
        customerName: 'John Payment Provider',
        customerEmail: 'john-payment@example.com',
      }),
    ).rejects.toThrow('Anúncios suspensos não podem receber pagamentos.');
  });
});
