# Infrastructure Layer

Implementations of application ports. Interacts with Firebase, AI providers, encryption services, and external HTTP APIs. Depends on domain types and implements application interfaces.

## Sections

- **firebase/** — FirestorePatientRepository, FirebaseAuthRepository, FirestoreAuditLogger
- **ai/** — OpenAIProvider, AnthropicProvider, GoogleAIProvider, ModelRouter, PHIDeidentifier
- **encryption/** — AESEncryptionService
- **http/** — FHIRClient, external API clients
