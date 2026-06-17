# User identity and Provider Profile are separate records with separate ownership

## Status

Accepted

## Context

The codebase already distinguishes authenticated User identity from public-facing Provider data in the domain glossary and schema, but the product surface had been treating them as one merged profile.

Before this decision:

- the account page mixed User identity fields with Provider-facing branding/contact fields
- `trpc.user.update` wrote Provider fields such as `socialLinks` and `isProviderVisible` into both the `user` row and the `provider_profile` row
- the public provider page depended on merged data, which made `User.name` and Provider-facing naming drift together
- adding Provider branding fields such as `companyName`, `tradeName`, `logoUrl`, `bannerUrl`, and `publicDescription` would have deepened the conflation further

This conflicted with the project glossary recorded in `CONTEXT.md`, `.plan/CONTEXT.md`, and PRD-v7:

- User owns account identity, authentication, and cross-device preferences
- Provider Profile owns public branding, public contact channels, and directory visibility
- `User.name` is the account identity used in moderation/admin contexts
- Provider Profile `displayName` is the public-facing identity visible to Visitors

The repository needs a strict architectural record for this split so future backend, frontend, and public-page work stops re-merging the two concepts.

## Decision

We will enforce a strict split between User identity and Provider Profile.

### User owns

- `name`
- `email`
- `phone`
- `image`
- `language`
- `theme`
- authentication credentials and account lifecycle actions

### Provider Profile owns

- `displayName`
- `companyName`
- `tradeName`
- `avatarUrl`
- `logoUrl`
- `bannerUrl`
- `publicDescription`
- `socialLinks`
- `isProviderVisible`

### API and UI implications

1. `trpc.user.update` is limited to User-owned fields and must not mirror Provider Profile fields into `provider_profile`.
2. `trpc.user.getProfile` returns User identity only.
3. `trpc.providerProfile.get` and `trpc.providerProfile.update` own Provider Profile reads/writes for the authenticated Provider only.
4. The Conta e Segurança surface edits only User-owned fields.
5. The Provedor Configurações surface edits only Provider Profile fields.
6. Public provider DTOs render Provider Profile identity with `displayName`, not `User.name`.
7. A shared `providerId = user.id` link is an association key, not permission to merge the two records into one DTO or one form.

## Consequences

### Positive

- Public-facing branding can evolve independently from account identity.
- Moderation/admin contexts keep a stable account identity that is not coupled to marketing copy.
- The backend contract becomes simpler: User routes own User data, Provider Profile routes own Provider data.
- New branding fields can be added without polluting account/profile surfaces.
- The public provider page can truthfully present Provider branding while preserving the authenticated User model.

### Negative

- Some flows now require touching two endpoints/surfaces instead of one merged profile form.
- Providers may need guidance when `User.name` and public `displayName` intentionally differ.
- Migration/remediation work is required anywhere the old merged DTO shape was assumed.

## Rejected alternatives

- **Keep mirroring Provider fields into both `user` and `provider_profile`**: rejected because it duplicates ownership, creates drift risk, and keeps the glossary false in implementation.
- **Store all public branding directly on `user`**: rejected because public Provider presentation is a distinct domain concept from authenticated account identity.
- **Expose one merged "profile" DTO and let pages pick fields ad hoc**: rejected because it reintroduces the same coupling at the API boundary even if the database stays split.
- **Use `User.name` as the public provider name everywhere**: rejected because Providers need a public-facing identity that may differ from their authenticated account identity.
