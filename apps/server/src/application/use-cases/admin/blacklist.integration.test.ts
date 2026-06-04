import { beforeAll, describe, expect, test } from 'bun:test';
import { db } from '@neighborhood-showcase/db';
import { blacklistedIdentifier } from '@neighborhood-showcase/db/schema/auth';
import { eq } from 'drizzle-orm';
import { DrizzleBlacklistRepository } from '../../../infrastructure/db/blacklist-repository';
import { AddBlacklist, CpfAlreadyBlacklistedError } from './add-blacklist';
import { ListBlacklist } from './list-blacklist';
import { RemoveBlacklist } from './remove-blacklist';

describe('Blacklist use cases', () => {
  const blacklistRepo = new DrizzleBlacklistRepository();
  const listBlacklist = new ListBlacklist(blacklistRepo);
  const addBlacklist = new AddBlacklist(blacklistRepo);
  const removeBlacklist = new RemoveBlacklist(blacklistRepo);

  const testCpfHash = 'blacklist-test-cpf-hash';

  beforeAll(async () => {
    await db.delete(blacklistedIdentifier);
  });

  test('addBlacklist creates a new entry', async () => {
    const entry = await addBlacklist.execute({
      cpfHash: testCpfHash,
      reason: 'Test ban',
    });

    expect(entry.cpfHash).toBe(testCpfHash);
    expect(entry.reason).toBe('Test ban');
    expect(entry.id).toBeTruthy();
  });

  test('addBlacklist throws CpfAlreadyBlacklistedError on duplicate', async () => {
    await expect(
      addBlacklist.execute({ cpfHash: testCpfHash, reason: 'Duplicate' }),
    ).rejects.toBeInstanceOf(CpfAlreadyBlacklistedError);
  });

  test('listBlacklist returns all entries', async () => {
    const entries = await listBlacklist.execute();
    expect(entries.length).toBeGreaterThanOrEqual(1);
    expect(entries.some((e) => e.cpfHash === testCpfHash)).toBe(true);
  });

  test('removeBlacklist deletes an entry by id', async () => {
    const entries = await listBlacklist.execute();
    const target = entries.find((e) => e.cpfHash === testCpfHash);
    expect(target).toBeDefined();

    const targetId = target?.id ?? '';
    await removeBlacklist.execute({ id: targetId });

    const remaining = await db
      .select()
      .from(blacklistedIdentifier)
      .where(eq(blacklistedIdentifier.id, targetId));
    expect(remaining).toHaveLength(0);
  });
});
