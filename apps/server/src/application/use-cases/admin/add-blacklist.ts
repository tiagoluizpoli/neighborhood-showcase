import crypto from 'node:crypto';
import type { BlacklistedIdentifier } from '../../../domain/entities/blacklist.entity';
import type { BlacklistRepository } from '../../../domain/repositories/blacklist.repository';
import { DomainError } from '../../../shared/domain-error';

export class CpfAlreadyBlacklistedError extends DomainError {
  constructor() {
    super('Este CPF já está na lista negra.');
  }
}

export interface AddBlacklistInput {
  cpfHash: string;
  reason: string;
}

export class AddBlacklist {
  constructor(private readonly blacklistRepo: BlacklistRepository) {}

  async execute(input: AddBlacklistInput): Promise<BlacklistedIdentifier> {
    const existing = await this.blacklistRepo.findByCpfHash(input.cpfHash);

    if (existing) {
      throw new CpfAlreadyBlacklistedError();
    }

    return this.blacklistRepo.create({
      id: crypto.randomUUID(),
      cpfHash: input.cpfHash,
      reason: input.reason,
    });
  }
}
