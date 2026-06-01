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

export class DrizzleAssignmentRepository implements AssignmentRepository {
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

    return inserted as Assignment;
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

    return (found as Assignment) || null;
  }

  async findByProviderId(providerId: string): Promise<AssignmentWithCondo[]> {
    const results = await db.query.providerLocation.findMany({
      where: eq(assignSchema.providerId, providerId),
      with: {
        condominium: true,
      },
    });

    return results as AssignmentWithCondo[];
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

    return results as AssignmentWithUser[];
  }

  async findById(id: string): Promise<Assignment | null> {
    const [found] = await db
      .select()
      .from(assignSchema)
      .where(eq(assignSchema.id, id))
      .limit(1);

    return (found as Assignment) || null;
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

    return updated as Assignment;
  }
}
