import type { Condominium } from '../../../domain/entities/condominium.entity';
import type { CondominiumRepository } from '../../../domain/repositories/condominium.repository';

export class ListApprovedCondominiums {
  constructor(private readonly condoRepo: CondominiumRepository) {}

  async execute(input: { query?: string }): Promise<Condominium[]> {
    return this.condoRepo.searchApproved(input.query ?? '');
  }
}
