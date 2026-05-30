# Decoupled Location Assignments and Base Address Schema

To support external/independent providers (who do not live in any condominium) and avoid duplicate address rows, we decided to:
1. Introduce a base `address` table containing shared, CEP-based street metadata.
2. Unify resident/moderator assignments and external provider addresses into a single `provider_location` table. This acts as a joint table mapping a `providerId` to either a `condominiumId` (for internal providers) or an `addressId` (for external providers).
3. Link the `announcement` table directly to the `provider_location` table via `providerLocationId` instead of mapping it directly to a `condominiumId`.

This decouples the announcement entities from strict condominium boundaries while preserving referential integrity and supporting flexible multi-location configurations without address redundancy.
