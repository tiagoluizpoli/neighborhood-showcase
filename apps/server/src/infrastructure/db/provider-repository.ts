import crypto from 'node:crypto';
import { db } from '@neighborhood-showcase/db';
import { provider as providerSchema } from '@neighborhood-showcase/db/schema/showcase';
import { and, eq, isNull } from 'drizzle-orm';
import type { Provider } from '../../domain/entities/provider.entity';
import type {
  CreateProviderInput,
  ProviderRepository,
} from '../../domain/repositories/provider.repository';
import { ProviderMapper } from './mappers/provider.mapper';

export class DrizzleProviderRepository implements ProviderRepository {
  private readonly mapper = new ProviderMapper();

  async create(input: CreateProviderInput): Promise<Provider> {
    const [inserted] = await db
      .insert(providerSchema)
      .values({
        id: input.id ?? crypto.randomUUID(),
        ownerId: input.ownerId,
      })
      .returning();

    if (!inserted) {
      throw new Error('Failed to create provider');
    }

    return this.mapper.toDomain(inserted);
  }

  async findById(id: string): Promise<Provider | null> {
    const [found] = await db
      .select()
      .from(providerSchema)
      .where(and(eq(providerSchema.id, id), isNull(providerSchema.deletedAt)))
      .limit(1);

    return found ? this.mapper.toDomain(found) : null;
  }

  async listByOwner(ownerId: string): Promise<Provider[]> {
    const rows = await db
      .select()
      .from(providerSchema)
      .where(
        and(
          eq(providerSchema.ownerId, ownerId),
          isNull(providerSchema.deletedAt),
        ),
      );

    return rows.map((row) => this.mapper.toDomain(row));
  }

  async softDelete(id: string): Promise<void> {
    await db
      .update(providerSchema)
      .set({ deletedAt: new Date() })
      .where(eq(providerSchema.id, id));
  }
}
