export interface ModerationReport {
  createdAt: Date | string;
  id: string;
  reason: string;
  reporterEmail: string;
  reporterName: string;
}

export interface ModerationReportedAnnouncement {
  id: string;
  imageUrl: string;
  providerEmail: string;
  providerId: string;
  providerName: string;
  reasonBreakdown: Record<string, number>;
  reports: ModerationReport[];
  status: string;
  title: string;
  totalReports: number;
}
