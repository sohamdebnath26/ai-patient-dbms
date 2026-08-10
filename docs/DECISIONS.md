# Architecture Decision Records — AI Patient DBMS

**Version:** 1.0
**Status:** Living Document
**Last Updated:** 2026-08-10
**Owner:** Engineering Team

---

## ADR-001: Repository Strategy

### Status

Accepted

### Context

We need a strategy for managing the codebase, branching, merging, and release process. The project has a small team (initially 3 engineers) and needs to move fast while maintaining quality.

### Decision

**Monorepo with trunk-based development.**

- Single Git repository containing the React SPA, Cloud Functions, Firestore rules, documentation, and E2E tests.
- Trunk-based development: `main` is the single source of truth; feature branches are short-lived (under 3 days).
- Squash and merge into `main` for linear history.
- Conventional Commits format: `type(scope): description`.
- Branch naming: `feat/<desc>`, `fix/<desc>`, `chore/<desc>`, `docs/<desc>`.

### Consequences

**Positive:**

- Single source of truth for all code, configuration, and documentation.
- Simplified CI/CD — one pipeline tests everything.
- Atomic commits across frontend, functions, and rules.
- No version-mismatch issues between client and server.

**Negative:**

- Repository grows large over time (mitigated by ignoring build artifacts and `node_modules`).
- Functions and frontend share `node_modules` root conventions (mitigated by separate `package.json` files).

### Alternatives Considered

| Alternative                                                   | Why Rejected                                                                      |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **Multi-repo** (separate repos for frontend, functions, docs) | Higher coordination overhead, version-mismatch risk, complex CI                   |
| **GitFlow** (develop, release, hotfix branches)               | Unnecessary ceremony for a small team; trunk-based is simpler and faster          |
| **Polyrepo with Nx/Turborepo**                                | Over-engineering at this stage; can migrate if monorepo tooling becomes necessary |

---

## ADR-002: Technology Stack

### Status

Accepted

### Context

We need to select a technology stack for building a multi-tenant, AI-augmented patient database management system. The stack must support rapid development, strong typing, HIPAA compliance, offline capability, and multi-tenancy.

### Decision

| Layer              | Technology                                  | Version     |
| ------------------ | ------------------------------------------- | ----------- |
| Frontend Framework | React                                       | 19+         |
| Language           | TypeScript (strict mode)                    | 5.x         |
| Bundler            | Vite                                        | 6+          |
| Styling            | Tailwind CSS                                | 4+          |
| Routing            | React Router                                | 7+          |
| Forms              | React Hook Form + Zod                       | Latest      |
| Client State       | Zustand                                     | 5+          |
| Server State       | TanStack Query (React Query)                | 5+          |
| Database           | Firestore                                   | Latest      |
| Auth               | Firebase Auth                               | Latest      |
| Backend            | Cloud Functions (2nd gen)                   | Node.js 20  |
| AI                 | OpenAI, Anthropic, Google AI                | Latest APIs |
| Testing            | Vitest + React Testing Library + Playwright | Latest      |
| CI/CD              | GitHub Actions                              | Latest      |
| Hosting            | Firebase Hosting                            | Latest      |

### Consequences

**Positive:**

- End-to-end TypeScript from database rules to UI components.
- Firebase ecosystem provides integrated auth, database, functions, and hosting.
- Vite delivers sub-second HMR for development.
- React Query adds offline support with minimal configuration.
- Zod + React Hook Form provides type-safe form validation.

**Negative:**

- Vendor lock-in to Google Cloud / Firebase (mitigated by repository interfaces abstracting persistence).
- Cloud Functions cold starts (mitigated by keeping minimum instances warm for latency-sensitive functions).
- Firestore has different query semantics than SQL (mitigated by comprehensive indexing and developer documentation).

### Alternatives Considered

| Alternative        | Why Rejected                                                                                                                       |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Next.js**        | Server-side rendering adds complexity without clear benefit for an authenticated SPA; Vite is simpler                              |
| **Supabase**       | PostgreSQL is powerful but Firestore's serverless scaling and Firebase Auth integration are better for multi-tenant document model |
| **AWS Amplify**    | Firebase has stronger offline support and a more mature emulator suite                                                             |
| **Svelte**         | Smaller ecosystem, fewer healthcare UI component libraries, smaller hiring pool                                                    |
| **REST + Express** | Managing servers adds operational overhead; serverless Cloud Functions reduce ops burden                                           |
| **GraphQL**        | Adds complexity for queries that are mostly simple CRUD; Firestore SDK is sufficient                                               |

---

## ADR-003: React + Vite

### Status

Accepted

### Context

We need a frontend framework and build tool for the SPA. The application is an authenticated, multi-tenant dashboard with forms, data tables, and real-time updates.

### Decision

**React 19+ with Vite.** React for its component model, ecosystem, and team familiarity. Vite for its fast development server, optimized builds, and native ESM support.

### Consequences

**Positive:**

- Vite's HMR is near-instant even with large component trees.
- React's component model maps well to our design system and composite UI architecture.
- Large ecosystem of accessible component libraries (Radix UI, React Aria) if needed.
- React Router 7 integrates cleanly with URL-as-state pattern.

**Negative:**

- React 19 server components are not used (SSR is intentionally avoided for SPA simplicity).
- Bundle size can grow; mitigated by code-splitting on routes.

### Alternatives Considered

