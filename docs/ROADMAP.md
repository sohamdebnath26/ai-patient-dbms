# Roadmap — AI Patient DBMS

**Version:** 1.1
**Status:** Living Document
**Last Updated:** 2026-08-10
**Owner:** Engineering Team

---

## 1. Vision Timeline

```
2026 Q3 ─────────── 2026 Q4 ─────────── 2027 Q1 ─────────── 2027 Q2 ─────────── 2027 Q3+
   │                   │                   │                   │                   │
   ▼                   ▼                   ▼                   ▼                   ▼
┌──────┐    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ MVP  │    │ V2 Clinical  │  │ V3 Connect   │  │ V4 AI        │  │ V5 Scale     │
│ V1.0 │───▶│   Depth      │─▶│   + FHIR     │─▶│   Advanced   │─▶│   Enterprise  │
│      │    │   V2.0       │  │   V3.0       │  │   V4.0       │  │   V5.0       │
└──────┘    └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
Weeks 1-12   Weeks 13-24       Weeks 25-36       Weeks 37-48       Weeks 49+
```

### Version Cadence

| Version                   | Timeline    | Duration | Theme                                                                           |
| ------------------------- | ----------- | -------- | ------------------------------------------------------------------------------- |
| **V1.0 — MVP**            | Weeks 1–12  | 12 weeks | Foundation: patient management, SOAP notes, AI summarization, multi-tenancy     |
| **V2.0 — Clinical Depth** | Weeks 13–24 | 12 weeks | Structured clinical data, AI coding, medications, allergies, labs               |
| **V3.0 — Connect**        | Weeks 25–36 | 12 weeks | FHIR API, HL7 ingestion, webhooks, third-party integrations                     |
| **V4.0 — AI Advanced**    | Weeks 37–48 | 12 weeks | Differential diagnosis, semantic search, voice-to-note, discharge summaries     |
| **V5.0 — Scale**          | Weeks 49+   | Ongoing  | Cross-tenant sharing, SOC 2, SSO, analytics, multi-region, enterprise readiness |

---

## 2. Development Phases

| Phase   | Name                  | Weeks | Team Size      | Budget Profile                             |
| ------- | --------------------- | ----- | -------------- | ------------------------------------------ |
| Phase 0 | Foundation & Setup    | 0–2   | 3 engineers    | Minimal — tooling, emulator setup          |
| Phase 1 | MVP Core              | 3–8   | 3–5 engineers  | Burn — active feature development          |
| Phase 2 | MVP Polish + Beta     | 9–12  | 5 engineers    | Stable — testing, hardening, documentation |
| Phase 3 | Clinical Depth (V2)   | 13–24 | 5–7 engineers  | Growth — expanding team and scope          |
| Phase 4 | Interoperability (V3) | 25–36 | 7 engineers    | Growth — FHIR, HL7 specialists             |
| Phase 5 | AI Advanced (V4)      | 37–48 | 7–9 engineers  | Growth — AI/ML specialists                 |
| Phase 6 | Enterprise Scale (V5) | 49+   | 8–10 engineers | Steady-state — maintenance + feature       |

---

## 3. MVP Definition

### 3.1 MVP Goal

A single independent clinic can onboard, add patients, write clinical notes, use AI summarization, and operate securely within their tenant — entirely self-service over a 2-week period.

### 3.2 MVP Feature Set

| #    | Feature                                                     | Priority |
| ---- | ----------------------------------------------------------- | -------- |
| M-01 | Firebase project + emulator suite operational               | P0       |
| M-02 | Domain model: Patient, ClinicalNote, Tenant, User           | P0       |
| M-03 | Firestore data model + security rules (tenant-scoped)       | P0       |
| M-04 | Firebase Auth with email/password + MFA                     | P0       |
| M-05 | Custom claims (tenantId, role)                              | P0       |
| M-06 | Patient CRUD: create, read, update, search, archive         | P0       |
| M-07 | Patient search with fuzzy matching (name, DOB, MRN)         | P0       |
| M-08 | SOAP note creation and editing                              | P0       |
| M-09 | AI summarization (generate SOAP note from visit transcript) | P0       |
| M-10 | Audit trail for all PHI access                              | P0       |
| M-11 | Tenant provisioning (Cloud Function)                        | P0       |
| M-12 | User invitation and role assignment per tenant              | P1       |
| M-13 | Responsive UI: patient list, patient detail, note editor    | P0       |
| M-14 | Tenant admin panel: users, basic settings                   | P1       |
| M-15 | Offline read support (cached patient records)               | P1       |
| M-16 | CI/CD pipeline: lint, typecheck, test, deploy               | P0       |

### 3.3 MVP Out-of-Scope

- FHIR APIs and HL7 ingestion
- Structured diagnosis coding (ICD-10)
- Medications, allergies, lab results
- Patient portal / mobile app
- Cross-tenant data sharing
- Advanced AI (differential diagnosis, semantic search)
- SSO / SAML integration
- Analytics dashboard
- Billing / scheduling

---

## 4. Milestones

