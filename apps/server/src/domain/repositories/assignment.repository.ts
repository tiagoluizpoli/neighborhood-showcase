import type {
  Assignment,
  AssignmentStatus,
  AssignmentType,
  AssignmentWithCondo,
  AssignmentWithUser,
} from '../entities/assignment.entity';

export interface CreateAssignmentRepositoryInput {
  id: string;
  providerId: string;
  condominiumId: string;
  type: AssignmentType;
  status?: AssignmentStatus;
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
  findPendingByCondoId(condominiumId: string): Promise<AssignmentWithUser[]>;
  findById(id: string): Promise<Assignment | null>;
  updateStatus(
    id: string,
    status: 'APPROVED' | 'REJECTED',
  ): Promise<Assignment>;
}
