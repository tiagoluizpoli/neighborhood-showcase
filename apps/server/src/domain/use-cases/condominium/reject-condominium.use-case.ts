import type { Condominium } from '../../entities/condominium.entity';

export interface RejectCondominiumInput {
  id: string;
  reason: string;
}

export interface RejectCondominiumUseCase {
  execute(input: RejectCondominiumInput): Promise<Condominium>;
}