| Alternative              | Why Rejected                                                                                         |
| ------------------------ | ---------------------------------------------------------------------------------------------------- |
| **Next.js (App Router)** | SSR/RSC overhead for a fully authenticated app behind login; no SEO benefit for a clinical dashboard |
| **Remix**                | Good SSR story but adds complexity; Vite + React Router 7 is simpler                                 |
| **SvelteKit**            | Excellent DX but smaller ecosystem and hiring pool                                                   |
| **Angular**              | Overly heavy for a focused SPA; opinionated structure conflicts with our layered architecture        |
| **Create React App**     | Deprecated by React team; Vite is the recommended replacement                                        |

---

## ADR-004: TypeScript

### Status

Accepted

### Context

We need a type system to prevent bugs in a multi-tenant healthcare application where data integrity and security are critical. Incorrect types could lead to PHI leakage or clinical data corruption.

### Decision

**TypeScript with `strict: true`.** Every file is TypeScript. No `any` without an explicit escape hatch comment. Domain entities, value objects, and API contracts are fully typed. Zod schemas bridge runtime validation with compile-time types.

### Consequences

**Positive:**

- Compile-time catching of null/undefined errors, missing properties, and type mismatches.
- IDE autocompletion and refactoring support across the entire codebase.
- Self-documenting APIs through type signatures.
- Tenant-scoping types (e.g., `TenantScoped<T>`) enforce tenant isolation at the type level.

**Negative:**

