import crypto from 'node:crypto';
import type { AnnouncementRepository } from '../../../domain/repositories/announcement.repository';
import type { BlacklistRepository } from '../../../domain/repositories/blacklist.repository';
import type { UserRepository } from '../../../domain/repositories/user.repository';
import { DomainError } from '../../../shared/domain-error';

export class ProviderNotFoundError extends DomainError {
  constructor() {
    super('Usuário não encontrado.');
  }
}

export interface BanProviderInput {
  actorId: string;
  targetUserId: string;
  reason: string;
}

export class BanProvider {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly blacklistRepo: BlacklistRepository,
    private readonly announcementRepo: AnnouncementRepository,
  ) {}

  async execute(input: BanProviderInput): Promise<void> {
    const user = await this.userRepo.findById(input.targetUserId);

    if (!user) {
      throw new ProviderNotFoundError();
    }

    await this.userRepo.updateStatus(input.targetUserId, 'BANNED');

    if (user.cpfHash) {
      const existing = await this.blacklistRepo.findByCpfHash(user.cpfHash);
      if (!existing) {
        await this.blacklistRepo.create({
          id: crypto.randomUUID(),
          cpfHash: user.cpfHash,
          reason: input.reason,
        });
      }
    }

    await this.announcementRepo.softDeleteAllByProviderId(
      input.targetUserId,
      `Banido globalmente: ${input.reason}`,
    );

    await this.userRepo.deleteSessionsAndAccountsByUserId(input.targetUserId);
  }
}
