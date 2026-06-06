import {
  ProviderDashboardAnnouncementCard,
  ProviderDashboardAnnouncementEmptyState,
} from './-provider-dashboard-announcement-card';
import type { ProviderDashboardAnnouncementItem } from './-provider-dashboard-types';

type AnnouncementTab = 'active' | 'draft' | 'expired' | 'suspended';

interface ProviderDashboardAnnouncementBuckets {
  active: ProviderDashboardAnnouncementItem[];
  draft: ProviderDashboardAnnouncementItem[];
  expired: ProviderDashboardAnnouncementItem[];
  suspended: ProviderDashboardAnnouncementItem[];
}

interface ProviderDashboardAnnouncementListProps {
  activeTab: AnnouncementTab;
  announcements: ProviderDashboardAnnouncementBuckets;
  formatDate: (str: string | null) => string;
  formatPrice: (val: number | null) => string;
  isRenewingAnnouncementId?: string | null;
  onActiveTabChange: (tab: AnnouncementTab) => void;
  onEdit: (ad: ProviderDashboardAnnouncementItem) => void;
  onPay: (ad: ProviderDashboardAnnouncementItem) => void;
  onRenew: (ad: ProviderDashboardAnnouncementItem) => void;
  onViewAnalytics: (ad: ProviderDashboardAnnouncementItem) => void;
}

export function ProviderDashboardAnnouncementList({
  activeTab,
  announcements,
  formatDate,
  formatPrice,
  isRenewingAnnouncementId,
  onActiveTabChange,
  onEdit,
  onPay,
  onRenew,
  onViewAnalytics,
}: ProviderDashboardAnnouncementListProps) {
  return (
    <>
      <div className="mb-6 border-border border-b">
        <div className="flex space-x-8">
          <TabButton
            active={activeTab === 'active'}
            count={announcements.active.length}
            label="Ativos"
            onClick={() => onActiveTabChange('active')}
          />
          <TabButton
            active={activeTab === 'draft'}
            count={announcements.draft.length}
            label="Rascunhos & Pendentes"
            onClick={() => onActiveTabChange('draft')}
          />
          <TabButton
            active={activeTab === 'expired'}
            count={announcements.expired.length}
            label="Expirados"
            onClick={() => onActiveTabChange('expired')}
          />
          <TabButton
            active={activeTab === 'suspended'}
            count={announcements.suspended.length}
            label="Suspensos"
            onClick={() => onActiveTabChange('suspended')}
          />
        </div>
      </div>

      <div>
        {activeTab === 'active' && (
          <AnnouncementGrid
            emptyText="Nenhum anúncio ativo no momento."
            emptyButtonText="Criar Anúncio"
            emptyLink="/panel/dashboard/anuncios/novo"
            items={announcements.active}
            onEdit={onEdit}
            onPay={undefined}
            onRenew={undefined}
            onViewAnalytics={onViewAnalytics}
            formatDate={formatDate}
            formatPrice={formatPrice}
            isRenewingAnnouncementId={isRenewingAnnouncementId}
          />
        )}

        {activeTab === 'draft' && (
          <AnnouncementGrid
            emptyText="Nenhum rascunho ou pagamento pendente."
            emptyButtonText="Criar Anúncio"
            emptyLink="/panel/dashboard/anuncios/novo"
            items={announcements.draft}
            onEdit={onEdit}
            onPay={onPay}
            onRenew={undefined}
            onViewAnalytics={onViewAnalytics}
            formatDate={formatDate}
            formatPrice={formatPrice}
            isRenewingAnnouncementId={isRenewingAnnouncementId}
          />
        )}

        {activeTab === 'expired' && (
          <AnnouncementGrid
            emptyText="Nenhum anúncio expirado."
            hideButton
            items={announcements.expired}
            onEdit={onEdit}
            onPay={undefined}
            onRenew={onRenew}
            onViewAnalytics={onViewAnalytics}
            formatDate={formatDate}
            formatPrice={formatPrice}
            isRenewingAnnouncementId={isRenewingAnnouncementId}
          />
        )}

        {activeTab === 'suspended' && (
          <AnnouncementGrid
            emptyText="Nenhum anúncio suspenso."
            hideButton
            items={announcements.suspended}
            onEdit={onEdit}
            onPay={undefined}
            onRenew={undefined}
            onViewAnalytics={onViewAnalytics}
            formatDate={formatDate}
            formatPrice={formatPrice}
            isRenewingAnnouncementId={isRenewingAnnouncementId}
          />
        )}
      </div>
    </>
  );
}

function TabButton({
  active,
  count,
  label,
  onClick,
}: {
  active: boolean;
  count: number;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative pb-4 font-semibold text-sm transition-all ${
        active
          ? 'border-primary border-b-2 text-primary'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {label} ({count})
    </button>
  );
}

interface AnnouncementGridProps {
  emptyButtonText?: string;
  emptyLink?: string;
  emptyText: string;
  hideButton?: boolean;
  items: ProviderDashboardAnnouncementItem[];
  isRenewingAnnouncementId?: string | null;
  onEdit: (ad: ProviderDashboardAnnouncementItem) => void;
  onPay?: (ad: ProviderDashboardAnnouncementItem) => void;
  onRenew?: (ad: ProviderDashboardAnnouncementItem) => void;
  onViewAnalytics: (ad: ProviderDashboardAnnouncementItem) => void;
  formatDate: (str: string | null) => string;
  formatPrice: (val: number | null) => string;
}

function AnnouncementGrid({
  emptyButtonText,
  emptyLink,
  emptyText,
  hideButton = false,
  items,
  isRenewingAnnouncementId,
  onEdit,
  onPay,
  onRenew,
  onViewAnalytics,
  formatDate,
  formatPrice,
}: AnnouncementGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.length === 0 ? (
        <ProviderDashboardAnnouncementEmptyState
          text={emptyText}
          link={emptyLink}
          buttonText={emptyButtonText}
          hideButton={hideButton}
        />
      ) : (
        items.map((ad) => (
          <ProviderDashboardAnnouncementCard
            key={ad.id}
            ad={ad}
            onEdit={() => onEdit(ad)}
            onPay={onPay ? () => onPay(ad) : undefined}
            onRenew={onRenew ? () => onRenew(ad) : undefined}
            isRenewing={isRenewingAnnouncementId === ad.id}
            formatDate={formatDate}
            formatPrice={formatPrice}
            onViewAnalytics={() => onViewAnalytics(ad)}
          />
        ))
      )}
    </div>
  );
}
