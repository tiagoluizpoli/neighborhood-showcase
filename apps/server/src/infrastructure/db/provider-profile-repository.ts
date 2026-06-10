import { db } from '@neighborhood-showcase/db';
import { providerProfile as providerProfileSchema } from '@neighborhood-showcase/db/schema/showcase';
import { eq } from 'drizzle-orm';
import type { ProviderProfile } from '../../domain/entities/provider-profile.entity';
import type { ProviderProfileRepository } from '../../domain/repositories/provider-profile.repository';
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

  async upsert(input: {
    providerId: string;
    displayName: string;
    avatarUrl?: string | null;
    companyName?: string | null;
    tradeName?: string | null;
    logoUrl?: string | null;
    bannerUrl?: string | null;
    publicDescription?: string | null;
    socialLinks?: {
      whatsapp?: string;
      phone?: string;
      email?: string;
      instagram?: string;
      tiktok?: string;
      facebook?: string;
      website?: string;
    };
    isProviderVisible?: boolean;
  }): Promise<ProviderProfile> {
    await db
      .insert(providerProfileSchema)
      .values({
        providerId: input.providerId,
        displayName: input.displayName,
        avatarUrl: input.avatarUrl ?? null,
        companyName: input.companyName ?? null,
        tradeName: input.tradeName ?? null,
        logoUrl: input.logoUrl ?? null,
        bannerUrl: input.bannerUrl ?? null,
        publicDescription: input.publicDescription ?? null,
        socialLinks: input.socialLinks ?? {},
        isProviderVisible: input.isProviderVisible ?? true,
      })
      .onConflictDoUpdate({
        target: providerProfileSchema.providerId,
        set: {
          displayName: input.displayName,
          avatarUrl: input.avatarUrl ?? null,
          companyName: input.companyName ?? null,
          tradeName: input.tradeName ?? null,
          logoUrl: input.logoUrl ?? null,
          bannerUrl: input.bannerUrl ?? null,
          publicDescription: input.publicDescription ?? null,
          socialLinks: input.socialLinks ?? {},
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
