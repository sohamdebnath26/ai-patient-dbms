# AGENTS.md — Engineering Guide for AI Patient DBMS

## 1. Project Vision

AI Patient DBMS is a multi-tenant, AI-augmented patient database management system built for healthcare providers. It replaces legacy EHR silos with a modern, Firestore-backed platform that enables:

- **Intelligent patient record management** with structured and unstructured data.
- **AI-assisted clinical workflows** including summarization, coding, and decision support.
- **Secure multi-tenancy** so hospitals, clinics, and independent practices share infrastructure without data leakage.
- **Compliance-first architecture** targeting HIPAA, GDPR, and SOC 2 controls.
- **API-first design** enabling EHR/HL7 FHIR interoperability and third-party integrations.

The system is designed for scale: small clinics start with a single tenant; large health systems span dozens of tenants with cross-facility data sharing governed by explicit consent.

---

## 2. Engineering Principles

1. **TypeScript first.** All application code is written in strict-mode TypeScript. No `any` without an explicit escape hatch and a comment.
2. **Component-driven UI.** Every UI element is a composable, testable component. No inline styles, no ad-hoc markup.
3. **Immutable state.** State transitions happen through well-defined actions/reducers. Direct mutation is forbidden.
4. **Fail loudly.** Validation, error boundaries, and type guards surface problems at development time, not in production.
5. **Offline-capable.** The application must degrade gracefully when connectivity drops. Critical workflows (viewing cached records) work offline.
6. **Test behavior, not implementation.** Tests assert user-visible outcomes. Implementation details are private.
7. **Security by default.** Every query, every API call, every Firestore read/write is subject to tenant-scoped authorization. There is no "admin bypass" in application code.
8. **Measurable performance.** Core user journeys (patient search, record open, AI summary generation) must complete within defined latency budgets.

---

## 3. Architecture Rules

1. **Layered architecture.** The codebase is organized into distinct layers with strict dependency direction:
   - `presentation` (UI components, pages) → depends on `application`
   - `application` (use cases, state management) → depends on `domain`
   - `domain` (entities, value objects, aggregates) → depends on nothing
   - `infrastructure` (Firebase, APIs, persistence) → depends on `domain`; implements interfaces from `application`
   - `ai` (ML models, prompts, inference pipelines) → depends on `domain`; called from `application`
2. **Domain model is the single source of truth.** All business rules live in `domain`. No business logic in components, hooks, or Firestore calls.
3. **Interface-driven infrastructure.** Every external dependency (Firestore, Auth, AI provider) is accessed through an interface defined in `application`. This enables testing with in-memory doubles and swapping providers without changing business logic.
4. **No circular dependencies.** Lint rules enforce this at the file and module level.
5. **Side effects at the edges.** Components and hooks never call Firebase or AI services directly. They dispatch commands/hooks to application-layer services which orchestrate infrastructure calls.

---

## 4. Folder Structure

