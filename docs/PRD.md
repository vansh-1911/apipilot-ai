# APIPilot AI — Product Requirements Document

| Field              | Value                          |
| ------------------ | ------------------------------ |
| **Document Type**  | PRD                            |
| **Product**        | APIPilot AI                    |
| **Version**        | v0.1.0 (MVP)                   |
| **Author**         | Vansh Singla — Product & Eng   |
| **Status**         | Draft → Ready for Development  |
| **Parent Doc**     | [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) |
| **Last Updated**   | July 2026                      |

---

## 1. Executive Summary

APIPilot AI is an AI-powered SaaS tool that transforms raw OpenAPI and Swagger specification files into polished, human-readable documentation — instantly.

Developers upload a spec file (`.json` or `.yaml`). The system parses it, sends structured endpoint data to a large language model, and produces a complete documentation page with summaries, explanations, and example request/response pairs. The output is presented in a beautiful, searchable, shareable UI.

**The MVP ships in 7 working days.** It delivers a focused, end-to-end flow: sign up → upload spec → receive AI-generated docs → browse and share. No team features, no chat, no billing. Just the core value loop, executed with polish.

---

## 2. Problem Statement

### What hurts

OpenAPI specifications are the standard contract between API producers and consumers. Yet they are fundamentally machine-readable documents — not human-readable ones. The result:

1. **Developers waste time decoding specs.** A typical 50-endpoint spec takes 15–30 minutes of manual scanning before a developer understands the authentication model, the happy path, and error conventions.

2. **Existing tools render data, they don't explain it.** Swagger UI and Redoc faithfully display endpoint lists, parameters, and schemas — but provide zero narrative context about *why* an endpoint exists, *how* to use it, or *what* to watch out for.

3. **Good docs are expensive.** Writing supplementary documentation requires dedicated technical writers or significant engineering time. Most teams skip it.

4. **Onboarding is slow.** New team members, contractors, and partner developers pay the comprehension cost every time they encounter an unfamiliar API.

### Why now

Large language models have reached the quality threshold where they can reliably summarise structured technical data into accurate, useful prose. The infrastructure cost (Supabase, Vercel, Lovable) has dropped to near-zero for a solo developer. The timing is right to build an AI-native documentation tool that didn't make sense two years ago.

---

## 3. Goals

Derived directly from [PROJECT_OVERVIEW.md § 5](./PROJECT_OVERVIEW.md).

| ID | Goal | Success Looks Like |
| -- | ---- | ------------------ |
| G1 | Upload and parse OpenAPI/Swagger specs | System accepts `.json`/`.yaml`, validates structure, stores in Supabase Storage |
| G2 | AI-powered documentation generation | Every endpoint gets a plain-English summary, parameter explanations, and example request/response |
| G3 | Beautiful documentation pages | Generated docs render with search, tag-based grouping, responsive layout, and a shareable URL |
| G4 | User authentication | Email/password and OAuth sign-up/login via Supabase Auth |
| G5 | Spec management dashboard | Authenticated users see all their uploaded specs with status, timestamps, and actions (view, delete) |
| G6 | Production deployment | Live on a public Vercel URL, stable, demonstrable end-to-end |

---

## 4. Target Users

### Primary — Integration Developer

| Attribute | Detail |
| --------- | ------ |
| Role | Backend / fullstack developer |
| Experience | 1–5 years |
| Context | Integrating a new external or internal API under deadline pressure |
| Frequency | Multiple times per week |
| Core need | Understand auth, happy path, and error handling in minutes, not hours |

### Secondary — Technical Lead

| Attribute | Detail |
| --------- | ------ |
| Role | Tech lead, engineering manager, solutions architect |
| Experience | 5+ years |
| Context | Evaluating vendor APIs, conducting architecture reviews |
| Frequency | Periodic, high-stakes |
| Core need | Rapid scope and capability assessment without reading raw specs |

### Tertiary — API Producer

