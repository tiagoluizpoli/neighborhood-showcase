import { describe, expect, mock, test } from 'bun:test';

mock.module('@tanstack/react-router', () => ({
  Link: (props: { children?: unknown; [key: string]: unknown }) => ({
    type: 'a',
    props,
  }),
}));

import type { ProviderDashboardAnnouncementItem } from './-provider-dashboard-types';

const baseAd: ProviderDashboardAnnouncementItem = {
  id: 'ad-1',
  title: 'Bolos caseiros',
  description: 'Bolos sob encomenda para festas e aniversários.',
  imageUrl: 'https://example.com/image.jpg',
  category: 'Doces',
  condoName: 'Residencial Aurora',
  status: 'ACTIVE',
  flaggedForReview: false,
  showVerifiedBadge: true,
  priceCents: 4500,
  expiresAt: '2026-06-30T12:00:00.000Z',
  suspensionReason: null,
};

type TestNode = {
  props?: {
    children?: unknown;
    [key: string]: unknown;
  };
  type?: unknown;
};

const findElement = (
  node: unknown,
  predicate: (el: TestNode) => boolean,
): TestNode | null => {
  if (!node) return null;
  if (predicate(node as TestNode)) return node as TestNode;
  if (
    typeof node === 'object' &&
    node !== null &&
    'type' in node &&
    typeof (node as TestNode).type === 'function'
  ) {
    try {
      const evaluated = (node as TestNode).type?.((node as TestNode).props);
      const found = findElement(evaluated, predicate);
      if (found) return found;
    } catch (_error) {}
  }
  const children =
    typeof node === 'object' && node !== null
      ? (node as TestNode).props?.children
      : null;
  if (children) {
    const items = Array.isArray(children) ? children : [children];
    for (const child of items) {
      const found = findElement(child, predicate);
      if (found) return found;
    }
  }
  return null;
};

const textContent = (node: unknown): string => {
  if (!node) return '';
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (typeof node !== 'object' || node === null) return '';
  const children = (node as TestNode).props?.children;
  if (!children) return '';
  if (Array.isArray(children)) {
    return children.map((child) => textContent(child)).join('');
  }
  return textContent(children);
};

const {
  ProviderDashboardAnnouncementCard,
  ProviderDashboardAnnouncementEmptyState,
} = await import('./-provider-dashboard-announcement-card');

describe('ProviderDashboardAnnouncementCard', () => {
  test('renders public detail, analytics, and edit actions', () => {
    const tree = ProviderDashboardAnnouncementCard({
      ad: baseAd,
      formatDate: (date) => date ?? '-',
      formatPrice: (value) => (value ? 'R$ 45,00' : 'A combinar'),
      onEdit: () => {},
      onViewAnalytics: () => {},
    });

    expect(
      findElement(tree, (element) => element.props?.title === 'Editar Anúncio'),
    ).toBeTruthy();
    expect(
      findElement(
        tree,
        (element) =>
          element.props?.to === '/anuncios/$id' &&
          textContent(element).includes('Ver Detalhes'),
      ),
    ).toBeTruthy();
    expect(
      findElement(tree, (element) =>
        textContent(element).includes('Ver Métricas'),
      ),
    ).toBeTruthy();
  });

  test('renders the publish CTA for draft ads', () => {
    const tree = ProviderDashboardAnnouncementCard({
      ad: { ...baseAd, status: 'DRAFT', showVerifiedBadge: false },
      formatDate: (date) => date ?? '-',
      formatPrice: () => 'A combinar',
      onEdit: () => {},
      onPay: () => {},
    });

    expect(
      findElement(tree, (element) =>
        textContent(element).includes('Publicar Anúncio'),
      ),
    ).toBeTruthy();
  });

  test('renders the empty state link when available', () => {
    const tree = ProviderDashboardAnnouncementEmptyState({
      text: 'Nenhum anúncio ativo no momento.',
      link: '/panel/dashboard/anuncios/novo',
      buttonText: 'Criar Anúncio',
    });

    expect(
      findElement(
        tree,
        (element) =>
          element.props?.children === 'Nenhum anúncio ativo no momento.',
      ),
    ).toBeTruthy();
    expect(
      findElement(tree, (element) =>
        textContent(element).includes('Criar Anúncio'),
      ),
    ).toBeTruthy();
  });
});