```
ai-patient-dbms/
├── src/
│   ├── domain/                  # Entities, value objects, domain services, aggregates
│   │   ├── patient/
│   │   ├── clinical/
│   │   ├── tenant/
│   │   ├── auth/
│   │   └── shared/
│   ├── application/             # Use cases, state management, ports (interfaces)
│   │   ├── patient/
│   │   ├── clinical/
│   │   ├── ai/
│   │   ├── tenant/
│   │   └── ports/
│   ├── infrastructure/          # Firebase, AI provider, encryption, external APIs
│   │   ├── firebase/
│   │   ├── ai/
│   │   ├── encryption/
│   │   └── http/
│   ├── presentation/            # React components, pages, hooks, design system
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   └── design-system/
│   ├── ai/                      # AI-specific: prompt templates, model configs, pipelines, evaluation
│   │   ├── prompts/
│   │   ├── models/
│   │   ├── pipelines/
│   │   └── evaluation/
│   ├── lib/                     # Shared utilities, constants, type helpers
│   ├── test/                    # Test utilities, fixtures, factories, mocks
│   └── config/                  # Environment configuration, feature flags
├── functions/                   # Firebase Cloud Functions (backend API, AI orchestration)
│   └── src/
│       ├── api/
│       ├── ai/
│       ├── triggers/
│       └── middleware/
├── firestore/                   # Firestore rules, indexes, schema definitions
│   ├── firestore.rules
│   ├── firestore.indexes.json
│   └── schema/
├── docs/                        # Project documentation
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── ROADMAP.md
│   └── DECISIONS.md
├── e2e/                         # End-to-end tests
├── .github/                     # CI/CD workflows
├── AGENTS.md                    # This file
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

### Folder Rules

1. **No cross-cutting imports.** `domain` must never import from `application`, `infrastructure`, `presentation`, or `ai`.
2. **One domain aggregate per directory.** `/domain/patient/` contains `Patient`, `PatientRepository` interface, and related value objects. No other aggregate lives there.
3. **Presentation components are organized by feature**, not by type. `/presentation/pages/patients/` contains all components needed for the patient list page.
4. **Shared UI primitives** (Button, Input, Modal, Card) live in `/presentation/design-system/`.
5. **Each hook is a single file** in `/presentation/hooks/` named for what it does (e.g., `usePatientSearch.ts`, `useClinicalSummary.ts`).
6. **No barrel files** except at the top of each layer (`domain/index.ts`, `application/index.ts`) and only for public exports.
7. **Firebase Functions** follow the same layered architecture. Functions are thin controllers that delegate to application-layer services.

---

## 5. State Management Rules

1. **Zustand for client state.** All application state (current patient, search results, UI state) is managed in Zustand stores scoped to their domain.
2. **React Query for server state.** All Firestore reads and API calls go through React Query (TanStack Query). This provides caching, background refetching, optimistic updates, and offline support.
3. **Derived state is computed, not stored.** Use selectors and computed values. Never store the same data in two places.
4. **Store conventions:**
   - One store per domain aggregate (e.g., `usePatientStore`, `useClinicalStore`).
   - Stores export actions, never raw `setState`.
   - Stores are testable in isolation with no React dependency.
5. **Form state** is managed with React Hook Form + Zod validation schemas defined in `domain`.
6. **URL state** (search params, selected patient ID) is the source of truth for navigation. Deep-linking must work for every detail view.

---

## 6. Firebase Rules

1. **Firestore is the primary database.** No SQL database is used. Firestore's document model maps cleanly to domain aggregates.
2. **Sub-collections for nested data.** Patient → visits, encounters, notes, attachments are sub-collections, not nested maps.
3. **Composite indexes** are declared in `firestore/firestore.indexes.json`. Every query in the application must have a corresponding index. Run queries in the emulator before deploying.
4. **Firestore Security Rules:**
   - All rules are tenant-scoped: `resource.data.tenantId == request.auth.claims.tenantId`.
   - Rules are tested with the Firestore Rules Unit Test framework.
   - No rule grants wildcard access to any collection.
   - Write rules validate field-level constraints (e.g., `request.resource.data.diagnosis is string`).
5. **Firebase Auth** with custom claims for tenant membership and role (provider, nurse, admin, super-admin).
6. **Cloud Functions** for operations that require server-side trust: AI inference orchestration, FHIR conversion, audit log ingestion, cross-tenant operations.
7. **Local emulator suite** (Auth, Firestore, Functions) is used for all development and testing. Nobody connects to production Firebase during development.

---

## 7. AI Rules

1. **AI is a capability, not a feature.** Each AI-powered function (summarization, coding, decision support) is a distinct use case in `application/ai/` with clear inputs, outputs, and error modes.
2. **Prompt templates** are version-controlled in `src/ai/prompts/`. Every prompt has a version, a description, expected input schema, and expected output schema.
3. **Model routing** is configured through `src/ai/models/`. The system supports multiple providers (OpenAI, Anthropic, Google AI) and models are selected per-use-case based on latency, cost, and capability requirements.
4. **AI outputs are suggestions, not decisions.** Every AI-generated artifact is presented to a clinician for review. Audit trails track what was suggested vs. what was accepted.
5. **Prompt evaluation** is mandatory. Every prompt template has a corresponding eval suite in `src/ai/evaluation/`. Eval results are checked into the repo.
6. **HIPAA compliance for AI:**
   - No PHI is sent to AI providers unless the provider has a BAA in place.
   - AI calls go through Cloud Functions, never from the client.
   - PHI is de-identified before leaving the tenant boundary whenever possible.
7. **AI latency budget:** AI-assisted features must respond within 5 seconds. Long-running AI tasks (batch processing) are handled asynchronously with progress indicators.

---

## 8. Multi-Tenant Rules

1. **Tenant isolation is mandatory.** No tenant can ever access another tenant's data. This is enforced at three levels:
   - **Firestore rules** (data-tier): Every document read/write is filtered by `tenantId`.
   - **Application layer** (logic-tier): Every repository query includes a `tenantId` filter. No generic "list all X" endpoint exists.
   - **Auth custom claims** (identity-tier): Tenant ID is embedded in the JWT and validated on every request.
2. **Tenant schema is shared, data is partitioned.** All tenants use the same Firestore collections. Tenant isolation is achieved through document fields and rules, not separate databases per tenant.
3. **Cross-tenant data sharing** requires explicit patient consent modeled as a `Consent` domain object. Data is not moved or copied; access is gated through consent verification.
4. **Tenant configuration** (features, branding, AI model preferences) is stored in `tenants/{tenantId}/config`.
5. **Super-admin operations** (tenant provisioning, global audit) are accessible only through Cloud Functions with admin SDK, never through client SDK.

---

## 9. Security Rules

1. **Authentication first.** Every route, every Firestore query, every Cloud Function call requires authenticated identity. No anonymous access for any operation.
2. **Principle of least privilege.** Users only access the data and operations their role permits. RBAC is defined in `domain/auth/` with explicit role → permission mappings.
3. **PHI handling:**
   - PHI is never logged to console, stored in `localStorage`, or sent to third-party analytics.
   - PHI fields are tagged in the domain model (e.g., `@PHI` in JSDoc) so lint rules can enforce handling.
   - Encryption at rest is handled by Firestore. Encryption in transit is mandatory (TLS 1.3+).
4. **API keys and secrets** are stored in Firebase Secret Manager (Cloud Functions config). Never in environment files, source code, or client bundles.
5. **Audit trail:** Every access and modification of PHI is logged to an append-only `audit/{tenantId}/` sub-collection. Audit records include: who, what, when, tenant, and outcome.
6. **Session management:** Token refresh is handled by Firebase Auth SDK. Custom claims are refreshed on login and propagate within 1 hour.
7. **Dependency audit:** `npm audit` on every CI run. Critical/high vulnerabilities block deployment.

---

## 10. Code Style

1. **TypeScript strict mode.** `strict: true` in `tsconfig.json`. No exceptions.
2. **Prettier for formatting.** Single configuration at root. No per-file overrides.
3. **ESLint** with `typescript-eslint` recommended rules plus custom rules for:
   - No direct Firestore access from components.
   - No `any` without `// eslint-disable-next-line` and a comment.
   - Domain-layer-only imports from domain.
