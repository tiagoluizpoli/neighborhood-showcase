import { db } from '@neighborhood-showcase/db';
import { user as userSchema } from '@neighborhood-showcase/db/schema/auth';
import {
  address as addressSchema,
  announcement as announcementSchema,
  category as categorySchema,
  condominium as condominiumSchema,
  providerAssignment as providerAssignmentSchema,
  providerProfile as providerProfileSchema,
  provider as providerSchema,
} from '@neighborhood-showcase/db/schema/showcase';
import { and, eq, isNull } from 'drizzle-orm';
import { sanitizeCta } from '../../../../domain/entities/cta';
import type { PublicAnnouncementDTO } from '../../../../domain/repositories/announcement.repository';
import {
  contactSettingsToLinks,
  rowToContactSettings,
} from '../../mappers/announcement-contact';
import { rowToCta } from '../../mappers/announcement-cta';

export async function findPublicAnnouncementById(
  id: string,
): Promise<PublicAnnouncementDTO | null> {
  const [found] = await db
    .select({ announcement: announcementSchema })
    .from(announcementSchema)
    .innerJoin(
      providerSchema,
      eq(announcementSchema.providerId, providerSchema.id),
    )
    .where(and(eq(announcementSchema.id, id), isNull(providerSchema.deletedAt)))
    .limit(1);

  const announcement = found?.announcement;

  if (announcement?.status !== 'ACTIVE' || announcement.deletedAt !== null) {
    return null;
  }

  let condoName = '';
  let condoCity = '';
  let condoState = '';

  if (announcement.condominiumId) {
    const [condo] = await db
      .select()
      .from(condominiumSchema)
      .where(eq(condominiumSchema.id, announcement.condominiumId))
      .limit(1);
    if (condo) {
      condoName = condo.name;
      condoCity = condo.city;
      condoState = condo.state;
    }
  } else if (announcement.providerAssignmentId) {
    const [location] = await db
      .select({ city: addressSchema.city, state: addressSchema.state })
      .from(providerAssignmentSchema)
      .innerJoin(
        addressSchema,
        eq(providerAssignmentSchema.addressId, addressSchema.id),
      )
      .where(eq(providerAssignmentSchema.id, announcement.providerAssignmentId))
      .limit(1);
    if (location) {
      condoCity = location.city;
      condoState = location.state;
    }
  }

  const [provider] = await db
    .select({
      name: userSchema.name,
      image: userSchema.image,
      profileName: providerProfileSchema.displayName,
      primaryPhone: providerProfileSchema.primaryPhone,
      callEnabled: providerProfileSchema.callEnabled,
    })
    .from(providerSchema)
    .innerJoin(userSchema, eq(providerSchema.ownerId, userSchema.id))
    .leftJoin(
      providerProfileSchema,
      eq(providerProfileSchema.providerId, providerSchema.id),
    )
    .where(
      and(
        eq(providerSchema.id, announcement.providerId),
        isNull(providerSchema.deletedAt),
      ),
    )
    .limit(1);

  const [category] = await db
    .select({ name: categorySchema.name })
    .from(categorySchema)
    .where(eq(categorySchema.id, announcement.categoryId))
    .limit(1);

  const contact = rowToContactSettings({
    mode: announcement.contactMode,
    custom: announcement.contactCustom ?? null,
  });
  const providerDefaults = {
    primaryPhone: provider?.primaryPhone ?? '',
    callEnabled: provider?.callEnabled ?? false,
  };
  const contactLinks = contactSettingsToLinks(contact, providerDefaults);
  const cta = sanitizeCta({
    cta: rowToCta(announcement.cta),
    providerId: announcement.providerId,
    effectiveWhatsappPhone: contactLinks.whatsapp ?? '',
  });

  return {
    id: announcement.id,
    providerId: announcement.providerId,
    condominiumId: announcement.condominiumId,
    providerAssignmentId: announcement.providerAssignmentId,
    title: announcement.title,
    subtitle: announcement.subtitle,
    description: announcement.description,
    priceCents: announcement.priceCents,
    imageUrl: announcement.imageUrl,
    categoryId: announcement.categoryId,
    tags: announcement.tags,
    contact,
    cta,
    contactLinks,
    showVerifiedBadge: announcement.showVerifiedBadge,
    status: announcement.status,
    createdAt: announcement.createdAt,
    category: category?.name ?? '',
    condoName,
    condoCity,
    condoState,
    providerName: provider?.profileName ?? provider?.name ?? '',
    providerAvatarUrl: provider?.image ?? null,
  };
}
