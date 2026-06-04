import type { AssignmentWithCondo } from '../../../domain/entities/assignment.entity';
import type { AssignmentRepository } from '../../../domain/repositories/assignment.repository';

export interface ListProviderAssignmentsInput {
  providerId: string;
}

export class ListProviderAssignments {
  constructor(private readonly assignmentRepository: AssignmentRepository) {}

  async execute(
    input: ListProviderAssignmentsInput,
  ): Promise<AssignmentWithCondo[]> {
    return this.assignmentRepository.findByProviderId(input.providerId);
  }
}