4. **Naming conventions:**
   - Files: `kebab-case.ts` for modules, `PascalCase.tsx` for React components.
   - Variables and functions: `camelCase`.
   - Types and interfaces: `PascalCase`.
   - Constants: `UPPER_SNAKE_CASE`.
   - Domain entities: `PascalCase` (e.g., `Patient`, `ClinicalNote`).
   - Value objects: `PascalCase` (e.g., `PatientId`, `DiagnosisCode`).
5. **Functions are small.** Target under 20 lines. Extract helpers when logic grows.
6. **No default exports.** All exports are named. This enables better tree-shaking and IDE autocompletion.
7. **Error handling:** Use a `Result<T, E>` pattern (or `Either`) for operations that can fail. Never throw from domain logic. Throwing is reserved for truly exceptional conditions in infrastructure.
8. **Comments explain "why," not "what."** Code should be readable. Comments are for design intent, tradeoffs, and non-obvious behavior.

---

## 11. Git Workflow

1. **Trunk-based development.** `main` is always deployable. Feature branches are short-lived (under 3 days).
2. **Branch naming:** `feat/<description>`, `fix/<description>`, `chore/<description>`, `docs/<description>`.
3. **Commit format:** Conventional Commits — `type(scope): description`. Types: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `perf`. Scope is the domain (e.g., `feat(patient): add allergy search`).
4. **Squash and merge** into `main`. Linear history.
5. **CI must pass** before merging: lint, typecheck, unit tests, Firestore rules tests, AI prompt evals.
6. **No commit of generated files.** Build artifacts, `.env` files, IDE settings are gitignored.
7. **Branch protection on `main`:** require PR, require passing CI, require at least one review.

