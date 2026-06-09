import { CreateAnnouncement } from '../../application/use-cases/announcement/create-announcement';
import { CountPendingAnnouncements } from '../../application/use-cases/announcement/count-pending-announcements';
import { DismissReports } from '../../application/use-cases/announcement/dismiss-reports';
import { GetAnnouncementAnalytics } from '../../application/use-cases/announcement/get-announcement-analytics';
import { GetProviderDashboardData } from '../../application/use-cases/announcement/get-provider-dashboard-data';
import { GetPublicAnnouncement } from '../../application/use-cases/announcement/get-public-announcement';
import { ListActiveCategories } from '../../application/use-cases/announcement/list-active-categories';
import { ListAnnouncementsForModeration } from '../../application/use-cases/announcement/list-announcements-for-moderation';
import { ListPublicAnnouncements } from '../../application/use-cases/announcement/list-public-announcements';
import { ListReportedAnnouncements } from '../../application/use-cases/announcement/list-reported-announcements';
import { ReinstateAnnouncement } from '../../application/use-cases/announcement/reinstate-announcement';
import { ReportAnnouncement } from '../../application/use-cases/announcement/report-announcement';
import { SuspendAnnouncement } from '../../application/use-cases/announcement/suspend-announcement';
import { TrackAnalyticsEvent } from '../../application/use-cases/announcement/track-analytics-event';
import { UpdateAnnouncement } from '../../application/use-cases/announcement/update-announcement';
import { GeneratePaymentIntent } from '../../application/use-cases/payment/generate-payment-intent';
import { GetPaymentStatus } from '../../application/use-cases/payment/get-payment-status';
import { DrizzleAnalyticsRepository } from '../../infrastructure/db/analytics-repository';
import { DrizzleAnnouncementRepository } from '../../infrastructure/db/announcement-repository';
import { DrizzleAssignmentRepository } from '../../infrastructure/db/assignment-repository';
import { DrizzleCategoryRepository } from '../../infrastructure/db/category-repository';
import { DrizzlePaymentRepository } from '../../infrastructure/db/payment-repository';
import { DrizzleReportRepository } from '../../infrastructure/db/report-repository';
import { DrizzleUserRepository } from '../../infrastructure/db/user-repository';
import { AbacatePayClient } from '../../infrastructure/payment/abacatepay.client';

export interface AnnouncementRouterDependencies {
  createAnnouncementUseCase: CreateAnnouncement;
  countPendingAnnouncementsUseCase: CountPendingAnnouncements;
  generatePaymentIntentUseCase: GeneratePaymentIntent;
  getPaymentStatusUseCase: GetPaymentStatus;
  listAnnouncementsForModerationUseCase: ListAnnouncementsForModeration;
  getPublicAnnouncementUseCase: GetPublicAnnouncement;
  updateAnnouncementUseCase: UpdateAnnouncement;
  listPublicAnnouncementsUseCase: ListPublicAnnouncements;
  listActiveCategoriesUseCase: ListActiveCategories;
  trackAnalyticsEventUseCase: TrackAnalyticsEvent;
  getProviderDashboardDataUseCase: GetProviderDashboardData;
  getAnnouncementAnalyticsUseCase: GetAnnouncementAnalytics;
  suspendAnnouncementUseCase: SuspendAnnouncement;
  reinstateAnnouncementUseCase: ReinstateAnnouncement;
  reportAnnouncementUseCase: ReportAnnouncement;
  dismissReportsUseCase: DismissReports;
  listReportedAnnouncementsUseCase: ListReportedAnnouncements;
}

export function createAnnouncementRouterDependencies(): AnnouncementRouterDependencies {
  const announcementRepo = new DrizzleAnnouncementRepository();
  const assignmentRepo = new DrizzleAssignmentRepository();
  const categoryRepo = new DrizzleCategoryRepository();
  const paymentRepo = new DrizzlePaymentRepository();
  const reportRepo = new DrizzleReportRepository();
  const userRepo = new DrizzleUserRepository();
  const analyticsRepo = new DrizzleAnalyticsRepository();
  const abacatePayClient = new AbacatePayClient();

  return {
    createAnnouncementUseCase: new CreateAnnouncement(
      announcementRepo,
      assignmentRepo,
    ),
    countPendingAnnouncementsUseCase: new CountPendingAnnouncements(
      announcementRepo,
    ),
    generatePaymentIntentUseCase: new GeneratePaymentIntent(
      announcementRepo,
      paymentRepo,
      abacatePayClient,
    ),
    getPaymentStatusUseCase: new GetPaymentStatus(
      announcementRepo,
      paymentRepo,
    ),
    listAnnouncementsForModerationUseCase: new ListAnnouncementsForModeration(
      announcementRepo,
      assignmentRepo,
    ),
    getPublicAnnouncementUseCase: new GetPublicAnnouncement(announcementRepo),
    updateAnnouncementUseCase: new UpdateAnnouncement(
      announcementRepo,
      assignmentRepo,
    ),
    listPublicAnnouncementsUseCase: new ListPublicAnnouncements(
      announcementRepo,
    ),
    listActiveCategoriesUseCase: new ListActiveCategories(categoryRepo),
    trackAnalyticsEventUseCase: new TrackAnalyticsEvent(analyticsRepo),
    getProviderDashboardDataUseCase: new GetProviderDashboardData(
      announcementRepo,
      analyticsRepo,
    ),
    getAnnouncementAnalyticsUseCase: new GetAnnouncementAnalytics(
      announcementRepo,
      analyticsRepo,
    ),
    suspendAnnouncementUseCase: new SuspendAnnouncement(
      announcementRepo,
      assignmentRepo,
      userRepo,
    ),
    reinstateAnnouncementUseCase: new ReinstateAnnouncement(
      announcementRepo,
      assignmentRepo,
      userRepo,
    ),
    reportAnnouncementUseCase: new ReportAnnouncement(
      announcementRepo,
      reportRepo,
    ),
    dismissReportsUseCase: new DismissReports(
      announcementRepo,
      assignmentRepo,
      reportRepo,
      userRepo,
    ),
    listReportedAnnouncementsUseCase: new ListReportedAnnouncements(
      announcementRepo,
      assignmentRepo,
      userRepo,
    ),
  };
}