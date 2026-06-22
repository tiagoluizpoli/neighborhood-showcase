import { db } from '@neighborhood-showcase/db';
import { announcement as announcementSchema } from '@neighborhood-showcase/db/schema/showcase';
import { eq } from 'drizzle-orm';
import type {
  Announcement,
  AnnouncementStatus,
} from '../../domain/entities/announcement.entity';
import type {
  AnnouncementRepository,
  CreateAnnouncementRepositoryInput,
  DashboardAnnouncementDTO,
  ListPublicAnnouncementsInput,
  ListReportedAnnouncementsRepositoryInput,
  ModerationAnnouncementDTO,
  ProviderAnnouncementDTO,
  PublicAnnouncementDTO,
  ReportedAnnouncementDTO,
  UpdateAnnouncementRepositoryInput,
} from '../../domain/repositories/announcement.repository';
import {
  countPendingAnnouncementsByCondo,
  createAnnouncement,
  findActiveAnnouncementsByProviderId,
  findAnnouncementById,
  findAnnouncementIdsByProviderId,
  findDashboardAnnouncementsByProviderId,
  findPublicAnnouncementById,
  listAnnouncementsForModeration,
  listPublicAnnouncements,
  listReportedAnnouncements,
  listTagSuggestions,
  reinstateAnnouncement,
  suspendAnnouncement,
  updateAnnouncement,
  updateAnnouncementStatus,
} from './announcement-repository/public';
import { AnnouncementMapper } from './mappers/announcement.mapper';

export class DrizzleAnnouncementRepository implements AnnouncementRepository {
  private readonly mapper = new AnnouncementMapper();

  async create(
    input: CreateAnnouncementRepositoryInput,
  ): Promise<Announcement> {
    return createAnnouncement(this.mapper, input);
  }

  async findById(id: string): Promise<Announcement | null> {
    return findAnnouncementById(this.mapper, id);
  }

  async updateStatus(
    id: string,
    status: AnnouncementStatus,
  ): Promise<Announcement> {
    return updateAnnouncementStatus(this.mapper, id, status);
  }

  async update(
    id: string,
    input: UpdateAnnouncementRepositoryInput,
  ): Promise<Announcement> {
    return updateAnnouncement(this.mapper, id, input);
  }

  async findPublicById(id: string): Promise<PublicAnnouncementDTO | null> {
    return findPublicAnnouncementById(id);
  }

  async listForModeration(
    condominiumId: string,
  ): Promise<ModerationAnnouncementDTO[]> {
    return listAnnouncementsForModeration(condominiumId);
  }

  async listReported(
    input: ListReportedAnnouncementsRepositoryInput,
  ): Promise<ReportedAnnouncementDTO[]> {
    return listReportedAnnouncements(input);
  }

  async suspend(id: string, reason: string): Promise<void> {
    await suspendAnnouncement(id, reason);
  }

  async reinstate(id: string): Promise<void> {
    await reinstateAnnouncement(id);
  }

  async softDeleteAllByProviderId(
    providerId: string,
    reason: string,
  ): Promise<void> {
    await db
      .update(announcementSchema)
      .set({
        deletedAt: new Date(),
        status: 'SUSPENDED',
        suspensionReason: reason,
      })
      .where(eq(announcementSchema.providerId, providerId));
  }

  async findActiveByProviderId(
    providerId: string,
    providerName: string,
    providerAvatarUrl: string | null,
  ): Promise<ProviderAnnouncementDTO[]> {
    return findActiveAnnouncementsByProviderId(
      providerId,
      providerName,
      providerAvatarUrl,
    );
  }

  async findIdsByProviderId(providerId: string): Promise<string[]> {
    return findAnnouncementIdsByProviderId(providerId);
  }

  async findDashboardByProviderId(
    providerId: string,
  ): Promise<DashboardAnnouncementDTO[]> {
    return findDashboardAnnouncementsByProviderId(providerId);
  }

  async findPublic(
    input: ListPublicAnnouncementsInput,
  ): Promise<PublicAnnouncementDTO[]> {
    return listPublicAnnouncements(input);
  }

  async countPendingByCondo(condominiumId: string): Promise<number> {
    return countPendingAnnouncementsByCondo(condominiumId);
  }

  async listTagSuggestions(limit?: number): Promise<string[]> {
    return listTagSuggestions(limit);
  }
}
