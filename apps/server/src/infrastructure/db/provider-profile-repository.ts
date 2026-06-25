import { db } from '@neighborhood-showcase/db';
import { providerProfile as providerProfileSchema } from '@neighborhood-showcase/db/schema/showcase';
import { eq } from 'drizzle-orm';
import type { ProviderProfile } from '../../domain/entities/provider-profile.entity';
import type {
  ProviderProfileRepository,
  UpsertProviderProfileInput,
} from '../../domain/repositories/provider-profile.repository';
import { ProviderProfileMapper } from './mappers/provider-profile.mapper';

export class ProviderProfileRepositoryImpl
  implements ProviderProfileRepository
{
  private mapper = new ProviderProfileMapper();

  async findByProviderId(providerId: string): Promise<ProviderProfile | null> {
    const [row] = await db
      .select()
      .from(providerProfileSchema)
      .where(eq(providerProfileSchema.providerId, providerId))
      .limit(1);

    if (!row) return null;

    return this.mapper.toDomain(row);
  }

  async upsert(input: UpsertProviderProfileInput): Promise<ProviderProfile> {
    await db
      .insert(providerProfileSchema)
      .values({
        providerId: input.providerId,
        displayName: input.displayName,
        companyName: input.companyName ?? null,
        tradeName: input.tradeName ?? null,
        logoUrl: input.logoUrl ?? null,
        logoOriginalUrl: input.logoOriginalUrl ?? null,
        bannerUrl: input.bannerUrl ?? null,
        bannerOriginalUrl: input.bannerOriginalUrl ?? null,
        publicDescription: input.publicDescription ?? null,
        primaryPhone: input.contactDefaults.primaryPhone,
        callEnabled: input.contactDefaults.callEnabled,
        contactMetadata: input.contactMetadata,
        isProviderVisible: input.isProviderVisible ?? true,
      })
      .onConflictDoUpdate({
        target: providerProfileSchema.providerId,
        set: {
          displayName: input.displayName,
          companyName: input.companyName ?? null,
          tradeName: input.tradeName ?? null,
          logoUrl: input.logoUrl ?? null,
          logoOriginalUrl: input.logoOriginalUrl ?? null,
          bannerUrl: input.bannerUrl ?? null,
          bannerOriginalUrl: input.bannerOriginalUrl ?? null,
          publicDescription: input.publicDescription ?? null,
          primaryPhone: input.contactDefaults.primaryPhone,
          callEnabled: input.contactDefaults.callEnabled,
          contactMetadata: input.contactMetadata,
          isProviderVisible: input.isProviderVisible ?? true,
          updatedAt: new Date(),
        },
      });

    const updated = await this.findByProviderId(input.providerId);

    if (!updated) {
      throw new Error(
        'ProviderProfile upsert failed: row not found after insert',
      );
    }

    return updated;
  }

  async delete(providerId: string): Promise<void> {
    await db
      .delete(providerProfileSchema)
      .where(eq(providerProfileSchema.providerId, providerId));
  }
}
