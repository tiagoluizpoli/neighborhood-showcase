import { db } from '@neighborhood-showcase/db';
import { condominium as condoSchema } from '@neighborhood-showcase/db/schema/showcase';
import { eq } from 'drizzle-orm';
import type { Condominium } from '../../domain/entities/condominium.entity';
import type {
  CondominiumRepository,
  CreateCondominiumRepositoryInput,
} from '../../domain/repositories/condominium.repository';
import { CondominiumMapper } from './mappers/condominium.mapper';

export class DrizzleCondominiumRepository implements CondominiumRepository {
  private readonly mapper = new CondominiumMapper();

  async create(input: CreateCondominiumRepositoryInput): Promise<Condominium> {
    const [inserted] = await db
      .insert(condoSchema)
      .values({
        id: input.id,
        name: input.name,
        city: input.city,
        state: input.state,
        cep: input.cep,
        contactInfo: input.contactInfo,
        createdBy: input.createdBy,
        proofUrl: input.proofUrl,
        status: 'PENDING_APPROVAL',
      })
      .returning();

    if (!inserted) {
      throw new Error('Failed to create condominium');
    }

    return this.mapper.toDomain(inserted);
  }

  async findById(id: string): Promise<Condominium | null> {
    const [found] = await db
      .select()
      .from(condoSchema)
      .where(eq(condoSchema.id, id))
      .limit(1);

    return found ? this.mapper.toDomain(found) : null;
  }

  async findByCEP(cep: string): Promise<Condominium[]> {
    const results = await db
      .select()
      .from(condoSchema)
      .where(eq(condoSchema.cep, cep));

    return results.map((row) => this.mapper.toDomain(row));
  }

  async findByCreatorId(userId: string): Promise<Condominium | null> {
    const [found] = await db
      .select()
      .from(condoSchema)
      .where(eq(condoSchema.createdBy, userId))
      .limit(1);

    return found ? this.mapper.toDomain(found) : null;
  }

  async searchApproved(query: string): Promise<Condominium[]> {
    const formattedQuery = `%${query}%`;
    const { and, eq, or, ilike } = await import('drizzle-orm');
    const results = await db
      .select()
      .from(condoSchema)
      .where(
        and(
          eq(condoSchema.status, 'APPROVED'),
          or(
            ilike(condoSchema.name, formattedQuery),
            ilike(condoSchema.city, formattedQuery),
            ilike(condoSchema.cep, formattedQuery),
          ),
        ),
      );

    return results.map((row) => this.mapper.toDomain(row));
  }

  async listPending(): Promise<Condominium[]> {
    const results = await db
      .select()
      .from(condoSchema)
      .where(eq(condoSchema.status, 'PENDING_APPROVAL'));

    return results.map((row) => this.mapper.toDomain(row));
  }

  async updateStatus(
    id: string,
    status: 'APPROVED' | 'REJECTED',
  ): Promise<Condominium> {
    const [updated] = await db
      .update(condoSchema)
      .set({ status })
      .where(eq(condoSchema.id, id))
      .returning();

    if (!updated) {
      throw new Error(`Failed to update status of condominium ${id}`);
    }

    return this.mapper.toDomain(updated);
  }
}