- Steeper learning curve for contributors from JavaScript backgrounds.
- Build time increases with project size (mitigated by Vite's ESM-native build and incremental typechecking in CI).
- Some Firebase SDK types are imperfect (mitigated by wrapper types in infrastructure layer).

### Alternatives Considered

| Alternative                   | Why Rejected                                                                |
| ----------------------------- | --------------------------------------------------------------------------- |
| **JavaScript + JSDoc**        | No compile-time guarantees; type errors surface late in healthcare context  |
| **Flow**                      | Smaller ecosystem, less tooling support, declining adoption                 |
| **ReScript / Elm**            | Too niche for team hiring; interop with Firebase/React ecosystem is painful |
| **TypeScript without strict** | Defeats the purpose; strict mode catches the most impactful bugs            |

---

## ADR-005: Firebase Platform

### Status

Accepted

### Context

We need a backend platform that provides authentication, database, file storage, serverless functions, and hosting — all with HIPAA eligibility and a strong local development story. The platform must support multi-tenancy and scale from 1 to 10,000+ tenants.

### Decision

**Firebase (Google Cloud) with Blaze (pay-as-you-go) plan.** Use Firestore, Firebase Auth, Cloud Functions (2nd gen), Cloud Storage, Firebase Hosting, and the Emulator Suite for local development.

### Consequences

**Positive:**

- Fully managed, serverless — no infrastructure to provision or maintain.
- Integrated services share the same auth model (custom claims propagate to Firestore rules and Functions).
- Emulator suite enables offline development and deterministic testing.
- Automatic scaling — Firestore and Cloud Functions scale with demand.
- HIPAA-eligible with Google Cloud BAA.
- Firebase Hosting provides global CDN with zero configuration.

**Negative:**

- Vendor lock-in to Google Cloud (mitigated by repository interfaces).
- Firestore query model is limited compared to SQL (no JOINs, limited aggregations).
- Cold starts for Cloud Functions (mitigated by minimum instances).
- Cost can grow unpredictably (mitigated by per-tenant cost tracking and usage alerts).

### Alternatives Considered

| Alternative                                            | Why Rejected                                                                                                          |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| **AWS (Cognito + DynamoDB + Lambda + Amplify)**        | More complex configuration, weaker local emulation story, less integrated                                             |
| **Supabase (self-hosted or cloud)**                    | PostgreSQL is powerful but operational burden of self-hosting or cost of managed; Firebase has better offline support |
| **Custom backend (Node.js + PostgreSQL + Kubernetes)** | Massive operational overhead for a small team; premature optimization                                                 |
| **MongoDB Atlas + Auth0 + Vercel**                     | Multiple vendor coordination; Firebase's integrated ecosystem simplifies compliance and operations                    |
| **Appwrite**                                           | Less mature, smaller community, limited AI/ML integration story                                                       |

---

## ADR-006: Firestore Data Model

### Status

Accepted

### Context

We need a database that supports a document-oriented domain model (patients, visits, notes), multi-tenancy, offline-first reads, and serverless scaling. The data model must be queryable, auditable, and governed by fine-grained security rules.

### Decision

**Firestore as the primary database.** Collections for top-level aggregates (`patients`, `tenants`, `consents`). Sub-collections for nested entities (`patients/{id}/visits`, `patients/{id}/visits/{vid}/notes`). Every document carries a `tenantId` field for security rule filtering. No SQL database; no secondary database.

### Data Modeling Principles

- **One aggregate root per collection.** `patients/` is the root collection for the Patient aggregate.
- **Sub-collections for ownership.** Visits are owned by a patient; notes are owned by a visit. This maps to Firestore's hierarchical data model.
- **Denormalize for queries.** Patient summary (name, DOB, MRN) is stored at the visit and note level to avoid N+1 reads.
- **No nested maps for unbounded data.** Medications, allergies, and lab results are sub-collections, not array fields.
- **Composite indexes for all queries.** Every query pattern has a corresponding index in `firestore.indexes.json`.

### Consequences

**Positive:**

- Document model maps naturally to domain aggregates.
- Sub-collection hierarchy simplifies security rules (access to visit implies access to parent patient).
- Real-time listeners enable live updates (future).
- Automatic scaling — no capacity planning.

**Negative:**

- No JOINs — denormalization required for common queries (mitigated by disciplined denormalization strategy).
- No aggregation queries (COUNT, SUM, AVG) — analytics deferred to BigQuery export (V4+).
- 1 MiB document size limit — large clinical note histories must be paginated.
- Write throughput limited to 1 write/second per document — acceptable for patient records (not chat apps).

### Alternatives Considered

| Alternative                | Why Rejected                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------- |
| **PostgreSQL (Cloud SQL)** | Requires connection management, connection pooling, and schema migrations — operational overhead  |
| **MongoDB Atlas**          | Similar document model but no integrated security rules or Firebase Auth integration              |
| **DynamoDB**               | Single-table design is complex and unintuitive for a domain-driven design with rich relationships |
| **Firestore + BigQuery**   | BigQuery for analytics is planned for V4+; Firestore alone is sufficient for MVP operational data |

---

## ADR-007: Multi-Tenant Architecture

### Status

Accepted

### Context

The system must serve multiple independent healthcare organizations (tenants) from a single codebase and infrastructure. Each tenant's data must be fully isolated. No tenant can access another tenant's data. The architecture must support cross-tenant data sharing with explicit patient consent in a future version.

### Decision

**Shared schema, partitioned data — with three-tier enforcement.**

- **Shared schema:** All tenants use the same Firestore collections and Cloud Functions. No per-tenant database instances.
- **Partitioned data:** Every document carries a `tenantId` field. Tenant isolation is achieved through filtering, not physical separation.
- **Three-tier enforcement:**
  1. **Data tier:** Firestore security rules filter by `resource.data.tenantId == request.auth.claims.tenantId`.
  2. **Application tier:** Every repository query includes a `tenantId` filter derived from the authenticated user's claims. No "list all X" endpoint exists.
  3. **Identity tier:** Firebase Auth custom claims embed `tenantId` in the user's JWT. Validated on every request.

### Consequences

**Positive:**

- Single codebase, single deployment — low operational complexity.
- New tenant provisioning is a Firestore document write (no database provisioning).
- Cross-tenant access is achievable via consent-gated admin SDK reads (V5).
- Tenant-specific configuration is just a Firestore document (`tenants/{id}/config`).

**Negative:**

- Shared schema means all tenants must adhere to the same field structure (mitigated by extensible `metadata` fields and per-tenant feature flags).
- A Firestore rules bug could theoretically expose cross-tenant data (mitigated by automated rules testing, penetration testing, and the three-tier defense).
- Noisy-neighbor risk — one high-traffic tenant could impact others (mitigated by Firestore's automatic scaling and per-tenant cost tracking).

### Alternatives Considered

| Alternative                                                   | Why Rejected                                                                                                |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Database-per-tenant**                                       | Operational nightmare — provisioning, backup, migration for each tenant; no Firestore-native way to do this |
| **Collection-per-tenant** (e.g., `patients_tenantA`)          | Firestore rules would be unmanageable; dynamic collection names break SDK patterns                          |
| **Project-per-tenant** (separate Firebase project per tenant) | Exponentially increases cost, devops complexity, and cross-tenant sharing is impossible                     |
| **Hybrid (schema-per-tier)**                                  | Unnecessary complexity; shared schema with three-tier enforcement is sufficient                             |

---

## ADR-008: Authentication & RBAC

### Status

Accepted

### Context

We need authentication for healthcare providers with role-based access control. The system must support multi-factor authentication (MFA), session management, and tenant-scoped permissions. PHI access must be restricted by role.

### Decision

**Firebase Auth with custom claims for RBAC.**

- **Authentication:** Email/password with mandatory MFA (TOTP or SMS). Firebase Auth SDK handles token refresh, session persistence, and MFA flows.
- **Authorization:** Custom claims embedded in the JWT: `{ tenantId, role, permissions[] }`. Claims are set via Admin SDK in Cloud Functions after user creation and role assignment.
- **Roles:** Super-Admin, Tenant Admin, Provider, Nurse, Viewer. Each role maps to a set of granular permissions (e.g., `patient:read`, `note:write`, `ai:summarize`).
- **Propagation:** Custom claims propagate within 1 hour. Force token refresh on role change via client SDK.

### Consequences

**Positive:**

- Firebase Auth is HIPAA-eligible with Google Cloud BAA.
- Custom claims are automatically available in Firestore security rules and Cloud Function context.
- MFA is built into Firebase Auth — no third-party MFA provider needed.
- RBAC is enforced at the token level, not in application code, providing defense in depth.

**Negative:**

- Custom claims have a 1000-byte limit — role + permission array must be compact (mitigated by using role as primary claim and deriving permissions).
- Token refresh for claim changes has up to 1-hour latency (documented; force refresh on critical role changes).
- Firebase Auth does not support SAML natively (SSO deferred to V5; will use a custom SAML integration or Identity Platform).

### Alternatives Considered

| Alternative                             | Why Rejected                                                                              |
| --------------------------------------- | ----------------------------------------------------------------------------------------- |
| **Auth0**                               | More expensive at scale, not natively integrated with Firestore security rules            |
| **Clerk**                               | Not HIPAA-eligible; multi-tenancy support is limited                                      |
| **Custom JWT + self-hosted auth**       | Massive security liability; never build your own auth                                     |
| **AWS Cognito**                         | Less integrated with Firestore; custom claims mapping to Firestore rules is awkward       |
| **Firebase Auth without custom claims** | Would require application-layer authorization checks only — missing data-tier enforcement |

---

## ADR-009: Cloud Functions

### Status

Accepted

### Context

We need a server-side execution environment for operations that require trust: AI orchestration, FHIR conversion, tenant provisioning, audit log ingestion, and operations that must not be performed client-side.

### Decision

**Firebase Cloud Functions (2nd gen) as the sole backend compute platform.**

- **2nd gen functions** for all deployments (longer timeout, higher concurrency, better cold start behavior).
- **Thin controllers.** Functions delegate to application-layer services. No business logic in function handlers.
- **Middleware chain.** Auth verification → tenant extraction → input validation (Zod) → rate limiting → use case execution.
- **Secrets management.** API keys and credentials in Firebase Secret Manager, accessed via `defineSecret()`.
- **Minimum instances.** 1 warm instance for latency-sensitive functions (`searchPatients`, `generateSummary`).

### Consequences

**Positive:**

- Serverless — no infrastructure to manage, provision, or patch.
- Auto-scales with demand (0 to 1000 concurrent per function).
- Integrated with Firebase Auth — `context.auth` contains verified user identity and custom claims.
- Same TypeScript stack as frontend — code sharing for types and validation schemas.

**Negative:**

- Cold starts for infrequently accessed functions (mitigated by minimum instances for latency-sensitive paths).
- 60-second max timeout (sufficient for all use cases; AI functions target 5–30 seconds).
- Functions cannot maintain long-lived connections (not needed for our use cases).
- Deployed per-region (single-region initially; multi-region in V5).

### Alternatives Considered

| Alternative                             | Why Rejected                                                                                 |
| --------------------------------------- | -------------------------------------------------------------------------------------------- |
| **Cloud Run**                           | More flexible (containers, WebSockets) but more ops overhead; Cloud Functions are sufficient |
| **Express on Compute Engine**           | Server management overhead contradicts serverless strategy                                   |
| **AWS Lambda**                          | Would need custom auth integration with Firebase; less seamless                              |
| **Edge Functions (Cloudflare, Vercel)** | Not HIPAA-eligible; limited runtime for AI workloads                                         |
| **1st gen Cloud Functions**             | Shorter timeout, lower concurrency limits, deprecated direction                              |

---

## ADR-010: AI Gateway

### Status

Accepted

### Context

The application requires AI capabilities (summarization, coding, decision support) powered by external LLM providers. AI calls carry clinical text that may contain PHI. API keys must never be exposed to the client. Every AI interaction must be auditable.

### Decision

**AI Gateway as a Cloud Function orchestration layer.** All AI provider calls flow through Cloud Functions. The client never calls AI providers directly.

The gateway handles:

1. **PHI de-identification:** Named Entity Recognition + surrogate replacement before text leaves the function boundary.
2. **Model routing:** Select the best model based on use case, latency budget, and cost profile.
3. **Prompt loading:** Fetch versioned prompt templates.
4. **Response processing:** Re-identify PHI surrogates, parse structured output, validate schema.
5. **Audit logging:** Record every AI request with prompt version, model, latency, token count, and clinician acceptance/rejection.

### Consequences

**Positive:**

- API keys remain in Firebase Secret Manager — never in the client bundle.
- PHI protection at the boundary — de-identification before external API calls.
- Model routing can be updated without client deployment.
- Complete audit trail for AI interactions (suggestion, acceptance, edits).
- Prompt templates are version-controlled and loaded server-side.

**Negative:**

- Added network hop (client → Cloud Function → AI provider → Cloud Function → client) increases latency by ~100-200ms.
- PHI de-identification is imperfect — names and dates may be missed (mitigated by BAAs with providers and iterative NER improvement).
- Single point of failure for AI features if the gateway function is down (mitigated by fallback model routing and graceful degradation).

### Alternatives Considered

| Alternative                               | Why Rejected                                                                                     |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Direct client-to-AI-provider calls**    | Exposes API keys; no PHI protection; no audit trail; violates security architecture              |
| **Separate AI microservice (Cloud Run)**  | More complexity for no benefit at current scale; Cloud Functions are sufficient                  |
| **On-device AI (WebLLM, transformer.js)** | Not HIPAA-compliant; models are not clinically validated; client-side compute is insufficient    |
| **Custom-hosted LLM (GCP Vertex AI)**     | Higher cost, more ops overhead; doesn't provide better clinical quality than hosted GPT-4/Claude |

---

## ADR-011: Provider Abstraction

### Status

Accepted

### Context

We need to interact with multiple AI providers (OpenAI, Anthropic, Google AI) and potentially swap or add providers. We also need to support multiple storage backends and authentication providers in the future. Direct coupling to specific SDKs creates vendor lock-in.

### Decision

**Interface-driven provider abstraction.** Every external dependency is accessed through an interface defined in `application/ports/`. Infrastructure implementations live in `infrastructure/`.

```typescript
// application/ports/IAIModelProvider.ts
interface IAIModelProvider {
  complete(prompt: Prompt, options: ModelOptions): Promise<Result<Completion, AIError>>;
  supportsUseCase(useCase: UseCase): boolean;
}

// infrastructure/ai/OpenAIProvider.ts
class OpenAIProvider implements IAIModelProvider { ... }

// infrastructure/ai/AnthropicProvider.ts
class AnthropicProvider implements IAIModelProvider { ... }
```

This pattern applies to all external dependencies: repositories (`IPatientRepository`), auth (`IAuthRepository`), encryption (`IEncryptionService`), and audit logging (`IAuditLogger`).

### Consequences

**Positive:**

- AI providers can be swapped or added without changing application or domain code.
- Testing with in-memory doubles is deterministic and fast.
- New providers can be developed and evaluated in parallel.
- Model routing can fall back between providers transparently.

**Negative:**

- Adds abstraction overhead — interfaces must be designed up front.
- Provider-specific capabilities may not map cleanly to a common interface (mitigated by optional configuration in `ModelOptions`).
- Each new provider requires a new infrastructure implementation (acceptable overhead for 3–4 providers).

### Alternatives Considered

| Alternative                              | Why Rejected                                                                                        |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **Direct SDK usage in application code** | Tight coupling; swapping a provider requires rewriting use cases; untestable without network        |
| **LangChain / Vercel AI SDK**            | Adds dependency weight; opinionated abstractions may not fit our PHI de-identification pipeline     |
| **OpenAI-only (no abstraction)**         | Single-provider risk; missing clinical models from Google (MedLM) and Anthropic's safety advantages |
| **Custom provider protocol (gRPC)**      | Unnecessary complexity; REST/JSON SDKs are sufficient                                               |

---

## ADR-012: Folder Structure

### Status

Accepted

### Context

The codebase will grow to hundreds of files across multiple layers (domain, application, infrastructure, presentation, AI). A clear, enforceable folder structure is necessary to maintain separation of concerns, prevent circular dependencies, and onboard new engineers quickly.

### Decision

**Layered architecture with strict dependency direction.**

```
src/
├── domain/          → depends on nothing
├── application/     → depends on domain
├── infrastructure/  → depends on domain; implements application ports
├── ai/              → depends on domain; called from application
├── presentation/    → depends on application
├── lib/             → shared utilities (no layer dependency)
├── test/            → test utilities, factories, mocks
└── config/          → environment, feature flags
```

### Rules

1. `domain/` never imports from any other layer.
2. `application/` only imports from `domain/`.
3. `infrastructure/` implements interfaces from `application/ports/` and uses types from `domain/`.
4. `presentation/` only imports from `application/` and `domain/` (for types).
5. `ai/` is a cross-cutting capability — its types are in `domain/`, its prompts in `ai/prompts/`.
6. Barrel files only at the top of each layer and only for public exports.

### Consequences

**Positive:**

- Dependency direction is visible from import paths.
- Circular dependency detection is enforceable by lint rules.
- Tests can mock at any layer boundary.
- New engineers can understand the codebase by reading from `domain/` outward.

**Negative:**

- More files and directories than a flat structure (offset by clear organization).
- Adding a feature requires touching multiple layers (offset by the clarity it provides).
- Folder structure must be enforced by discipline and lint rules.

### Alternatives Considered

| Alternative                                                                                      | Why Rejected                                                                                        |
| ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| **Feature-based folders** (e.g., `features/patients/` containing components + hooks + API calls) | Cross-feature code sharing is messy; business logic is scattered; domain rules are not consolidated |
| **Flat structure** (all files in `src/`)                                                         | Does not scale beyond 20 files; no separation of concerns                                           |
| **Package-based monorepo** (Nx, Turborepo: `packages/domain`, `packages/ui`)                     | Over-engineering for a 3-person team; can migrate later if the codebase warrants it                 |
| **MVC (models, views, controllers)**                                                             | Outdated web pattern; blurs domain vs. application boundaries                                       |

---

## ADR-013: State Management

### Status

Accepted

### Context

The React application needs to manage three categories of state: server data (Firestore), client/UI state (current patient, search filter, sidebar), and form state (patient creation, note editing). These have different lifecycles, caching needs, and synchronization requirements.

### Decision

**Three-state strategy: React Query for server state, Zustand for client state, React Hook Form for form state.**

- **React Query (TanStack Query):** All Firestore reads go through query hooks. Provides caching, background refetching, optimistic updates, and offline persistence. Server state is never duplicated in client stores.
- **Zustand:** Ephemeral UI state (sidebar open/close, active tab, draft note content, theme). One store per domain aggregate. Stores are testable in isolation.
- **React Hook Form + Zod:** Form state is local to the form component. Zod schemas (defined in `domain/`) provide runtime validation and TypeScript types.
- **URL state (React Router):** Navigation state (selected patient ID, search query, active tab) lives in the URL for deep-linking. React Router parses and provides this to components.

### Consequences

**Positive:**

- Clear ownership — each piece of state has exactly one home.
- React Query handles the hardest parts of server state (cache invalidation, refetch, optimistic updates).
- Zustand stores are simple, testable, and have no React dependency.
- Offline support comes almost for free with React Query's persistence plugin.
- URL state enables deep-linking and browser back/forward.

**Negative:**

- Three state libraries instead of one (offset by each being the best tool for its job).
- React Query's stale-while-revalidate model requires understanding (documented in onboarding).
- Zustand selectors must be used carefully to avoid unnecessary re-renders (enforced by lint rule).

### Alternatives Considered

| Alternative                 | Why Rejected                                                                                               |
| --------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Redux (Toolkit or Saga)** | Heavy boilerplate for a use case that React Query + Zustand handle with less code                          |
| **React Context only**      | Performance issues with frequent updates; no caching/refetching story for server data                      |
| **Jotai / Recoil**          | Atomic state model is elegant but Zustand's store model is simpler and better tested at scale              |
| **MobX**                    | Observable-based reactivity is powerful but opaque; decorator usage conflicts with our TypeScript strategy |
| **Apollo Client**           | GraphQL-first; our data layer is Firestore SDK, not GraphQL                                                |
| **SWR**                     | Similar to React Query but less mature, fewer features (no mutation helpers, less offline support)         |

---

## ADR-014: API Boundary

### Status

Accepted

### Context

The system needs a clear boundary between client and server. The client (React SPA) accesses Firestore directly for CRUD via the Firestore SDK. Operations requiring server-side trust (AI, FHIR, HL7, admin, secrets) must go through an API layer.

### Decision

**Dual API model: Firestore SDK for CRUD, Cloud Functions callables for trusted operations.**

- **Firestore SDK (client-side):** Used for all CRUD operations on patient records, clinical notes, and tenant configuration. Access is governed by Firestore security rules which enforce tenant isolation and RBAC.
- **Cloud Functions callables:** Used for AI inference, FHIR API, HL7 ingestion, tenant provisioning, user invitation, and audit log queries. These require the Admin SDK or access to secrets.
- **FHIR REST API (V3):** Exposed via `onRequest` Cloud Functions for external system integration. Authenticated via API keys.

### API Design Principles

- Callable functions accept typed input, return `Result<T, DomainError>`.
- All inputs are validated with Zod at the function boundary.
- Errors are structured and never leak implementation details.
- No PHI is returned in error messages.

### Consequences

**Positive:**

- Latency-critical reads (patient search) avoid the Cloud Function hop — direct Firestore reads are faster.
- Security rules enforce authorization at the data tier — no application-layer bypass possible.
- Cloud Functions are reserved for operations that genuinely need server trust — fewer functions to maintain and deploy.
- Client SDK handles offline persistence, real-time listeners, and caching automatically.

**Negative:**

- Two API paradigms (SDK + callables) requires discipline about which operations use which path.
- Firestore SDK exposes query capabilities to the client — complex queries must be supported by indexes and rules.
- Direct Firestore access means the data model is partially visible to the client (mitigated by security rules preventing unauthorized reads).

### Alternatives Considered

| Alternative                                              | Why Rejected                                                                                                  |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **All operations through Cloud Functions**               | Adds ~200ms latency to every read; loses Firestore SDK offline/real-time features; more functions to maintain |
| **All operations through Firestore SDK**                 | Cannot secure AI API keys; no server-side validation beyond rules; no FHIR/HL7 ingestion possible             |
| **GraphQL gateway (Apollo Server on Cloud Functions)**   | Adds complexity; Firestore queries are simple enough that GraphQL's flexibility isn't needed                  |
| **REST API (Express on Cloud Functions) for everything** | Loses Firestore SDK benefits; more code to write and maintain for basic CRUD                                  |

---

## ADR-015: Security Model

### Status

Accepted

### Context

The system stores Protected Health Information (PHI) and must comply with HIPAA. Security is not a feature — it is a foundational constraint that must be designed into every layer.

### Decision

**Defense in depth across five layers.**

1. **Transport Security:** TLS 1.3+ for all communications. HSTS headers. Content Security Policy (CSP) headers to prevent XSS.
2. **Authentication:** Firebase Auth with mandatory MFA. Short-lived tokens. Session timeout after 15 minutes of inactivity.
3. **Authorization:** Custom claims (tenantId, role, permissions). Firestore rules enforce tenant-scoping and field-level write validation. RBAC gates Cloud Function access.
4. **Data Protection:** Encryption at rest (Firestore/Cloud Storage default). Encryption in transit (TLS). PHI fields tagged with `@PHI` JSDoc. No PHI in client-side logs, localStorage, error reports, or analytics. API keys in Secret Manager.
5. **Monitoring & Audit:** Immutable, append-only audit log for all PHI access. Structured logging in Cloud Logging. Anomaly detection alerts. Annual penetration testing.

### Key Rules

- Every Firestore document read/write is gated by `resource.data.tenantId == request.auth.claims.tenantId`.
- Write rules validate field types and required fields.
- No wildcard access to any collection.
- Audit log entries are append-only (no update, no delete).
- Super-admin operations only via Cloud Functions with Admin SDK.

### Consequences

**Positive:**

- Defense in depth means a single layer failure does not compromise the system.
- Firestore rules provide data-tier enforcement that cannot be bypassed by application code.
- Audit trail provides compliance evidence and forensic capability.
- MFA + session management reduces credential-based attack surface.

**Negative:**

- Security adds latency (token verification, rules evaluation, audit writes).
- Audit log volume grows with usage (mitigated by cold storage archival in V3+).
- Security rules are a domain-specific language — engineers must learn and test them carefully.

### Alternatives Considered

| Alternative                          | Why Rejected                                                                        |
| ------------------------------------ | ----------------------------------------------------------------------------------- |
| **Application-layer auth only**      | No data-tier enforcement; a bug in application code exposes all data                |
| **No MFA**                           | HIPAA requires multi-factor authentication for remote access                        |
| **Encrypt PHI at application layer** | Added complexity without clear benefit over Firestore's built-in encryption at rest |
| **Third-party audit log service**    | Adds cost and integration complexity; Firestore audit sub-collection is sufficient  |

---

## ADR-016: Validation Strategy

### Status

Accepted

### Context

Data entering the system must be validated at multiple levels: client forms, API inputs, Firestore writes, and domain entity construction. Invalid data could corrupt clinical records or bypass security rules.

### Decision

**Multi-layer validation with Zod as the single schema source.**

1. **Domain layer:** Zod schemas define the shape and constraints of all entities and value objects. These are the single source of truth.
2. **Form validation:** React Hook Form integrates with Zod schemas for client-side validation before submission.
3. **Function input validation:** Cloud Function middleware validates all incoming data against Zod schemas before executing use cases.
4. **Firestore rule validation:** Security rules validate field types (`request.resource.data.name is string`) and required fields (`request.resource.data.keys().hasAll(['tenantId', 'firstName'])`).

### Schema Hierarchy

```typescript
// domain/patient/Patient.ts
export const PatientSchema = z.object({
  id: PatientIdSchema,
  tenantId: TenantIdSchema,
  demographics: DemographicsSchema,
  contact: ContactSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  archived: z.boolean().default(false),
});
export type Patient = z.infer<typeof PatientSchema>;
```

### Consequences

**Positive:**

- One schema definition generates both TypeScript types and runtime validation.
- Validation failures are caught at the earliest possible layer.
- Firestore rules provide a final safety net for write validation.
- Error messages are user-friendly and field-specific.

**Negative:**

- Zod schemas must be maintained in sync with Firestore rules (partially redundant but defense in depth).
- Large schemas for complex entities (Patient with all sub-collections) can be verbose.
- Zod's runtime validation has a small performance cost (negligible for form and API inputs).

### Alternatives Considered

| Alternative                             | Why Rejected                                                                                           |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Yup**                                 | Similar to Zod but less TypeScript integration; Zod's `z.infer` is superior                            |
| **Joi**                                 | Not TypeScript-native; less ergonomic type inference                                                   |
| **Manual validation**                   | Error-prone; no type inference; duplicated validation logic                                            |
| **JSON Schema**                         | More verbose than Zod; less TypeScript-native; better for API documentation but worse for code         |
| **Class-validator + class-transformer** | Decorator-based; requires experimental TypeScript features; conflicts with our functional domain model |

---

## ADR-017: Logging & Audit Trail

### Status

Accepted

### Context

HIPAA requires an audit trail of all PHI access and modification. We also need operational logging for debugging, monitoring, and alerting. These have different requirements: audit logs are immutable, structured, and queryable; operational logs are for real-time monitoring and debugging.

### Decision

**Dual logging strategy: Firestore for audit trail, Cloud Logging for operations.**

- **Audit Trail (Firestore):** Append-only sub-collection (`audit/{tenantId}/`). Every PHI access (read, create, update, export) writes an audit entry with: who, what, when, tenant, action, outcome, and metadata. Audit entries are immutable (security rules deny update/delete). Queried by tenant admins for compliance.
- **Operational Logging (Cloud Logging):** Structured JSON logs from Cloud Functions and client SDK. Tracks function invocations, errors, latencies, and non-PHI events. Feeds into Cloud Monitoring for dashboards and alerts.
- **PHI Rule:** No PHI in operational logs. Lint rules enforce `@PHI`-tagged fields are never passed to `console.log`, error reporters, or analytics.

### Consequences

**Positive:**

- Audit trail is a first-class data structure, not a log side-effect.
- Immutable audit entries provide non-repudiation for compliance.
- Operational logs are optimized for search and alerting (Cloud Logging).
- Separation of concerns — audit trail lives in the primary database; operational logs in the monitoring stack.

**Negative:**

- Every PHI operation requires an additional Firestore write (audit entry) — increases write volume and cost.
- Audit trail grows unbounded (mitigated by configurable retention and archival to BigQuery/Cold Storage in V3+).
- Two logging systems to maintain and understand.

### Alternatives Considered

| Alternative                                     | Why Rejected                                                                             |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------- |
| **Cloud Logging only for audit**                | Logs can be deleted; no immutability guarantee; harder to query by tenant for compliance |
| **Third-party audit service (Datadog, Splunk)** | Adds cost and integration complexity; audit data should live in the primary database     |
| **Blockchain-anchored audit** (V5 research)     | Over-engineering for HIPAA compliance; Firestore's immutability rules are sufficient     |
| **Firestore triggers to BigQuery**              | Good for analytics but not for real-time audit querying by tenant admins                 |

---

## ADR-018: Error Handling

### Status

Accepted

### Context

Operations in a healthcare application can fail for many reasons: network errors, validation failures, authorization denials, AI timeouts, and Firestore unavailability. Error handling must be consistent, type-safe, and user-friendly without leaking implementation details.

### Decision

**Result<T, E> pattern for domain errors; exceptions for infrastructure failures.**

- **Domain errors:** Returned as `Result<T, DomainError>`. Domain errors include `NotFound`, `ValidationError`, `Unauthorized`, `TenantMismatch`, `ConsentRequired`. These are expected failure modes that the application handles gracefully.
- **Infrastructure errors:** Thrown as exceptions (`NetworkError`, `FirestoreError`, `AITimeout`, `RateLimited`). Caught by error boundaries or middleware and mapped to user-facing messages.
- **The rule:** Never throw from domain logic. Throwing is reserved for truly exceptional conditions in infrastructure.

### Error Flow

1. Repository returns `Result<T, DomainError>` for expected failures, throws `InfrastructureError` for unexpected.
2. Application service catches infrastructure errors, may retry or re-throw.
3. Cloud Function middleware catches all errors, logs them, and returns structured error responses to the client.
4. Client error boundaries catch unhandled exceptions and display recovery UI.

### Consequences

**Positive:**

- Type-safe error handling — callers must handle domain errors (TypeScript enforces `Result` unwrapping).
- Clear distinction between expected failures (domain) and unexpected failures (infrastructure).
- No swallowed errors — every error path is explicit.
- Infrastructure errors are isolated and don't leak to domain logic.

**Negative:**

- `Result<T, E>` adds verbosity to function signatures and call sites.
- Engineers must learn the pattern (mitigated by documentation and examples).
- Some Firebase SDK methods throw; must be wrapped in repository implementations.

### Alternatives Considered

| Alternative                   | Why Rejected                                                                                  |
| ----------------------------- | --------------------------------------------------------------------------------------------- |
| **Exceptions for everything** | No compile-time enforcement of error handling; domain errors mixed with infrastructure errors |
| **Error codes (C-style)**     | Not type-safe; no distinction between error categories; awkward in TypeScript                 |
| **Either monad (fp-ts)**      | Powerful but heavy; steep learning curve for the team; `Result<T, E>` is simpler              |
| **try-catch everywhere**      | Verbose; no type-level distinction between error types                                        |

---

## ADR-019: CI/CD Strategy

### Status

Accepted

### Context

We need automated quality gates (lint, typecheck, test, build) and deployment pipelines for staging and production. The pipeline must run Firestore rules tests and AI prompt evaluations in addition to standard checks.

### Decision

**GitHub Actions for CI/CD with staged deployment.**

- **CI Pipeline (on every PR and push to `main`):**
  1. Lint (`eslint`)
  2. Typecheck (`tsc --noEmit`)
  3. Unit tests (`vitest run`)
  4. Firestore rules tests (emulator)
  5. AI prompt evaluations
  6. Build (`vite build` + `tsc` for functions)
- **CD Pipeline:**
  - **Staging:** Auto-deploy on merge to `main`.
  - **Production:** Manual trigger via GitHub Releases (semantic versioning).

### Quality Gates

- All CI steps must pass before merge.
- `npm audit` runs on every CI run; critical/high vulnerabilities block deployment.
- Firestore rules tests must have 100% coverage of access patterns.
- AI prompt evals must meet minimum accuracy thresholds.

### Consequences

**Positive:**

- Consistent quality checks on every change.
- Automated deployment eliminates manual release errors.
- Firestore rules and AI evals are treated as first-class test suites.
- Staging environment enables pre-production validation and beta testing.

**Negative:**

- CI pipeline takes 5–8 minutes (acceptable for a 3-person team; can optimize with caching).
- Emulator-based tests require emulator setup in CI (one-time configuration).
- AI evals may be flaky (non-deterministic LLM outputs); thresholds account for variance.

### Alternatives Considered

| Alternative                             | Why Rejected                                                                            |
| --------------------------------------- | --------------------------------------------------------------------------------------- |
| **GitLab CI**                           | Repository is on GitHub; no benefit to switching                                        |
| **CircleCI / Jenkins**                  | More configuration overhead; GitHub Actions is sufficient and free for public repos     |
| **No staging environment**              | Risky — all changes go directly to production; staging catches integration issues       |
| **Continuous deployment to production** | Healthcare software requires manual release approval for compliance and risk management |

---

## ADR-020: Deployment Strategy

### Status

Accepted

### Context

We need to deploy the React SPA, Cloud Functions, Firestore rules, indexes, and storage rules to Firebase. Deployment must be reliable, repeatable, and support rollback.

### Decision

**Firebase-native deployment with GitHub Actions orchestration.**

- **Deployment targets:**
  - `firebase deploy --only hosting` → SPA to Firebase Hosting (global CDN).
  - `firebase deploy --only functions` → Cloud Functions (2nd gen).
  - `firebase deploy --only firestore:rules` → Firestore security rules.
  - `firebase deploy --only firestore:indexes` → Composite indexes.
  - `firebase deploy --only storage` → Cloud Storage security rules.

- **Environments:**
  - **Local:** Emulator suite (`firebase emulators:start`).
  - **Staging:** `ai-patient-dbms-staging` Firebase project.
  - **Production:** `ai-patient-dbms-prod` Firebase project.

- **Rollback:** Redeploy previous version (tagged in Git). Hosting can be rolled back with `firebase hosting:clone`.

### Deployment Flow

1. PR merged to `main` → CI passes → auto-deploy to staging.
2. Staging is smoke-tested (automated + manual).
3. Release is cut (GitHub Release with semver tag).
4. Manual approval triggers production deployment.
5. Post-deployment monitoring for 1 hour.

### Consequences

**Positive:**

- Firebase CLI handles all deployment complexity.
- Hosting deploys are atomic — no downtime during SPA updates.
- Functions deploy with traffic splitting (2nd gen) for gradual rollout.
- Rollback is a single command for each component.

**Negative:**

- Firebase CLI is a black box — debugging deployment failures requires understanding Firebase internals.
- Firestore indexes can take minutes to build; deployment may appear complete before indexes are ready.
- Production and staging are separate Firebase projects with separate configurations (mitigated by configuration-as-code and environment variable templates).

### Alternatives Considered

| Alternative                    | Why Rejected                                                                             |
| ------------------------------ | ---------------------------------------------------------------------------------------- |
| **Docker + Kubernetes (GKE)**  | Massive operational overhead; serverless Cloud Functions eliminate container management  |
| **Vercel + Supabase**          | Not HIPAA-eligible; mixed vendor stack complicates compliance                            |
| **Terraform / Pulumi (IaC)**   | Firebase doesn't have strong IaC support; CLI-based deployment is the idiomatic approach |
| **Manual deployment**          | Error-prone; no repeatability; violates CI/CD principles                                 |
| **Feature branch deployments** | Adds complexity; staging on merge to main is sufficient for team size                    |
