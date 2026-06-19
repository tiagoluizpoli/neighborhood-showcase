import { Link } from '@tanstack/react-router';
import { AlertTriangle } from 'lucide-react';
import type { ProviderDashboardAnnouncementItem } from './-provider-dashboard-types';
import { AnnouncementPresentationPrimitive } from '@/components/announcement-presentation-primitive';

interface ProviderDashboardAnnouncementCardProps {
  ad: ProviderDashboardAnnouncementItem;
  formatDate: (str: string | null) => string;
  formatPrice: (val: number | null) => string;
  isRenewing?: boolean;
  onEdit: () => void;
  onPay?: () => void;
  onRenew?: () => void;
  onViewAnalytics?: (ad: ProviderDashboardAnnouncementItem) => void;
}

export function ProviderDashboardAnnouncementCard({
  ad,
  formatDate,
  formatPrice,
  isRenewing,
  onEdit,
  onPay,
  onRenew,
  onViewAnalytics,
}: ProviderDashboardAnnouncementCardProps) {
  return (
    <AnnouncementPresentationPrimitive
      variant="dashboard-card"
      ad={ad}
      formatDate={formatDate}
      formatPrice={formatPrice}
      isRenewing={isRenewing}
      onEdit={onEdit}
      onPay={onPay}
      onRenew={onRenew}
      onViewAnalytics={onViewAnalytics ? () => onViewAnalytics(ad) : undefined}
    />
  );
}

interface ProviderDashboardAnnouncementEmptyStateProps {
  buttonText?: string;
  hideButton?: boolean;
  link?: string;
  text: string;
}

export function ProviderDashboardAnnouncementEmptyState({
  buttonText,
  hideButton = false,
  link,
  text,
}: ProviderDashboardAnnouncementEmptyStateProps) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border-2 border-border border-dashed p-12 text-center">
      <AlertTriangle className="mx-auto h-10 w-10 text-muted-foreground" />
      <p className="mt-4 font-medium text-muted-foreground text-sm">{text}</p>
      {!hideButton && link && buttonText && (
        <Link
          to={link}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 font-medium text-primary-foreground text-sm transition-colors hover:bg-primary/90"
        >
          {buttonText}
        </Link>
      )}
    </div>
  );
}
