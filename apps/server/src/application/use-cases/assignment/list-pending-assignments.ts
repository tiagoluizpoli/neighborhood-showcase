import type { AssignmentWithUser } from '../../../domain/entities/assignment.entity';
import type { AssignmentRepository } from '../../../domain/repositories/assignment.repository';

export interface ListPendingAssignmentsInput {
  condominiumId: string;
}

export class ListPendingAssignments {
  constructor(private readonly assignmentRepository: AssignmentRepository) {}

  async execute(
    input: ListPendingAssignmentsInput,
  ): Promise<AssignmentWithUser[]> {
    return this.assignmentRepository.findPendingByCondoId(input.condominiumId);
  }
}
