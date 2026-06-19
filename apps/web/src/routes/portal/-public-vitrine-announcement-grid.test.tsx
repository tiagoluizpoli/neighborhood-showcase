// biome-ignore-all lint/suspicious/noExplicitAny: test harness stubs module dependencies
import { describe, expect, mock, test } from 'bun:test';

mock.module('@/components/announcement-presentation-primitive', () => ({
  AnnouncementPresentationPrimitive: (props: any) => ({
    type: 'div',
    props: { 'data-variant': props.variant, variant: props.variant },
  }),
}));

mock.module('@/components/announcement-card-skeleton', () => ({
  AnnouncementCardSkeleton: () => ({ type: 'div', props: {} }),
}));

mock.module('@neighborhood-showcase/ui/components/button', () => ({
  Button: (props: any) => ({ type: 'button', props }),
}));

import {
  PublicVitrineAnnouncementGrid,
  resolvePublicVitrineAnnouncementGridState,
} from './-public-vitrine-announcement-grid';

const findByProp = (node: any, key: string, value: string): any => {
  if (node == null || typeof node !== 'object') return null;
  if (Array.isArray(node)) {
    for (const child of node) {
      const hit = findByProp(child, key, value);
      if (hit) return hit;
    }
    return null;
  }
  if (node.props?.[key] === value) return node;
  return findByProp(node.props?.children, key, value);
};

const mockAnnouncement = {
  id: 'ann-public-1',
  title: 'Public Announcement',
} as any;

const baseGridProps = {
  isError: false,
  isLoading: false,
  emptyState: null as any,
  hasIpFallback: false,
  isGpsFresh: false,
  onContactClick: undefined as any,
  onRetry: () => {},
  selectedCondo: null,
  visitorCoords: null,
};

describe('PublicVitrineAnnouncementGrid', () => {
  test('results state renders each announcement with public-card variant', () => {
    const tree = PublicVitrineAnnouncementGrid({
      ...baseGridProps,
      announcements: [mockAnnouncement],
    });
    const primEl = findByProp(tree, 'variant', 'public-card');
    expect(primEl).not.toBeNull();
  });

  test('results state does not use dashboard-card or detail-header variant', () => {
    const tree = PublicVitrineAnnouncementGrid({
      ...baseGridProps,
      announcements: [mockAnnouncement],
    });
    expect(findByProp(tree, 'variant', 'dashboard-card')).toBeNull();
    expect(findByProp(tree, 'variant', 'detail-header')).toBeNull();
  });

  test('empty state renders the emptyState slot when no announcements', () => {
    const emptySlot = { type: 'p', props: { children: 'Nenhum anúncio' } };
    const tree = PublicVitrineAnnouncementGrid({
      ...baseGridProps,
      emptyState: emptySlot,
      announcements: [],
    });
    expect(tree).toBe(emptySlot);
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
    const announcements = [mockAnnouncement];
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
