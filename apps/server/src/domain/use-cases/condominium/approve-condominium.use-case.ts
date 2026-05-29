import type { Condominium } from '../../entities/condominium.entity';

export interface ApproveCondominiumInput {
  id: string;
}

export interface ApproveCondominiumUseCase {
  execute(input: ApproveCondominiumInput): Promise<Condominium>;
}
