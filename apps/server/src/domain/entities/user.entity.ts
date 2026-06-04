import { AuditableEntity, type AuditableProps } from '../../shared/base-entity';

export interface UserProps extends AuditableProps {
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  cpfHash?: string | null;
  role: 'PROVIDER' | 'SYSTEM_MANAGER';
  status: 'ACTIVE' | 'BANNED';
  phone?: string | null;
  socialLinks: {
    whatsapp?: string;
    phone?: string;
    email?: string;
    instagram?: string;
    tiktok?: string;
    facebook?: string;
    website?: string;
  };
  isProviderVisible: boolean;
  deletedAt?: Date | null;
}

export class User extends AuditableEntity<UserProps> {
  get name(): string {
    return this.props.name;
  }

  get email(): string {
    return this.props.email;
  }

  get emailVerified(): boolean {
    return this.props.emailVerified;
  }

  get image(): string | null | undefined {
    return this.props.image;
  }

  get cpfHash(): string | null | undefined {
    return this.props.cpfHash;
  }

  get role(): 'PROVIDER' | 'SYSTEM_MANAGER' {
    return this.props.role;
  }

  get status(): 'ACTIVE' | 'BANNED' {
    return this.props.status;
  }

  get phone(): string | null | undefined {
    return this.props.phone;
  }

  get socialLinks() {
    return this.props.socialLinks;
  }

  get isProviderVisible(): boolean {
    return this.props.isProviderVisible;
  }

  get deletedAt(): Date | null | undefined {
    return this.props.deletedAt;
  }
}
