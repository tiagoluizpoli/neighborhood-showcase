import { TRPCError } from '@trpc/server';
import type { Assignment } from '../../../domain/entities/assignment.entity';
import type { AssignmentRepository } from '../../../domain/repositories/assignment.repository';
import type {
  ApproveAssignmentInput,
  ApproveAssignmentUseCase,
} from '../../../domain/use-cases/assignment/approve-assignment.use-case';

export class ApproveAssignment implements ApproveAssignmentUseCase {
  constructor(private readonly assignmentRepo: AssignmentRepository) {}

  async execute(input: ApproveAssignmentInput): Promise<Assignment> {
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

    return this.assignmentRepo.updateStatus(input.id, 'APPROVED');
  }
}
