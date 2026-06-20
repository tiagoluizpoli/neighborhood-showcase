import { createFileRoute, Outlet } from '@tanstack/react-router';
import { requireModeratorAccess } from '@/lib/moderation-guard';

/**
 * Layout for the moderation area. Guards access once for every section and
 * exposes the moderator context to child routes; the sections render through
 * the Outlet. The bare `/panel/moderation` path is handled by the index route.
 */
export const Route = createFileRoute('/panel/moderation')({
  beforeLoad: () => requireModeratorAccess(),
  component: () => <Outlet />,
});
