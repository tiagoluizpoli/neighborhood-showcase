import crypto from 'node:crypto';
import type { Assignment } from '../../../domain/entities/assignment.entity';
import { Condominium } from '../../../domain/entities/condominium.entity';
import type { AddressRepository } from '../../../domain/repositories/address.repository';
import type { AssignmentRepository } from '../../../domain/repositories/assignment.repository';
import type {
  RegisterExternalLocationInput,
  RegisterExternalLocationUseCase,
} from '../../../domain/use-cases/assignment/register-external-location.use-case';
import { DomainError } from '../../../shared/domain-error';

export class InvalidAddressError extends DomainError {}

export class RegisterExternalLocation
  implements RegisterExternalLocationUseCase
{
  constructor(
    private readonly assignmentRepo: AssignmentRepository,
    private readonly addressRepo: AddressRepository,
  ) {}

  async execute(input: RegisterExternalLocationInput): Promise<Assignment> {
    // 1. Validate inputs via Condominium entity CEP validation
    new Condominium({
      name: 'Dummy Condominium',
      city: 'Dummy City',
      state: 'SC',
      cep: input.cep,
      contactInfo: {},
      status: 'PENDING_APPROVAL',
      createdBy: 'dummy-creator',
    });

    if (!input.street.trim()) {
      throw new InvalidAddressError('O nome da rua é obrigatório.');
    }
    if (!input.neighborhood.trim()) {
      throw new InvalidAddressError('O bairro é obrigatório.');
    }
    if (!input.city.trim()) {
      throw new InvalidAddressError('A cidade é obrigatória.');
    }
    if (input.state.trim()?.length !== 2) {
      throw new InvalidAddressError(
        'O estado deve ser informado com 2 caracteres (UF).',
      );
    }
    if (!input.number.trim()) {
      throw new InvalidAddressError('O número do endereço é obrigatório.');
    }

    const cleanCep = input.cep.replace(/\D/g, '');

    // 2. Lookup existing address by CEP
    let addressId = '';
    const existingAddress = await this.addressRepo.findByCep(cleanCep);

    if (existingAddress) {
      addressId = existingAddress.id;
    } else {
      // Create new address record
      addressId = crypto.randomUUID();
      await this.addressRepo.create({
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
