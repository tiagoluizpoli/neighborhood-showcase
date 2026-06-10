import type { providerProfile as providerProfileSchema } from '@neighborhood-showcase/db/schema/showcase';
import { ProviderProfile } from '../../../domain/entities/provider-profile.entity';
import type { EntityMapper } from '../../../domain/mapper';

type ProviderProfileSchemaSelect = typeof providerProfileSchema.$inferSelect;
type ProviderProfileSchemaInsert = typeof providerProfileSchema.$inferInsert;

export class ProviderProfileMapper
  implements
    EntityMapper<
      ProviderProfileSchemaSelect,
      ProviderProfile,
      ProviderProfileSchemaInsert
    >
{
  toDomain(raw: ProviderProfileSchemaSelect): ProviderProfile {
    return new ProviderProfile(
      {
        displayName: raw.displayName,
        avatarUrl: raw.avatarUrl,
        companyName: raw.companyName,
        tradeName: raw.tradeName,
        logoUrl: raw.logoUrl,
        bannerUrl: raw.bannerUrl,
        publicDescription: raw.publicDescription,
        socialLinks: raw.socialLinks || {},
        isProviderVisible: raw.isProviderVisible,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      raw.providerId,
    );
  }

  toPersistence(entity: ProviderProfile): ProviderProfileSchemaInsert {
    return {
      providerId: entity.id,
      displayName: entity.displayName,
      avatarUrl: entity.avatarUrl,
      companyName: entity.companyName,
      tradeName: entity.tradeName,
      logoUrl: entity.logoUrl,
      bannerUrl: entity.bannerUrl,
      publicDescription: entity.publicDescription,
      socialLinks: entity.socialLinks,
      isProviderVisible: entity.isProviderVisible,
      updatedAt: entity.updatedAt,
    };
  }
}
