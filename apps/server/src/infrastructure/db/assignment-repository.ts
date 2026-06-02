import { db } from '@neighborhood-showcase/db';
import { providerLocation as assignSchema } from '@neighborhood-showcase/db/schema/showcase';
import { and, eq } from 'drizzle-orm';
import type {
  Assignment,
  AssignmentWithCondo,
  AssignmentWithUser,
} from '../../domain/entities/assignment.entity';
import type {
  AssignmentRepository,
  CreateAssignmentRepositoryInput,
} from '../../domain/repositories/assignment.repository';
import { AssignmentMapper } from './mappers/assignment.mapper';

export class DrizzleAssignmentRepository implements AssignmentRepository {
  private readonly mapper = new AssignmentMapper();

  async create(input: CreateAssignmentRepositoryInput): Promise<Assignment> {
    const [inserted] = await db
      .insert(assignSchema)
      .values({
        id: input.id,
        providerId: input.providerId,
        condominiumId: input.condominiumId || null,
        addressId: input.addressId || null,
        number: input.number || null,
        type: input.type,
        status: input.status || 'PENDING',
        unitInfo: input.unitInfo || null,
        proofOfResidency: input.proofOfResidency || null,
      })
      .returning();

    if (!inserted) {
      throw new Error('Failed to create assignment');
    }

    return this.mapper.toDomain(inserted);
  }

  async findByProviderAndCondo(
    providerId: string,
    condominiumId: string,
  ): Promise<Assignment | null> {
    const [found] = await db
      .select()
      .from(assignSchema)
      .where(
        and(
          eq(assignSchema.providerId, providerId),
          eq(assignSchema.condominiumId, condominiumId),
        ),
      )
      .limit(1);

    return found ? this.mapper.toDomain(found) : null;
  }

  async findByProviderId(providerId: string): Promise<AssignmentWithCondo[]> {
    const results = await db.query.providerLocation.findMany({
      where: eq(assignSchema.providerId, providerId),
      with: {
        condominium: true,
      },
    });

    return results.map((row) => {
      const entity = this.mapper.toDomain(row);
      Object.assign(entity, { condominium: row.condominium });
      return entity as AssignmentWithCondo;
    });
  }

  async findPendingByCondoId(
    condominiumId: string,
  ): Promise<AssignmentWithUser[]> {
    const results = await db.query.providerLocation.findMany({
      where: and(
        eq(assignSchema.condominiumId, condominiumId),
        eq(assignSchema.status, 'PENDING'),
      ),
      with: {
        provider: true,
      },
    });

    return results.map((row) => {
      const entity = this.mapper.toDomain(row);
      Object.assign(entity, { provider: row.provider });
      return entity as AssignmentWithUser;
    });
  }

  async findById(id: string): Promise<Assignment | null> {
    const [found] = await db
      .select()
      .from(assignSchema)
      .where(eq(assignSchema.id, id))
      .limit(1);

    return found ? this.mapper.toDomain(found) : null;
  }

  async updateStatus(
    id: string,
    status: 'APPROVED' | 'REJECTED',
  ): Promise<Assignment> {
    const [updated] = await db
      .update(assignSchema)
      .set({ status })
      .where(eq(assignSchema.id, id))
      .returning();

    if (!updated) {
      throw new Error(`Failed to update assignment status for ${id}`);
    }

    return this.mapper.toDomain(updated);
  }
}
