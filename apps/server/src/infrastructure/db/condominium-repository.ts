import { db } from '@base-fullstack-template/db';
import { condominium as condoSchema } from '@base-fullstack-template/db/schema/showcase';
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
}
