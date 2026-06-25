import { db } from '@neighborhood-showcase/db';
import { user as userSchema } from '@neighborhood-showcase/db/schema/auth';
import {
  address as addressSchema,
  announcement as announcementSchema,
  category as categorySchema,
  condominium as condominiumSchema,
  providerAssignment as providerAssignmentSchema,
  providerProfile as providerProfileSchema,
} from '@neighborhood-showcase/db/schema/showcase';
import { eq } from 'drizzle-orm';
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
    .select()
    .from(announcementSchema)
    .where(eq(announcementSchema.id, id))
    .limit(1);

  if (found?.status !== 'ACTIVE' || found.deletedAt !== null) {
    return null;
  }

  let condoName = '';
  let condoCity = '';
  let condoState = '';

  if (found.condominiumId) {
    const [condo] = await db
      .select()
      .from(condominiumSchema)
      .where(eq(condominiumSchema.id, found.condominiumId))
      .limit(1);
    if (condo) {
      condoName = condo.name;
      condoCity = condo.city;
      condoState = condo.state;
    }
  } else if (found.providerAssignmentId) {
    const [location] = await db
      .select({ city: addressSchema.city, state: addressSchema.state })
      .from(providerAssignmentSchema)
      .innerJoin(
        addressSchema,
        eq(providerAssignmentSchema.addressId, addressSchema.id),
      )
      .where(eq(providerAssignmentSchema.id, found.providerAssignmentId))
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
    .from(userSchema)
    .leftJoin(
      providerProfileSchema,
      eq(providerProfileSchema.providerId, userSchema.id),
    )
    .where(eq(userSchema.id, found.providerId))
    .limit(1);

  const [category] = await db
    .select({ name: categorySchema.name })
    .from(categorySchema)
    .where(eq(categorySchema.id, found.categoryId))
    .limit(1);

  const contact = rowToContactSettings({
    mode: found.contactMode,
    custom: found.contactCustom ?? null,
  });
  const providerDefaults = {
    primaryPhone: provider?.primaryPhone ?? '',
    callEnabled: provider?.callEnabled ?? false,
  };
  const contactLinks = contactSettingsToLinks(contact, providerDefaults);
  const cta = sanitizeCta({
    cta: rowToCta(found.cta),
    providerId: found.providerId,
    effectiveWhatsappPhone: contactLinks.whatsapp ?? '',
  });

  return {
    id: found.id,
    providerId: found.providerId,
    condominiumId: found.condominiumId,
    providerAssignmentId: found.providerAssignmentId,
    title: found.title,
    subtitle: found.subtitle,
    description: found.description,
    priceCents: found.priceCents,
    imageUrl: found.imageUrl,
    categoryId: found.categoryId,
    tags: found.tags,
    contact,
    cta,
    contactLinks,
    showVerifiedBadge: found.showVerifiedBadge,
    status: found.status,
    createdAt: found.createdAt,
    category: category?.name ?? '',
    condoName,
    condoCity,
    condoState,
    providerName: provider?.profileName ?? provider?.name ?? '',
    providerAvatarUrl: provider?.image ?? null,
  };
}
