import { db } from '@neighborhood-showcase/db';
import { user as userSchema } from '@neighborhood-showcase/db/schema/auth';
import { announcement as announcementSchema } from '@neighborhood-showcase/db/schema/showcase';
import { sql } from 'drizzle-orm';
import type { SpectrumOverview } from '../../../domain/entities/spectrum/spectrum-overview.entity';
import type {
  GetSpectrumOverviewRepositoryInput,
  SpectrumRepository,
} from '../../../domain/repositories/spectrum.repository';
import { SpectrumMapper } from '../mappers/spectrum-mapper';

export class DrizzleSpectrumRepository implements SpectrumRepository {
  private readonly mapper = new SpectrumMapper();

  async getOverview(
    input: GetSpectrumOverviewRepositoryInput,
  ): Promise<SpectrumOverview> {
    const { periodStart, periodEnd } = input;

    const [
      activeProvidersResult,
      totalAnnouncementsResult,
      flaggedResult,
      newUsersResult,
    ] = await Promise.all([
      db.execute(sql<{ count: number }>`
        SELECT COUNT(DISTINCT pp.provider_id) as count
        FROM provider_profile pp
        INNER JOIN ${userSchema} u ON u.id = pp.provider_id
        WHERE u.status = 'ACTIVE'
          AND pp.is_provider_visible = true
      `),
      db.execute(sql<{ count: number }>`
        SELECT COUNT(*) as count
        FROM ${announcementSchema} a
        WHERE a.status IN ('ACTIVE', 'PENDING_PAYMENT')
          AND a.deleted_at IS NULL
      `),
      db.execute(sql<{ count: number }>`
        SELECT COUNT(*) as count
        FROM ${announcementSchema} a
        WHERE a.flagged_for_review = true
          AND a.deleted_at IS NULL
      `),
      db.execute(sql<{ count: number }>`
        SELECT COUNT(*) as count
        FROM ${userSchema} u
        WHERE u.created_at >= ${periodStart}
          AND u.created_at <= ${periodEnd}
      `),
    ]);

    const activeProviders = Number(activeProvidersResult.rows[0]?.count ?? 0);
    const totalAnnouncements = Number(
      totalAnnouncementsResult.rows[0]?.count ?? 0,
    );
    const flaggedForReview = Number(flaggedResult.rows[0]?.count ?? 0);
    const newUserSignups = Number(newUsersResult.rows[0]?.count ?? 0);

    return this.mapper.toDomain({
      activeProviders,
      totalAnnouncements,
      flaggedForReview,
      newUserSignups,
      periodStart,
      periodEnd,
    });
  }
}