| Milestone                   | Week | Description                                                        | Gate                                                  |
| --------------------------- | ---- | ------------------------------------------------------------------ | ----------------------------------------------------- |
| **M0 — Project Init**       | 0    | Repo, CI/CD, emulator suite, domain model scaffold                 | `tsc --noEmit` passes, emulators run                  |
| **M1 — Auth + Tenant**      | 2    | Firebase Auth, custom claims, tenant provisioning, Firestore rules | Multi-tenant isolation test passes                    |
| **M2 — Patient Core**       | 5    | Patient CRUD, search, list UI, detail page                         | Search returns in < 500ms for 10k patients            |
| **M3 — Clinical Notes**     | 7    | SOAP note editor, note persistence, patient timeline               | Create/edit/read notes in Firestore emulator          |
| **M4 — AI Integration**     | 9    | AI summarization pipeline, AI audit trail, review UI               | AI summary generated in < 5s, clinician accepts > 80% |
| **M5 — Admin + Onboarding** | 10   | Tenant admin panel, user management, tenant settings               | Admin provisions tenant, invites user end-to-end      |
| **M6 — Polish + Hardening** | 11   | Error boundaries, loading states, WCAG audit, performance pass     | Lighthouse > 90, WCAG AA, zero high vulns             |
| **M7 — Beta Ready**         | 12   | Staging deployment, beta test plan, launch checklist               | Beta testers onboard successfully                     |

---

## 5. Sprint Plan

### Sprint 0 — Foundation (Week 0–2)

**Goal:** Establish development infrastructure, domain model scaffold, and CI/CD pipeline.

**Features:**

- Project initialization: Vite, React, TypeScript, Tailwind, ESLint, Prettier
- Firebase project setup (staging + production)
- Emulator suite configuration
- CI/CD pipeline (GitHub Actions): lint, typecheck, test
- Domain model interfaces and value objects (Patient, PatientId, Tenant, User, Role)
- Result<T, E> type and domain error types
- Firestore emulator + schema definition
- AGENTS.md, PRD.md, ARCHITECTURE.md, ROADMAP.md, DECISIONS.md

**Dependencies:**

- Firebase project created and billing enabled
- GitHub repo with branch protection

**Exit Criteria:**

- [ ] `npm run dev` starts Vite dev server with blank React app
- [ ] `npm run emulators` starts Auth + Firestore emulators
- [ ] `npm run lint` passes with zero warnings
- [ ] `npm run typecheck` passes with zero errors
- [ ] `npm run test` runs sample test successfully
- [ ] CI pipeline triggers on PR and passes
- [ ] All docs approved by stakeholders

---

### Sprint 1 — Auth + Tenant Foundation (Week 3–4)

**Goal:** Implement authentication with custom claims and tenant provisioning.

**Features:**

- Firebase Auth integration (email/password)
- MFA enrollment and enforcement
- Custom claims: tenantId, role, permissions
- Auth repository (FirebaseAuthRepository)
- Tenant domain model and repository interface
- Tenant provisioning Cloud Function (admin only)
- Tenant-scoped Firestore security rules
- Auth UI: login, register, MFA setup
- TenantGuard route component
- Auth state management (useAuthStore)

**Dependencies:**

- Firebase Auth configured in both projects
- Custom claims via Admin SDK setup

**Exit Criteria:**

- [ ] User registers with email/password, enrolls MFA, logs in
- [ ] JWT contains tenantId and role claims
- [ ] TenantGuard redirects unauthenticated users to login
- [ ] Firestore security rules unit tests pass (tenant isolation verified)
- [ ] Tenant provisioning Cloud Function deploys and creates tenant document
- [ ] Super-admin cannot access tenant data from client SDK

---

### Sprint 2 — Patient CRUD (Week 5–6)

**Goal:** Complete patient management: create, read, update, search, and archive.

**Features:**

- Patient aggregate root and value objects (Demographics, Contact)
- PatientRepository interface + Firestore implementation
- SearchPatients, GetPatient, CreatePatient, UpdatePatient use cases
- Patient search with fuzzy matching (prefix search on lastName, exact MRN)
- Patient list page with search bar, results table, pagination
- Patient detail page with demographics display
- Patient create/edit form (React Hook Form + Zod)
- Patient archive (soft delete)
- Firestore composite indexes for search queries
- usePatientSearch, usePatientDetail hooks
- React Query integration for server state

**Dependencies:**

- Auth + tenant foundation (Sprint 1)

**Exit Criteria:**

- [ ] Create 1,000 patients in emulator; search by name returns results in < 500ms
- [ ] Search by MRN returns exact match
- [ ] Create patient form validates required fields (Zod)
- [ ] Patient detail page loads patient data
- [ ] Archive patient removes from active search results
- [ ] All patient operations are tenant-scoped (verified by integration test)
- [ ] Search pagination works (20 per page, next/previous)

---

### Sprint 3 — Clinical Notes (Week 7–8)

**Goal:** Implement SOAP note creation, editing, and patient timeline.

**Features:**

