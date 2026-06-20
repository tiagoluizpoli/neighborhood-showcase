import { createFileRoute, redirect } from '@tanstack/react-router';
import type { ModeratorRouteContext } from '@/lib/moderation-guard';

/**
 * `/panel/moderation` has no content of its own — send moderators to their
 * condo-scoped residents queue, and system managers without a condo straight
 * to the cross-condo reports queue. Reads the moderator context resolved by the
 * parent layout guard.
 */
export const Route = createFileRoute('/panel/moderation/')({
  beforeLoad: ({ context }) => {
    const { moderatorAssignments } = context as ModeratorRouteContext;
    throw redirect({
      to:
        moderatorAssignments.length > 0
          ? '/panel/moderation/residents'
          : '/panel/moderation/reports',
    });
  },
});
