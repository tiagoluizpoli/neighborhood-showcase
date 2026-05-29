import crypto from 'node:crypto';
import { TRPCError } from '@trpc/server';
import type { Condominium } from '../../../domain/entities/condominium.entity';
import type { AssignmentRepository } from '../../../domain/repositories/assignment.repository';
import type { CondominiumRepository } from '../../../domain/repositories/condominium.repository';
import type {
  ApproveCondominiumInput,
  ApproveCondominiumUseCase,
} from '../../../domain/use-cases/condominium/approve-condominium.use-case';

export class ApproveCondominium implements ApproveCondominiumUseCase {
  constructor(
    private readonly condoRepo: CondominiumRepository,
    private readonly assignmentRepo: AssignmentRepository,
  ) {}

  async execute(input: ApproveCondominiumInput): Promise<Condominium> {
    const condo = await this.condoRepo.findById(input.id);
    if (!condo) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Condomínio não encontrado.',
      });
    }

    if (condo.status !== 'PENDING_APPROVAL') {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Este condomínio não está pendente de aprovação.',
      });
    }

    // Approve the condominium
    const approvedCondo = await this.condoRepo.updateStatus(
      input.id,
      'APPROVED',
    );

    // Create an approved MODERATOR assignment for the creator
    const assignmentId = crypto.randomUUID();
    await this.assignmentRepo.create({
      id: assignmentId,
      providerId: condo.createdBy,
      condominiumId: condo.id,
      type: 'MODERATOR',
      status: 'APPROVED',
    });

    return approvedCondo;
  }
}
