import { beforeAll, describe, expect, test } from 'bun:test';
import { db } from '@neighborhood-showcase/db';
import { user } from '@neighborhood-showcase/db/schema/auth';
import {
  announcement,
  condominium,
  payment,
} from '@neighborhood-showcase/db/schema/showcase';
import { DrizzleAnnouncementRepository } from '../../../infrastructure/db/announcement-repository';
import { DrizzlePaymentRepository } from '../../../infrastructure/db/payment-repository';
import {
  AnnouncementAccessDeniedError,
  GetPaymentStatus,
  PaymentNotFoundError,
} from './get-payment-status';

describe('GetPaymentStatus use case', () => {
  const providerId = 'payment-status-provider-id';
  const otherProviderId = 'payment-status-other-provider-id';
  const condoId = 'payment-status-condo-id';
  const announcementId = 'payment-status-announcement-id';

  const announcementRepo = new DrizzleAnnouncementRepository();
  const paymentRepo = new DrizzlePaymentRepository();
  const getPaymentStatus = new GetPaymentStatus(announcementRepo, paymentRepo);

  beforeAll(async () => {
    await db.delete(payment);
    await db.delete(announcement);
    await db.delete(condominium);
    await db.delete(user);

    await db.insert(user).values([
      {
        id: providerId,
        name: 'Payment Owner',
        email: 'payment-owner@example.com',
        emailVerified: true,
        role: 'PROVIDER',
        status: 'ACTIVE',
      },
      {
        id: otherProviderId,
        name: 'Other Provider',
        email: 'payment-other@example.com',
        emailVerified: true,
        role: 'PROVIDER',
        status: 'ACTIVE',
      },
    ]);

    await db.insert(condominium).values({
      id: condoId,
      name: 'Payment Condo',
      city: 'Florianopolis',
      state: 'SC',
      cep: '88000000',
      createdBy: providerId,
      status: 'APPROVED',
    });

    await db.insert(announcement).values({
      id: announcementId,
      providerId,
      condominiumId: condoId,
      title: 'Payment Service',
      description: 'Tracks payment state',
      imageUrl: 'https://example.com/payment.png',
      categoryId: 'cat-servicos',
      status: 'PENDING_PAYMENT',
    });

    await db.insert(payment).values({
      id: 'payment-status-id',
      announcementId,
      billingId: 'billing-status-id',
      amountCents: 200,
      status: 'PENDING',
    });
  });

  test('returns latest payment status for announcement owner', async () => {
    const result = await getPaymentStatus.execute({
      announcementId,
      providerId,
    });

    expect(result.id).toBe('payment-status-id');
    expect(result.status).toBe('PENDING');
    expect(result.billingId).toBe('billing-status-id');
  });

  test('throws PaymentNotFoundError when payment record is missing', async () => {
    await expect(
      getPaymentStatus.execute({
        announcementId: 'missing-announcement-id',
        providerId,
      }),
    ).rejects.toBeInstanceOf(PaymentNotFoundError);
  });

  test('throws AnnouncementAccessDeniedError for non-owner', async () => {
    await expect(
      getPaymentStatus.execute({
        announcementId,
        providerId: otherProviderId,
      }),
    ).rejects.toBeInstanceOf(AnnouncementAccessDeniedError);
  });
});