| Attribute | Detail |
| --------- | ------ |
| Role | Backend developer maintaining an internal API |
| Experience | 2+ years |
| Context | Needs docs for their own API without spending a sprint writing them |
| Frequency | On each spec update |
| Core need | Beautiful, always-current docs with zero manual writing |

---

## 5. User Personas

### Persona A: Riya — The Mid-Level Backend Developer

> *"I just got handed a payment gateway's Swagger file. 180 endpoints. I need to ship the integration by Friday."*

- **Age:** 25 | **Location:** Bangalore | **Role:** Backend Developer (2.5 yrs exp)
- **Tools:** VS Code, Postman, GitHub, Stack Overflow
- **Frustration:** Swagger UI shows her every endpoint but doesn't tell her where to start or how auth works.
- **Dream:** Upload the spec, get a "Start Here" guide with the 5 endpoints she actually needs, in plain English.
- **APIPilot solves:** Riya uploads the spec. In 30 seconds, she has a readable overview of auth, a summary of each endpoint, and example payloads. She ships by Thursday.

### Persona B: Arjun — The Engineering Lead

> *"We're choosing between three geolocation APIs. I need to compare scope and auth models — fast."*

- **Age:** 31 | **Location:** Remote | **Role:** Engineering Lead (7 yrs exp)
- **Tools:** Notion, Slack, GitHub, Architecture docs
- **Frustration:** Reading three different doc sites with three different structures wastes his afternoon.
- **Dream:** Upload three specs, get three clean doc pages in a consistent format, compare side-by-side.
- **APIPilot solves:** Arjun uploads all three specs. Each generates docs in the same clean layout. He compares auth models, endpoint coverage, and data schemas in 15 minutes.

### Persona C: Meera — The API Maintainer

> *"My team's internal API has 40 endpoints and zero documentation beyond the Swagger file."*

- **Age:** 27 | **Location:** Hyderabad | **Role:** Platform Engineer (3 yrs exp)
- **Tools:** FastAPI, Supabase, internal tooling
- **Frustration:** She knows she should write docs but never has time. New joiners ask her the same questions repeatedly.
- **Dream:** Auto-generate beautiful docs from her existing spec and share a link with the team.
- **APIPilot solves:** Meera uploads her spec. She shares the generated doc URL in Slack. New joiner questions drop immediately.

---

## 6. Functional Requirements

### FR-1: Landing Page

| Field | Detail |
| ----- | ------ |
| **Priority** | P0 |
| **Description** | A public landing page that communicates the product value proposition and provides entry points for sign-up and login. |
| **Requirements** | • Hero section with tagline, subtitle, and CTA button<br>• Feature highlights section (3–4 cards)<br>• "How it works" section (3-step visual)<br>• Footer with links<br>• Responsive: mobile, tablet, desktop |

### FR-2: Authentication

| Field | Detail |
| ----- | ------ |
| **Priority** | P0 |
| **Description** | Users must authenticate to upload specs and access their dashboard. |
| **Requirements** | • Sign up with email + password<br>• Log in with email + password<br>• OAuth login (GitHub recommended, Google optional)<br>• Password reset via email<br>• Session persistence (Supabase JWT)<br>• Protected routes: dashboard, upload, doc view redirect to login if unauthenticated |

### FR-3: Spec Upload

| Field | Detail |
| ----- | ------ |
| **Priority** | P0 |
| **Description** | Authenticated users can upload an OpenAPI or Swagger specification file. |
| **Requirements** | • Accept `.json` and `.yaml`/`.yml` files<br>• File size limit: 5 MB<br>• Client-side validation: file type, file size<br>• Server-side validation: valid OpenAPI 2.0 (Swagger) or OpenAPI 3.x structure<br>• Store raw file in Supabase Storage<br>• Create a record in `specs` table with metadata (name, version, endpoint count, upload timestamp, status)<br>• Show upload progress indicator<br>• Display clear error messages for invalid files |

