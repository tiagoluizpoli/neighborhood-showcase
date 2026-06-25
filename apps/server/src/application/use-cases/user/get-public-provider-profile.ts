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
    displayName: string;
    companyName: string | null;
    tradeName: string | null;
    logoUrl: string | null;
    logoOriginalUrl: string | null;
    bannerUrl: string | null;
    bannerOriginalUrl: string | null;
    publicDescription: string | null;
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
    const provider = await this.userRepo.findPublicProviderById(
      input.providerId,
    );

    if (
      !provider ||
      provider.status === 'BANNED' ||
      provider.deletedAt != null
    ) {
      throw new PublicProviderNotFoundError();
    }

    const isVerified = await this.assignmentRepo.hasApprovedResidentAssignment(
      input.providerId,
    );

    const announcements = await this.announcementRepo.findActiveByProviderId(
      input.providerId,
      provider.displayName,
      provider.avatarUrl,
    );

    return {
      provider: {
        id: provider.id,
        displayName: provider.displayName,
        companyName: provider.companyName,
        tradeName: provider.tradeName,
        logoUrl: provider.logoUrl,
        logoOriginalUrl: provider.logoOriginalUrl,
        bannerUrl: provider.bannerUrl,
        bannerOriginalUrl: provider.bannerOriginalUrl,
        publicDescription: provider.publicDescription,
        socialLinks: provider.socialLinks,
        isVerified,
      },
      announcements,
    };
  }
}
