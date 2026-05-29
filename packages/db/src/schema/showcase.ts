import { relations } from 'drizzle-orm';
import { jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
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
