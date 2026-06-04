import { db } from '@neighborhood-showcase/db';
import { address as addressSchema } from '@neighborhood-showcase/db/schema/showcase';
import { eq } from 'drizzle-orm';
import type {
  AddressDTO,
  AddressRepository,
  CreateAddressInput,
} from '../../domain/repositories/address.repository';

export class DrizzleAddressRepository implements AddressRepository {
  async findByCep(cep: string): Promise<AddressDTO | null> {
    const [found] = await db
      .select()
      .from(addressSchema)
      .where(eq(addressSchema.cep, cep))
      .limit(1);

    if (!found) {
      return null;
    }

    return {
      id: found.id,
      cep: found.cep,
      street: found.street,
      neighborhood: found.neighborhood,
      city: found.city,
      state: found.state,
      createdAt: found.createdAt,
    };
  }

  async create(input: CreateAddressInput): Promise<AddressDTO> {
    const [inserted] = await db
      .insert(addressSchema)
      .values({
        id: input.id,
        cep: input.cep,
        street: input.street,
        neighborhood: input.neighborhood,
        city: input.city,
        state: input.state,
      })
      .returning();

    if (!inserted) {
      throw new Error('Failed to create address');
    }

    return {
      id: inserted.id,
      cep: inserted.cep,
      street: inserted.street,
      neighborhood: inserted.neighborhood,
      city: inserted.city,
      state: inserted.state,
      createdAt: inserted.createdAt,
    };
  }
}
