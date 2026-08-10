# Domain Layer

Entities, value objects, domain services, and aggregate roots. The domain layer is the single source of truth for all business rules. It must never import from any other layer.

## Aggregates

- **patient/** — Patient aggregate root, demographics, contact, identifiers
- **clinical/** — ClinicalNote, Visit, DiagnosisCode, SOAP sections
- **tenant/** — Tenant aggregate root, configuration
- **auth/** — User, Role, Permission value objects
- **consent/** — Consent aggregate root (cross-tenant data sharing, V5)
- **shared/** — Shared types: Result, AuditEntry, TenantScoped, ValidationError
