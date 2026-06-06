import { describe, expect, test } from 'bun:test';
import type { ProviderDashboardAnnouncementItem } from './-provider-dashboard-types';

const { ProviderDashboardAnnouncementList } = await import(
  './-provider-dashboard-announcement-list'
);

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

const findElement = (
  node: unknown,
  predicate: (el: {
    props?: { [key: string]: unknown };
    type?: unknown;
  }) => boolean,
): { props?: { [key: string]: unknown }; type?: unknown } | null => {
  if (!node) return null;
  if (
    predicate(node as { props?: { [key: string]: unknown }; type?: unknown })
  ) {
    return node as { props?: { [key: string]: unknown }; type?: unknown };
  }
  if (
    typeof node === 'object' &&
    node !== null &&
    'type' in node &&
    typeof (node as { type?: unknown }).type === 'function'
  ) {
    try {
      const evaluated = (
        node as { type: (props?: unknown) => unknown; props?: unknown }
      ).type?.((node as { props?: unknown }).props);
      const found = findElement(evaluated, predicate);
      if (found) return found;
    } catch (_error) {}
  }
  const children =
    typeof node === 'object' && node !== null
      ? (node as { props?: { children?: unknown } }).props?.children
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
  const children = (node as { props?: { children?: unknown } }).props?.children;
  if (!children) return '';
  if (Array.isArray(children)) {
    return children.map((child) => textContent(child)).join('');
  }
  return textContent(children);
};

describe('ProviderDashboardAnnouncementList', () => {
  test('renders tabs and draft empty state', () => {
    const tree = ProviderDashboardAnnouncementList({
      activeTab: 'draft',
      announcements: {
        active: [baseAd],
        draft: [],
        expired: [],
        suspended: [],
      },
      formatDate: (date) => date ?? '-',
      formatPrice: () => 'A combinar',
      onActiveTabChange: () => {},
      onEdit: () => {},
      onPay: () => {},
      onRenew: () => {},
      onViewAnalytics: () => {},
    });

    expect(
      findElement(tree, (element) => textContent(element).includes('Ativos')),
    ).toBeTruthy();
    expect(
      findElement(tree, (element) =>
        textContent(element).includes('Nenhum rascunho ou pagamento pendente.'),
      ),
    ).toBeTruthy();
    expect(
      findElement(tree, (element) =>
        textContent(element).includes('Criar Anúncio'),
      ),
    ).toBeTruthy();
  });
});
