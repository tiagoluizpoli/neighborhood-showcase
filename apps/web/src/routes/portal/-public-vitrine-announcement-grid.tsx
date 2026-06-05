import { Button } from '@neighborhood-showcase/ui/components/button';
import type { ComponentProps, ReactNode } from 'react';
import { AnnouncementCard } from '@/components/announcement-card';
import { AnnouncementCardSkeleton } from '@/components/announcement-card-skeleton';

type PublicAnnouncement = ComponentProps<typeof AnnouncementCard>['ad'];
type PublicSelectedCondo = ComponentProps<
  typeof AnnouncementCard
>['selectedCondo'];
type PublicVisitorCoords = ComponentProps<
  typeof AnnouncementCard
>['visitorCoords'];
type PublicContactClickHandler = ComponentProps<
  typeof AnnouncementCard
>['onContactClick'];

interface ResolvePublicVitrineAnnouncementGridStateParams {
  announcements?: ReadonlyArray<PublicAnnouncement>;
  isError: boolean;
  isLoading: boolean;
}

type PublicVitrineAnnouncementGridState =
  | { kind: 'error' }
  | { kind: 'loading' }
  | { announcements: ReadonlyArray<PublicAnnouncement>; kind: 'results' }
  | { kind: 'empty' };

interface PublicVitrineAnnouncementGridProps
  extends ResolvePublicVitrineAnnouncementGridStateParams {
  emptyState: ReactNode;
  hasIpFallback: boolean;
  isGpsFresh: boolean;
  onContactClick: PublicContactClickHandler;
  onRetry: () => void;
  selectedCondo: PublicSelectedCondo;
  visitorCoords: PublicVisitorCoords;
}

export const resolvePublicVitrineAnnouncementGridState = ({
  announcements,
  isError,
  isLoading,
}: ResolvePublicVitrineAnnouncementGridStateParams): PublicVitrineAnnouncementGridState => {
  if (isError) {
    return { kind: 'error' };
  }

  if (isLoading) {
    return { kind: 'loading' };
  }

  if (announcements && announcements.length > 0) {
    return { announcements, kind: 'results' };
  }

  return { kind: 'empty' };
};

export function PublicVitrineAnnouncementGrid(
  props: PublicVitrineAnnouncementGridProps,
) {
  const state = resolvePublicVitrineAnnouncementGridState(props);

  if (state.kind === 'error') {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 py-20 text-center">
        <p className="font-semibold text-destructive text-lg">
          Não conseguimos carregar os anúncios agora.
        </p>
        <Button onClick={props.onRetry} variant="outline" className="mt-4">
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (state.kind === 'loading') {
    return (
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <AnnouncementCardSkeleton key={`announcement-skeleton-${index}`} />
        ))}
      </div>
    );
  }

  if (state.kind === 'results') {
    return (
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {state.announcements.map((announcement) => (
          <AnnouncementCard
            key={announcement.id}
            ad={announcement}
            selectedCondo={props.selectedCondo}
            visitorCoords={props.visitorCoords}
            isGpsFresh={props.isGpsFresh}
            hasIpFallback={props.hasIpFallback}
            onContactClick={props.onContactClick}
          />
        ))}
      </div>
    );
  }

  return props.emptyState;
}
