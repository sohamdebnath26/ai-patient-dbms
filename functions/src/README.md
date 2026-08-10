# Firebase Cloud Functions

Serverless backend for operations requiring server-side trust. Thin controllers that delegate to application-layer services.

## Sections

- **api/** — REST/callable endpoints for patient, clinical, and tenant operations
- **ai/** — AI orchestration: generateSummary, suggestCodes, orchestrateInference
- **triggers/** — Firestore event handlers: onNoteWrite, onPatientUpdate
- **fhir/** — FHIR R4 endpoint
- **ingestion/** — HL7 v2 message ingestion
- **admin/** — Super-admin operations: provisionTenant, configureTenant
- **middleware/** — Auth, tenant, validation, and rate-limiting middleware
