import { beforeEach, describe, expect, mock, test } from 'bun:test';
import * as RealRouter from '@tanstack/react-router';
import { fireEvent, render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';

// Complete router mock (spreads the real module so no named export is dropped
// for other files) with a navigate spy so card-click navigation is assertable.
const navigate = mock(() => {});
mock.module('@tanstack/react-router', () => ({
  ...RealRouter,
  // biome-ignore lint/suspicious/noExplicitAny: test boundary stub
  Link: (props: any) => {
    const { to, hash, search, params, children, ...rest } = props;
    return createElement(
      'a',
      {
        ...rest,
        'data-to': to,
        'data-hash': hash,
        'data-params': params ? JSON.stringify(params) : undefined,
        'data-search': search ? JSON.stringify(search) : undefined,
      },
      children,
    );
  },
  useNavigate: () => navigate,
  Outlet: () => null,
}));

const { AnnouncementCard } = await import('./announcement-card');
const { AnnouncementDashboardCard } = await import(
  './announcement-dashboard-card'
);
const { AnnouncementPresentationPrimitive } = await import(
  './announcement-presentation-primitive'
);

// biome-ignore lint/suspicious/noExplicitAny: fixture mirrors API payload
function renderCard(props: any) {
  return render(
    <I18nextProvider i18n={i18n}>
      <AnnouncementCard {...props} />
    </I18nextProvider>,
  );
}

describe('AnnouncementCard', () => {
  beforeEach(async () => {
    navigate.mockClear();
    await i18n.changeLanguage('pt');
  });

  const mockAd = {
    id: 'ann-123',
    providerId: 'prov-456',
    providerAssignmentId: 'assignment-123',
    condominiumId: 'condo-789',
    condoName: 'Condominio Central',
    condoCity: 'Florianópolis',
    condoState: 'SC',
    condoNeighborhood: 'Centro',
    title: 'Awesome Pizza Delivery',
    subtitle: 'Best artisan pizza in town',
    description: 'We deliver fresh and delicious pizza directly to your door.',
    priceCents: 4500,
    imageUrl: 'pizza.jpg',
    category: 'Alimentação',
    categoryId: 'cat-1',
    tags: [],
    cta: {
      primary: null,
      secondary: [],
    },
    contact: {
      mode: 'inherit' as const,
      custom: null,
    },
    contactLinks: {
      whatsapp: '5548999999999',
      phone: '4833333333',
      email: 'pizza@test.com',
    },
    showVerifiedBadge: true,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    providerName: 'John Pizza',
    providerAvatarUrl: 'avatar.jpg',
  };

  test('renders basic card content', () => {
    const { container } = renderCard({ ad: mockAd });
    expect(screen.getByText('Awesome Pizza Delivery')).toBeTruthy();
    expect(screen.getByText('Best artisan pizza in town')).toBeTruthy();
    expect(container.textContent).toContain('45,00');
    expect(screen.getByText('John Pizza')).toBeTruthy();
  });

  test('navigates to detail page on card click', () => {
    renderCard({ ad: mockAd });
    fireEvent.click(screen.getByRole('button', { name: /Awesome Pizza/ }));
    expect(navigate).toHaveBeenCalled();
  });

  test('does not navigate to detail page when clicking contact button', () => {
    const onContactClick = mock(() => {});
    const { container } = renderCard({ ad: mockAd, onContactClick });

    const whatsappLink = container.querySelector(
      'a[href="https://wa.me/5548999999999"]',
    );
    expect(whatsappLink).toBeTruthy();

    fireEvent.click(whatsappLink as Element);
    expect(navigate).not.toHaveBeenCalled();
    expect(onContactClick).toHaveBeenCalled();
  });

  test('shows the verified resident stamp only under the hybrid gate', () => {
    const { container, rerender } = renderCard({ ad: mockAd });
    expect(
      screen.getByLabelText('Morador verificado em Condominio Central'),
    ).toBeTruthy();
    expect(container.textContent).toContain('Condominio Central');

    rerender(
      <I18nextProvider i18n={i18n}>
        <AnnouncementCard
          ad={{
            ...mockAd,
            showVerifiedBadge: false,
          }}
        />
      </I18nextProvider>,
    );
    expect(
      screen.queryByLabelText('Morador verificado em Condominio Central'),
    ).toBeNull();

    rerender(
      <I18nextProvider i18n={i18n}>
        <AnnouncementCard
          ad={{
            ...mockAd,
            providerAssignmentId: null,
          }}
        />
      </I18nextProvider>,
    );
    expect(
      screen.queryByLabelText('Morador verificado em Condominio Central'),
    ).toBeNull();
  });

  test('displays correct location/proximity text based on confidence rules', () => {
    // 1. Confirmed condominium
    const condo = renderCard({
      ad: mockAd,
      selectedCondo: { id: 'condo-789', name: 'Condominio Central' },
    });
    expect(condo.container.textContent).toContain('No seu condomínio');
    condo.unmount();

    const adWithCoords = {
      ...mockAd,
      latitude: '-27.5969',
      longitude: '-48.5495',
    };

    // 2. Fresh GPS (approximate distance shown)
    const gps = renderCard({
      ad: adWithCoords,
      visitorCoords: { latitude: -27.5969, longitude: -48.5495 },
      isGpsFresh: true,
    });
    expect(gps.container.textContent).toContain('A 0.0 km');
    gps.unmount();

    // 3. Stored GPS while refreshing/stale (no distance)
    const refreshing = renderCard({
      ad: adWithCoords,
      visitorCoords: { latitude: -27.5969, longitude: -48.5495 },
      isGpsFresh: false,
    });
    expect(refreshing.container.textContent).toContain(
      'Florianópolis - Centro',
    );
    refreshing.unmount();

    // 4. IP Fallback
    const ip = renderCard({ ad: mockAd, hasIpFallback: true });
    expect(ip.container.textContent).toContain(
      'Região aproximada (Florianópolis)',
    );
    ip.unmount();

    // 5. No signal
    const none = renderCard({ ad: mockAd });
    expect(none.container.textContent).toContain('Florianópolis - Centro');
  });

  test('provider link click stops propagation and does not trigger detail navigation', () => {
    const { container } = renderCard({ ad: mockAd });
    const providerLink = container.querySelector(
      'a[href="/providers/prov-456"]',
    );
    expect(providerLink).toBeTruthy();

    fireEvent.click(providerLink as Element);
    expect(navigate).not.toHaveBeenCalled();
  });

  test('fallback sequence: prefers WhatsApp over phone and email', () => {
    const { container } = renderCard({ ad: mockAd });
    expect(
      container.querySelector('a[href="https://wa.me/5548999999999"]'),
    ).toBeTruthy();
    expect(container.textContent).toContain('WhatsApp');
  });

  test('prefers a configured CTA over the WhatsApp contact fallback', () => {
    const adWithCta = {
      ...mockAd,
      cta: {
        primary: { type: 'website', value: 'https://menu.example.com' },
        secondary: [],
      },
    };
    const { container } = renderCard({ ad: adWithCta });
    expect(
      container.querySelector('a[href="https://menu.example.com"]'),
    ).toBeTruthy();
    expect(
      container.querySelector('a[href="https://wa.me/5548999999999"]'),
    ).toBeNull();
  });

  test('falls back to WhatsApp when no CTA primary is present', () => {
    const adNoCta = { ...mockAd, cta: { primary: null, secondary: [] } };
    const { container } = renderCard({ ad: adNoCta });
    expect(
      container.querySelector('a[href="https://wa.me/5548999999999"]'),
    ).toBeTruthy();
  });

  test('fallback sequence: uses phone when WhatsApp is missing', () => {
    const adPhoneOnly = {
      ...mockAd,
      contactLinks: {
        whatsapp: '',
        phone: '4833333333',
        email: 'pizza@test.com',
      },
    };
    const { container } = renderCard({ ad: adPhoneOnly });
    expect(container.querySelector('a[href="tel:4833333333"]')).toBeTruthy();
    expect(container.textContent).toContain('Ligar');
    expect(container.textContent).not.toContain('WhatsApp');
  });

  test('fallback sequence: uses email when WhatsApp and phone are missing', () => {
    const adEmailOnly = {
      ...mockAd,
      contactLinks: { whatsapp: '', phone: '', email: 'pizza@test.com' },
    };
    const { container } = renderCard({ ad: adEmailOnly });
    expect(
      container.querySelector('a[href="mailto:pizza@test.com"]'),
    ).toBeTruthy();
    expect(container.textContent).toContain('Email');
  });

  test('fallback sequence: uses Detalhes button when all contacts are missing', () => {
    const adNoContact = {
      ...mockAd,
      contactLinks: { whatsapp: '', phone: '', email: '' },
    };
    const { container } = renderCard({ ad: adNoContact });
    expect(container.textContent).toContain('Detalhes');
  });
});

describe('AnnouncementPresentationPrimitive variant dispatch', () => {
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
    cta: {
      primary: null,
      secondary: [],
    },
    contact: {
      mode: 'inherit' as const,
      custom: null,
    },
    contactLinks: { whatsapp: '', phone: '', email: '' },
    showVerifiedBadge: false,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    providerName: 'Provider A',
    providerAvatarUrl: null,
  };

  const mockDashAd = {
    id: 'dash-1',
    title: 'Dashboard Ad',
    description: 'Dash desc.',
    imageUrl: 'dash.jpg',
    category: 'Services',
    condoName: 'Condo B',
    priceCents: null,
    expiresAt: null,
    status: 'ACTIVE' as const,
    flaggedForReview: false,
    showVerifiedBadge: false,
    suspensionReason: null,
  };

  test('public-card variant dispatches to AnnouncementCard', () => {
    const result = AnnouncementPresentationPrimitive({
      variant: 'public-card',
      // biome-ignore lint/suspicious/noExplicitAny: fixture
      ad: mockPublicAd as any,
    });
    expect(result.type).toBe(AnnouncementCard);
  });

  test('dashboard-card variant dispatches to AnnouncementDashboardCard', () => {
    const result = AnnouncementPresentationPrimitive({
      variant: 'dashboard-card',
      ad: mockDashAd,
      formatDate: (s) => s ?? '-',
      formatPrice: () => 'R$ 0,00',
      onEdit: () => {},
    });
    expect(result.type).toBe(AnnouncementDashboardCard);
  });

  test('detail-header variant renders announcement title', () => {
    const primitive = AnnouncementPresentationPrimitive({
      variant: 'detail-header',
      announcement: {
        title: 'Detail Header Title',
        imageUrl: 'header.jpg',
        status: 'ACTIVE',
        flaggedForReview: false,
        showVerifiedBadge: false,
        subtitle: null,
      },
    });
    render(<I18nextProvider i18n={i18n}>{primitive}</I18nextProvider>);
    expect(screen.getByText('Detail Header Title')).toBeTruthy();
  });
});
