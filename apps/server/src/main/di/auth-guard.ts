import type { AssignmentRepository } from '../../domain/repositories/assignment.repository';
import type { ProviderRepository } from '../../domain/repositories/provider.repository';
import { DrizzleAssignmentRepository } from '../../infrastructure/db/assignment-repository';
import { DrizzleProviderRepository } from '../../infrastructure/db/provider-repository';

// Composition root for the provider-scoped authorization guard (T-20-04).
// The guard lives in the presentation layer (`trpc.ts`) but must reach the
// provider + assignment persistence contracts to enforce ownership and APPROVED
// standing. Concrete repositories are wired here and exposed to the tRPC context
// so the presentation layer never imports infrastructure directly.
export interface AuthGuardDependencies {
  providerRepository: ProviderRepository;
  assignmentRepository: AssignmentRepository;
}

export function createAuthGuardDependencies(): AuthGuardDependencies {
  return {
    providerRepository: new DrizzleProviderRepository(),
    assignmentRepository: new DrizzleAssignmentRepository(),
  };
}
