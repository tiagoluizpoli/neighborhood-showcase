import { beforeEach, describe, expect, test } from 'bun:test';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import {
  PublicVitrineAnnouncementGrid,
  resolvePublicVitrineAnnouncementGridState,
} from './-public-vitrine-announcement-grid';
import i18n from '@/i18n';

// Render the real grid against happy-dom with the real i18n + router (global
// test-setup stub). The previous version partial-mocked shared modules (`Button`,
// the presentation primitive, the skeleton) to return PLAIN `{type, props}`
// objects; under bun's process-global `mock.module` that poisoned every other
// file that rendered a real `<Button>`/card. Use real components instead.

const mockPublicAd = {
  id: 'pub-1',
  providerId: 'prov-1',
  condominiumId: 'condo-1',
  condoName: 'Condo Public',
  condoCity: 'City',
  condoState: 'SC',
  condoNeighborhood: 'Bairro',
  title: 'Public Ad Title',
  subtitle: null,
  description: 'Public desc.',
  priceCents: null,
  imageUrl: 'pub.jpg',
  category: 'Services',
  categoryId: 'cat-1',
  tags: [],
  contactLinks: { whatsapp: '', phone: '', email: '' },
  showVerifiedBadge: false,
  status: 'ACTIVE',
  createdAt: new Date(),
  providerName: 'Provider A',
  providerAvatarUrl: null,
  // biome-ignore lint/suspicious/noExplicitAny: fixture mirrors API payload
} as any;

const baseGridProps = {
  isError: false,
  isLoading: false,
  // biome-ignore lint/suspicious/noExplicitAny: test slot
  emptyState: null as any,
  hasIpFallback: false,
  isGpsFresh: false,
  // biome-ignore lint/suspicious/noExplicitAny: optional handler
  onContactClick: undefined as any,
  onRetry: () => {},
  selectedCondo: null,
  visitorCoords: null,
};

// biome-ignore lint/suspicious/noExplicitAny: test feeds partial props
function renderGrid(overrides: any) {
  return render(
    <I18nextProvider i18n={i18n}>
      <PublicVitrineAnnouncementGrid {...baseGridProps} {...overrides} />
    </I18nextProvider>,
  );
}

describe('PublicVitrineAnnouncementGrid', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('pt');
  });

  test('results state renders each announcement as a public card', () => {
    renderGrid({ announcements: [mockPublicAd] });
    expect(screen.getByText('Public Ad Title')).toBeTruthy();
  });

  test('loading state renders skeleton placeholders', () => {
    const { container } = renderGrid({ isLoading: true });
    expect(
      container.querySelectorAll('[data-slot="skeleton"]').length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText('Public Ad Title')).toBeNull();
  });

  test('empty state renders the emptyState slot when no announcements', () => {
    renderGrid({
      emptyState: <p>Nenhum anúncio</p>,
      announcements: [],
    });
    expect(screen.getByText('Nenhum anúncio')).toBeTruthy();
  });
});

describe('resolvePublicVitrineAnnouncementGridState', () => {
  test('returns error when isError is true', () => {
    expect(
      resolvePublicVitrineAnnouncementGridState({
        isError: true,
        isLoading: false,
        announcements: [],
      }),
    ).toEqual({ kind: 'error' });
  });

  test('returns loading when isLoading is true', () => {
    expect(
      resolvePublicVitrineAnnouncementGridState({
        isError: false,
        isLoading: true,
        announcements: undefined,
      }),
    ).toEqual({ kind: 'loading' });
  });

  test('returns results when announcements are present', () => {
    const announcements = [mockPublicAd];
    const result = resolvePublicVitrineAnnouncementGridState({
      isError: false,
      isLoading: false,
      announcements,
    });
    expect(result).toEqual({ kind: 'results', announcements });
  });

  test('returns empty when announcements array is empty', () => {
    expect(
      resolvePublicVitrineAnnouncementGridState({
        isError: false,
        isLoading: false,
        announcements: [],
      }),
    ).toEqual({ kind: 'empty' });
  });
});
