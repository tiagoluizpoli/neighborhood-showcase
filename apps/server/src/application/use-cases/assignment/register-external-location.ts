import crypto from 'node:crypto';
import { db } from '@neighborhood-showcase/db';
import { address as addressSchema } from '@neighborhood-showcase/db/schema/showcase';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import type { Assignment } from '../../../domain/entities/assignment.entity';
import { validateCEP } from '../../../domain/entities/condominium.entity';
import type { AssignmentRepository } from '../../../domain/repositories/assignment.repository';
import type {
  RegisterExternalLocationInput,
  RegisterExternalLocationUseCase,
} from '../../../domain/use-cases/assignment/register-external-location.use-case';

export class RegisterExternalLocation
  implements RegisterExternalLocationUseCase
{
  constructor(private readonly assignmentRepo: AssignmentRepository) {}

  async execute(input: RegisterExternalLocationInput): Promise<Assignment> {
    // 1. Validate inputs
    validateCEP(input.cep);

    if (!input.street.trim()) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'O nome da rua é obrigatório.',
      });
    }
    if (!input.neighborhood.trim()) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'O bairro é obrigatório.',
      });
    }
    if (!input.city.trim()) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'A cidade é obrigatória.',
      });
    }
    if (!input.state.trim() || input.state.trim().length !== 2) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'O estado deve ser informado com 2 caracteres (UF).',
      });
    }
    if (!input.number.trim()) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'O número do endereço é obrigatório.',
      });
    }

    const cleanCep = input.cep.replace(/\D/g, '');

    // 2. Lookup existing address by CEP
    let addressId = '';
    const [existingAddress] = await db
      .select()
      .from(addressSchema)
      .where(eq(addressSchema.cep, cleanCep))
      .limit(1);

    if (existingAddress) {
      addressId = existingAddress.id;
    } else {
      // Create new address record
      addressId = crypto.randomUUID();
      await db.insert(addressSchema).values({
        id: addressId,
        cep: cleanCep,
        street: input.street.trim(),
        neighborhood: input.neighborhood.trim(),
        city: input.city.trim(),
        state: input.state.trim().toUpperCase(),
      });
    }

    // 3. Create the external location assignment
    const locationId = crypto.randomUUID();

    return this.assignmentRepo.create({
      id: locationId,
      providerId: input.providerId,
      condominiumId: null,
      addressId,
      number: input.number.trim(),
      unitInfo: input.complement?.trim() || null,
      type: 'EXTERNAL',
      status: 'APPROVED', // External provider location is auto-approved
    });
  }
}