- ClinicalNote and Visit aggregate roots
- ClinicalRepository interface + Firestore implementation
- CreateNote, UpdateNote, GetPatientTimeline use cases
- SOAP note editor component (free-text for MVP, structured sections)
- Patient timeline view (chronological feed of visits and notes)
- Visit-to-notes sub-collection relationship
- Note list for a visit
- Note edit history (last modified timestamp, author)

**Dependencies:**

- Patient CRUD (Sprint 2)

**Exit Criteria:**

- [ ] Create visit, add SOAP note, view note on patient timeline
- [ ] Edit existing note, verify changes persisted
- [ ] Patient timeline lists visits in reverse chronological order
- [ ] Each visit shows associated notes
- [ ] Firestore security rules allow note write only for provider role
- [ ] Integration test: create patient → create visit → create note → read back

---

### Sprint 4 — AI Summarization (Week 9–10)

**Goal:** Deploy AI summarization pipeline through Cloud Functions with audit trail.

**Features:**

- Prompt template: `summarize-note.v1.txt`
- Model routing config (primary: GPT-4o, fallback: Claude 3.5 Sonnet)
- AI orchestrator Cloud Function
- PHI de-identification pipeline (NER + surrogate replacement)
- GenerateSummary use case
- AISummarizeButton component with loading/success/error states
- AI review UI: show suggestion with accept/edit/reject
- AI audit trail: log suggestion, accepted edits, prompt version, latency
- AI evaluation suite: `summarize-note.eval.ts` with test fixture
- AI error boundary (timeout, model unavailable)

**Dependencies:**

- Clinical notes (Sprint 3)
- OpenAI and Anthropic API keys in Firebase Secret Manager
- BAAs in progress with AI providers

**Exit Criteria:**

- [ ] Type clinical text → click "Summarize" → AI generates SOAP note in < 5s
- [ ] Clinician can accept, edit, or reject the AI suggestion
- [ ] Audit trail records AI suggestion + clinician action
- [ ] PHI de-identification removes names, dates, MRNs before API call
- [ ] AI eval suite passes with > 80% clinical acceptability
- [ ] AI timeout (30s) shows graceful error with retry
- [ ] AI error boundary catches failures, user can continue manually

---

### Sprint 5 — Admin + User Management (Week 11)

**Goal:** Complete tenant administration and user onboarding flows.

**Features:**

- Tenant admin dashboard page (role-gated)
- User invitation flow: admin invites via email → Cloud Function sends invite
- User registration with pre-assigned tenant and role
- User list with role display
- Tenant settings page: feature flags, basic branding
- Admin audit log viewer
- Role-based access control enforcement in UI
- Admin-only routes with role guard

**Dependencies:**

- Auth + tenant foundation (Sprint 1)
- Patient CRUD (Sprint 2)

**Exit Criteria:**

- [ ] Admin invites user via email → user registers → assigned correct tenant + role
- [ ] Admin views all users in tenant with roles
- [ ] Admin audit log shows PHI access events
- [ ] Non-admin user cannot access `/admin` routes
- [ ] Tenant settings changes persist and apply
- [ ] Provider users cannot view admin-only data

---

### Sprint 6 — Offline + Error Handling (Week 12)

**Goal:** Add offline support, error boundaries, and UI polish.

**Features:**

- React Query offline persistence (IndexedDB cache)
- Offline indicator in UI header
- Read-only mode when offline (view cached patients)
- Error boundaries: TenantErrorBoundary, AIErrorBoundary, GlobalErrorBoundary
- Loading states: skeletons for patient list, detail page, note editor
- Empty states: no patients, no notes, no search results
- Toast notifications for success/error actions
- Keyboard navigation audit and fixes
- Screen reader labels on all interactive elements
- Focus management for modals and page transitions

**Dependencies:**

- All prior sprints

**Exit Criteria:**

- [ ] Disconnect network → cached patients still viewable, offline indicator shown
- [ ] Error boundaries catch and display user-friendly messages
- [ ] Skeleton loading states on every data-fetching view
- [ ] All forms show validation errors inline
- [ ] WCAG 2.1 AA compliance verified (automated + manual audit)
- [ ] Lighthouse performance score > 90
- [ ] Keyboard navigation covers all core workflows

---

### Sprint 7 — Beta Preparation (Week 13)

**Goal:** Polish, documentation, and staging deployment for beta launch.

**Features:**

- Staging environment deployment
- Beta tenant provisioning script
- Beta testing guide and feedback form
- End-to-end smoke tests (Playwright)
- Firestore security rules penetration test
- Performance baseline measurements
- User documentation: quick-start guide
- Bug bash: fix all P0/P1 bugs

**Dependencies:**

- Sprint 6 complete

**Exit Criteria:**

- [ ] Staging environment live with full MVP feature set
- [ ] E2E tests pass for happy paths
- [ ] Zero P0 bugs, < 5 P1 bugs
- [ ] Firestore rules penetration test: no unauthorized access
- [ ] Performance baselines recorded (search p95, AI p95, page load)
- [ ] Beta testing documentation complete
- [ ] 3 beta clinics provisioned and ready to onboard

---

### Sprint 8 — Beta Testing (Week 14–15)

**Goal:** Run beta program, collect feedback, fix issues.

