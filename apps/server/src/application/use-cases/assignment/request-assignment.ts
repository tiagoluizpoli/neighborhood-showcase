import crypto from 'node:crypto';
import { TRPCError } from '@trpc/server';
import { Assignment } from '../../../domain/entities/assignment.entity';
import type { AssignmentRepository } from '../../../domain/repositories/assignment.repository';
import type {
  RequestAssignmentInput,
  RequestAssignmentUseCase,
} from '../../../domain/use-cases/assignment/request-assignment.use-case';

export class RequestAssignment implements RequestAssignmentUseCase {
  constructor(private readonly assignmentRepo: AssignmentRepository) {}

  async execute(input: RequestAssignmentInput): Promise<Assignment> {
    // Validate unitInfo using Assignment domain entity constructor rules
    new Assignment({
      providerId: input.providerId,
      condominiumId: input.condominiumId,
      type: 'RESIDENT',
      status: 'PENDING',
      unitInfo: input.unitInfo,
      proofOfResidency: input.proofOfResidency,
    });

    // Check if duplicate assignment exists
    const existing = await this.assignmentRepo.findByProviderAndCondo(
      input.providerId,
      input.condominiumId,
    );

    if (existing) {
      if (existing.status === 'APPROVED') {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Você já possui uma associação ativa com este condomínio.',
        });
      }
      if (existing.status === 'PENDING') {
        throw new TRPCError({
          code: 'CONFLICT',
          message:
            'Você já possui uma solicitação pendente para este condomínio.',
        });
      }
    }

    const id = crypto.randomUUID();

    return this.assignmentRepo.create({
      id,
      providerId: input.providerId,
      condominiumId: input.condominiumId,
      type: 'RESIDENT',
      unitInfo: input.unitInfo,
      proofOfResidency: input.proofOfResidency,
    });
  }
}
