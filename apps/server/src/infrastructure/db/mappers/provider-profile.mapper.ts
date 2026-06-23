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
        avatarOriginalUrl: raw.avatarOriginalUrl,
        companyName: raw.companyName,
        tradeName: raw.tradeName,
        logoUrl: raw.logoUrl,
        logoOriginalUrl: raw.logoOriginalUrl,
        bannerUrl: raw.bannerUrl,
        bannerOriginalUrl: raw.bannerOriginalUrl,
        publicDescription: raw.publicDescription,
        contactDefaults: {
          primaryPhone: raw.primaryPhone,
          callEnabled: raw.callEnabled,
        },
        contactMetadata: raw.contactMetadata || {},
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
      avatarOriginalUrl: entity.avatarOriginalUrl,
      companyName: entity.companyName,
      tradeName: entity.tradeName,
      logoUrl: entity.logoUrl,
      logoOriginalUrl: entity.logoOriginalUrl,
      bannerUrl: entity.bannerUrl,
      bannerOriginalUrl: entity.bannerOriginalUrl,
      publicDescription: entity.publicDescription,
      primaryPhone: entity.contactDefaults.primaryPhone,
      callEnabled: entity.contactDefaults.callEnabled,
      contactMetadata: entity.contactMetadata,
      isProviderVisible: entity.isProviderVisible,
      updatedAt: entity.updatedAt,
    };
  }
}
