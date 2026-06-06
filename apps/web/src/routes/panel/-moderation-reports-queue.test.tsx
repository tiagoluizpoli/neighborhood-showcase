import { describe, expect, test } from 'bun:test';
import { ModerationReportsQueue } from './-moderation-reports-queue';

const reportedAnnouncement = {
  id: 'reported-ad-1',
  imageUrl: 'https://example.com/ad.jpg',
  providerEmail: 'provider@example.com',
  providerId: 'provider-1',
  providerName: 'Provider Example',
  reasonBreakdown: {
    ASSEDIO_OFENSIVO: 1,
    FRAUDE_GOLPE: 2,
    OUTROS: 0,
    SERVICO_ILEGAL: 0,
    SPAM: 0,
  },
  reports: [
    {
      createdAt: '2026-06-05T12:00:00.000Z',
      id: 'report-1',
      reason: 'FRAUDE_GOLPE',
      reporterEmail: 'reporter@example.com',
      reporterName: 'Reporter Example',
    },
  ],
  status: 'ACTIVE',
  title: 'Reported Ad',
  totalReports: 3,
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

describe('ModerationReportsQueue', () => {
  test('renders the reported announcement summary and manager-only action', () => {
    const tree = ModerationReportsQueue({
      banPending: false,
      banReason: '',
      dismissReportsPending: false,
      getReasonLabel: (reasonKey) => reasonKey,
      isBanningUserId: null,
      isSuspendingId: null,
      isSystemManager: true,
      reportedAnnouncements: [reportedAnnouncement],
      selectedAdForReports: undefined,
      suspensionReason: '',
      suspendPending: false,
      t,
      viewingReportsAdId: null,
      onBanReasonChange: () => {},
      onCancelBan: () => {},
      onCancelSuspend: () => {},
      onCloseDetails: () => {},
      onConfirmBan: () => {},
      onConfirmDismiss: () => {},
      onConfirmSuspend: () => {},
      onOpenBan: () => {},
      onOpenDetails: () => {},
      onOpenSuspend: () => {},
      onSuspensionReasonChange: () => {},
    });

    expect(
      findElement(tree, (element) =>
        textContent(element).includes('Reported Ad'),
      ),
    ).toBeTruthy();
    expect(
      findElement(tree, (element) =>
        textContent(element).includes('Provider Example'),
      ),
    ).toBeTruthy();
    expect(
      findElement(tree, (element) =>
        textContent(element).includes('FRAUDE_GOLPE: 2'),
      ),
    ).toBeTruthy();
    expect(
      findElement(tree, (element) =>
        textContent(element).includes('moderation.ban'),
      ),
    ).toBeTruthy();
  });

  test('renders the details dialog when a reported announcement is selected', () => {
    const tree = ModerationReportsQueue({
      banPending: false,
      banReason: '',
      dismissReportsPending: false,
      getReasonLabel: (reasonKey) => reasonKey,
      isBanningUserId: null,
      isSuspendingId: null,
      isSystemManager: false,
      reportedAnnouncements: [reportedAnnouncement],
      selectedAdForReports: reportedAnnouncement,
      suspensionReason: '',
      suspendPending: false,
      t,
      viewingReportsAdId: reportedAnnouncement.id,
      onBanReasonChange: () => {},
      onCancelBan: () => {},
      onCancelSuspend: () => {},
      onCloseDetails: () => {},
      onConfirmBan: () => {},
      onConfirmDismiss: () => {},
      onConfirmSuspend: () => {},
      onOpenBan: () => {},
      onOpenDetails: () => {},
      onOpenSuspend: () => {},
      onSuspensionReasonChange: () => {},
    });

    expect(
      findElement(tree, (element) =>
        textContent(element).includes('Reporter Example'),
      ),
    ).toBeTruthy();
    expect(
      findElement(tree, (element) =>
        textContent(element).includes('reporter@example.com'),
      ),
    ).toBeTruthy();
  });
});
