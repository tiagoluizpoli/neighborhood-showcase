import crypto from 'node:crypto';
import { Condominium } from '../../../domain/entities/condominium.entity';
import type { CondominiumRepository } from '../../../domain/repositories/condominium.repository';
import type {
  RequestCondominiumInput,
  RequestCondominiumUseCase,
} from '../../../domain/use-cases/condominium/request-condominium.use-case';

export class RequestCondominium implements RequestCondominiumUseCase {
  constructor(private readonly condoRepo: CondominiumRepository) {}

  async execute(input: RequestCondominiumInput): Promise<Condominium> {
    // Validate details using Condominium constructor validations
    new Condominium({
      name: input.name,
      city: input.city,
      state: input.state,
      cep: input.cep,
      contactInfo: input.contactInfo,
      createdBy: input.createdBy,
      proofUrl: input.proofUrl,
      status: 'PENDING_APPROVAL',
    });

    const id = crypto.randomUUID();

    return this.condoRepo.create({
      id,
      name: input.name,
      city: input.city,
      state: input.state,
      cep: input.cep.replace(/\D/g, ''),
      contactInfo: input.contactInfo,
      createdBy: input.createdBy,
      proofUrl: input.proofUrl,
    });
  }
}
