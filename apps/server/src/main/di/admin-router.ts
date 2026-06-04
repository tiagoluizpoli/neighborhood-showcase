import { AddBlacklist } from '../../application/use-cases/admin/add-blacklist';
import { ListBlacklist } from '../../application/use-cases/admin/list-blacklist';
import { RemoveBlacklist } from '../../application/use-cases/admin/remove-blacklist';
import { AssignModerator } from '../../application/use-cases/user/assign-moderator';
import { BanProvider } from '../../application/use-cases/user/ban-provider';
import { ListProviders } from '../../application/use-cases/user/list-providers';
import { ListUsers } from '../../application/use-cases/user/list-users';
import { PromoteToSystemManager } from '../../application/use-cases/user/promote-to-system-manager';
import { ToggleProviderVisibility } from '../../application/use-cases/user/toggle-provider-visibility';
import { DrizzleAnnouncementRepository } from '../../infrastructure/db/announcement-repository';
import { DrizzleAssignmentRepository } from '../../infrastructure/db/assignment-repository';
import { DrizzleBlacklistRepository } from '../../infrastructure/db/blacklist-repository';
import { DrizzleCondominiumRepository } from '../../infrastructure/db/condominium-repository';
import { DrizzleUserRepository } from '../../infrastructure/db/user-repository';

export interface AdminRouterDependencies {
  listProvidersUseCase: ListProviders;
  listUsersUseCase: ListUsers;
  promoteToSystemManagerUseCase: PromoteToSystemManager;
  assignModeratorUseCase: AssignModerator;
  toggleProviderVisibilityUseCase: ToggleProviderVisibility;
  banProviderUseCase: BanProvider;
  listBlacklistUseCase: ListBlacklist;
  addBlacklistUseCase: AddBlacklist;
  removeBlacklistUseCase: RemoveBlacklist;
}

export function createAdminRouterDependencies(): AdminRouterDependencies {
  const userRepo = new DrizzleUserRepository();
  const condoRepo = new DrizzleCondominiumRepository();
  const assignmentRepo = new DrizzleAssignmentRepository();
  const blacklistRepo = new DrizzleBlacklistRepository();
  const announcementRepo = new DrizzleAnnouncementRepository();

  return {
    listProvidersUseCase: new ListProviders(userRepo),
    listUsersUseCase: new ListUsers(userRepo),
    promoteToSystemManagerUseCase: new PromoteToSystemManager(userRepo),
    assignModeratorUseCase: new AssignModerator(
      userRepo,
      condoRepo,
      assignmentRepo,
    ),
    toggleProviderVisibilityUseCase: new ToggleProviderVisibility(userRepo),
    banProviderUseCase: new BanProvider(
      userRepo,
      blacklistRepo,
      announcementRepo,
    ),
    listBlacklistUseCase: new ListBlacklist(blacklistRepo),
    addBlacklistUseCase: new AddBlacklist(blacklistRepo),
    removeBlacklistUseCase: new RemoveBlacklist(blacklistRepo),
  };
}
