import type { Assignment } from '../../entities/assignment.entity';

export interface RejectAssignmentInput {
  id: string;
  reason: string;
}

export interface RejectAssignmentUseCase {
  execute(input: RejectAssignmentInput): Promise<Assignment>;
}
