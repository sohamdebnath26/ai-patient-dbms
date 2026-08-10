# Shared Domain Types

Common types, value objects, and utilities shared across domain aggregates.

- `Result.ts` — Result<T, E> discriminated union for operations that can fail
- `TenantScoped.ts` — Base type for all tenant-scoped entities
- `AuditEntry.ts` — Immutable audit log entry value object
- `ValidationError.ts` — Domain error types
