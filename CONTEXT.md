# Neighborhood Showcase

A platform where residents of a condominium discover products and services offered by neighbors and local businesses.

## Language

**User**:
An authenticated account identity managed by Better Auth. A User may hold domain capabilities such as Provider or Moderator.
_Avoid_: Account, profile

**Provider**:
A User who can publish announcements on the platform. Since visitors browse publicly, only Users who publish announcements need Provider capability. A Provider holds one or more **Assignments** (e.g., Internal Neighbor, External Neighbor, Local Commerce).
_Avoid_: Resident, seller, vendor, store

**Provider Assignment**:
A relation record that links a Provider to a Condominium or Address and stores the approval/status and location-specific provider data needed to publish and moderate announcements.
_Avoid_: Provider location, location record

**Provider Profile**:
A public-facing presentation record for a Provider, separate from authenticated User identity, used for company name, logo, banner, description, and other branding fields.
_Avoid_: User avatar, account profile

**Provider Profile Fields**:
`companyName`, `logoUrl`, `bannerUrl`, `publicDescription`, and public contact links belong to Provider Profile rather than User.
_Avoid_: User avatar, auth profile fields

**User vs Provider Profile ownership**:
- **User** owns: account identity (`name`, `email`, `phone`), authentication credentials, account-level preferences (language, theme), and the LGPD `deleteAccount` flow.
- **Provider Profile** owns: `displayName` (public-facing, may differ from `User.name`), `logoUrl`, `bannerUrl`, `publicDescription`, `socialLinks` (contact channels), and `isProviderVisible` (public availability toggle).
- A User's `name` is the account identity used in moderation/admin contexts; a Provider Profile's `displayName` is what Visitors see in the directory and on announcements. They are intentionally separate fields and may diverge.
- The `Conta` page (account) MUST NOT expose Provider Profile fields. The Provedor `Configurações` page MUST NOT expose User identity fields.
_Avoid_: Mixing User and Provider Profile fields on a single page, reading Provider data from the `user` table.

**Provider Profile (current scope — Option A)**:
A Provider Profile in the current scope is always backed by an individual (one User, one CPF). Optional `companyName` and `tradeName` (nome fantasia) are free-text branding fields with no legal weight — they do not introduce a separate legal-entity identity, no CNPJ, no document storage, no admin verification.
_Avoid_: Storing CNPJ on the profile today, treating `companyName` as legal data, adding a `providerType` enum in this scope.

**Provider Profile (future — Option B, deferred)**:
The future "Company Provider" scope will introduce a `COMPANY` profile type with CNPJ + razão social + nome fantasia + document upload, separate onboarding step, CNPJ validation, and admin verification. This is a separate epic and is NOT in the current Provider Profile scope.

**Assignment**:
A verified link, status, or location record connecting a Provider to a specific Condominium (requiring approval from that Condominium's Moderator) or to a physical Address (for independent/external listings).
_Avoid_: Role, profile, status

**Address**:
A shared geographic location defined by a CEP, street, neighborhood, city, and state, which can be linked to multiple Condominiums or Providers.
_Avoid_: Location, street info

**Moderator**:
A User with condominium-management privileges who can verify Assignments and moderate active Announcements for their assigned Condominium. Moderator is a separate role from Provider.
_Avoid_: Administrator, manager

**System Manager**:
A User with platform-wide administration privileges for global backend operations. System Manager is separate from Moderator and Provider.
_Avoid_: Super admin, owner

**Administrator**:
A User with the highest platform-wide administration privileges. An Administrator can perform all System Manager actions and additional sensitive governance actions.
_Avoid_: Super administrator, root

**Role hierarchy**:
Global account roles are ordered `USER` < `SYSTEM_MANAGER` < `ADMINISTRATOR`. Higher roles include the permissions of lower roles.
_Avoid_: Multiple role stacking, duplicated roles

**Provider Assignment `enabled` flag**:
A boolean flag on a Provider Assignment that controls public visibility. When `enabled = true`, the Provider appears in the public directory. When `disabled`, the Provider is hidden from public search but remains visible to Administrators. This flag is NOT an approval mechanism — it is a public availability toggle. Opt-out during onboarding means the Assignment record is never created.
_Avoid_: Provider active flag, provider visibility flag

**Sidebar block visibility rules**:
- **Provedor**: visible iff the User has a Provider Assignment with `enabled = true`
- **Moderação**: visible iff the User has at least one APPROVED MODERATOR assignment
- **Administração**: visible iff `user.role ∈ {SYSTEM_MANAGER, ADMINISTRATOR}`
- **Reports**: visible iff `user.role === ADMINISTRATOR`
_Avoid_: Role-based sidebar (Provedor is capability-based, not role-based)

**Provedor group visibility for new users (Option A — strict)**:
A User with zero Provider Assignments sees no Provedor sidebar group at all. The onboarding entry point is the public "Anunciar" CTA in the portal footer, NOT the panel sidebar. If a User's only assignment has `enabled = false` (they opted out), they also see no Provedor group. The rule is exactly: at least one Provider Assignment with `enabled = true`.
_Avoid_: Showing the Provedor group to a User with no provider capability, falling back to a "set up your provider profile" empty state inside the panel for new users.

**Condominium**:
A physical or logical community context that groups Providers and their Assignments, defining the primary boundary for announcements.
_Avoid_: Building, community

**Announcement**:
A standardized flyer/banner publication showcasing a service, product, or donation, containing an image, title, optional subtitle, description, value/price (optional), and contact links. It progresses through states: `Draft/Pending Payment`, `Active`, and `Expired`.
_Avoid_: Ad, post, advertisement, product

**Payment**:
An automated Pix transaction processed via **AbacatePay** to pay the publication fee for an Announcement.
_Avoid_: Invoice, bill, transaction

**ExpiredAt**:
The date and time when an Announcement ceases to be visible to Visitors (automatically set to 30 days after payment confirmation).
_Avoid_: End date

**Visitor**:
An unauthenticated person browsing the showcase without login barriers.
_Avoid_: Guest, consumer, reader

## Example Dialogue

> **Dev**: Can a Visitor contact a Provider directly?
> **Domain Expert**: Yes, a Visitor should be able to see the contact link on the Announcement and click it without needing to log in.
> **Dev**: How does a Provider update their Announcement?
> **Domain Expert**: The Provider logs in and updates it directly, choosing which of their Assignments they want to publish under.
