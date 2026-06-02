export interface EntityMapper<SchemaRow, DomainEntity, InsertRow = unknown> {
  toDomain(raw: SchemaRow): DomainEntity;
  toPersistence(entity: DomainEntity): InsertRow;
}
