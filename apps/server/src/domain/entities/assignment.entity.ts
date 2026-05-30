import { TRPCError } from '@trpc/server';

export type AssignmentType = 'RESIDENT' | 'MODERATOR' | 'EXTERNAL';
export type AssignmentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Assignment {
  id: string;
  providerId: string;
  condominiumId: string | null;
  addressId?: string | null;
  number?: string | null;
  type: AssignmentType;
  status: AssignmentStatus;
  unitInfo?: string | null;
  proofOfResidency?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssignmentWithCondo extends Assignment {
  condominium?: {
    name: string;
    city: string;
    state: string;
  } | null;
}

export interface AssignmentWithUser extends Assignment {
  provider?: {
    name: string | null;
    email: string;
  } | null;
}

export function validateUnitInfo(unitInfo?: string): void {
  if (!unitInfo || unitInfo.trim().length === 0) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Informações da unidade são obrigatórias para moradores.',
    });
  }
  if (unitInfo.length > 100) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Informações da unidade não podem exceder 100 caracteres.',
    });
  }
}
