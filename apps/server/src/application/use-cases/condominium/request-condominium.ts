import crypto from 'node:crypto';
import type { Condominium } from '../../../domain/entities/condominium.entity';
import {
  validateCEP,
  validateCondominiumName,
  validateContactInfo,
} from '../../../domain/entities/condominium.entity';
import type { CondominiumRepository } from '../../../domain/repositories/condominium.repository';
import type {
  RequestCondominiumInput,
  RequestCondominiumUseCase,
} from '../../../domain/use-cases/condominium/request-condominium.use-case';

export class RequestCondominium implements RequestCondominiumUseCase {
  constructor(private readonly condoRepo: CondominiumRepository) {}

  async execute(input: RequestCondominiumInput): Promise<Condominium> {
    validateCondominiumName(input.name);
    validateCEP(input.cep);
    validateContactInfo(input.contactInfo);

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
