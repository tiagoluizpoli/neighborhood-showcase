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
  condominiumId?: string | null;
  addressId?: string | null;
  number?: string | null;
  type: AssignmentType;
  status?: AssignmentStatus;
  unitInfo?: string | null;
  proofOfResidency?: string | null;
}

export interface AssignmentRepository {
  create(input: CreateAssignmentRepositoryInput): Promise<Assignment>;
  findByProviderAndCondo(
    providerId: string,
    condominiumId: string,
  ): Promise<Assignment | null>;
  findByProviderCondoAndType(
    providerId: string,
    condominiumId: string,
    type: 'MODERATOR' | 'RESIDENT',
  ): Promise<Assignment | null>;
  findByProviderId(providerId: string): Promise<AssignmentWithCondo[]>;
  findPendingByCondoId(condominiumId: string): Promise<AssignmentWithUser[]>;
  countPendingByCondo(condominiumId: string): Promise<number>;
  countPendingByCondoAndType(
    condominiumId: string,
    type: 'MODERATOR' | 'RESIDENT',
  ): Promise<number>;
  findById(id: string): Promise<Assignment | null>;
  hasApprovedResidentAssignment(providerId: string): Promise<boolean>;
  updateStatus(
    id: string,
    status: 'APPROVED' | 'REJECTED' | 'PENDING',
  ): Promise<Assignment>;
}
