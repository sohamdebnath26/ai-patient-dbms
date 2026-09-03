# Application Layer

Use cases, state management, and ports (interfaces). Depends on the domain layer. Does NOT import from infrastructure or presentation.

## Sections

- **patient/** — Patient use cases: create, update, search, deregister
- **clinical/** — Clinical use cases: medications, allergies, diagnoses, lab reports, notes
- **encounter/** — Encounter use cases: start, update, complete, cancel
- **appointment/** — Appointment use cases: book, confirm, check-in, cancel, complete
- **imaging/** — Clinical image upload and AI analysis orchestration
- **ai/** — AI chat service with navigation detection and context building
- **chat/** — Chat service wrapper with validation
- **auth/** — Authentication use cases: login, signup, password reset, account deletion
- **profile/** — Profile management use cases
- **organization/** — Organization membership use cases
- **ports/** — Interfaces for infrastructure: repositories, AI providers, services
