import { beforeAll, describe, expect, test } from 'bun:test';
import { db } from '@neighborhood-showcase/db';
import { user } from '@neighborhood-showcase/db/schema/auth';
import { announcement, condominium, providerAssignment, } from '@neighborhood-showcase/db/schema/showcase';
import { DrizzleAnnouncementRepository } from '../../../infrastructure/db/announcement-repository';
import { DrizzleAssignmentRepository } from '../../../infrastructure/db/assignment-repository';
import { ListAnnouncementsForModeration, ModerationAccessDeniedError, } from './list-announcements-for-moderation';
describe('ListAnnouncementsForModeration use case', () => {
    const moderatorId = 'moderation-list-moderator-id';
    const providerId = 'moderation-list-provider-id';
    const outsiderId = 'moderation-list-outsider-id';
    const condoId = 'moderation-list-condo-id';
    const otherCondoId = 'moderation-list-other-condo-id';
    const announcementRepo = new DrizzleAnnouncementRepository();
    const assignmentRepo = new DrizzleAssignmentRepository();
    const listAnnouncementsForModeration = new ListAnnouncementsForModeration(announcementRepo, assignmentRepo);
    beforeAll(async () => {
        await db.delete(announcement);
        await db.delete(providerAssignment);
        await db.delete(condominium);
        await db.delete(user);
        await db.insert(user).values([
            {
                id: moderatorId,
                name: 'Moderator User',
                email: 'moderator-list@example.com',
                emailVerified: true,
                role: 'USER',
                status: 'ACTIVE',
            },
            {
                id: providerId,
                name: 'Provider User',
                email: 'provider-list@example.com',
                emailVerified: true,
                role: 'USER',
                status: 'ACTIVE',
            },
            {
                id: outsiderId,
                name: 'Outsider User',
                email: 'outsider-list@example.com',
                emailVerified: true,
                role: 'USER',
                status: 'ACTIVE',
            },
        ]);
        await db.insert(condominium).values([
            {
                id: condoId,
                name: 'Moderated Condo',
                city: 'Florianopolis',
                state: 'SC',
                cep: '88000000',
                createdBy: providerId,
                status: 'APPROVED',
            },
            {
                id: otherCondoId,
                name: 'Other Condo',
                city: 'Florianopolis',
                state: 'SC',
                cep: '88000001',
                createdBy: providerId,
                status: 'APPROVED',
            },
        ]);
        await db.insert(providerAssignment).values({
            id: 'moderation-list-moderator-assignment-id',
            providerId: moderatorId,
            condominiumId: condoId,
            type: 'MODERATOR',
            status: 'APPROVED',
        });
        await db.insert(announcement).values([
            {
                id: 'moderation-list-active-id',
                providerId,
                condominiumId: condoId,
                title: 'Active Listing',
                description: 'Active listing description',
                imageUrl: 'https://example.com/active.png',
                categoryId: 'cat-servicos',
                status: 'ACTIVE',
            },
            {
                id: 'moderation-list-suspended-id',
                providerId,
                condominiumId: condoId,
                title: 'Suspended Listing',
                description: 'Suspended listing description',
                imageUrl: 'https://example.com/suspended.png',
                categoryId: 'cat-servicos',
                status: 'SUSPENDED',
                suspensionReason: 'Previous violation',
            },
            {
                id: 'moderation-list-draft-id',
                providerId,
                condominiumId: condoId,
                title: 'Draft Listing',
                description: 'Draft listing description',
                imageUrl: 'https://example.com/draft.png',
                categoryId: 'cat-servicos',
                status: 'DRAFT',
            },
            {
                id: 'moderation-list-other-condo-id',
                providerId,
                condominiumId: otherCondoId,
                title: 'Other Condo Listing',
                description: 'Other condo listing description',
                imageUrl: 'https://example.com/other.png',
                categoryId: 'cat-servicos',
                status: 'ACTIVE',
            },
        ]);
    });
    test('returns only active and suspended announcements in moderated condominium', async () => {
        const results = await listAnnouncementsForModeration.execute({
            actorId: moderatorId,
            condominiumId: condoId,
        });
        const suspendedAnnouncement = results.find((item) => item.id === 'moderation-list-suspended-id');
        expect(results).toHaveLength(2);
        expect(results.map((item) => item.id).sort()).toEqual(['moderation-list-active-id', 'moderation-list-suspended-id'].sort());
        expect(results[0]?.providerName).toBe('Provider User');
        expect(suspendedAnnouncement?.suspensionReason).toBe('Previous violation');
    });
    test('throws ModerationAccessDeniedError for non-moderator user', async () => {
        await expect(listAnnouncementsForModeration.execute({
            actorId: outsiderId,
            condominiumId: condoId,
        })).rejects.toBeInstanceOf(ModerationAccessDeniedError);
    });
});
