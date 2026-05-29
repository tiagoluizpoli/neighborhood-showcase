import type {
  Condominium,
  CondominiumContactInfo,
} from '../entities/condominium.entity';

export interface CreateCondominiumRepositoryInput {
  id: string;
  name: string;
  city: string;
  state: string;
  cep: string;
  contactInfo: CondominiumContactInfo;
  createdBy: string;
  proofUrl?: string | null;
}

export interface CondominiumRepository {
  create(input: CreateCondominiumRepositoryInput): Promise<Condominium>;
  findById(id: string): Promise<Condominium | null>;
  findByCEP(cep: string): Promise<Condominium[]>;
  findByCreatorId(userId: string): Promise<Condominium | null>;
  searchApproved(query: string): Promise<Condominium[]>;
}