### FR-4: Spec Parsing

| Field | Detail |
| ----- | ------ |
| **Priority** | P0 |
| **Description** | The system parses the uploaded spec and extracts structured data for AI processing. |
| **Requirements** | • Parse JSON or YAML into a structured object<br>• Extract: API title, version, base URL, description<br>• Extract per endpoint: method, path, summary, description, parameters, request body schema, response schemas, tags<br>• Extract authentication/security schemes<br>• Store parsed data in `endpoints` table<br>• Handle `$ref` resolution within the spec<br>• Set spec status to `parsed` on success, `parse_failed` on error |

### FR-5: AI Documentation Generation

| Field | Detail |
| ----- | ------ |
| **Priority** | P0 |
| **Description** | For each parsed endpoint, the system generates AI-powered documentation. |
| **Requirements** | • Send structured endpoint data to LLM (OpenAI GPT-4o or Gemini)<br>• Generate per endpoint: plain-English summary (2–3 sentences), parameter explanations, example request (cURL + JSON body), example response (JSON), common error scenarios<br>• Generate API-level overview: what the API does, authentication guide, getting started summary<br>• Store generated content in `generated_docs` table<br>• Rate limiting: batch endpoints to stay within API limits<br>• Retry logic: up to 2 retries on LLM failure<br>• Set spec status to `ready` on completion, `generation_failed` on error |

### FR-6: Documentation View

| Field | Detail |
| ----- | ------ |
| **Priority** | P0 |
| **Description** | A polished UI that displays the AI-generated documentation for a spec. |
| **Requirements** | • API overview section at top (title, description, base URL, auth summary)<br>• Endpoints grouped by tags (collapsible sections)<br>• Each endpoint card shows: method badge (GET/POST/PUT/DELETE with colour coding), path, AI summary, parameters table, request/response examples with syntax highlighting<br>• Search bar: filter endpoints by path or summary text<br>• Sidebar navigation: jump to sections/tags<br>• Responsive layout<br>• Copy-to-clipboard on code blocks |

### FR-7: Dashboard

| Field | Detail |
| ----- | ------ |
| **Priority** | P0 |
| **Description** | Authenticated users see a dashboard listing all their uploaded API specs. |
| **Requirements** | • List view of all specs belonging to the user<br>• Each card shows: API name, version, endpoint count, upload date, status badge (processing / ready / failed)<br>• Actions per spec: view docs, delete<br>• Empty state: friendly message + CTA to upload first spec<br>• Sort by: most recent (default) |

### FR-8: Spec Deletion

| Field | Detail |
| ----- | ------ |
| **Priority** | P1 |
| **Description** | Users can delete specs they no longer need. |
| **Requirements** | • Confirmation modal before deletion<br>• Cascade delete: spec record, parsed endpoints, generated docs, stored file<br>• Row-level security: users can only delete their own specs |

### FR-9: Shareable Documentation URL

| Field | Detail |
| ----- | ------ |
| **Priority** | P1 |
| **Description** | Each generated doc page has a unique, shareable URL. |
| **Requirements** | • URL format: `/docs/{spec-id}`<br>• Publicly accessible (no auth required to view)<br>• Copy-link button on the doc page<br>• Meta tags for link previews (Open Graph) |

---

## 7. Non-Functional Requirements

