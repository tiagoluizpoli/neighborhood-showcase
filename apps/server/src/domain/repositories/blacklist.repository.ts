import type { BlacklistedIdentifier } from '../entities/blacklist.entity';

export interface BlacklistRepository {
  findAll(): Promise<BlacklistedIdentifier[]>;
  findByCpfHash(cpfHash: string): Promise<BlacklistedIdentifier | null>;
  create(input: {
    id: string;
    cpfHash: string;
    reason: string;
  }): Promise<BlacklistedIdentifier>;
  delete(id: string): Promise<void>;
}