**Features:**

- No new features — stability and feedback loop
- Bug fixes from beta feedback (daily triage)
- Performance optimization based on real-world usage
- AI prompt tuning based on beta clinician reviews

**Dependencies:**

- Beta clinics active

**Exit Criteria:**

- [ ] 3 beta clinics using system for 2+ weeks
- [ ] NPS score > 30 from beta users
- [ ] AI summarization acceptance rate > 70%
- [ ] Zero P0 bugs reported in the last 5 days
- [ ] Average patient search latency < 500ms in staging
- [ ] Beta feedback categorized and prioritized for V2 backlog

---

### Sprint 9 — V1.0 Launch (Week 16)

**Goal:** Production deployment and public launch.

**Activities:**

- Production environment deployment
- DNS and custom domain configuration
- Production Firestore indexes deployment
- Production AI provider switch (from test keys to production keys)
- Launch monitoring dashboards
- On-call rotation established
- Marketing site and documentation portal
- Launch announcement

**Dependencies:**

- Beta exit criteria met

**Exit Criteria:**

- [ ] Production environment live and stable for 48 hours
- [ ] Zero critical alerts in monitoring
- [ ] All BAAs executed with sub-processors
- [ ] On-call rotation and runbooks ready
- [ ] Launch blog post and documentation published
- [ ] First paying customer onboarded

---

## 6. Acceptance Criteria (per Phase)

### 6.1 MVP (V1.0)

| ID        | Criterion                                                                     | Owner       |
| --------- | ----------------------------------------------------------------------------- | ----------- |
| AC-MVP-01 | Independent clinic can onboard self-service in < 1 hour                       | Product     |
| AC-MVP-02 | Patient search p95 < 500ms for 10,000-patient database                        | Engineering |
| AC-MVP-03 | AI summarization generates clinically acceptable SOAP notes > 80% of the time | AI          |
| AC-MVP-04 | Zero cross-tenant data leakage in security penetration test                   | Security    |
| AC-MVP-05 | All UI meets WCAG 2.1 AA                                                      | Design      |
| AC-MVP-06 | MFA enrollment rate > 90% for all users                                       | Product     |
| AC-MVP-07 | Audit trail captures 100% of PHI access events                                | Engineering |
| AC-MVP-08 | Core workflows functional offline (cached reads)                              | Engineering |
| AC-MVP-09 | 99.9% uptime for first 30 days post-launch                                    | DevOps      |
| AC-MVP-10 | Zero critical/high vulnerabilities in `npm audit`                             | Security    |

---

## 7. Risks per Phase

### 7.1 MVP (V1)

| Risk                                              | Impact                                        | Probability | Mitigation                                                            |
| ------------------------------------------------- | --------------------------------------------- | ----------- | --------------------------------------------------------------------- |
| Firestore rules too permissive                    | Cross-tenant leakage                          | Low         | Unit test every rule, automated isolation tests, pentesting           |
| AI latency exceeds 5s budget                      | Poor UX, clinician abandonment                | Medium      | Model fallback routing, response streaming, async processing for > 5s |
| AI hallucination produces unsafe clinical content | Patient safety, liability                     | Medium      | Human-in-the-loop review, confidence scoring, strict prompt design    |
| Firebase Auth custom claims propagation delay     | Users unable to access data after role change | Low         | Force token refresh on role change, document SLA (up to 1 hour)       |
| Emulator vs. production Firestore divergence      | Bugs found only in production                 | Medium      | Integration tests against both emulator and staging Firestore         |
| Team velocity lower than estimated                | Missed MVP deadline                           | Medium      | Scope is defined with P0/P1 priority; P1 features can slide to V2     |

### 7.2 Clinical Depth (V2)

| Risk                                    | Impact                      | Probability | Mitigation                                                       |
| --------------------------------------- | --------------------------- | ----------- | ---------------------------------------------------------------- |
| ICD-10 code accuracy insufficient       | Clinician mistrust          | Medium      | Multiple model evaluation, clinician review panel, feedback loop |
| Medication/allergy data model too rigid | Specialties can't customize | Low         | Extensible schema with custom attributes per tenant              |
| Lab result LOINC mapping complexity     | Delayed lab feature         | Medium      | Scope MVP to common labs; expand LOINC coverage iteratively      |

### 7.3 Connect (V3)

| Risk                                  | Impact                      | Probability | Mitigation                                                                    |
| ------------------------------------- | --------------------------- | ----------- | ----------------------------------------------------------------------------- |
| FHIR R4 compliance gaps               | Integration partners reject | Medium      | FHIR validation test suite, compliance testing with Inferno                   |
| HL7 v2 message variability            | Ingestion failures          | High        | Robust error handling, partial ingestion with manual review queue             |
| API rate limiting breaks integrations | Partner churn               | Medium      | Usage-based pricing with clear rate limit documentation, graceful degradation |

### 7.4 AI Advanced (V4)

