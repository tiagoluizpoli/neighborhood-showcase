import { ApproveAssignment } from '../../application/use-cases/assignment/approve-assignment';
import { CountPendingAssignments } from '../../application/use-cases/assignment/count-pending-assignments';
import { GetAssignment } from '../../application/use-cases/assignment/get-assignment';
import { GetCondominiumAssignment } from '../../application/use-cases/assignment/get-condominium-assignment';
import { ListPendingAssignments } from '../../application/use-cases/assignment/list-pending-assignments';
import { ListProviderAssignments } from '../../application/use-cases/assignment/list-provider-assignments';
import { RegisterExternalLocation } from '../../application/use-cases/assignment/register-external-location';
import { RejectAssignment } from '../../application/use-cases/assignment/reject-assignment';
import { RequestAssignment } from '../../application/use-cases/assignment/request-assignment';
import type { AssignmentRepository } from '../../domain/repositories/assignment.repository';
import { DrizzleAddressRepository } from '../../infrastructure/db/address-repository';
import { DrizzleAssignmentRepository } from '../../infrastructure/db/assignment-repository';

export interface AssignmentRouterDependencies {
  assignmentRepo: AssignmentRepository;
  countPendingAssignmentsUseCase: CountPendingAssignments;
  getCondominiumAssignmentUseCase: GetCondominiumAssignment;
  getAssignmentUseCase: GetAssignment;
  requestAssignmentUseCase: RequestAssignment;
  listPendingAssignmentsUseCase: ListPendingAssignments;
  listProviderAssignmentsUseCase: ListProviderAssignments;
  approveAssignmentUseCase: ApproveAssignment;
  rejectAssignmentUseCase: RejectAssignment;
  registerExternalUseCase: RegisterExternalLocation;
}

export function createAssignmentRouterDependencies(): AssignmentRouterDependencies {
  const assignmentRepo = new DrizzleAssignmentRepository();
  const addressRepo = new DrizzleAddressRepository();

  return {
    assignmentRepo,
    getCondominiumAssignmentUseCase: new GetCondominiumAssignment(
      assignmentRepo,
    ),
    getAssignmentUseCase: new GetAssignment(assignmentRepo),
    requestAssignmentUseCase: new RequestAssignment(assignmentRepo),
    listPendingAssignmentsUseCase: new ListPendingAssignments(assignmentRepo),
    listProviderAssignmentsUseCase: new ListProviderAssignments(assignmentRepo),
    approveAssignmentUseCase: new ApproveAssignment(assignmentRepo),
    rejectAssignmentUseCase: new RejectAssignment(assignmentRepo),
    countPendingAssignmentsUseCase: new CountPendingAssignments(assignmentRepo),
    registerExternalUseCase: new RegisterExternalLocation(
      assignmentRepo,
      addressRepo,
    ),
  };
}
