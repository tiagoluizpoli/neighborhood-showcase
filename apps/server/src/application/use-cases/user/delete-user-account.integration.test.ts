import { beforeAll, describe, expect, test } from 'bun:test';
import { db } from '@neighborhood-showcase/db';
import { account, session, user } from '@neighborhood-showcase/db/schema/auth';
import {
  announcement,
  providerLocation as assignment,
  condominium,
  payment,
} from '@neighborhood-showcase/db/schema/showcase';
import { eq } from 'drizzle-orm';
import { DrizzleUserRepository } from '../../../infrastructure/db/user-repository';
import { DeleteUserAccount } from './delete-user-account';

describe('Delete User Account LGPD Integration Test', () => {
  const useCase = new DeleteUserAccount(new DrizzleUserRepository());

  const userId = 'delete-user-id';
  const condoId = 'delete-condo-id';
  const annId = 'delete-ann-id';

  beforeAll(async () => {
    // Clear tables
    await db.delete(payment);
    await db.delete(announcement);
    await db.delete(assignment);
    await db.delete(condominium);
    await db.delete(session);
    await db.delete(account);
    await db.delete(user);

    // Insert user with PII
    await db.insert(user).values({
      id: userId,
      name: 'João da Silva',
      email: 'joao@example.com',
      emailVerified: true,
      role: 'PROVIDER',
      status: 'ACTIVE',
      phone: '11999999999',
      cpfHash: 'hashed-cpf-123',
    });

    // Insert session and account
    await db.insert(session).values({
      id: 'session-id',
      token: 'session-token',
      expiresAt: new Date(Date.now() + 3600000),
      userId,
    });

    await db.insert(account).values({
      id: 'account-id',
      accountId: 'acc-123',
      providerId: 'google',
      userId,
    });

    // Insert condo
    await db.insert(condominium).values({
      id: condoId,
      name: 'Residencial LGPD',
      city: 'Curitiba',
      state: 'PR',
      cep: '80000000',
      createdBy: userId,
      status: 'APPROVED',
    });

    // Insert announcement
    await db.insert(announcement).values({
      id: annId,
      providerId: userId,
      condominiumId: condoId,
      title: 'Doceria Gourmet',
      description: 'Melhores doces da região.',
      imageUrl: 'https://example.com/sweet.png',
      categoryId: 'cat-alimentacao',
      tags: [],
      contactLinks: {},
      status: 'ACTIVE',
    });

    // Insert payment
    await db.insert(payment).values({
      id: 'payment-id',
      announcementId: annId,
      billingId: 'bill-123',
      amountCents: 200,
      status: 'PAID',
    });
  });

  test('successfully scrubs user details, soft-deletes announcements, deletes sessions/accounts, and preserves payment records', async () => {
    await useCase.execute({ userId });

    // Verify User PII is scrubbed
    const [updatedUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    expect(updatedUser).toBeDefined();
    expect(updatedUser?.name).toBe('Anônimo');
    expect(updatedUser?.email).toBe(`deleted-${userId}@lgpd.local`);
    expect(updatedUser?.phone).toBeNull();
    expect(updatedUser?.cpfHash).toBeNull();
    expect(updatedUser?.deletedAt).not.toBeNull();

    // Verify Announcements are soft-deleted
    const [updatedAnn] = await db
      .select()
      .from(announcement)
      .where(eq(announcement.id, annId))
      .limit(1);

    expect(updatedAnn).toBeDefined();
    expect(updatedAnn?.deletedAt).not.toBeNull();

    // Verify Sessions and Accounts are deleted
    const activeSessions = await db
      .select()
      .from(session)
      .where(eq(session.userId, userId));
    expect(activeSessions).toHaveLength(0);

    const activeAccounts = await db
      .select()
      .from(account)
      .where(eq(account.userId, userId));
    expect(activeAccounts).toHaveLength(0);

    // Verify Payment records are fully preserved
    const [preservedPayment] = await db
      .select()
      .from(payment)
      .where(eq(payment.announcementId, annId))
      .limit(1);

    expect(preservedPayment).toBeDefined();
    expect(preservedPayment?.status).toBe('PAID');
    expect(preservedPayment?.amountCents).toBe(200);
  });
});