| Risk                                        | Impact         | Probability | Mitigation                                                                               |
| ------------------------------------------- | -------------- | ----------- | ---------------------------------------------------------------------------------------- |
| Differential diagnosis AI liability         | Legal exposure | Medium      | UI disclaimers, human-in-the-loop, liability insurance, legal review                     |
| Semantic search indexing cost               | Budget overrun | Medium      | Incremental indexing, embedding caching, cost-per-query monitoring                       |
| Voice-to-note accuracy in clinical settings | Low adoption   | High        | Noise-cancellation preprocessing, specialty-specific fine-tuning, fallback to text input |

### 7.5 Enterprise Scale (V5)

| Risk                                             | Impact                               | Probability | Mitigation                                                                  |
| ------------------------------------------------ | ------------------------------------ | ----------- | --------------------------------------------------------------------------- |
| SOC 2 audit findings                             | Delayed enterprise sales             | Medium      | Engage auditor early (V4), continuous compliance monitoring                 |
| Cross-tenant consent model complexity            | Data-sharing failures                | Medium      | Formal consent model verification, exhaustive test suite for consent states |
| Multi-region Firestore latency                   | International tenant dissatisfaction | Low         | Regional Firestore instances, CDN for static assets                         |
| SSO integration diversity (Okta, Azure AD, etc.) | Per-customer integration overhead    | Medium      | SAML 2.0 standard implementation, abstraction layer for identity providers  |

---

## 8. Technical Debt Strategy

### 8.1 Principles

1. **Zero tech debt in MVP path.** P0 features ship clean. No "fix later" for security, performance, or accessibility.
2. **Acknowledged debt is tracked.** All known shortcuts are logged as GitHub issues with `tech-debt` label and a scheduled resolution sprint.
3. **20% rule.** Every sprint after MVP allocates 20% capacity to tech debt reduction.
4. **Refactor on touch.** When modifying a module with known tech debt, fix it as part of the change.

### 8.2 Scheduled Debt Resolution

| Debt                                          | Incurred | Resolution Sprint | Rationale                                                 |
| --------------------------------------------- | -------- | ----------------- | --------------------------------------------------------- |
| Free-text SOAP notes (no structured sections) | Sprint 3 | Sprint 10 (V2)    | Ship MVP faster; structure comes with ICD-10 coding in V2 |
| No FHIR validation in patient model           | Sprint 2 | Sprint 20 (V3)    | FHIR compliance not needed until V3                       |
| Single-region Cloud Functions                 | Sprint 0 | Sprint 40 (V5)    | Multi-region overhead not justified at MVP scale          |
| AI provider keys in .env.local (dev only)     | Sprint 0 | Sprint 4          | Move to Secret Manager before AI goes live                |
| Hardcoded prompt templates in functions       | Sprint 4 | Sprint 12 (V2)    | Move to versioned template files with eval integration    |
| No feature flag system                        | Sprint 0 | Sprint 8          | Needed for beta/production toggle and gradual rollout     |

---

## 9. Testing Strategy

### 9.1 Testing Pyramid

```
           ┌─────────┐
           │   E2E   │  Playwright: critical happy paths
           │  10%    │
          ┌┴─────────┴┐
          │Integration│  Firestore emulator: repository + use case tests
          │    30%    │
         ┌┴───────────┴┐
         │   Unit       │  Vitest: domain logic, value objects, use cases (with mocks)
         │    50%       │
        ┌┴──────────────┴┐
        │   Static        │  TypeScript strict mode, ESLint rules
        │    10%          │
        └─────────────────┘
```

### 9.2 Test Categories

| Category               | Tool                                         | Scope                                     | Sprint           |
| ---------------------- | -------------------------------------------- | ----------------------------------------- | ---------------- |
| Static analysis        | TypeScript, ESLint                           | Every PR                                  | 0+               |
| Unit tests             | Vitest                                       | Domain entities, value objects, use cases | 1+               |
| Repository integration | Vitest + Firestore emulator                  | Repository implementations                | 2+               |
| Firestore rules        | `@firebase/rules-unit-testing`               | All security rules                        | 1+               |
| AI prompt eval         | Custom eval framework (`src/ai/evaluation/`) | Every prompt template                     | 4+               |
| Component tests        | Vitest + React Testing Library               | Key components (forms, search, buttons)   | 3+               |
| E2E tests              | Playwright                                   | Critical user journeys                    | 7+               |
| Accessibility          | axe-core + manual audit                      | All UI components                         | 6+               |
| Performance            | Lighthouse, custom benchmarks                | Search latency, page load, AI latency     | 7+               |
| Security               | Penetration testing (manual)                 | Firestore rules, auth, XSS, CSRF          | 7, before launch |

### 9.3 CI Pipeline Gates

```
PR Opened
  │
  ├── Static: tsc --noEmit, eslint          (must pass)
  ├── Unit Tests: vitest run                (must pass)
  ├── Firestore Rules: npm run test:rules  (must pass)
  ├── AI Evals: npm run test:ai            (must pass)
  └── Build: vite build                     (must pass)
```

### 9.4 Pre-Launch Testing

