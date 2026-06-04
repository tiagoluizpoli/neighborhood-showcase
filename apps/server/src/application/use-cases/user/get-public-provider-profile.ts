import type {
  AnnouncementRepository,
  ProviderAnnouncementDTO,
} from '../../../domain/repositories/announcement.repository';
import type { AssignmentRepository } from '../../../domain/repositories/assignment.repository';
import type { UserRepository } from '../../../domain/repositories/user.repository';
import { DomainError } from '../../../shared/domain-error';

export class PublicProviderNotFoundError extends DomainError {
  constructor() {
    super('Prestador não encontrado');
  }
}

export interface GetPublicProviderProfileInput {
  providerId: string;
}

export interface PublicProviderProfileResult {
  provider: {
    id: string;
    name: string;
    avatarUrl: string | null;
    socialLinks: Record<string, string | undefined>;
    isVerified: boolean;
  };
  announcements: ProviderAnnouncementDTO[];
}

export class GetPublicProviderProfile {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly assignmentRepo: AssignmentRepository,
    private readonly announcementRepo: AnnouncementRepository,
  ) {}

  async execute(
    input: GetPublicProviderProfileInput,
  ): Promise<PublicProviderProfileResult> {
    const user = await this.userRepo.findById(input.providerId);

    if (!user || user.status === 'BANNED' || user.deletedAt != null) {
      throw new PublicProviderNotFoundError();
    }

    const isVerified = await this.assignmentRepo.hasApprovedResidentAssignment(
      input.providerId,
    );

    const announcements = await this.announcementRepo.findActiveByProviderId(
      input.providerId,
      user.name,
      user.image ?? null,
    );

    return {
      provider: {
        id: user.id,
        name: user.name,
        avatarUrl: user.image ?? null,
        socialLinks: user.socialLinks as Record<string, string | undefined>,
        isVerified,
      },
      announcements,
    };
  }
}
