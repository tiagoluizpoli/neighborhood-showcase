import type { AssignmentRepository } from '../../../domain/repositories/assignment.repository';
import type { ProviderRepository } from '../../../domain/repositories/provider.repository';

export interface GetUserAccessProfileInput {
  userId: string;
}

export interface UserAccessProfileResult {
  providerEnabled: boolean;
}

export class GetUserAccessProfile {
  constructor(
    private readonly assignmentRepo: AssignmentRepository,
    private readonly providerRepo: ProviderRepository,
  ) {}

  async execute(
    input: GetUserAccessProfileInput,
  ): Promise<UserAccessProfileResult> {
    const providers = await this.providerRepo.listByOwner(input.userId);

    let providerEnabled = false;
    for (const provider of providers) {
      const hasAssignment =
        await this.assignmentRepo.hasApprovedResidentAssignment(provider.id);
      if (hasAssignment) {
        providerEnabled = true;
        break;
      }
    }

    return {
      providerEnabled,
    };
  }
}
