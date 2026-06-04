import type { Condominium } from '../../../domain/entities/condominium.entity';
import type { CondominiumRepository } from '../../../domain/repositories/condominium.repository';

export class ListNearbyCondominiums {
  constructor(private readonly condoRepo: CondominiumRepository) {}

  async execute(input: {
    latitude: number;
    longitude: number;
    radiusInMeters?: number;
  }): Promise<{ condo: Condominium; distance: number }[]> {
    return this.condoRepo.findNearbyApproved(
      input.latitude,
      input.longitude,
      input.radiusInMeters ?? 1000,
    );
  }
}
