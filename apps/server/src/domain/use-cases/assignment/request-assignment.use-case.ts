import type { Assignment } from '../../entities/assignment.entity';

export interface RequestAssignmentInput {
  providerId: string;
  condominiumId: string;
  unitInfo: string;
  proofOfResidency?: string;
}

export interface RequestAssignmentUseCase {
  execute(input: RequestAssignmentInput): Promise<Assignment>;
}
