import { db } from '@neighborhood-showcase/db';
import { condominium as condoSchema } from '@neighborhood-showcase/db/schema/showcase';
import { eq } from 'drizzle-orm';
import type { Condominium } from '../../domain/entities/condominium.entity';
import type {
  CondominiumRepository,
  CreateCondominiumRepositoryInput,
} from '../../domain/repositories/condominium.repository';

export class DrizzleCondominiumRepository implements CondominiumRepository {
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

    return inserted as Condominium;
  }

  async findById(id: string): Promise<Condominium | null> {
    const [found] = await db
      .select()
      .from(condoSchema)
      .where(eq(condoSchema.id, id))
      .limit(1);

    return (found as Condominium) || null;
  }

  async findByCEP(cep: string): Promise<Condominium[]> {
    const results = await db
      .select()
      .from(condoSchema)
      .where(eq(condoSchema.cep, cep));

    return results as Condominium[];
  }

  async findByCreatorId(userId: string): Promise<Condominium | null> {
    const [found] = await db
      .select()
      .from(condoSchema)
      .where(eq(condoSchema.createdBy, userId))
      .limit(1);

    return (found as Condominium) || null;
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

    return results as Condominium[];
  }

  async listPending(): Promise<Condominium[]> {
    const results = await db
      .select()
      .from(condoSchema)
      .where(eq(condoSchema.status, 'PENDING_APPROVAL'));

    return results as Condominium[];
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

    return updated as Condominium;
  }
}
