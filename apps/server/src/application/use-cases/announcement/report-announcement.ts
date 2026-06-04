import type { AnnouncementRepository } from '../../../domain/repositories/announcement.repository';
import type {
  ReportReason,
  ReportRepository,
} from '../../../domain/repositories/report.repository';
import { DomainError } from '../../../shared/domain-error';

export class AnnouncementReportNotFoundError extends DomainError {
  constructor() {
    super('Anúncio não encontrado.');
  }
}

export class AnnouncementReportConflictError extends DomainError {
  constructor() {
    super('Você já denunciou este anúncio.');
  }
}

export interface ReportAnnouncementInput {
  reporterId: string;
  announcementId: string;
  reason: ReportReason;
}

export class ReportAnnouncement {
  constructor(
    private readonly announcementRepo: AnnouncementRepository,
    private readonly reportRepo: ReportRepository,
  ) {}

  async execute(input: ReportAnnouncementInput): Promise<void> {
    const announcement = await this.announcementRepo.findById(
      input.announcementId,
    );

    if (!announcement || announcement.deletedAt !== null) {
      throw new AnnouncementReportNotFoundError();
    }

    const existingReport = await this.reportRepo.findByReporterAndAnnouncement(
      input.reporterId,
      input.announcementId,
    );

    if (existingReport) {
      throw new AnnouncementReportConflictError();
    }

    await this.reportRepo.create({
      reporterId: input.reporterId,
      announcementId: input.announcementId,
      reason: input.reason,
    });
  }
}
