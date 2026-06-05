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
import { DrizzleAnnouncementRepository } from '../../../infrastructure/db/announcement-repository';
import { DrizzleBlacklistRepository } from '../../../infrastructure/db/blacklist-repository';
import { DrizzleUserRepository } from '../../../infrastructure/db/user-repository';
import { BanProvider, ProviderNotFoundError } from './ban-provider';

describe('BanProvider use case', () => {
  const providerId = 'ban-provider-uc-id';
  const targetCpfHash = 'ban-cpf-hash-uc-456';

  const userRepo = new DrizzleUserRepository();
  const blacklistRepo = new DrizzleBlacklistRepository();
  const announcementRepo = new DrizzleAnnouncementRepository();
  const banProvider = new BanProvider(
    userRepo,
    blacklistRepo,
    announcementRepo,
  );

  beforeAll(async () => {
    await db.delete(announcement);
    await db.delete(condominium);
    await db.delete(session);
    await db.delete(account);
    await db.delete(blacklistedIdentifier);
    await db.delete(user);

    await db.insert(user).values({
      id: 'creator-uc-id',
      name: 'Condo Creator',
      email: 'creator-uc@example.com',
      role: 'USER',
      status: 'ACTIVE',
    });

    await db.insert(condominium).values({
      id: 'condo-ban-uc-id',
      name: 'Residencial Banning UC',
      city: 'Florianópolis',
      state: 'SC',
      cep: '88000001',
      createdBy: 'creator-uc-id',
      status: 'APPROVED',
    });

    await db.insert(user).values({
      id: providerId,
      name: 'Violating Provider UC',
      email: 'violation-uc@example.com',
      role: 'USER',
      status: 'ACTIVE',
      phone: '11999999999',
      cpfHash: targetCpfHash,
    });

    await db.insert(session).values({
      id: 'session-ban-uc-id',
      token: 'session-ban-uc-token',
      expiresAt: new Date(Date.now() + 3600000),
      userId: providerId,
    });

    await db.insert(announcement).values({
      id: 'ann-ban-uc-id',
      providerId,
      condominiumId: 'condo-ban-uc-id',
      title: 'Bad Service UC',
      description: 'Violates community guidelines.',
      imageUrl: 'https://example.com/bad.png',
      categoryId: 'cat-servicos',
      tags: [],
      contactLinks: {},
      status: 'ACTIVE',
    });
  });

  test('bans provider, blacklists CPF hash, soft-deletes announcements, and revokes sessions', async () => {
    const reason = 'Fraude comprovada';
    await banProvider.execute({
      actorId: 'creator-uc-id',
      targetUserId: providerId,
      reason,
    });

    const [bannedUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, providerId))
      .limit(1);
    expect(bannedUser?.status).toBe('BANNED');

    const [blacklistRecord] = await db
      .select()
      .from(blacklistedIdentifier)
      .where(eq(blacklistedIdentifier.cpfHash, targetCpfHash))
      .limit(1);
    expect(blacklistRecord).toBeDefined();
    expect(blacklistRecord?.reason).toBe(reason);

    const [updatedAnn] = await db
      .select()
      .from(announcement)
      .where(eq(announcement.id, 'ann-ban-uc-id'))
      .limit(1);
    expect(updatedAnn?.status).toBe('SUSPENDED');
    expect(updatedAnn?.deletedAt).not.toBeNull();
    expect(updatedAnn?.suspensionReason).toBe(`Banido globalmente: ${reason}`);

    const activeSessions = await db
      .select()
      .from(session)
      .where(eq(session.userId, providerId));
    expect(activeSessions).toHaveLength(0);
  });

  test('does not double-blacklist if CPF already present', async () => {
    // Provider is already banned from above test; cpfHash already in blacklist.
    // Run again — should not throw and not duplicate the entry.
    await expect(
      banProvider.execute({
        actorId: 'creator-uc-id',
        targetUserId: providerId,
        reason: 'Second ban attempt',
      }),
    ).resolves.toBeUndefined();

    const allEntries = await db
      .select()
      .from(blacklistedIdentifier)
      .where(eq(blacklistedIdentifier.cpfHash, targetCpfHash));
    expect(allEntries).toHaveLength(1);
  });

  test('throws ProviderNotFoundError for unknown user id', async () => {
    await expect(
      banProvider.execute({
        actorId: 'creator-uc-id',
        targetUserId: 'non-existent-user',
        reason: 'Test',
      }),
    ).rejects.toBeInstanceOf(ProviderNotFoundError);
  });
});
