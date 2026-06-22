import { describe, expect, test } from 'bun:test';
import { render } from '@testing-library/react';
import { ModerationReportsQueue } from './-moderation-reports-queue';

// RTL render against happy-dom. `t`/`getReasonLabel` are injected props (echo the
// key), so no i18n provider is needed; the details dialog renders `open` into a
// base-ui PORTAL, so assertions read `document.body.textContent`.

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

const noop = () => {};

const baseProps = {
  banPending: false,
  banReason: '',
  dismissReportsPending: false,
  getReasonLabel: (reasonKey: string) => reasonKey,
  isBanningUserId: null,
  isSuspendingId: null,
  isSystemManager: true,
  reportedAnnouncements: [reportedAnnouncement],
  selectedAdForReports: undefined,
  suspensionReason: '',
  suspendPending: false,
  t: (key: string) => key,
  viewingReportsAdId: null,
  onBanReasonChange: noop,
  onCancelBan: noop,
  onCancelSuspend: noop,
  onCloseDetails: noop,
  onConfirmBan: noop,
  onConfirmDismiss: noop,
  onConfirmSuspend: noop,
  onOpenBan: noop,
  onOpenDetails: noop,
  onOpenSuspend: noop,
  onSuspensionReasonChange: noop,
};

function renderQueue(overrides: Record<string, unknown>) {
  // biome-ignore lint/suspicious/noExplicitAny: test feeds partial/echoed props
  const props = { ...baseProps, ...overrides } as any;
  return render(<ModerationReportsQueue {...props} />);
}

describe('ModerationReportsQueue', () => {
  test('renders the reported announcement summary and manager-only action', () => {
    renderQueue({ isSystemManager: true });
    const text = document.body.textContent ?? '';
    expect(text).toContain('Reported Ad');
    expect(text).toContain('Provider Example');
    expect(text).toContain('FRAUDE_GOLPE: 2');
    expect(text).toContain('moderation.ban');
  });

  test('renders the details dialog when a reported announcement is selected', () => {
    renderQueue({
      isSystemManager: false,
      selectedAdForReports: reportedAnnouncement,
      viewingReportsAdId: reportedAnnouncement.id,
    });
    const text = document.body.textContent ?? '';
    expect(text).toContain('Reporter Example');
    expect(text).toContain('reporter@example.com');
  });
});
