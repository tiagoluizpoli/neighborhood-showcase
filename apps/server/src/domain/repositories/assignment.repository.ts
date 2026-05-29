import type {
  Assignment,
  AssignmentType,
  AssignmentWithCondo,
} from '../entities/assignment.entity';

export interface CreateAssignmentRepositoryInput {
  id: string;
  providerId: string;
  condominiumId: string;
  type: AssignmentType;
  unitInfo?: string;
  proofOfResidency?: string;
}

export interface AssignmentRepository {
  create(input: CreateAssignmentRepositoryInput): Promise<Assignment>;
  findByProviderAndCondo(
    providerId: string,
    condominiumId: string,
  ): Promise<Assignment | null>;
  findByProviderId(providerId: string): Promise<AssignmentWithCondo[]>;
  findPendingByCondoId(condominiumId: string): Promise<Assignment[]>;
}
