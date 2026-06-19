import { DeleteUserAccount } from '../../application/use-cases/user/delete-user-account';
import {
  GetPublicProviderProfile,
  type GetPublicProviderProfileInput,
  type PublicProviderProfileResult,
} from '../../application/use-cases/user/get-public-provider-profile';
import {
  GetUserAccessProfile,
  type GetUserAccessProfileInput,
  type UserAccessProfileResult,
} from '../../application/use-cases/user/get-user-access-profile';
import {
  GetUserProfile,
  type GetUserProfileInput,
} from '../../application/use-cases/user/get-user-profile';
import {
  UpdateUser,
  type UpdateUserInput,
} from '../../application/use-cases/user/update-user';
import { DrizzleAnnouncementRepository } from '../../infrastructure/db/announcement-repository';
import { DrizzleAssignmentRepository } from '../../infrastructure/db/assignment-repository';
import { DrizzleUserRepository } from '../../infrastructure/db/user-repository';

export interface UserRouterDependencies {
  deleteUserAccountUseCase: {
    execute(input: { userId: string }): Promise<void>;
  };
  getPublicProviderProfileUseCase: {
    execute(
      input: GetPublicProviderProfileInput,
    ): Promise<PublicProviderProfileResult>;
  };
  getUserAccessProfileUseCase: {
    execute(input: GetUserAccessProfileInput): Promise<UserAccessProfileResult>;
  };
  getUserProfileUseCase: {
    execute(input: GetUserProfileInput): Promise<{
      id: string;
      name: string;
      email: string;
      phone: string | null;
      image: string | null;
      language: string;
      theme: string;
      emailVerified: boolean;
    }>;
  };
  updateUserUseCase: {
    execute(input: UpdateUserInput): Promise<{ success: boolean }>;
  };
}

export function createUserRouterDependencies(): UserRouterDependencies {
  const userRepo = new DrizzleUserRepository();
  const assignmentRepo = new DrizzleAssignmentRepository();
  const announcementRepo = new DrizzleAnnouncementRepository();

  return {
    deleteUserAccountUseCase: new DeleteUserAccount(userRepo),
    getPublicProviderProfileUseCase: new GetPublicProviderProfile(
      userRepo,
      assignmentRepo,
      announcementRepo,
    ),
    getUserAccessProfileUseCase: new GetUserAccessProfile(assignmentRepo),
    getUserProfileUseCase: new GetUserProfile(userRepo),
    updateUserUseCase: new UpdateUser(userRepo),
  };
}
