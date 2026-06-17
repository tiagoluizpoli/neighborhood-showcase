# Neighborhood Showcase — Ralph Loop Context Copy

> This file mirrors the codebase-specific glossary and durable domain decisions
> from `/CONTEXT.md` so the `.plan/` framework carries the same project
> language/context that implementation depends on.
>
> If `/CONTEXT.md` and `.plan/CONTEXT.md` diverge, fix the drift.

## Language

**User**:
An authenticated account identity managed by Better Auth. A User may hold
domain capabilities such as Provider or Moderator.
Avoid: Account, profile

**Provider**:
A User who can publish announcements on the platform. Since visitors browse
publicly, only Users who publish announcements need Provider capability. A
Provider holds one or more Assignments (e.g., Internal Neighbor, External
Neighbor, Local Commerce).
Avoid: Resident, seller, vendor, store

**Provider Assignment**:
A relation record that links a Provider to a Condominium or Address and stores
the approval/status and location-specific provider data needed to publish and
moderate announcements.
Avoid: Provider location, location record

**Provider Profile**:
A public-facing presentation record for a Provider, separate from
authenticated User identity, used for company name, logo, banner,
description, and other branding fields.
Avoid: User avatar, account profile

**Provider Profile Fields**:
`companyName`, `logoUrl`, `bannerUrl`, `publicDescription`, and public contact
links belong to Provider Profile rather than User.
Avoid: User avatar, auth profile fields

**User vs Provider Profile ownership**:
- User owns: account identity (`name`, `email`, `phone`), authentication
  credentials, account-level preferences (language, theme), and the LGPD
  `deleteAccount` flow.
- Provider Profile owns: `displayName` (public-facing, may differ from
  `User.name`), `logoUrl`, `bannerUrl`, `publicDescription`, `socialLinks`,
  and `isProviderVisible`.
- `User.name` is the account identity used in moderation/admin contexts;
  Provider Profile `displayName` is what Visitors see.
- The Conta page MUST NOT expose Provider Profile fields. The Provedor
  Configurações page MUST NOT expose User identity fields.
Avoid: Mixing User and Provider Profile fields on a single page.

**Provider Profile (current scope — Option A)**:
A Provider Profile in the current scope is always backed by an individual
(one User, one CPF). Optional `companyName` and `tradeName` are free-text
branding fields with no legal weight.
Avoid: Storing CNPJ on the profile today, treating `companyName` as legal data.

**Provider Profile (future — Option B, deferred)**:
The future Company Provider scope will introduce a `COMPANY` profile type with
CNPJ + razão social + nome fantasia + document upload, separate onboarding,
CNPJ validation, and admin verification. This is NOT in the current scope.

**Assignment**:
A verified link, status, or location record connecting a Provider to a
specific Condominium or to a physical Address.
Avoid: Role, profile, status

**Address**:
A shared geographic location defined by CEP, street, neighborhood, city, and
state.
Avoid: Location, street info

**Moderator**:
A User with condominium-management privileges who can verify Assignments and
moderate active Announcements for their assigned Condominium.
Avoid: Administrator, manager

**System Manager**:
A User with platform-wide administration privileges for global backend
operations.
Avoid: Super admin, owner

**Administrator**:
A User with the highest platform-wide administration privileges.
Avoid: Super administrator, root

**Role hierarchy**:
Global account roles are ordered `USER` < `SYSTEM_MANAGER` < `ADMINISTRATOR`.
Avoid: Multiple role stacking, duplicated roles

**Provider Assignment `enabled` flag**:
A boolean flag on a Provider Assignment that controls public visibility.
When `enabled = true`, the Provider appears in the public directory. When
disabled, the Provider is hidden from public search but remains visible to
Administrators. This is NOT an approval mechanism.
Avoid: Provider active flag, provider visibility flag

**Sidebar block visibility rules**:
- Provedor: visible iff the User has a Provider Assignment with `enabled = true`
- Moderação: visible iff the User has at least one APPROVED MODERATOR assignment
- Administração: visible iff `user.role ∈ {SYSTEM_MANAGER, ADMINISTRATOR}`
- Reports: visible iff `user.role === ADMINISTRATOR`
Avoid: Role-based sidebar for Provedor

**Provedor group visibility for new users (Option A — strict)**:
A User with zero Provider Assignments sees no Provedor sidebar group at all.
If a User's only assignment has `enabled = false`, they also see no Provedor
group. The rule is exactly: at least one Provider Assignment with
`enabled = true`.

**Condominium**:
A physical or logical community context that groups Providers and their
Assignments.
Avoid: Building, community

**Announcement**:
A standardized flyer/banner publication showcasing a service, product, or
donation. It progresses through states: Draft/Pending Payment, Active,
Expired.
Avoid: Ad, post, advertisement, product

**Payment**:
An automated Pix transaction processed via AbacatePay to pay the publication
fee for an Announcement.
Avoid: Invoice, bill, transaction

**ExpiredAt**:
The date and time when an Announcement ceases to be visible to Visitors.
Avoid: End date

**Visitor**:
An unauthenticated person browsing the showcase without login barriers.
Avoid: Guest, consumer, reader

## Example Dialogue

Dev: Can a Visitor contact a Provider directly?
Domain Expert: Yes. A Visitor can see the contact link on the Announcement and
click it without needing to log in.

Dev: How does a Provider update their Announcement?
Domain Expert: The Provider logs in and updates it directly, choosing which of
their Assignments they want to publish under.
