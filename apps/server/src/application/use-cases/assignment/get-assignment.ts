import type { Assignment } from '../../../domain/entities/assignment.entity';
import type { AssignmentRepository } from '../../../domain/repositories/assignment.repository';

export interface GetAssignmentInput {
  id: string;
}

export class GetAssignment {
  constructor(private readonly assignmentRepository: AssignmentRepository) {}

  async execute(input: GetAssignmentInput): Promise<Assignment | null> {
    return this.assignmentRepository.findById(input.id);
  }
}
