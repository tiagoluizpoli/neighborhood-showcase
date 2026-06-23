export interface ProviderIdentityInput {
  logoUrl?: string | null;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  name: string;
}

export type ProviderIdentityMark =
  | { kind: 'logo'; src: string }
  | { kind: 'avatar'; src: string }
  | { kind: 'initials'; initials: string };

export interface ProviderIdentityResult {
  mark: ProviderIdentityMark;
  bannerUrl: string | null;
}

export function deriveInitials(name: string): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return (parts[0] ?? '').slice(0, 2).toUpperCase();
  return `${parts[0]?.[0] ?? ''}${parts.at(-1)?.[0] ?? ''}`.toUpperCase();
}

export function resolveProviderIdentity(
  input: ProviderIdentityInput,
): ProviderIdentityResult {
  const { logoUrl, avatarUrl, bannerUrl, name } = input;

  let mark: ProviderIdentityMark;
  if (logoUrl) {
    mark = { kind: 'logo', src: logoUrl };
  } else if (avatarUrl) {
    mark = { kind: 'avatar', src: avatarUrl };
  } else {
    mark = { kind: 'initials', initials: deriveInitials(name) };
  }

  return { mark, bannerUrl: bannerUrl ?? null };
}
