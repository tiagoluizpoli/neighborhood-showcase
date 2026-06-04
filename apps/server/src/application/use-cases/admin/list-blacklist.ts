import type { BlacklistedIdentifier } from '../../../domain/entities/blacklist.entity';
import type { BlacklistRepository } from '../../../domain/repositories/blacklist.repository';

export class ListBlacklist {
  constructor(private readonly blacklistRepo: BlacklistRepository) {}

  async execute(): Promise<BlacklistedIdentifier[]> {
    return this.blacklistRepo.findAll();
  }
}
