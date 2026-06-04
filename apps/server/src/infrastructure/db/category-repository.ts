import { db } from '@neighborhood-showcase/db';
import { category as categorySchema } from '@neighborhood-showcase/db/schema/showcase';
import { asc, eq } from 'drizzle-orm';
import type {
  CategoryDTO,
  CategoryRepository,
} from '../../domain/repositories/category.repository';

export class DrizzleCategoryRepository implements CategoryRepository {
  async listActive(): Promise<CategoryDTO[]> {
    return db
      .select()
      .from(categorySchema)
      .where(eq(categorySchema.isActive, true))
      .orderBy(asc(categorySchema.displayOrder));
  }

  async findById(id: string): Promise<CategoryDTO | null> {
    const [row] = await db
      .select()
      .from(categorySchema)
      .where(eq(categorySchema.id, id))
      .limit(1);

    return row ?? null;
  }
}
