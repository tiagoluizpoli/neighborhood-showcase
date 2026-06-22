import { beforeEach, describe, expect, test } from 'bun:test';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import {
  ProviderDashboardAnnouncementCard,
  ProviderDashboardAnnouncementEmptyState,
} from './-provider-dashboard-announcement-card';
import type { ProviderDashboardAnnouncementItem } from './-provider-dashboard-types';
import i18n from '@/i18n';

// Real router (global test-setup stub renders Link as a real <a data-to>) + real
// i18n. The previous partial `@tanstack/react-router` mock returned plain
// `{type, props}` objects which, under bun's process-global `mock.module`,
// poisoned every other file rendering a real <Link>.

const baseAd: ProviderDashboardAnnouncementItem = {
  id: 'ad-1',
  title: 'Bolos caseiros',
  subtitle: null,
  description: 'Bolos sob encomenda para festas e aniversários.',
  priceCents: 4500,
  imageUrl: 'https://example.com/image.jpg',
  category: 'Doces',
  categoryId: 'cat-1',
  tags: [],
  contact: { mode: 'inherit', custom: null },
  cta: { primary: null, secondary: [] },
  contactLinks: {},
  showVerifiedBadge: true,
  flaggedForReview: false,
  status: 'ACTIVE',
  paidAt: null,
  expiresAt: '2026-06-30T12:00:00.000Z',
  createdAt: '2026-06-01T12:00:00.000Z',
  suspensionReason: null,
  condoName: 'Residencial Aurora',
  providerAssignmentId: null,
};

// biome-ignore lint/suspicious/noExplicitAny: test feeds partial props
function renderCard(props: any) {
  return render(
    <I18nextProvider i18n={i18n}>
      <ProviderDashboardAnnouncementCard {...props} />
    </I18nextProvider>,
  );
}

describe('ProviderDashboardAnnouncementCard', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('pt');
  });

  test('renders public detail, analytics, and edit actions', () => {
    const { container } = renderCard({
      ad: baseAd,
      formatDate: (date: string | null) => date ?? '-',
      formatPrice: (value: number | null) =>
        value ? 'R$ 45,00' : 'A combinar',
      onEdit: () => {},
      onViewAnalytics: () => {},
    });

    expect(screen.getByTitle('Editar Anúncio')).toBeTruthy();
    const detailLink = container.querySelector('a[data-to="/anuncios/$id"]');
    expect(detailLink).toBeTruthy();
    expect(detailLink?.textContent).toContain('Ver Detalhes');
    expect(screen.getByText('Ver Métricas')).toBeTruthy();
  });

  test('renders the publish CTA for draft ads', () => {
    renderCard({
      ad: { ...baseAd, status: 'DRAFT', showVerifiedBadge: false },
      formatDate: (date: string | null) => date ?? '-',
      formatPrice: () => 'A combinar',
      onEdit: () => {},
      onPay: () => {},
    });

    expect(screen.getByText('Publicar Anúncio')).toBeTruthy();
  });

  test('renders the ad as a dashboard card', () => {
    renderCard({
      ad: baseAd,
      formatDate: (date: string | null) => date ?? '-',
      formatPrice: () => 'R$ 0,00',
      onEdit: () => {},
    });
    expect(screen.getByText('Bolos caseiros')).toBeTruthy();
  });

  test('renders the empty state link when available', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <ProviderDashboardAnnouncementEmptyState
          text="Nenhum anúncio ativo no momento."
          link="/panel/dashboard/announcements/new"
          buttonText="Criar Anúncio"
        />
      </I18nextProvider>,
    );
    expect(screen.getByText('Nenhum anúncio ativo no momento.')).toBeTruthy();
    expect(screen.getByText('Criar Anúncio')).toBeTruthy();
  });
});
