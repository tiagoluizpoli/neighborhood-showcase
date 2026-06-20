/**
 * Announcement Presentation Primitive
 *
 * Three variant slots — each owns only the named boundary:
 *
 *   public-card    Portal listing card. Owns: image, title, price, category,
 *                  location badge, provider identity, primary contact CTA.
 *                  Deep contact-flow tuning is deferred to later packets.
 *
 *   dashboard-card Provider management card. Owns: image, status overlay,
 *                  title / category / description, price / condo / expiry
 *                  metadata, and status-driven action buttons (pay / renew /
 *                  edit / analytics). Deep analytics and edit tuning deferred.
 *
 *   detail-header  Announcement identity header in the detail view. Owns:
 *                  image, title, subtitle, and status / verified badges only.
 *                  Description, tags, contact links, and edit form are NOT
 *                  part of this slot — they belong to the surface layer.
 */
import { Badge } from '@neighborhood-showcase/ui/components/badge';
import {
  Card,
  CardDescription,
  CardHeader,
} from '@neighborhood-showcase/ui/components/card';
import { ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { AnnouncementCardProps } from './announcement-card';
import { AnnouncementCard } from './announcement-card';
import {
  AnnouncementDashboardCard,
  type AnnouncementDashboardCardData,
} from './announcement-dashboard-card';

// ---------------------------------------------------------------------------
// Variant type
// ---------------------------------------------------------------------------

export type AnnouncementPresentationVariant =
  | 'dashboard-card'
  | 'detail-header'
  | 'public-card';

// ---------------------------------------------------------------------------
// Per-variant prop interfaces
// ---------------------------------------------------------------------------

interface PublicCardVariantProps extends AnnouncementCardProps {
  variant: 'public-card';
}

interface DashboardCardVariantProps {
  variant: 'dashboard-card';
  ad: AnnouncementDashboardCardData;
  formatDate: (str: string | null) => string;
  formatPrice: (val: number | null) => string;
  isRenewing?: boolean;
  onEdit: () => void;
  onPay?: () => void;
  onRenew?: () => void;
  onViewAnalytics?: (ad: AnnouncementDashboardCardData) => void;
}

export interface DetailHeaderAnnouncementData {
  flaggedForReview: boolean;
  imageUrl: string;
  showVerifiedBadge: boolean;
  status: AnnouncementDashboardCardData['status'];
  subtitle: string | null;
  title: string;
}

interface DetailHeaderVariantProps {
  variant: 'detail-header';
  announcement: DetailHeaderAnnouncementData;
}

export type AnnouncementPresentationPrimitiveProps =
  | DashboardCardVariantProps
  | DetailHeaderVariantProps
  | PublicCardVariantProps;

// ---------------------------------------------------------------------------
// Primitive component
// ---------------------------------------------------------------------------

export function AnnouncementPresentationPrimitive(
  props: AnnouncementPresentationPrimitiveProps,
) {
  if (props.variant === 'public-card') {
    return (
      <AnnouncementCard
        ad={props.ad}
        selectedCondo={props.selectedCondo}
        visitorCoords={props.visitorCoords}
        isGpsFresh={props.isGpsFresh}
        hasIpFallback={props.hasIpFallback}
        onContactClick={props.onContactClick}
      />
    );
  }

  if (props.variant === 'dashboard-card') {
    return (
      <AnnouncementDashboardCard
        ad={props.ad}
        formatDate={props.formatDate}
        formatPrice={props.formatPrice}
        isRenewing={props.isRenewing}
        onEdit={props.onEdit}
        onPay={props.onPay}
        onRenew={props.onRenew}
        onViewAnalytics={props.onViewAnalytics}
      />
    );
  }

  return <AnnouncementDetailHeader announcement={props.announcement} />;
}

// ---------------------------------------------------------------------------
// Detail-header slot renderer
// ---------------------------------------------------------------------------

function AnnouncementDetailHeader({
  announcement,
}: {
  announcement: DetailHeaderAnnouncementData;
}) {
  const { t } = useTranslation();

  return (
    <Card className="overflow-hidden">
      <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
        <img
          src={announcement.imageUrl}
          alt={announcement.title}
          className="h-full w-full object-cover"
        />
      </div>
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">
            {t(statusTranslationKey(announcement))}
          </Badge>
          {announcement.showVerifiedBadge && (
            <Badge className="gap-1" variant="secondary">
              <ShieldCheck className="h-3.5 w-3.5" />
              {t('meus_anuncios.detail.verified_badge')}
            </Badge>
          )}
        </div>
        <div className="space-y-1">
          <h1 className="font-semibold text-3xl">{announcement.title}</h1>
          {announcement.subtitle && (
            <CardDescription className="text-base">
              {announcement.subtitle}
            </CardDescription>
          )}
        </div>
      </CardHeader>
    </Card>
  );
}

function statusTranslationKey(
  announcement: Pick<
    DetailHeaderAnnouncementData,
    'flaggedForReview' | 'status'
  >,
) {
  if (announcement.status === 'ACTIVE' && announcement.flaggedForReview) {
    return 'meus_anuncios.detail.status.active_review';
  }
  return `meus_anuncios.detail.status.${announcement.status.toLowerCase()}`;
}
