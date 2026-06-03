import { relations } from 'drizzle-orm';
import {
  boolean,
  customType,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';
import { user } from './auth';

export const geography = customType<{ data: string }>({
  dataType() {
    return 'geography(Point, 4326)';
  },
});

export const condominiumStatusEnum = pgEnum('condominium_status', [
  'PENDING_APPROVAL',
  'APPROVED',
  'REJECTED',
]);

export const providerLocationTypeEnum = pgEnum('provider_location_type', [
  'RESIDENT',
  'MODERATOR',
  'EXTERNAL',
]);

export const providerLocationStatusEnum = pgEnum('provider_location_status', [
  'PENDING',
  'APPROVED',
  'REJECTED',
]);

export const assignmentTypeEnum = pgEnum('assignment_type', [
  'RESIDENT',
  'MODERATOR',
]);

export const assignmentStatusEnum = pgEnum('assignment_status', [
  'PENDING',
  'APPROVED',
  'REJECTED',
]);

export const announcementStatusEnum = pgEnum('announcement_status', [
  'DRAFT',
  'PENDING_PAYMENT',
  'ACTIVE',
  'EXPIRED',
  'SUSPENDED',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'PENDING',
  'PAID',
  'EXPIRED',
  'REFUNDED',
]);

export const analyticsEventTypeEnum = pgEnum('analytics_event_type', [
  'IMPRESSION',
  'CONTACT_CLICK',
]);

export const analyticsTargetTypeEnum = pgEnum('analytics_target_type', [
  'WHATSAPP',
  'INSTAGRAM',
  'WEBSITE',
]);

export const address = pgTable('address', {
  id: text('id').primaryKey(),
  cep: text('cep').notNull(),
  street: text('street').notNull(),
  neighborhood: text('neighborhood').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const condominium = pgTable('condominium', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  cep: text('cep').notNull(),
  addressId: text('address_id').references(() => address.id, {
    onDelete: 'set null',
  }),
  number: text('number'),
  contactInfo: jsonb('contact_info')
    .$type<{
      website?: string;
      email?: string;
      phone?: string;
    }>()
    .notNull()
    .default({}),
  status: condominiumStatusEnum('status').default('PENDING_APPROVAL').notNull(),
  createdBy: text('created_by')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  proofUrl: text('proof_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  latitude: numeric('latitude'),
  longitude: numeric('longitude'),
  geog: geography('geog'),
});

export const providerLocation = pgTable('provider_location', {
  id: text('id').primaryKey(),
  providerId: text('provider_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  type: providerLocationTypeEnum('type').notNull(),
  status: providerLocationStatusEnum('status').default('PENDING').notNull(),
  condominiumId: text('condominium_id').references(() => condominium.id, {
    onDelete: 'cascade',
  }),
  addressId: text('address_id').references(() => address.id, {
    onDelete: 'cascade',
  }),
  number: text('number'),
  unitInfo: text('complement'),
  proofOfResidency: text('proof_file'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  latitude: numeric('latitude'),
  longitude: numeric('longitude'),
  geog: geography('geog'),
});

export const assignment = pgTable('assignment', {
  id: text('id').primaryKey(),
  providerId: text('provider_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  condominiumId: text('condominium_id')
    .notNull()
    .references(() => condominium.id, { onDelete: 'cascade' }),
  type: assignmentTypeEnum('type').notNull(),
  status: assignmentStatusEnum('status').default('PENDING').notNull(),
  unitInfo: text('unit_info'),
  proofOfResidency: text('proof_of_residency'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const addressRelations = relations(address, ({ many }) => ({
  condominiums: many(condominium),
  providerLocations: many(providerLocation),
}));

export const condominiumRelations = relations(condominium, ({ one, many }) => ({
  creator: one(user, {
    fields: [condominium.createdBy],
    references: [user.id],
  }),
  address: one(address, {
    fields: [condominium.addressId],
    references: [address.id],
  }),
  providerLocations: many(providerLocation),
  assignments: many(assignment),
}));

export const providerLocationRelations = relations(
  providerLocation,
  ({ one }) => ({
    provider: one(user, {
      fields: [providerLocation.providerId],
      references: [user.id],
    }),
    condominium: one(condominium, {
      fields: [providerLocation.condominiumId],
      references: [condominium.id],
    }),
    address: one(address, {
      fields: [providerLocation.addressId],
      references: [address.id],
    }),
  }),
);

export const assignmentRelations = relations(assignment, ({ one }) => ({
  provider: one(user, {
    fields: [assignment.providerId],
    references: [user.id],
  }),
  condominium: one(condominium, {
    fields: [assignment.condominiumId],
    references: [condominium.id],
  }),
}));

export const announcement = pgTable('announcement', {
  id: text('id').primaryKey(),
  providerId: text('provider_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  providerLocationId: text('provider_location_id').references(
    () => providerLocation.id,
    { onDelete: 'cascade' },
  ),
  condominiumId: text('condominium_id').references(() => condominium.id, {
    onDelete: 'cascade',
  }),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  description: text('description').notNull(),
  priceCents: integer('price_cents'),
  imageUrl: text('image_url').notNull(),
  category: text('category').notNull(),
  tags: text('tags').array().notNull().default([]),
  contactLinks: jsonb('contact_links')
    .$type<{
      whatsapp?: string;
      phone?: string;
      email?: string;
      instagram?: string;
      tiktok?: string;
      facebook?: string;
      website?: string;
    }>()
    .notNull()
    .default({}),
  showVerifiedBadge: boolean('show_verified_badge').default(false).notNull(),
  flaggedForReview: boolean('flagged_for_review').default(false).notNull(),
  status: announcementStatusEnum('status').default('DRAFT').notNull(),
  paidAt: timestamp('paid_at'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  suspensionReason: text('suspension_reason'),
});

export const announcementRelations = relations(
  announcement,
  ({ one, many }) => ({
    provider: one(user, {
      fields: [announcement.providerId],
      references: [user.id],
    }),
    providerLocation: one(providerLocation, {
      fields: [announcement.providerLocationId],
      references: [providerLocation.id],
    }),
    condominium: one(condominium, {
      fields: [announcement.condominiumId],
      references: [condominium.id],
    }),
    payments: many(payment),
    analyticsEvents: many(analyticsEvent),
    reports: many(report),
  }),
);

export const payment = pgTable('payment', {
  id: text('id').primaryKey(),
  announcementId: text('announcement_id')
    .notNull()
    .references(() => announcement.id, { onDelete: 'cascade' }),
  billingId: text('billing_id').notNull(),
  amountCents: integer('amount_cents').notNull(),
  status: paymentStatusEnum('status').default('PENDING').notNull(),
  pixQrCode: text('pix_qr_code'),
  pixCopyPaste: text('pix_copy_paste'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const paymentRelations = relations(payment, ({ one }) => ({
  announcement: one(announcement, {
    fields: [payment.announcementId],
    references: [announcement.id],
  }),
}));

export const analyticsEvent = pgTable('analytics_event', {
  id: text('id').primaryKey(),
  announcementId: text('announcement_id')
    .notNull()
    .references(() => announcement.id, { onDelete: 'cascade' }),
  eventType: analyticsEventTypeEnum('event_type').notNull(),
  targetType: analyticsTargetTypeEnum('target_type'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const analyticsEventRelations = relations(analyticsEvent, ({ one }) => ({
  announcement: one(announcement, {
    fields: [analyticsEvent.announcementId],
    references: [announcement.id],
  }),
}));

export const reportReasonEnum = pgEnum('report_reason', [
  'FRAUDE_GOLPE',
  'ASSEDIO_OFENSIVO',
  'SPAM',
  'SERVICO_ILEGAL',
  'OUTROS',
]);

export const report = pgTable(
  'report',
  {
    id: text('id').primaryKey(),
    reporterId: text('reporter_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    announcementId: text('announcement_id')
      .notNull()
      .references(() => announcement.id, { onDelete: 'cascade' }),
    reason: reportReasonEnum('reason').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    unique('reporter_announcement_unique').on(
      table.reporterId,
      table.announcementId,
    ),
  ],
);

export const reportRelations = relations(report, ({ one }) => ({
  reporter: one(user, {
    fields: [report.reporterId],
    references: [user.id],
  }),
  announcement: one(announcement, {
    fields: [report.announcementId],
    references: [announcement.id],
  }),
}));