| ID | Category | Requirement | Target |
| -- | -------- | ----------- | ------ |
| NFR-1 | **Performance** | Documentation generation latency | < 30 seconds for a 50-endpoint spec |
| NFR-2 | **Performance** | Page load time (doc view) | < 2 seconds on 4G connection |
| NFR-3 | **Reliability** | Spec upload success rate | ≥ 95% for valid OpenAPI 3.x files |
| NFR-4 | **Reliability** | Uptime | 99% (Vercel + Supabase SLA) |
| NFR-5 | **Security** | Data isolation | Row-Level Security on all Supabase tables; users access only their own data |
| NFR-6 | **Security** | Auth | Supabase Auth with JWT; HTTPS everywhere |
| NFR-7 | **Security** | API keys | LLM API keys stored as environment variables, never exposed to client |
| NFR-8 | **Scalability** | Concurrent users | Support 50 concurrent users (free-tier Supabase limits) |
| NFR-9 | **Usability** | Accessibility | WCAG 2.1 AA on core flows (colour contrast, keyboard nav, alt text) |
| NFR-10 | **Usability** | Responsiveness | Fully functional on mobile (≥ 375px), tablet, and desktop |
| NFR-11 | **Maintainability** | Code quality | Consistent code style, component-based architecture, meaningful commit messages |
| NFR-12 | **Observability** | Error tracking | Client-side and server-side errors logged; failed generations surface to user |

---

## 8. User Stories & Acceptance Criteria

### Epic 1: Onboarding

**US-1.1: Sign Up**
> As a new user, I want to create an account so that I can upload API specs and access my documentation.

| # | Acceptance Criterion |
| - | -------------------- |
| AC-1 | User can sign up with email + password |
| AC-2 | User can sign up with GitHub OAuth |
| AC-3 | Validation errors shown for invalid email, weak password (< 8 chars) |
| AC-4 | After sign-up, user is redirected to the dashboard |
| AC-5 | Duplicate email shows appropriate error |

**US-1.2: Log In**
> As a returning user, I want to log in so that I can access my previously uploaded specs.

| # | Acceptance Criterion |
| - | -------------------- |
| AC-1 | User can log in with email + password |
| AC-2 | User can log in with GitHub OAuth |
| AC-3 | Invalid credentials show a clear error message |
| AC-4 | After login, user is redirected to the dashboard |
| AC-5 | Session persists across browser refreshes (JWT stored) |

**US-1.3: Log Out**
> As a logged-in user, I want to log out so that I can secure my session.

| # | Acceptance Criterion |
| - | -------------------- |
| AC-1 | Logout button visible in the header/sidebar when authenticated |
| AC-2 | On logout, session is cleared and user is redirected to the landing page |

---

### Epic 2: Spec Upload & Processing

**US-2.1: Upload Spec**
> As an authenticated user, I want to upload an OpenAPI/Swagger file so that the system can generate documentation for it.

| # | Acceptance Criterion |
| - | -------------------- |
| AC-1 | Upload accepts `.json`, `.yaml`, `.yml` files |
| AC-2 | Files exceeding 5 MB are rejected with an error |
| AC-3 | Non-spec files (e.g., `.txt`, `.png`) are rejected |
| AC-4 | Upload progress is visible to the user |
| AC-5 | On successful upload, the spec appears on the dashboard with status "Processing" |
| AC-6 | Invalid OpenAPI structure shows a descriptive error (e.g., "Missing `paths` field") |

**US-2.2: View Processing Status**
> As a user who has uploaded a spec, I want to see its processing status so I know when documentation is ready.

| # | Acceptance Criterion |
| - | -------------------- |
| AC-1 | Dashboard shows status badge: `Processing`, `Ready`, or `Failed` |
| AC-2 | Status updates without requiring a full page refresh (polling or real-time) |
| AC-3 | Failed status shows a retry or re-upload option |

---

### Epic 3: Documentation Viewing

**US-3.1: View Generated Docs**
> As a user, I want to view the AI-generated documentation for my uploaded spec in a clean, organised layout.

| # | Acceptance Criterion |
| - | -------------------- |
| AC-1 | Doc page shows API overview (title, description, base URL, auth method) |
| AC-2 | Endpoints are grouped by tags with collapsible sections |
| AC-3 | Each endpoint displays: method badge, path, AI summary, parameters, example request, example response |
| AC-4 | Code blocks have syntax highlighting and copy-to-clipboard |
| AC-5 | Page is responsive on mobile, tablet, and desktop |

**US-3.2: Search Endpoints**
> As a user viewing docs, I want to search/filter endpoints so I can quickly find what I need.

