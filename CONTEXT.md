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
