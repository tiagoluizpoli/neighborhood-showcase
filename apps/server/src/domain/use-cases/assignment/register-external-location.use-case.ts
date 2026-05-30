import type { Assignment } from '../../entities/assignment.entity';

export interface RegisterExternalLocationInput {
  providerId: string;
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  number: string;
  complement?: string;
}

export interface RegisterExternalLocationUseCase {
  execute(input: RegisterExternalLocationInput): Promise<Assignment>;
}
