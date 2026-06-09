import type { AssignmentRepository } from '../../../domain/repositories/assignment.repository';
import type { CondominiumRepository } from '../../../domain/repositories/condominium.repository';
import { DomainError } from '../../../shared/domain-error';

export class CondominiumNotFoundError extends DomainError {
  constructor() {
    super('Condomínio não encontrado.');
  }
}

export class UnauthorizedCondominiumAccessError extends DomainError {
  constructor() {
    super('Você não tem acesso a este condomínio.');
  }
}

export interface GetCondominiumInfoInput {
  userId: string;
  condominiumId: string;
}

export interface GetCondominiumInfoOutput {
  id: string;
  name: string;
  city: string;
  state: string;
  cep: string;
  contactInfo: {
    website?: string;
    email?: string;
    phone?: string;
  };
  status: string;
  createdBy: string;
  proofUrl?: string | null;
  addressId?: string | null;
  number?: string | null;
  latitude?: string | null;
  longitude?: string | null;
}

export interface GetCondominiumInfoUseCase {
  execute(input: GetCondominiumInfoInput): Promise<GetCondominiumInfoOutput>;
}

export class GetCondominiumInfo implements GetCondominiumInfoUseCase {
  constructor(
    private readonly condominiumRepo: CondominiumRepository,
    private readonly assignmentRepo: AssignmentRepository,
  ) {}

  async execute(
    input: GetCondominiumInfoInput,
  ): Promise<GetCondominiumInfoOutput> {
    const condo = await this.condominiumRepo.findById(input.condominiumId);
    if (!condo) {
      throw new CondominiumNotFoundError();
    }

    const assignment = await this.assignmentRepo.findByProviderCondoAndType(
      input.userId,
      input.condominiumId,
      'MODERATOR',
    );

    const isModerator = assignment && assignment.status === 'APPROVED';

    if (!isModerator) {
      const residentAssignment =
        await this.assignmentRepo.findByProviderCondoAndType(
          input.userId,
          input.condominiumId,
          'RESIDENT',
        );
      const isResident =
        residentAssignment && residentAssignment.status === 'APPROVED';
      if (!isResident) {
        throw new UnauthorizedCondominiumAccessError();
      }
    }

    return {
      id: condo.id,
      name: condo.name,
      city: condo.city,
      state: condo.state,
      cep: condo.cep,
      contactInfo: condo.contactInfo,
      status: condo.status,
      createdBy: condo.createdBy,
      proofUrl: condo.proofUrl,
      addressId: condo.addressId,
      number: condo.number,
      latitude: condo.latitude,
      longitude: condo.longitude,
    };
  }
}
