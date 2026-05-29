import { TRPCError } from '@trpc/server';

export interface CondominiumContactInfo {
  website?: string;
  email?: string;
  phone?: string;
}

export type CondominiumStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

export interface Condominium {
  id: string;
  name: string;
  city: string;
  state: string;
  cep: string;
  contactInfo: CondominiumContactInfo;
  status: CondominiumStatus;
  createdBy: string;
  proofUrl?: string | null;
  createdAt: Date;
  deletedAt?: Date | null;
}

export function validateCondominiumName(name: string): void {
  if (!name || name.trim().length < 3) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Nome do condomínio deve ter pelo menos 3 caracteres.',
    });
  }
}

export function validateCEP(cep: string): void {
  const cleanCep = cep.replace(/\D/g, '');
  if (cleanCep.length !== 8) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'CEP inválido. Deve conter 8 dígitos.',
    });
  }
}

export function validateContactInfo(info: CondominiumContactInfo): void {
  if (info.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(info.email)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'E-mail administrativo inválido.',
    });
  }
  if (info.phone && info.phone.replace(/\D/g, '').length < 10) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Telefone administrativo inválido.',
    });
  }
}
