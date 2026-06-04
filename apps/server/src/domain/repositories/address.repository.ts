export interface AddressDTO {
  id: string;
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  createdAt?: Date;
}

export interface CreateAddressInput {
  id: string;
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface AddressRepository {
  findByCep(cep: string): Promise<AddressDTO | null>;
  create(input: CreateAddressInput): Promise<AddressDTO>;
}
