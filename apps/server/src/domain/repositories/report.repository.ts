export type ReportReason =
  | 'FRAUDE_GOLPE'
  | 'ASSEDIO_OFENSIVO'
  | 'SPAM'
  | 'SERVICO_ILEGAL'
  | 'OUTROS';

export interface ReportRecord {
  id: string;
  reporterId: string;
  announcementId: string;
  reason: ReportReason;
  createdAt: Date;
}

export interface CreateReportRepositoryInput {
  reporterId: string;
  announcementId: string;
  reason: ReportReason;
}

export interface ReportRepository {
  findByReporterAndAnnouncement(
    reporterId: string,
    announcementId: string,
  ): Promise<ReportRecord | null>;
  create(input: CreateReportRepositoryInput): Promise<ReportRecord>;
}