| Gate                 | Description                                         | Owner       | Timeline |
| -------------------- | --------------------------------------------------- | ----------- | -------- |
| Load test            | 100 concurrent users, patient search + AI summarize | Engineering | Sprint 7 |
| Penetration test     | OWASP Top 10, Firestore rules bypass attempts       | Security    | Sprint 7 |
| Accessibility audit  | WCAG 2.1 AA (automated + manual)                    | Design      | Sprint 6 |
| Cross-browser test   | Chrome, Firefox, Safari, Edge (latest 2)            | QA          | Sprint 7 |
| Performance baseline | Lighthouse, search latency, AI latency p50/p95/p99  | Engineering | Sprint 7 |
| Failover test        | Simulate Firestore outage, AI provider outage       | DevOps      | Sprint 7 |
| User acceptance test | 3 beta clinics perform MVP workflows                | Product     | Sprint 8 |

---

## 10. Deployment Plan

### 10.1 Environments

| Environment    | Purpose                  | Deploy Trigger                   | Data                 |
| -------------- | ------------------------ | -------------------------------- | -------------------- |
| **Local**      | Development              | `npm run emulators`              | Synthetic            |
| **PR Preview** | Per-PR review            | Automatic (GitHub Actions)       | Emulator             |
| **Staging**    | Integration, beta, demos | Merge to `main`                  | Anonymized test data |
| **Production** | Live tenants             | Manual release (GitHub Releases) | Real patient data    |

### 10.2 Deployment Pipeline

```
GitHub PR ──▶ CI Checks ──▶ Merge to main ──▶ Auto-deploy Staging ──▶ Manual Release ──▶ Deploy Production
```

### 10.3 Rollback Plan

| Component         | Rollback Method                                      | RTO      |
| ----------------- | ---------------------------------------------------- | -------- |
| Hosting (SPA)     | `firebase hosting:clone` from previous version       | < 5 min  |
| Cloud Functions   | Redeploy previous version (tagged in Git)            | < 10 min |
| Firestore Rules   | Revert to previous rules file in Git                 | < 5 min  |
| Firestore Indexes | Indexes are additive; no rollback needed for indexes | N/A      |
| AI Provider       | Switch model routing to fallback provider            | < 1 min  |

---

## 11. Beta Testing Plan

### 11.1 Beta Objectives

1. Validate real-world clinical workflows against our assumptions.
2. Measure AI summarization quality with real clinical notes.
3. Identify UX friction points before public launch.
4. Test onboarding self-service flow with non-technical users.
5. Establish performance baselines with production-like data volume.

### 11.2 Beta Timeline

| Week    | Activity                                            |
| ------- | --------------------------------------------------- |
| Week 13 | Recruit 3–5 beta clinics; provision staging tenants |
| Week 14 | Beta clinics onboard; shadow and support            |
| Week 15 | Collect structured feedback (surveys, interviews)   |
| Week 16 | Triage feedback → V2 backlog and/or bug fixes       |

### 11.3 Beta Participant Profile

- 1 solo practitioner (primary care)
- 1 small clinic (3–5 providers, family medicine)
- 1 specialty clinic (cardiology or mental health)

### 11.4 Beta Feedback Collection

- Daily automated: error rates, latency, feature usage analytics
- Weekly survey: NPS, feature satisfaction, pain points
- Exit interview: overall experience, likelihood to adopt, pricing sensitivity

### 11.5 Beta Exit Criteria

- [ ] All 3 clinics active for 2+ weeks
- [ ] Zero data loss or security incidents
- [ ] NPS > 30
- [ ] AI acceptance rate > 70%
- [ ] Average weekly active usage > 3 sessions per provider per week

---

## 12. Launch Checklist

### 12.1 Pre-Launch

- [ ] Production Firebase project configured and billing enabled
- [ ] All Firestore indexes deployed to production
- [ ] Firestore security rules deployed and tested in production
- [ ] Cloud Functions deployed with production environment config
- [ ] All secrets in Firebase Secret Manager (no .env files in production path)
- [ ] Custom domain configured with SSL
- [ ] BAAs signed with all sub-processors handling PHI
- [ ] Penetration test complete, all critical findings resolved
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] Performance baselines recorded and within targets
- [ ] Load test passed (100 concurrent users)
- [ ] Disaster recovery runbook documented
- [ ] On-call rotation established with escalation paths
- [ ] Monitoring dashboards configured (latency, errors, auth failures)
- [ ] Alert thresholds configured and tested
- [ ] Data retention and backup policies documented
- [ ] Terms of Service and Privacy Policy published
- [ ] Support workflow established (ticketing, SLA)
- [ ] Launch communication drafted (blog, social, email)
- [ ] Go/no-go decision from all stakeholders

### 12.2 Launch Day

- [ ] Deploy production release
- [ ] Verify monitoring dashboards receiving data
- [ ] Smoke test all MVP flows in production
- [ ] Enable new tenant registration
- [ ] Publish launch communications
- [ ] War room active for first 8 hours

### 12.3 Post-Launch (Week 1)

- [ ] Daily standups with on-call handoff
- [ ] Bug triage: P0 fixed immediately, P1 within 24h, P2 within sprint
- [ ] Daily monitoring report: users, errors, latency, AI acceptance
- [ ] End-of-week retro with action items

