import type { BlacklistRepository } from '../../../domain/repositories/blacklist.repository';

export interface RemoveBlacklistInput {
  id: string;
}

export class RemoveBlacklist {
  constructor(private readonly blacklistRepo: BlacklistRepository) {}

  async execute(input: RemoveBlacklistInput): Promise<void> {
    await this.blacklistRepo.delete(input.id);
  }
}
