import { db } from '@neighborhood-showcase/db';
import { blacklistedIdentifier as blacklistSchema } from '@neighborhood-showcase/db/schema/auth';
import { eq } from 'drizzle-orm';
import type { BlacklistedIdentifier } from '../../domain/entities/blacklist.entity';
import type { BlacklistRepository } from '../../domain/repositories/blacklist.repository';
import { BlacklistMapper } from './mappers/blacklist.mapper';

export class DrizzleBlacklistRepository implements BlacklistRepository {
  private readonly mapper = new BlacklistMapper();

  async findAll(): Promise<BlacklistedIdentifier[]> {
    const rows = await db.select().from(blacklistSchema);
    return rows.map((row) => this.mapper.toDomain(row));
  }

  async findByCpfHash(cpfHash: string): Promise<BlacklistedIdentifier | null> {
    const [row] = await db
      .select()
      .from(blacklistSchema)
      .where(eq(blacklistSchema.cpfHash, cpfHash))
      .limit(1);

    if (!row) return null;
    return this.mapper.toDomain(row);
  }

  async create(input: {
    id: string;
    cpfHash: string;
    reason: string;
  }): Promise<BlacklistedIdentifier> {
    const [inserted] = await db
      .insert(blacklistSchema)
      .values({
        id: input.id,
        cpfHash: input.cpfHash,
        reason: input.reason,
      })
      .returning();

    if (!inserted) {
      throw new Error('Failed to create blacklisted identifier');
    }

    return this.mapper.toDomain(inserted);
  }

  async delete(id: string): Promise<void> {
    await db.delete(blacklistSchema).where(eq(blacklistSchema.id, id));
  }
}
