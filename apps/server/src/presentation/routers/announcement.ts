import { createAnnouncementRouterDependencies } from '../../main/di';
import { router } from '../trpc';
import { createModerationAnnouncementRouter } from './announcement/moderation';
import { createProviderAnnouncementRouter } from './announcement/provider';
import { createPublicAnnouncementRouter } from './announcement/public';

export function createAnnouncementRouter(
  dependencies = createAnnouncementRouterDependencies(),
) {
  return router({
    ...createPublicAnnouncementRouter(dependencies),
    ...createProviderAnnouncementRouter(dependencies),
    ...createModerationAnnouncementRouter(dependencies),
  });
}

export const announcementRouter = createAnnouncementRouter();
