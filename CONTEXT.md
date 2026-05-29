# Neighborhood Showcase

A platform where residents of a condominium discover products and services offered by neighbors and local businesses.

## Language

**Provider**:
A registered and authenticated user of the platform. Since visitors browse publicly, only those who publish announcements need accounts. A Provider holds one or more **Assignments** (e.g., Internal Neighbor, External Neighbor, Local Commerce).
_Avoid_: User, resident, seller, vendor, store

**Assignment**:
A verified link or status connecting a Provider to a specific Condominium, approved by that Condominium's Moderator.
_Avoid_: Role, profile, status

**Moderator**:
A Provider authorized to verify Assignments and moderate active Announcements for their assigned Condominium (typically the Condominium Manager/Síndico or authorized administration staff).
_Avoid_: Administrator, manager

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

