import type {
  Condominium,
  CondominiumContactInfo,
} from '../../entities/condominium.entity';

export interface RequestCondominiumInput {
  name: string;
  city: string;
  state: string;
  cep: string;
  contactInfo: CondominiumContactInfo;
  createdBy: string;
  proofUrl?: string | null;
}

export interface RequestCondominiumUseCase {
  execute(input: RequestCondominiumInput): Promise<Condominium>;
}
