import { describe, expect, test } from 'bun:test';
import { ModerationAnnouncementsQueue } from './-moderation-announcements-queue';

const activeAnnouncement = {
  category: 'Serviços',
  description: 'Descrição do anúncio moderado.',
  flaggedForReview: true,
  id: 'announcement-1',
  imageUrl: 'https://example.com/announcement.jpg',
  providerName: 'Provider Example',
  status: 'ACTIVE',
  suspensionReason: null,
  title: 'Anúncio Moderado',
};

const suspendedAnnouncement = {
  ...activeAnnouncement,
  flaggedForReview: false,
  id: 'announcement-2',
  status: 'SUSPENDED',
  suspensionReason: 'Contato indevido',
  title: 'Anúncio Suspenso',
};

const t = (key: string) => key;

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

const findElement = (
  node: unknown,
  predicate: (element: {
    props?: { [key: string]: unknown };
    type?: unknown;
  }) => boolean,
): { props?: { [key: string]: unknown }; type?: unknown } | null => {
  if (!node) return null;
  const element = node as {
    props?: { [key: string]: unknown };
    type?: unknown;
  };
  if (predicate(element)) return element;

  if (
    typeof node === 'object' &&
    node !== null &&
    'type' in node &&
    typeof element.type === 'function'
  ) {
    const evaluated = (
      node as { props?: unknown; type: (props?: unknown) => unknown }
    ).type((node as { props?: unknown }).props);
    const found = findElement(evaluated, predicate);
    if (found) return found;
  }

  const children = element.props?.children;
  if (!children) return null;
  for (const child of Array.isArray(children) ? children : [children]) {
    const found = findElement(child, predicate);
    if (found) return found;
  }
  return null;
};

describe('ModerationAnnouncementsQueue', () => {
  test('renders moderated announcements and flagged state', () => {
    const tree = ModerationAnnouncementsQueue({
      announcements: [activeAnnouncement],
      isSuspendingId: null,
      reinstatePending: false,
      suspensionReason: '',
      suspendPending: false,
      t,
      onCancelSuspend: () => {},
      onConfirmReinstate: () => {},
      onConfirmSuspend: () => {},
      onOpenSuspend: () => {},
      onSuspensionReasonChange: () => {},
    });

    expect(
      findElement(tree, (element) =>
        textContent(element).includes('Anúncio Moderado'),
      ),
    ).toBeTruthy();
    expect(
      findElement(tree, (element) =>
        textContent(element).includes('Provider Example'),
      ),
    ).toBeTruthy();
    expect(
      findElement(tree, (element) =>
        textContent(element).includes('Alterado recentemente'),
      ),
    ).toBeTruthy();
  });

  test('renders suspended announcement details and reinstate action', () => {
    const tree = ModerationAnnouncementsQueue({
      announcements: [suspendedAnnouncement],
      isSuspendingId: null,
      reinstatePending: false,
      suspensionReason: '',
      suspendPending: false,
      t,
      onCancelSuspend: () => {},
      onConfirmReinstate: () => {},
      onConfirmSuspend: () => {},
      onOpenSuspend: () => {},
      onSuspensionReasonChange: () => {},
    });

    expect(
      findElement(tree, (element) =>
        textContent(element).includes('Motivo da Suspensão:'),
      ),
    ).toBeTruthy();
    expect(
      findElement(tree, (element) =>
        textContent(element).includes('Contato indevido'),
      ),
    ).toBeTruthy();
    expect(
      findElement(tree, (element) =>
        textContent(element).includes('Reabilitar Anúncio'),
      ),
    ).toBeTruthy();
  });
});
