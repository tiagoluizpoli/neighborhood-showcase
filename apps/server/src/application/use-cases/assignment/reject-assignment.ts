import { TRPCError } from '@trpc/server';
import type { Assignment } from '../../../domain/entities/assignment.entity';
import type { AssignmentRepository } from '../../../domain/repositories/assignment.repository';
import type {
  RejectAssignmentInput,
  RejectAssignmentUseCase,
} from '../../../domain/use-cases/assignment/reject-assignment.use-case';

export class RejectAssignment implements RejectAssignmentUseCase {
  constructor(private readonly assignmentRepo: AssignmentRepository) {}

  async execute(input: RejectAssignmentInput): Promise<Assignment> {
    if (!input.reason.trim()) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'O motivo da rejeição é obrigatório.',
      });
    }

    const assignmentObj = await this.assignmentRepo.findById(input.id);
    if (!assignmentObj) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Solicitação de associação não encontrada.',
      });
    }

    if (assignmentObj.status !== 'PENDING') {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Esta solicitação já foi processada.',
      });
    }

    console.log(
      `[ASSIGNMENT REJECTED] ID: ${input.id}, Reason: ${input.reason.trim()}`,
    );

    return this.assignmentRepo.updateStatus(input.id, 'REJECTED');
  }
}
