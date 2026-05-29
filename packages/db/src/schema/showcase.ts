import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { user } from './auth';

export const condominium = pgTable('condominium', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  cep: text('cep').notNull(),
  contactInfo: jsonb('contact_info')
    .$type<{
      website?: string;
      email?: string;
      phone?: string;
    }>()
    .notNull()
    .default({}),
  status: text('status', {
    enum: ['PENDING_APPROVAL', 'APPROVED', 'REJECTED'],
  })
    .default('PENDING_APPROVAL')
    .notNull(),
  createdBy: text('created_by')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  proofUrl: text('proof_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const assignment = pgTable('assignment', {
  id: text('id').primaryKey(),
  providerId: text('provider_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  condominiumId: text('condominium_id')
    .notNull()
    .references(() => condominium.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['RESIDENT', 'MODERATOR'] }).notNull(),
  status: text('status', {
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
  })
    .default('PENDING')
    .notNull(),
  unitInfo: text('unit_info'),
  proofOfResidency: text('proof_of_residency'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const condominiumRelations = relations(condominium, ({ one, many }) => ({
  creator: one(user, {
    fields: [condominium.createdBy],
    references: [user.id],
  }),
  assignments: many(assignment),
}));

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
  condominiumId: text('condominium_id')
    .notNull()
    .references(() => condominium.id, { onDelete: 'cascade' }),
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
      instagram?: string;
      website?: string;
    }>()
    .notNull()
    .default({}),
  showVerifiedBadge: boolean('show_verified_badge').default(false).notNull(),
  flaggedForReview: boolean('flagged_for_review').default(false).notNull(),
  status: text('status', {
    enum: ['DRAFT', 'PENDING_PAYMENT', 'ACTIVE', 'EXPIRED', 'SUSPENDED'],
  })
    .default('DRAFT')
    .notNull(),
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
    condominium: one(condominium, {
      fields: [announcement.condominiumId],
      references: [condominium.id],
    }),
    payments: many(payment),
    analyticsEvents: many(analyticsEvent),
  }),
);

export const payment = pgTable('payment', {
  id: text('id').primaryKey(),
  announcementId: text('announcement_id')
    .notNull()
    .references(() => announcement.id, { onDelete: 'cascade' }),
  billingId: text('billing_id').notNull(),
  amountCents: integer('amount_cents').notNull(),
  status: text('status', {
    enum: ['PENDING', 'PAID', 'EXPIRED', 'REFUNDED'],
  })
    .default('PENDING')
    .notNull(),
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
  eventType: text('event_type', {
    enum: ['IMPRESSION', 'CONTACT_CLICK'],
  }).notNull(),
  targetType: text('target_type', {
    enum: ['WHATSAPP', 'INSTAGRAM', 'WEBSITE'],
  }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const analyticsEventRelations = relations(analyticsEvent, ({ one }) => ({
  announcement: one(announcement, {
    fields: [analyticsEvent.announcementId],
    references: [announcement.id],
  }),
}));
