import type { Condominium } from '../../../domain/entities/condominium.entity';
import type { CondominiumRepository } from '../../../domain/repositories/condominium.repository';

export class ListPendingCondominiums {
  constructor(private readonly condoRepo: CondominiumRepository) {}

  async execute(): Promise<Condominium[]> {
    return this.condoRepo.listPending();
  }
}
