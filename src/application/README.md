# Application Layer

Use cases, state management, and ports (interfaces). Depends on the domain layer. Does NOT import from infrastructure or presentation.

## Sections

- **patient/** — Patient use cases: SearchPatients, GetPatient, CreatePatient, UpdatePatient
- **clinical/** — Clinical use cases: CreateNote, UpdateNote, GetPatientTimeline
- **ai/** — AI use cases: GenerateSummary, SuggestCodes, SummarizePatientRecord
- **tenant/** — Tenant use cases: ProvisionTenant, InviteUser, ConfigureTenant
- **ports/** — Interfaces for infrastructure: IPatientRepository, IAIModelProvider, IAuditLogger
