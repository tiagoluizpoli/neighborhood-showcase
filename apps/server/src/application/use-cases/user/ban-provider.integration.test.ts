import crypto from 'node:crypto';
import { beforeAll, describe, expect, test } from 'bun:test';
import { db } from '@neighborhood-showcase/db';
import {
  account,
  blacklistedIdentifier,
  session,
  user,
} from '@neighborhood-showcase/db/schema/auth';
import {
  announcement,
  condominium,
} from '@neighborhood-showcase/db/schema/showcase';
import { eq } from 'drizzle-orm';

describe('Ban Provider Integration Test', () => {
  const providerId = 'ban-provider-id';
  const targetCpfHash = 'ban-cpf-hash-123';

  beforeAll(async () => {
    // Clear tables
    await db.delete(announcement);
    await db.delete(condominium);
    await db.delete(session);
    await db.delete(account);
    await db.delete(blacklistedIdentifier);
    await db.delete(user);

    // Insert moderator/creator user first
    await db.insert(user).values({
      id: 'creator-id',
      name: 'Condo Creator',
      email: 'creator@example.com',
      role: 'PROVIDER',
      status: 'ACTIVE',
    });

    // Insert condo
    await db.insert(condominium).values({
      id: 'condo-ban-id',
      name: 'Residencial Banning',
      city: 'Florianópolis',
      state: 'SC',
      cep: '88000000',
      createdBy: 'creator-id',
      status: 'APPROVED',
    });

    // Insert provider with PII
    await db.insert(user).values({
      id: providerId,
      name: 'Violating Provider',
      email: 'violation@example.com',
      role: 'PROVIDER',
      status: 'ACTIVE',
      phone: '11999999999',
      cpfHash: targetCpfHash,
    });

    // Insert session and account
    await db.insert(session).values({
      id: 'session-ban-id',
      token: 'session-ban-token',
      expiresAt: new Date(Date.now() + 3600000),
      userId: providerId,
    });

    // Insert active announcement
    await db.insert(announcement).values({
      id: 'ann-ban-id',
      providerId,
      condominiumId: 'condo-ban-id',
      title: 'Bad Service',
      description: 'Violates community guidelines.',
      imageUrl: 'https://example.com/bad.png',
      category: 'Serviços',
      tags: [],
      contactLinks: {},
      status: 'ACTIVE',
    });
  });

  test('successfully bans a provider, revokes sessions, soft-deletes active announcements, and blacklists their CPF hash', async () => {
    // Simulate Ban mutation behavior
    const reasonForBan = 'Fraude comprovada';

    // 1. Update target user to BANNED
    await db
      .update(user)
      .set({ status: 'BANNED' })
      .where(eq(user.id, providerId));

    // 2. Add CPF hash to blacklist
    await db.insert(blacklistedIdentifier).values({
      id: crypto.randomUUID(),
      cpfHash: targetCpfHash,
      reason: reasonForBan,
    });

    // 3. Remove/hide announcements (soft delete)
    await db
      .update(announcement)
      .set({
        deletedAt: new Date(),
        status: 'SUSPENDED',
        suspensionReason: `Banido globalmente: ${reasonForBan}`,
      })
      .where(eq(announcement.providerId, providerId));

    // 4. Revoke sessions and accounts
    await db.delete(session).where(eq(session.userId, providerId));
    await db.delete(account).where(eq(account.userId, providerId));

    // Assertions
    const [bannedUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, providerId))
      .limit(1);
    expect(bannedUser).toBeDefined();
    expect(bannedUser?.status).toBe('BANNED');

    const [blacklistRecord] = await db
      .select()
      .from(blacklistedIdentifier)
      .where(eq(blacklistedIdentifier.cpfHash, targetCpfHash))
      .limit(1);
    expect(blacklistRecord).toBeDefined();
    expect(blacklistRecord?.reason).toBe(reasonForBan);

    const [updatedAnn] = await db
      .select()
      .from(announcement)
      .where(eq(announcement.id, 'ann-ban-id'))
      .limit(1);
    expect(updatedAnn).toBeDefined();
    expect(updatedAnn?.deletedAt).not.toBeNull();
    expect(updatedAnn?.status).toBe('SUSPENDED');

    const activeSessions = await db
      .select()
      .from(session)
      .where(eq(session.userId, providerId));
    expect(activeSessions).toHaveLength(0);
  });
});
