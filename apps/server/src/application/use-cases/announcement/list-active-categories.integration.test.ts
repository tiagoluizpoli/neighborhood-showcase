import { beforeEach, describe, expect, test } from 'bun:test';
import { db } from '@neighborhood-showcase/db';
import {
  announcement,
  category,
} from '@neighborhood-showcase/db/schema/showcase';
import { inArray } from 'drizzle-orm';
import { DrizzleCategoryRepository } from '../../../infrastructure/db/category-repository';
import { ListActiveCategories } from './list-active-categories';

describe('ListActiveCategories use case', () => {
  const categoryRepo = new DrizzleCategoryRepository();
  const listActiveCategories = new ListActiveCategories(categoryRepo);

  beforeEach(async () => {
    await db.delete(announcement);
    await db
      .delete(category)
      .where(
        inArray(category.id, [
          'inactive-category-id',
          'second-active-category-id',
          'first-active-category-id',
        ]),
      );

    await db.insert(category).values([
      {
        id: 'inactive-category-id',
        slug: 'inactive',
        name: 'Inactive',
        displayOrder: 99,
        isActive: false,
      },
      {
        id: 'second-active-category-id',
        slug: 'second-active',
        name: 'Second Active',
        displayOrder: 2,
        isActive: true,
      },
      {
        id: 'first-active-category-id',
        slug: 'first-active',
        name: 'First Active',
        displayOrder: 1,
        isActive: true,
      },
    ]);
  });

  test('returns only active categories ordered by displayOrder', async () => {
    const result = await listActiveCategories.execute();
    const insertedActiveIds = result
      .filter(
        (item) =>
          item.id === 'first-active-category-id' ||
          item.id === 'second-active-category-id',
      )
      .map((item) => item.id);

    expect(insertedActiveIds).toEqual([
      'first-active-category-id',
      'second-active-category-id',
    ]);
    expect(
      result.find((item) => item.id === 'inactive-category-id'),
    ).toBeUndefined();
  });
});