| # | Acceptance Criterion |
| - | -------------------- |
| AC-1 | Search input filters endpoints by path or summary text |
| AC-2 | Filtering is instant (client-side, < 100ms) |
| AC-3 | No-results state shows a helpful message |

**US-3.3: Share Documentation**
> As a user, I want to share a link to my generated docs so others can view them without signing up.

| # | Acceptance Criterion |
| - | -------------------- |
| AC-1 | Each doc page has a unique URL (`/docs/{spec-id}`) |
| AC-2 | The URL is publicly accessible without authentication |
| AC-3 | A "Copy Link" button is visible on the doc page |
| AC-4 | Shared link renders proper Open Graph meta tags for link previews |

---

### Epic 4: Spec Management

**US-4.1: View Dashboard**
> As an authenticated user, I want to see all my uploaded specs in one place.

| # | Acceptance Criterion |
| - | -------------------- |
| AC-1 | Dashboard lists all specs belonging to the current user |
| AC-2 | Each card shows: API name, endpoint count, upload date, status |
| AC-3 | Specs are sorted by most recent first |
| AC-4 | Empty state shows a message and CTA: "Upload your first API spec" |

**US-4.2: Delete Spec**
> As a user, I want to delete a spec I no longer need.

| # | Acceptance Criterion |
| - | -------------------- |
| AC-1 | Delete button visible on each spec card |
| AC-2 | Confirmation modal appears before deletion |
| AC-3 | On confirm, spec and all associated data (endpoints, generated docs, file) are removed |
| AC-4 | User cannot delete another user's spec (RLS enforced) |

---

## 9. MVP Scope

### Included in MVP (v0.1.0)

| Feature | Priority |
| ------- | -------- |
| Landing page | P0 |
| Email + password authentication | P0 |
| GitHub OAuth | P0 |
| Spec upload (JSON/YAML) | P0 |
| Client + server-side spec validation | P0 |
| Spec parsing and endpoint extraction | P0 |
| AI documentation generation (per-endpoint + overview) | P0 |
| Documentation view page with search and grouping | P0 |
| User dashboard with spec management | P0 |
| Spec deletion with cascade | P1 |
| Shareable public doc URLs | P1 |
| Open Graph meta tags on doc pages | P1 |
| Production deployment on Vercel | P0 |
| Row-Level Security on all tables | P0 |

### Data model (core tables)

```
users (managed by Supabase Auth)
├── specs
│   ├── id, user_id, title, version, description, base_url
│   ├── file_path, status, endpoint_count
│   └── created_at, updated_at
├── endpoints
│   ├── id, spec_id, method, path, summary, description
│   ├── tag, parameters (jsonb), request_body (jsonb), responses (jsonb)
│   └── created_at
└── generated_docs
    ├── id, spec_id, endpoint_id (nullable for API-level overview)
    ├── content_type (overview | endpoint)
    ├── ai_summary, ai_explanation, example_request, example_response
    └── created_at
```

---

## 10. Out-of-Scope Features

These are explicitly **not** in the MVP. Documented here to prevent scope creep.

| Feature | Why Not Now | Planned For |
| ------- | ----------- | ----------- |
| Chat with your API (conversational AI) | Requires RAG pipeline, embeddings, conversation state. Too complex for 7 days. | v0.2.0 |
| SDK / client code generation | Different product category entirely (Fern, Speakeasy). | Not planned |
| API testing / mocking | Postman, Insomnia, Hoppscotch own this. | Not planned |
| Team workspaces & collaboration | Requires RBAC, invitations, shared state. | v0.3.0 |
| Billing / payments | No monetisation until product-market signal exists. | v0.4.0+ |
| GraphQL / gRPC spec support | OpenAPI/Swagger is the 80% case. Expand later. | v0.3.0+ |
| Custom branding on docs | Nice-to-have, not core value. | v0.3.0 |
| Spec version diffing / changelog | Requires multi-version storage and comparison logic. | v0.3.0 |
| Self-hosted deployment | Cloud-only for now. | Not planned |
| Email notifications | No async flows that warrant notifications in MVP. | v0.2.0 |

