import { ApproveCondominium } from '../../application/use-cases/condominium/approve-condominium';
import { GetMyCondominium } from '../../application/use-cases/condominium/get-my-condominium';
import { ListApprovedCondominiums } from '../../application/use-cases/condominium/list-approved-condominiums';
import { ListNearbyCondominiums } from '../../application/use-cases/condominium/list-nearby-condominiums';
import { ListPendingCondominiums } from '../../application/use-cases/condominium/list-pending-condominiums';
import { RejectCondominium } from '../../application/use-cases/condominium/reject-condominium';
import { RequestCondominium } from '../../application/use-cases/condominium/request-condominium';
import { DrizzleAssignmentRepository } from '../../infrastructure/db/assignment-repository';
import { DrizzleCondominiumRepository } from '../../infrastructure/db/condominium-repository';
import { DrizzleUserRepository } from '../../infrastructure/db/user-repository';

export interface CondominiumRouterDependencies {
  requestCondoUseCase: RequestCondominium;
  approveCondoUseCase: ApproveCondominium;
  rejectCondoUseCase: RejectCondominium;
  getMyCondoUseCase: GetMyCondominium;
  listApprovedCondoUseCase: ListApprovedCondominiums;
  listNearbyCondoUseCase: ListNearbyCondominiums;
  listPendingCondoUseCase: ListPendingCondominiums;
}

export function createCondominiumRouterDependencies(): CondominiumRouterDependencies {
  const condoRepo = new DrizzleCondominiumRepository();
  const assignmentRepo = new DrizzleAssignmentRepository();
  const userRepo = new DrizzleUserRepository();

  return {
    requestCondoUseCase: new RequestCondominium(condoRepo),
    approveCondoUseCase: new ApproveCondominium(condoRepo, assignmentRepo),
    rejectCondoUseCase: new RejectCondominium(condoRepo, userRepo),
    getMyCondoUseCase: new GetMyCondominium(condoRepo),
    listApprovedCondoUseCase: new ListApprovedCondominiums(condoRepo),
    listNearbyCondoUseCase: new ListNearbyCondominiums(condoRepo),
    listPendingCondoUseCase: new ListPendingCondominiums(condoRepo),
  };
}
