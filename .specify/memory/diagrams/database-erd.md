# Database Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    Users {
        string id PK
        string name
        string email UK
        string cpfHash UK
        string role "enum: PROVIDER, SYSTEM_MANAGER"
        string status "enum: ACTIVE, BANNED"
        string phone
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt
    }
    Condominiums {
        string id PK
        string name
        string city
        string state
        string cep
        jsonb contactInfo
        string status "enum: PENDING_APPROVAL, APPROVED, REJECTED"
        string createdBy FK
        timestamp createdAt
        timestamp deletedAt
    }
    Assignments {
        string id PK
        string providerId FK
        string condominiumId FK
        string type "enum: RESIDENT, MODERATOR"
        string status "enum: PENDING, APPROVED, REJECTED"
        string unitInfo
        string proofOfResidency
        timestamp createdAt
        timestamp updatedAt
    }
    Announcements {
        string id PK
        string providerId FK
        string title
        string subtitle
        string description
        int priceCents
        string imageUrl
        string category
        string_array tags
        jsonb contactLinks
        boolean showVerifiedBadge
        string status "enum: DRAFT, PENDING_PAYMENT, ACTIVE, EXPIRED, SUSPENDED"
        timestamp paidAt
        timestamp expiresAt
        timestamp createdAt
        timestamp deletedAt
    }
    Payments {
        string id PK
        string announcementId FK
        string billingId
        int amountCents
        string status "enum: PENDING, PAID, EXPIRED, REFUNDED"
        string pixQrCode
        string pixCopyPaste
        timestamp createdAt
        timestamp updatedAt
    }
    AnalyticsEvents {
        string id PK
        string announcementId FK
        string eventType "enum: IMPRESSION, CONTACT_CLICK"
        string targetType "enum: WHATSAPP, INSTAGRAM, WEBSITE"
        timestamp createdAt
    }
    BlacklistedIdentifiers {
        string id PK
        string cpfHash UK
        string reason
        timestamp bannedAt
    }

    Users ||--o{ Condominiums : "creates"
    Users ||--o{ Assignments : "applies"
    Condominiums ||--o{ Assignments : "contains"
    Users ||--o{ Announcements : "publishes"
    Announcements ||--o{ Payments : "requires"
    Announcements ||--o{ AnalyticsEvents : "generates"
```
