import type { AssignmentRepository } from '../../../domain/repositories/assignment.repository';

export interface GetUserAccessProfileInput {
  userId: string;
}

export interface UserAccessProfileResult {
  providerEnabled: boolean;
}

export class GetUserAccessProfile {
  constructor(private readonly assignmentRepo: AssignmentRepository) {}

  async execute(
    input: GetUserAccessProfileInput,
  ): Promise<UserAccessProfileResult> {
    const providerEnabled =
      await this.assignmentRepo.hasApprovedResidentAssignment(input.userId);

    return {
      providerEnabled,
    };
  }
}