---

## 13. Post-Launch Roadmap

### 13.1 Immediate Post-Launch (Weeks 13–16)

| Priority | Activity                                      |
| -------- | --------------------------------------------- |
| P0       | Production incident response                  |
| P0       | Critical bug fixes                            |
| P1       | Performance optimization from production data |
| P1       | User feedback-driven UX improvements          |
| P2       | Feature usage analytics for V2 prioritization |

---

## 14. V2 Features — Clinical Depth (Weeks 17–28)

### 14.1 Theme

Transform free-text clinical notes into structured, codified clinical data with AI assistance.

### 14.2 Features

| ID    | Feature                                                                 | Priority |
| ----- | ----------------------------------------------------------------------- | -------- |
| V2-01 | ICD-10 code search and assignment to notes                              | P0       |
| V2-02 | AI-suggested ICD-10 codes from clinical text                            | P0       |
| V2-03 | Structured medication list (name, dosage, frequency, route, prescriber) | P0       |
| V2-04 | Structured allergy list (substance, reaction, severity)                 | P0       |
| V2-05 | Vital signs charting with trend visualization                           | P1       |
| V2-06 | Lab result display (LOINC-coded)                                        | P1       |
| V2-07 | Family history and social history sections                              | P1       |
| V2-08 | Patient problem list (active diagnoses)                                 | P1       |
| V2-09 | SOAP note structured sections (not free-text)                           | P0       |
| V2-10 | Note templates per specialty (configurable per tenant)                  | P2       |
| V2-11 | AI-assisted medication interaction checking                             | P2       |
| V2-12 | Clinical data import (CSV for meds, allergies, problems)                | P2       |

### 14.3 Key Milestones

| Milestone                    | Sprint    | Gate                                                             |
| ---------------------------- | --------- | ---------------------------------------------------------------- |
| ICD-10 coding live           | Sprint 11 | AI coding accuracy > 85%                                         |
| Medications + allergies live | Sprint 12 | Structured data model validated with 3 specialties               |
| Structured SOAP notes        | Sprint 13 | Clinicians can complete notes 40% faster than free-text baseline |
| Labs + vitals live           | Sprint 14 | Lab result ingestion and display end-to-end                      |

---

## 15. V3 Features — Connect (Weeks 29–40)

### 15.1 Theme

Open the platform to external systems through standards-based APIs and ingestion pipelines.

### 15.2 Features

| ID    | Feature                                                          | Priority |
| ----- | ---------------------------------------------------------------- | -------- |
| V3-01 | FHIR R4 RESTful API (Patient, Observation, Encounter, Condition) | P0       |
| V3-02 | HL7 v2 message ingestion (ADT, ORU)                              | P0       |
| V3-03 | Webhook subscriptions for real-time event notifications          | P1       |
| V3-04 | API key management per tenant (generate, revoke, rotate)         | P0       |
| V3-05 | API rate limiting and usage analytics                            | P1       |
| V3-06 | Bulk FHIR export for data migration                              | P1       |
| V3-07 | Third-party developer documentation and sandbox                  | P1       |
| V3-08 | GDPR compliance (data export, deletion, processing records)      | P0       |
| V3-09 | API usage-based billing                                          | P2       |
| V3-10 | FHIR validation test suite (Inferno)                             | P0       |

### 15.3 Key Milestones

| Milestone                | Sprint    | Gate                                                              |
| ------------------------ | --------- | ----------------------------------------------------------------- |
| FHIR Patient API live    | Sprint 20 | Passes Inferno FHIR validation                                    |
| HL7 ADT ingestion live   | Sprint 22 | Ingest 1,000 ADT messages without errors                          |
| Developer portal live    | Sprint 23 | External developer creates sandbox tenant and makes FHIR API call |
| GDPR compliance verified | Sprint 24 | Passes third-party GDPR readiness assessment                      |

---

## 16. V4 Features — AI Advanced (Weeks 41–52)

### 16.1 Theme

Deploy advanced AI capabilities that make the system an intelligent clinical assistant.

### 16.2 Features

| ID    | Feature                                                    | Priority |
| ----- | ---------------------------------------------------------- | -------- |
| V4-01 | AI-assisted differential diagnosis with evidence citations | P0       |
| V4-02 | Semantic search across unstructured clinical notes         | P0       |
| V4-03 | Automated discharge summary generation                     | P1       |
| V4-04 | Voice-to-structured-note (Whisper + GPT-4o pipeline)       | P1       |
| V4-05 | Patient record one-click summarization (chart review)      | P1       |
| V4-06 | AI confidence scores on all suggestions                    | P0       |
| V4-07 | Clinician feedback loop for AI model improvement           | P1       |
| V4-08 | Specialty-specific AI prompt templates                     | P2       |
| V4-09 | AI usage dashboard per tenant                              | P2       |
| V4-10 | Batch AI processing for retrospective chart review         | P2       |

### 16.3 Key Milestones

