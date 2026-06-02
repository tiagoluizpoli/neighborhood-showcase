import crypto from 'node:crypto';

export abstract class Entity<TProps> {
  protected readonly _id: string;
  protected readonly props: TProps;

  constructor(props: TProps, id?: string) {
    this._id = id || crypto.randomUUID();
    this.props = { ...props };
  }

  get id(): string {
    return this._id;
  }

  public toDTO(): TProps & { id: string } {
    return {
      id: this.id,
      ...this.props,
    };
  }

  public toJSON() {
    return this.toDTO();
  }

  public equals(object?: Entity<TProps>): boolean {
    if (object === null || object === undefined) {
      return false;
    }
    if (this === object) {
      return true;
    }
    if (!(object instanceof Entity)) {
      return false;
    }
    return this._id === object._id;
  }
}

export interface AuditableProps {
  createdAt?: Date;
  updatedAt?: Date;
}

export abstract class AuditableEntity<
  TProps extends AuditableProps,
> extends Entity<TProps> {
  get createdAt(): Date {
    return this.props.createdAt || new Date();
  }

  get updatedAt(): Date {
    return this.props.updatedAt || new Date();
  }
}