---

## 11. Future Features (Post-MVP Roadmap)

### v0.2.0 — Conversational API Assistant
- Natural-language chat interface scoped to a single uploaded API.
- RAG-based retrieval: AI answers are grounded in the actual spec, not hallucinated.
- Suggested questions: "How do I authenticate?", "What errors can `/payments` return?"
- Chat history persisted per spec.

### v0.3.0 — Teams & Collaboration
- Shared workspaces with invite-by-email.
- Role-based access: Owner, Editor, Viewer.
- Custom branding: logo, colours, domain on generated doc pages.
- Automated changelog: diff two spec versions and generate a human-readable summary.

### v1.0.0 — Public API Hub
- Community-driven directory of AI-documented public APIs.
- API producers claim listings and keep docs current.
- Search and discover APIs by category, auth type, or use case.
- Change detection: alerts when a tracked API's spec changes.

---

## 12. Risks & Mitigations

| # | Risk | Likelihood | Impact | Mitigation |
| - | ---- | ---------- | ------ | ---------- |
| R1 | **LLM rate limits or downtime** block doc generation | Medium | High | Implement retry logic (2 retries, exponential backoff). Queue large specs. Have a fallback to display parsed-only docs without AI summaries. |
| R2 | **AI generates inaccurate explanations** | Medium | Medium | Prompt engineering with strict grounding instructions ("only use information from the provided spec"). Display a subtle "AI-generated" badge. Manual QA on 10 sample specs. |
| R3 | **Large specs (100+ endpoints) exceed LLM context window** | Medium | Medium | Chunk endpoints into batches of 5–10 per LLM call. Process batches sequentially. Generate overview separately from endpoint docs. |
| R4 | **Supabase free-tier limits hit** during demo | Low | High | Monitor usage. Estimated MVP usage is well within free tier (500 MB DB, 1 GB storage, 50K auth MAUs). |
| R5 | **Scope creep** pushes past 7-day deadline | High | High | This PRD is the scope contract. Any feature not listed here is a "no." Daily scope check against this doc. |
| R6 | **Complex `$ref` resolution** in nested specs fails | Medium | Medium | Use an established OpenAPI parser library (e.g., `swagger-parser`) instead of hand-rolling resolution. |
| R7 | **OpenAI/Gemini API costs** escalate | Low | Low | Estimate: ~$0.01–0.05 per spec generation. MVP testing will cost < $5 total. Set a hard spending cap. |

---

## 13. Timeline

**Total duration: 7 working days**

| Day | Phase | Deliverables |
| --- | ----- | ------------ |
| **Day 1** | Foundation | Project setup (Lovable + Supabase + Vercel). Database schema created. Supabase Auth configured (email + GitHub OAuth). Landing page live. |
| **Day 2** | Auth & Dashboard | Sign up, login, logout flows working. Protected routes. Dashboard page with empty state. Basic navigation. |
| **Day 3** | Upload & Parsing | File upload UI + Supabase Storage integration. Spec validation (client + server). Parsing logic: extract endpoints, params, schemas. Store in DB. |
| **Day 4** | AI Integration | Edge Function for LLM calls. Prompt engineering for endpoint summaries + overview. Batch processing for multi-endpoint specs. Store generated docs in DB. |
| **Day 5** | Documentation View | Doc view page: overview section, endpoint cards, tag grouping, method badges, syntax-highlighted code blocks. Search/filter. Sidebar nav. |
| **Day 6** | Polish & Connect | Wire dashboard → doc view. Status badges. Spec deletion. Shareable URLs. Open Graph tags. Responsive design pass. |
| **Day 7** | QA & Ship | End-to-end testing with 3–5 real-world specs. Bug fixes. Lighthouse audit. Final deploy. Screen recording of demo flow. Docs review. |