| Milestone                    | Sprint    | Gate                                                                |
| ---------------------------- | --------- | ------------------------------------------------------------------- |
| Differential diagnosis live  | Sprint 32 | Physician panel rates AI differentials as "clinically useful" > 75% |
| Semantic search live         | Sprint 34 | Search returns semantically relevant results across all notes       |
| Voice-to-note live           | Sprint 36 | Voice note transcription accuracy > 95% with medical terminology    |
| One-click chart summary live | Sprint 37 | Summarize 10-year patient record in < 10 seconds                    |

---

## 17. V5 Features — Scale (Weeks 53+)

### 17.1 Theme

Achieve enterprise readiness: cross-tenant sharing, certifications, SSO, and global deployment.

### 17.2 Features

| ID    | Feature                                                       | Priority |
| ----- | ------------------------------------------------------------- | -------- |
| V5-01 | Cross-tenant data sharing with patient consent management     | P0       |
| V5-02 | SOC 2 Type II certification                                   | P0       |
| V5-03 | SSO / SAML 2.0 integration (Okta, Azure AD, Google Workspace) | P0       |
| V5-04 | Multi-region deployment (EU, APAC)                            | P1       |
| V5-05 | Analytics dashboard (tenant-level and system-level)           | P1       |
| V5-06 | Custom roles and permission sets per tenant                   | P1       |
| V5-07 | White-label tenant branding                                   | P1       |
| V5-08 | Enterprise SLA (99.95% uptime, 4-hour support)                | P0       |
| V5-09 | Audit log export and SIEM integration                         | P1       |
| V5-10 | Legacy EHR data migration tooling                             | P2       |
| V5-11 | Clinical decision support rules engine                        | P2       |
| V5-12 | Data residency controls (EU data stays in EU)                 | P1       |

### 17.3 Key Milestones

| Milestone                     | Sprint    | Gate                                                 |
| ----------------------------- | --------- | ---------------------------------------------------- |
| Cross-tenant sharing live     | Sprint 43 | Consent-gated access verified for all consent states |
| SOC 2 Type II audit started   | Sprint 45 | Audit readiness assessment passed                    |
| SSO integration live          | Sprint 46 | At least Okta and Azure AD integrated                |
| Multi-region deployment live  | Sprint 48 | EU tenant provisioned in europe-west1 Firestore      |
| SOC 2 Type II report received | Sprint 50 | Clean opinion from auditor                           |

---

## 18. Summary Sprint Map

```
Sprint 0    (Wk 0-2):   Foundation + Setup
Sprint 1    (Wk 3-4):   Auth + Tenant Foundation
Sprint 2    (Wk 5-6):   Patient CRUD
Sprint 3    (Wk 7-8):   Clinical Notes
Sprint 4    (Wk 9-10):  AI Summarization
Sprint 5    (Wk 11):    Admin + User Management
Sprint 6    (Wk 12):    Offline + Error Handling
Sprint 7    (Wk 13):    Beta Preparation
Sprint 8    (Wk 14-15): Beta Testing
Sprint 9    (Wk 16):    V1.0 Launch
───────────────────────────────────────────
Sprint 10   (Wk 17-18): V2: ICD-10 Coding + Structured Notes
Sprint 11   (Wk 19-20): V2: Medications + Allergies
Sprint 12   (Wk 21-22): V2: Labs + Vitals + Templates
Sprint 13   (Wk 23-24): V2: Polish, Integration, Beta
Sprint 14   (Wk 25):    V2.0 Launch
───────────────────────────────────────────
Sprint 15   (Wk 26-27): V3: FHIR Patient API
Sprint 16   (Wk 28-29): V3: FHIR Observation + Encounter
Sprint 17   (Wk 30-31): V3: HL7 Ingestion
Sprint 18   (Wk 32-33): V3: Webhooks + API Keys
Sprint 19   (Wk 34-35): V3: GDPR + Developer Portal
Sprint 20   (Wk 36-37): V3: Polish, Validation, Beta
Sprint 21   (Wk 38):    V3.0 Launch
───────────────────────────────────────────
Sprint 22   (Wk 39-40): V4: Semantic Search
Sprint 23   (Wk 41-42): V4: Differential Diagnosis
Sprint 24   (Wk 43-44): V4: Discharge Summaries + Voice-to-Note
Sprint 25   (Wk 45-46): V4: Chart Summary + AI Feedback Loop
Sprint 26   (Wk 47-48): V4: Polish, Eval, Beta
Sprint 27   (Wk 49):    V4.0 Launch
───────────────────────────────────────────
Sprint 28   (Wk 50-51): V5: Cross-Tenant Sharing + Consent
Sprint 29   (Wk 52-53): V5: SSO Integration
Sprint 30   (Wk 54-55): V5: SOC 2 Preparation
Sprint 31   (Wk 56-57): V5: Multi-Region + Data Residency
Sprint 32   (Wk 58-59): V5: Analytics + White-Label
Sprint 33   (Wk 60-61): V5: Audit + SIEM + Migration Tooling
Sprint 34   (Wk 62-63): V5: SOC 2 Audit Period
Sprint 35   (Wk 64-65): V5: Polish + Enterprise Beta
Sprint 36   (Wk 66):    V5.0 Launch
```
