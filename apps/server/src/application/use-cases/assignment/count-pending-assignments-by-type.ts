import type { AssignmentRepository } from '../../../domain/repositories/assignment.repository';

export interface CountPendingAssignmentsByTypeInput {
  condominiumId: string;
  type: 'MODERATOR' | 'RESIDENT';
}

export class CountPendingAssignmentsByType {
  constructor(private readonly assignmentRepository: AssignmentRepository) {}

  async execute(input: CountPendingAssignmentsByTypeInput): Promise<number> {
    return this.assignmentRepository.countPendingByCondoAndType(
      input.condominiumId,
      input.type,
    );
  }
}