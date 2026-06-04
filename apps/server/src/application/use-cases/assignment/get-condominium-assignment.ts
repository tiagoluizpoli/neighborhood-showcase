import type { Assignment } from '../../../domain/entities/assignment.entity';
import type { AssignmentRepository } from '../../../domain/repositories/assignment.repository';

export interface CondominiumAssignment extends Assignment {
  condominiumId: string;
}

export class AssignmentNotFoundError extends Error {
  constructor() {
    super('Solicitação não encontrada.');
  }
}

export class AssignmentWithoutCondominiumError extends Error {
  constructor() {
    super('Solicitação não vinculada a um condomínio.');
  }
}

export interface GetCondominiumAssignmentInput {
  id: string;
}

export class GetCondominiumAssignment {
  constructor(private readonly assignmentRepository: AssignmentRepository) {}

  async execute(
    input: GetCondominiumAssignmentInput,
  ): Promise<CondominiumAssignment> {
    const assignment = await this.assignmentRepository.findById(input.id);

    if (!assignment) {
      throw new AssignmentNotFoundError();
    }

    if (!assignment.condominiumId) {
      throw new AssignmentWithoutCondominiumError();
    }

    return assignment as CondominiumAssignment;
  }
}