---

## 12. Documentation Rules

1. **AGENTS.md** (this file) — the engineering guide. All contributors read it before writing code.
2. **PRD.md** (`docs/PRD.md`) — product requirements, user personas, MVP scope, success metrics.
3. **ARCHITECTURE.md** (`docs/ARCHITECTURE.md`) — final architecture, technology choices, data model, deployment diagram.
4. **ROADMAP.md** (`docs/ROADMAP.md`) — versioned roadmap with milestones and acceptance criteria.
5. **DECISIONS.md** (`docs/DECISIONS.md`) — architecture decision records (ADRs) for every major technical decision.
6. **README.md** — brief project overview, quick-start instructions, link to full docs.
7. **Code documentation:** Every domain entity, use case, port interface, and public function has a JSDoc comment describing its purpose, inputs, outputs, and edge cases.
8. **Diagrams** are stored as Mermaid source in markdown files. No binary image files.

---

## 13. AI Agent Rules

1. **Agents follow AGENTS.md.** Every AI coding agent working on this project must read and follow this document. No exceptions.
2. **Scope-locked changes.** An agent changes only the files necessary for the task. No opportunistic refactoring of unrelated code.
3. **Verify, don't assume.** Agents must read existing code before modifying it. Agents run `tsc --noEmit`, `eslint`, and `vitest` after making changes.
4. **Explicit file creation.** Agents never create files beyond the scope of the assigned task. When generating documentation, agents create only the specified files.
5. **No hallucinated APIs.** Agents must verify library APIs by reading `node_modules/<package>/package.json` or its type definitions. No guessing.
6. **Commit atomicity.** Each commit is a single logical change with a conventional commit message. Agents do not commit without explicit instruction.
7. **Security awareness.** Agents never generate hardcoded secrets, never weaken Firestore rules, and never bypass tenant scoping.

---

## 14. Startup Rules

1. **First-time setup:**
   ```bash
   git clone <repo>
   cd ai-patient-dbms
   npm install
   npx firebase emulators:start
   npm run dev
   ```
2. **Node.js ≥ 20, npm ≥ 10.**
3. **Firebase project** must be configured with Blaze (pay-as-you-go) plan for Cloud Functions.
4. **Local emulators** (Auth, Firestore, Functions) are started with `npm run emulators`.
5. **Environment:** Copy `.env.example` to `.env.local` and populate only the values needed for local development. Production secrets go in Firebase Secret Manager.
6. **Run tests before committing:** `npm run test:all` (unit + integration + Firestore rules + AI evals).
7. **Start work by reading:** `AGENTS.md` → `docs/ARCHITECTURE.md` → `docs/PRD.md`.

---

## 15. Definition of Done

A feature or story is **done** when:

1. **Code complete:** Implementation matches the acceptance criteria.
2. **Type-safe:** `tsc --noEmit` passes with zero errors.
3. **Lint clean:** `eslint` passes with zero warnings.
4. **Tested:**
   - Unit tests for domain logic and application use cases.
   - Integration tests for repository implementations against Firestore emulator.
   - Firestore security rules tests for any new or modified access patterns.
   - AI prompt evaluation for any new or modified prompts.
   - E2E test for the happy path (if the feature touches the UI).
5. **Accessible:** All UI components meet WCAG 2.1 AA. Keyboard navigation, screen reader labels, focus management.
6. **Documented:**
   - JSDoc on public APIs.
   - ADR in `DECISIONS.md` if a new architectural decision was made.
   - README or docs updated if developer-facing setup changed.
7. **Reviewed:** At least one approving review.
8. **Deployed and verified:** Feature is deployed to staging, smoke-tested, and behaves as expected.
