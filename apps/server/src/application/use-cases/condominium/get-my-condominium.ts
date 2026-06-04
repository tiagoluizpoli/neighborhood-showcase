import type { Condominium } from '../../../domain/entities/condominium.entity';
import type { CondominiumRepository } from '../../../domain/repositories/condominium.repository';

export class GetMyCondominium {
  constructor(private readonly condoRepo: CondominiumRepository) {}

  async execute(input: { userId: string }): Promise<Condominium | null> {
    return this.condoRepo.findByCreatorId(input.userId);
  }
}
