import type { AssignmentRepository } from '../../../domain/repositories/assignment.repository';

export interface CountPendingAssignmentsInput {
  condominiumId: string;
  type?: 'MODERATOR' | 'RESIDENT';
}

export class CountPendingAssignments {
  constructor(private readonly assignmentRepository: AssignmentRepository) {}

  async execute(input: CountPendingAssignmentsInput): Promise<number> {
    if (input.type) {
      return this.assignmentRepository.countPendingByCondoAndType(
        input.condominiumId,
        input.type,
      );
    }
    return this.assignmentRepository.countPendingByCondo(input.condominiumId);
  }
}