### Daily checkpoints

Each day ends with:
1. Code committed and pushed to GitHub.
2. Preview deployment verified on Vercel.
3. Progress updated in task tracker.

---

## 14. KPIs

Key Performance Indicators measured **post-launch** to evaluate product health:

| KPI | Definition | Target (30 days post-launch) |
| --- | ---------- | ---------------------------- |
| **Specs uploaded** | Total number of specs uploaded by all users | ≥ 20 |
| **Unique users** | Distinct authenticated users | ≥ 10 |
| **Upload-to-docs completion rate** | % of uploads that reach "Ready" status | ≥ 90% |
| **Generation latency (p50)** | Median time from upload to docs ready | < 20 seconds |
| **Generation latency (p95)** | 95th percentile generation time | < 45 seconds |
| **Return rate** | % of users who upload more than one spec | ≥ 30% |
| **Share rate** | % of generated docs accessed via public URL by a non-uploader | ≥ 10% |

---

## 15. Success Metrics

Success is evaluated on two axes: **product** and **portfolio**.

### Product success

| Metric | Target | Measurement |
| ------ | ------ | ----------- |
| Valid spec acceptance rate | ≥ 95% | Error logs |
| AI doc generation success rate | ≥ 90% | Status tracking in DB |
| Doc generation latency (50-endpoint spec) | < 30 seconds | Server-side timing |
| Zero P0 bugs at launch | 0 critical bugs | Manual QA |
| Lighthouse performance score | ≥ 85 | Lighthouse audit |
| Mobile usability | Fully functional at 375px | Manual testing |

### Portfolio success

| Metric | Target | Measurement |
| ------ | ------ | ----------- |
| Live public URL | Accessible and stable | Vercel dashboard |
| Demo flow duration | Upload → view docs in < 60 seconds | Screen recording |
| GitHub repo quality | Clear commits, branching, complete docs/ | Repo inspection |
| Peer validation | ≥ 3 developers confirm product feels "real" | Informal feedback |
| Recruiter readiness | End-to-end demo can be shown in a 5-min interview segment | Practice run |

---

## Appendix A: Glossary

| Term | Definition |
| ---- | ---------- |
| **OpenAPI Specification (OAS)** | A standard, language-agnostic interface description for REST APIs. Versions 3.0.x and 3.1.x. |
| **Swagger** | The original name for OpenAPI (v2.0). Often used interchangeably. APIPilot supports both. |
| **Spec** | Short for specification. The uploaded API definition file. |
| **Endpoint** | A single API operation: one HTTP method + one path (e.g., `GET /users/{id}`). |
| **LLM** | Large Language Model. The AI engine (GPT-4o or Gemini) used for documentation generation. |
| **RLS** | Row-Level Security. Supabase/PostgreSQL feature ensuring users can only access their own data. |
| **Edge Function** | A serverless function running on Supabase's edge infrastructure (Deno runtime). |
| **P0 / P1** | Priority levels. P0 = must-have for launch. P1 = should-have, included if time permits. |

---

## Appendix B: Open Questions

| # | Question | Impact | Status |
| - | -------- | ------ | ------ |
| Q1 | OpenAI vs Gemini — which LLM? | Prompt design, cost, latency | To be decided Day 1 based on free-tier limits |
| Q2 | Should generated docs be editable by the user post-generation? | Schema design, UI complexity | Deferred to v0.2.0 |
| Q3 | Rate limiting strategy for free users (how many specs per day?) | Abuse prevention, cost | Set at 5 specs/day for MVP; revisit post-launch |
| Q4 | Should we support spec upload via URL (paste a link) in addition to file upload? | UX convenience | Nice-to-have; include if Day 6 has time |

---

*This PRD is the scope contract for the APIPilot AI MVP. Features not listed here are out of scope. Any proposed additions must be evaluated against the 7-day timeline before being accepted.*
