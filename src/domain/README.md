# Domain Layer

Entities, value objects, domain services, and aggregate roots. The domain layer is the single source of truth for all business rules. It must never import from any other layer.

## Aggregates

- **patient/** — Patient aggregate root, demographics, contact, identifiers, and clinical data
- **appointment/** — Appointment aggregate (scheduling, status lifecycle)
- **encounter/** — Encounter aggregate (clinical encounters, procedures)
- **imaging/** — Clinical imaging and image analysis domain types
- **auth/** — User, AuthSession, AuthError value objects
- **profile/** — Profile and role value objects
- **organization/** — Organization membership aggregate
- **chat/** — Chat-related domain types
- **ai/** — Medical context types for AI pipelines
