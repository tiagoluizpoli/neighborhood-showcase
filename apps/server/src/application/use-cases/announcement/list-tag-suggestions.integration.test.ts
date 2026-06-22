import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { db } from '@neighborhood-showcase/db';
import { user } from '@neighborhood-showcase/db/schema/auth';
import {
  announcement,
  category,
} from '@neighborhood-showcase/db/schema/showcase';
import { eq, inArray } from 'drizzle-orm';
import { DrizzleAnnouncementRepository } from '../../../infrastructure/db/announcement-repository';
import { ListTagSuggestions } from './list-tag-suggestions';

describe('ListTagSuggestions use case', () => {
  const announcementRepo = new DrizzleAnnouncementRepository();
  const useCase = new ListTagSuggestions(announcementRepo);

  const providerId = 'tag-suggestions-provider';
  const categoryId = 'tag-suggestions-category';
  const id1 = 'tag-ann-1';
  const id2 = 'tag-ann-2';
  const id3 = 'tag-ann-3';
  const ids = [id1, id2, id3];

  beforeAll(async () => {
    await db.delete(announcement).where(inArray(announcement.id, ids));
    await db.delete(user).where(eq(user.id, providerId));
    await db.delete(category).where(eq(category.id, categoryId));

    await db.insert(user).values({
      id: providerId,
      name: 'Tag Provider',
      email: 'tag-provider@example.com',
      emailVerified: true,
      role: 'USER',
      status: 'ACTIVE',
    });
    await db.insert(category).values({
      id: categoryId,
      slug: 'tag-suggestions',
      name: 'Tag Suggestions',
      displayOrder: 1,
      isActive: true,
    });

    const base = {
      providerId,
      categoryId,
      description: 'A description long enough to be valid.',
      imageUrl: 'https://example.com/img.png',
      contactMode: 'inherit' as const,
      status: 'ACTIVE' as const,
    };
    await db
      .insert(announcement)
      .values({ ...base, id: id1, title: 'One', tags: ['bolo', 'doce'] });
    await db
      .insert(announcement)
      .values({ ...base, id: id2, title: 'Two', tags: ['bolo', 'salgado'] });
    // Soft-deleted: its unique tag must be excluded from suggestions.
    await db.insert(announcement).values({
      ...base,
      id: id3,
      title: 'Three',
      tags: ['removido'],
      deletedAt: new Date(),
    });
  });

  afterAll(async () => {
    await db.delete(announcement).where(inArray(announcement.id, ids));
    await db.delete(user).where(eq(user.id, providerId));
    await db.delete(category).where(eq(category.id, categoryId));
  });

  test('returns distinct tags ordered by frequency, excluding deleted', async () => {
    const result = await useCase.execute();
    const seeded = result.filter((tag) =>
      ['bolo', 'doce', 'salgado', 'removido'].includes(tag),
    );

    // 'bolo' used twice ranks first; deleted-only 'removido' is absent.
    expect(seeded[0]).toBe('bolo');
    expect(seeded).toContain('doce');
    expect(seeded).toContain('salgado');
    expect(seeded).not.toContain('removido');
  });
});
