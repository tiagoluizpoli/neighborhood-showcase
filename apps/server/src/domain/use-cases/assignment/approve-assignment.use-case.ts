import type { Assignment } from '../../entities/assignment.entity';

export interface ApproveAssignmentInput {
  id: string;
}

export interface ApproveAssignmentUseCase {
  execute(input: ApproveAssignmentInput): Promise<Assignment>;
}
