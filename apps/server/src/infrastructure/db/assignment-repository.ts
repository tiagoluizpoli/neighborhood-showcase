import { db } from '@base-fullstack-template/db';
import { assignment as assignSchema } from '@base-fullstack-template/db/schema/showcase';
import { and, eq } from 'drizzle-orm';
import type {
  Assignment,
  AssignmentWithCondo,
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
        condominiumId: input.condominiumId,
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
    const results = await db.query.assignment.findMany({
      where: eq(assignSchema.providerId, providerId),
      with: {
        condominium: true,
      },
    });

    return results as AssignmentWithCondo[];
  }

  async findPendingByCondoId(condominiumId: string): Promise<Assignment[]> {
    const results = await db
      .select()
      .from(assignSchema)
      .where(
        and(
          eq(assignSchema.condominiumId, condominiumId),
          eq(assignSchema.status, 'PENDING'),
        ),
      );

    return results as Assignment[];
  }
}
