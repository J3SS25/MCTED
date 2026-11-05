# MCTEB Project Plan

**Municipal Community Tool and Equipment Bank — Municipality of Basco, Batanes**

This document has two parts:

- **Part A — Product and Implementation Plan:** what we are building, for whom, workflows, UX, data, phases, and acceptance criteria.
- **Part B — Technical Architecture:** how it is built (pnpm monorepo, TypeScript, Express, SQLite), repository layout, security protocols, and docs conventions.

> In Part B, `@app` is the workspace scope; rename to your package scope (e.g. `@mcteb`). Directory name suggestion: `mcteb/`.

---

# PART A — PRODUCT AND IMPLEMENTATION PLAN

## A1. Project Summary

Build a municipal community tool and equipment bank for the Municipality of Basco, Batanes. Residents browse shared equipment, request reservations, pay applicable fees, collect and return items, and report on their experience. Municipal staff administer inventory and transactions. Administrators oversee accounts and system activity.

The supplied database schema (`db/schema.sql`) is the domain baseline for the new implementation. Keep its nine core entities and documented status values unless a reviewed schema change is approved. The current application is useful as a source of workflow and visual direction, but its API data model does not fully match the supplied schema. Do not copy its API assumptions without reconciling them with the database.

## A2. Outcomes and Success Measures

- Residents can find equipment by name, category, availability, and fee, then submit and follow a reservation.
- Staff can make a clear, auditable decision on reservations and manage handover, return, payment verification, and equipment condition.
- Inventory status and available quantity reflect current reservations, rentals, maintenance, and returns.
- Administrators and staff can identify pending work and inspect relevant account and transaction history.
- Every role sees only the actions and records appropriate to that role.
- Workflows remain understandable on mobile devices, including forms, status updates, and confirmation steps.
- Seed data supports a repeatable demonstration without overwriting user data or granting production access through demo credentials.

## A3. Users and Permissions

| Role | Main responsibilities | Access boundaries |
|---|---|---|
| Borrower | Browse equipment, reserve, review own reservations/rentals/payments, submit feedback, manage profile, receive notifications | Own personal and transaction records; public catalog and public feedback |
| Municipal Staff | Review reservations, coordinate pickup/return, verify payments, manage equipment and maintenance, respond to feedback/issues | Operational records needed for municipal service; no administrator-only account controls |
| Administrator | Staff capabilities plus user/account oversight and system audit review | Full municipal system administration; sensitive changes require confirmation and audit record |
| Guest | Browse public catalog and public feedback | No personal data, reservations, payments, or protected operations |

Enforce access in the service layer for every request. Hiding a menu item is a convenience, not an authorization boundary.

## A4. Database-Derived Domain Model

### A4.1 Core entities

| Entity | Purpose and important information |
|---|---|
| `users` | Identity, contact/address, barangay, account role/status, password hash, login lockout counters, timestamps |
| `tools` | Catalog item, category, description/specifications, availability and condition, rental/deposit fees, quantity, image/serial number, acquisition and usage history |
| `reservations` | Borrower/tool request, requested pickup and return dates, purpose, decision status, staff notes, reviewer and review timestamps |
| `rentals` | Physical loan lifecycle, optional reservation link, borrower/tool, due/return dates, initial/returned condition, releasing/receiving staff, notes and penalties |
| `payments` | Receipt/reference, payer, optional reservation/rental links, tool, amount, payment method/status, proof and verifier details |
| `maintenance` | Tool issue, reporter, optional rental, severity/status, technician, cost, schedule/completion and resolution |
| `feedback` | Borrower rating of overall experience, tool condition and service; comments and public visibility |
| `notifications` | User-specific message, type, optional destination link, read state and timestamp |
| `audit_logs` | Actor/name, action, target, details, IP address and timestamp for accountability |

### A4.2 Relationship map

- One user can have many reservations, rentals, payments, notifications, feedback entries, and audit events.
- One tool can have many reservations, rentals, maintenance reports, payments, and feedback entries.
- A reservation may lead to a rental and/or payment; a rental may have payments, maintenance reports, and feedback.
- Reviewer, verifier, reporter, releaser, and receiver references represent staff actions and should be displayed as attributable events.
- Feedback is optionally associated with a rental and identifies both the user and tool being reviewed.

### A4.3 Statuses represented in the schema

| Field | Allowed values |
|---|---|
| User role | `Administrator`, `Municipal Staff`, `Borrower` |
| User status | `Active`, `Pending Verification`, `Suspended` |
| Tool availability | `Available`, `Reserved`, `Borrowed`, `Returned`, `Maintenance`, `Damaged`, `Archived` |
| Tool condition | `Excellent`, `Good`, `Fair`, `Needs Repair`, `Under Maintenance` |
| Reservation | `Pending`, `Approved`, `Rejected`, `Cancelled`, `Completed` |
| Rental | `Pending`, `Reserved`, `Borrowed`, `Returned`, `Completed` |
| Payment | `Pending`, `Paid`, `Failed`, `Refunded` |
| Maintenance severity | `Minor`, `Moderate`, `Severe`, `Critical` |
| Maintenance status | `Reported`, `Scheduled`, `In Progress`, `Completed`, `Decommissioned` |
| Notification type | `info`, `success`, `warning`, `danger` |

Treat these as persisted values and map them to consistent display labels, colors, and allowed transitions. Do not invent extra status strings in screens or APIs without a corresponding domain/schema decision. Define them once as Zod enums in `packages/shared` (see Part B) so the API, database layer, and UI cannot drift.

## A5. Main Workflows

### A5.1 Account access

1. Guest opens catalog or public reviews.
2. Borrower registers with name, birth date, contact details, barangay, address, email, and password; validate age and required values according to municipal policy.
3. Authenticate with email/password, show clear errors and lockout guidance, and provide a secure sign-out/session-expiry experience.
4. Staff and administrator accounts are provisioned or approved through a controlled administrative process, not by trusting a client-selected role.
5. Account state is visible to the user; suspended/inactive accounts cannot perform protected actions.

### A5.2 Discover and reserve equipment

1. Browse a searchable catalog with category, availability, fee, and condition filters.
2. Open an item detail view to compare description, specifications, quantity, fees/deposit, condition, images, and current availability.
3. Authenticated borrower selects pickup/return dates and supplies an optional purpose.
4. Validate date order, item status, available quantity, overlapping bookings, and policy restrictions before accepting the request.
5. Show a confirmation with reservation ID and `Pending` state.
6. Staff reviews the request, checks dates/stock, and approves or rejects with optional notes. Notify the borrower of the result.
7. Borrower can cancel an eligible request; staff can mark the approved reservation complete after the rental lifecycle finishes.

### A5.3 Checkout, return, and payment

1. Staff verifies the approved reservation and borrower, records the item's initial condition, and releases it.
2. A rental record captures due date, responsible staff, and inspection notes.
3. Borrower sees current rental status, due date, fees, payment instructions, and receipt/reference information.
4. Payment is recorded with supported method, amount, reference, status, and optional proof; staff verifies/declines it and the system records who did so. 
5. On return, staff records actual return time, returned condition, inspection notes, overdue penalty, and damage penalty if applicable.
6. Update tool availability and quantity only after the relevant transaction succeeds. Make penalty/fee calculations visible before confirmation.
7. Provide a printable/downloadable receipt or transaction summary from stored payment and rental details.

### A5.4 Maintenance, feedback, and notifications

- Staff can create a maintenance report against an item, set severity, technician, cost estimate, and scheduled date; update progress and resolution.
- A tool under maintenance or damaged must not be offered as available until a staff member records its return to service.
- A borrower can submit feedback linked to their rental/item, with separate ratings for overall experience, condition, and service.
- Staff can moderate whether a feedback entry is public, retaining the original rating and audit trail.
- Users can view and mark their own notifications as read. Notifications link directly to the relevant reservation, payment, rental, or maintenance item.

### A5.5 Administration and audit

- Staff dashboards prioritize pending reservations, due/overdue rentals, payment verification, maintenance work, and recent returns.
- Administrator account tools cover user status/role oversight, with safeguards against accidental privilege escalation or self-lockout.
- Audit views support filters by date, actor, action, target type, and target ID.
- High-impact actions (approval/rejection, payment verification, account suspension, fee/penalty changes, archiving) require clear confirmation and record actor, reason/details, and time.

## A6. UI/UX Design Plan

### A6.1 Product direction

Continue the existing municipal identity: a practical, welcoming civic service with deep green primary actions, neutral surfaces, clear typography, and consistent success/warning/error colors. Preserve light and dark themes. Avoid the "mainframe" framing in user-facing copy; use straightforward language such as "Equipment Bank," "My Reservations," and "Staff Dashboard."

Design for residents who may primarily use a phone and may not be familiar with online booking or payment workflows. Use plain language, predictable controls, large touch targets, and short forms.

### A6.2 Global information architecture

**Public/borrower navigation:** Dashboard/home · Equipment catalog · My reservations · My rentals · Payments and receipts · Feedback · Notifications · Profile and account settings

**Staff navigation:** Staff dashboard · Reservations queue · Rental checkout/return · Inventory · Payments to verify · Maintenance · Feedback moderation · Notifications

**Administrator additions:** User and account management · Audit log · System settings/policies (if included in approved scope)

On desktop, use a persistent left navigation rail with a compact top bar for page title, notifications, theme, and account actions. On mobile, replace the rail with a dismissible drawer and keep primary actions reachable. Highlight the current location and retain useful filters when navigating back to a list.

### A6.3 Screen specifications

| Screen | Primary content and actions | Important UX states |
|---|---|---|
| Sign in / registration | Login form; borrower registration; password visibility; barangay selection; account access help | Field validation, password mismatch/weakness, duplicate email, success, account pending/suspended, lockout |
| Dashboard | Role-aware summary cards, next action, pending items, upcoming due dates, recent activity | First-use guidance, empty states, loading, actionable warnings |
| Equipment catalog | Search, category/status filters, sort, paginated list/grid results, availability/fee badges | No results with clear-filter action, unavailable item, image fallback, loading/error |
| Equipment detail | Photos, name, category, description/specs, condition, quantity, fee/deposit, reviews | Clear "Reserve" availability, sign-in prompt, dates unavailable |
| Reservation form/detail | Date range, purpose, fee summary, status history, staff notes; cancel when eligible | Validation, conflict, unavailable stock, submission confirmation, rejected/cancelled/completed |
| Staff reservation queue | Filterable table/cards, borrower/item/dates/status, review details and approve/reject actions | Pending count, stale request, conflict warning, decision confirmation, no requests |
| Rental desk | Approved pickup list, borrower verification, initial condition, release action; active rentals and return inspection | Missing reservation, item mismatch, return condition and fee review, overdue callout |
| Payments and receipts | Payment history, receipt/reference, amount/method/status; staff verification queue | Pending proof, verified/refunded/failed, invalid amount, receipt unavailable |
| Inventory | Search/filter by category, status, condition; create/edit/archive; stock and image management | Quantity validation, archive confirmation, currently borrowed/maintained item, unsaved changes |
| Maintenance | Open/scheduled/in-progress/completed work, severity, issue, item, assignee, costs and resolution | Critical issue warning, item unavailable, completion confirmation, empty queue |
| Feedback | Public review list and ratings; borrower submission; staff moderation | Review eligibility, already submitted, hidden/public state, respectful-content guidance |
| Notifications | Chronological feed, unread indicator, mark read, destination links | No notifications, unread/all filter, target no longer available |
| Profile | Contact/address and account details; password change if in scope | Save success/failure, validation, sensitive-action confirmation |
| Users | Searchable account list, role/status, account details and permitted changes | Privilege warning, suspend/restore confirmation, no users |
| Audit log | Search/filterable chronological event list and detail drawer | No matching events, long details, date range and pagination |

### A6.4 Shared interaction patterns

- Use the same status badge wording/color on cards, tables, detail pages, and notifications.
- Pair every destructive or high-impact control with a consequence summary, confirmation, and clear cancel path.
- Use inline field errors and a page-level summary for failed submissions.
- Show loading skeletons for data views and keep layouts stable while loading.
- Provide empty states that explain the next action rather than showing a blank panel.
- Confirm saved changes with a concise toast and persistent state in the view.
- Use tables for desktop staff review, switching to readable cards on narrow screens.
- Ensure keyboard navigation, visible focus, semantic labels, sufficient contrast, accessible dialogs, and text alternatives for images/icons.
- Display Philippine peso amounts consistently and use localized date/time presentation (Asia/Manila) while storing comparable timestamps.
- Never rely on color alone to communicate status.

## A7. Seed Data and Demonstration Plan

### A7.1 Existing fixture scope

The sample seed describes:

- Four account personas: one administrator, one municipal staff member, and two borrowers.
- Equipment spanning agricultural, fishing, carpentry, construction, electrical, mechanical, and emergency-response categories.
- Sample reservations and a completed rental, multiple payments, a maintenance record, feedback, notifications, and a system audit event.
- Example barangays and image paths that point to the existing equipment illustrations.

Use the supplied values as demonstration fixtures after validation and reconciliation. Seed data should exercise all meaningful statuses and edge cases, not just the happy path. Add deterministic examples for unavailable equipment, rejected/cancelled bookings, pending payment verification, overdue/returned rental, an open critical maintenance report, and hidden feedback.

### A7.2 Seed safeguards

- Separate demo accounts and sample records from production initialization.
- Never expose sample passwords in production; replace known demo credentials before a real deployment and use non-production-only credentials.
- Make seeding repeatable without resetting or replacing user-generated data.
- Seed parent rows before dependent rows and verify every reference.
- Add an explicit development/demo environment guard before inserting fixtures.
- Report inserted/skipped/invalid records clearly and roll back the seed batch when a relational insert fails.
- Keep sample images available or provide an intentional fallback image.
- Document which sample account represents each role without embedding any production secrets.

### A7.3 Fixture consistency work before first seed

Validate that each reservation, rental, and payment points to the same intended borrower and equipment item. Check that sample status combinations make sense chronologically (for example, a completed rental should have a return time and appropriate return condition). Review the currently supplied fixture links before importing them; do not silently seed inconsistent associations.

## A8. Implementation Phases

### Phase 0 — Product and data decisions
- Confirm that `db/schema.sql` is the authoritative schema for the new project.
- Decide whether account verification/ID evidence and profile-change requests are required: they exist in current product behavior but are not represented by dedicated fields/tables in the supplied schema.
- Decide reservation-to-rental/payment rules, quantity semantics, fee and penalty policy, cancellation cutoffs, and stock conflict rules.
- Reconcile the sample fixtures and identify every required schema extension.
- Define role permissions, notification events, and retention/audit policy.

**Exit:** agreed data dictionary, status transitions, role matrix, and MVP scope.

### Phase 1 — Foundation and visual system
- Define design tokens, typography, spacing, responsive breakpoints, forms, buttons, cards, status badges, dialogs, tables, toast messages, and empty states.
- Implement the authenticated/guest application shell and role-aware navigation.
- Establish environment configuration, database connectivity, health visibility, validation/error conventions, and safe session handling.
- Apply the schema and prove a minimal create/read/update flow against a clean development database.

**Exit:** usable responsive shell, reliable local startup, schema initialized, and basic operational diagnostics.

### Phase 2 — Accounts and equipment catalog
- Implement borrower registration, sign-in/out, profile, account status, and server-enforced permissions.
- Implement searchable/filterable catalog and detailed equipment views.
- Implement staff inventory create/edit/availability/condition/archive operations with validation and history.

**Exit:** guest can browse; authenticated borrower can access their profile; authorized staff can manage the catalog.

### Phase 3 — Reservation and rental operations
- Implement date/quantity conflict checks and reservation lifecycle.
- Build borrower reservation history and staff review queue.
- Implement approved pickup, equipment condition capture, checkout, return inspection, and inventory adjustment.
- Add notifications for request, decision, pickup, due date, return, and cancellation.

**Exit:** an end-to-end reservation-to-return flow passes concurrent/conflict, authorization, and inventory consistency tests.

### Phase 4 — Payments and receipts
- Implement payment record submission and staff verification.
- Link payments correctly to reservations/rentals and preserve transaction references.
- Calculate/display authorized fees, deposits, late penalties, and damage penalties with a confirmation step.
- Generate receipt detail and print-friendly view.

**Exit:** payment state changes are attributable, amount handling is tested, and receipts match stored records.

### Phase 5 — Maintenance, feedback, and administration
- Implement maintenance reports, assignment, scheduling, completion, and equipment return-to-service.
- Implement rental-linked feedback, public visibility, and moderation.
- Add user oversight, audit search, and administrator workflows.
- Add notification preferences and read-state handling as policy permits.

**Exit:** operational exceptions, moderation, and sensitive account actions have complete audit coverage.

### Phase 6 — Quality, launch, and operations
- Run security/accessibility, usability, responsive, performance, and data integrity checks.
- Test migration/restore, backup, monitoring, error alerts, retention, and recovery procedures.
- Prepare staff training, resident help text, release checklist, and rollback plan.
- Remove demo access and verify production secrets and payment-process disclaimers.

**Exit:** launch approval from municipal stakeholders; backup restoration and critical workflows demonstrated.

## A9. Cross-Cutting Requirements

- Validate all input on the server and use parameterized database operations.
- Apply least privilege to roles and records; protect payment/account data.
- Hash passwords, limit login attempts, secure sessions, and avoid logging credentials or full payment proof contents.
- Use database transactions for reservation approval/stock changes, checkout, return, payment verification, and other multi-row operations.
- Enforce and test referential integrity; prevent deleting users/items with valuable transaction history unless policy explicitly permits it.
- Make high-impact actions auditable and distinguish an actor's identity from the target account/item.
- Define timezone and currency conventions; use decimal-safe currency handling (store centavos as integers or use a decimal strategy; never floats).
- Support keyboard-only interaction, accessible labels, screen-reader announcements, readable contrast, and mobile layouts.
- Provide clear recoverable errors, retry guidance, and non-destructive confirmation for failures.

## A10. Verification and Acceptance Checklist

### Data
- [ ] A clean database can be initialized and validated against the agreed schema.
- [ ] Seed execution is idempotent and preserves non-fixture data.
- [ ] Foreign keys and transaction rollback prevent orphaned or partial records.
- [ ] Fees, quantity, dates, status values, and associations are validated at boundaries.
- [ ] Audit rows identify the actor and action for all sensitive operations.

### Workflow
- [ ] Guest catalog access does not expose protected information.
- [ ] Borrower cannot view or change another borrower's reservations, rentals, payments, profile, or notifications.
- [ ] Staff cannot grant administrator access or bypass authorization.
- [ ] Concurrent requests cannot overbook an item or make inventory negative.
- [ ] A reservation cannot be approved when dates/stock conflict.
- [ ] Return, maintenance, and cancellation update inventory exactly once.
- [ ] Payment state and receipts remain consistent across retries.
- [ ] Notifications point to the correct in-scope record.

### UX
- [ ] Every screen has loading, empty, success, validation, and error states where applicable.
- [ ] Core resident journeys work comfortably on small screens.
- [ ] Status is understandable without relying on color.
- [ ] Dialogs, forms, navigation, and tables are operable without a pointer.
- [ ] User-facing dates, amounts, labels, and next steps are consistent.

## A11. Known Risks and Decisions

| # | Risk / open decision | Action |
|---|---|---|
| 1 | **Schema/application mismatch:** the existing active API was built against different table names, columns, and ID assumptions | Implement against the supplied schema or approve a versioned migration; do not copy old controllers unchanged |
| 2 | **Verification data is absent:** no ID-verification fields/tables in the nine-table schema | Confirm whether verification is needed; design explicit fields/tables before building it |
| 3 | **Reservation-to-rental relationship:** `rentals.reservation_id` is nullable with no declared foreign key | Decide whether to add the constraint and whether walk-in rentals are allowed |
| 4 | **Payment references:** no declared foreign keys for reservation, rental, tool, verifier, or receipt relationships | Add integrity rules after confirming optional-payment behavior |
| 5 | **Maintenance attribution:** `reported_by` and `rental_id` not declared as foreign keys | Confirm whether non-users may report; add relationships |
| 6 | **Inventory state semantics:** availability stored alongside total and available quantity | Define the authoritative source; make all transitions update consistently |
| 7 | **Demo credentials and PII in fixtures** | Keep accounts non-production; never copy real resident data into demos |
| 8 | **Payment scope:** simulated, in-person, or provider-integrated? | Decide early; design and proof-of-payment handling differ substantially |

## A12. Suggested MVP

1. Role-controlled account access and profiles.
2. Public equipment catalog and detail pages.
3. Reservation request/review/cancel lifecycle.
4. Staff inventory and pickup/return workflow.
5. Payment recording, staff verification, and receipt view.
6. Notifications for the above events.
7. Basic maintenance reporting and audit logging.

**Deferred:** external payment gateway integration, advanced analytics, automated identity-document verification, and complex report exports until policy, privacy, and integration requirements are confirmed.

---

# PART B — TECHNICAL ARCHITECTURE

A scalable, maintainable full-stack TypeScript project: React + Tailwind frontend, Express backend, a single SQLite database file, managed as a pnpm workspace monorepo.

---

## B1. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Package manager | **pnpm** (workspaces) | Strict, fast, disk-efficient; one lockfile |
| Frontend | TypeScript, **React + Vite**, **Tailwind CSS** | React Router, TanStack Query for server state |
| Backend | TypeScript, **Express** | Layered modules, run with `tsx` (dev) / `tsc` (build) |
| Database | **SQLite** (one `.db` file) | `better-sqlite3`; `db/schema.sql` is the authoritative baseline (A1). Use it as migration `0001` and keep later changes as reviewed SQL migrations; Drizzle (introspected from the schema) or Kysely may be used for typed queries |
| Validation | **Zod** | Schemas shared between frontend and backend |
| Testing | **Vitest** (+ Supertest for API, Testing Library for UI) | |
| Quality | ESLint, Prettier, `tsc --noEmit` | Enforced via Husky + lint-staged + CI |

---

## B2. Repository Layout

> The layout below is generic. The MCTEB-specific modules and pages are listed in B2.1 right after it.

```
<project-name>/
├── apps/
│   ├── web/                      # Frontend (React + Vite + Tailwind)
│   │   ├── public/
│   │   ├── src/
│   │   │   ├── app/              # App shell, router, providers
│   │   │   ├── features/         # Feature-based modules (see below)
│   │   │   │   └── <feature>/
│   │   │   │       ├── components/
│   │   │   │       ├── hooks/
│   │   │   │       ├── api.ts    # API calls for this feature
│   │   │   │       └── index.ts  # Public exports only
│   │   │   ├── components/       # Shared UI (Button, Modal, Table...)
│   │   │   ├── lib/              # api client, utils, constants
│   │   │   ├── styles/           # index.css (Tailwind layers)
│   │   │   └── main.tsx
│   │   ├── index.html
│   │   ├── tailwind.config.ts
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── api/                      # Backend (Express)
│       ├── src/
│       │   ├── config/           # env.ts (Zod-validated env), constants
│       │   ├── db/
│       │   │   ├── client.ts     # SQLite connection + pragmas
│       │   │   ├── schema.ts     # Drizzle table definitions
│       │   │   ├── migrations/   # Generated SQL migrations (committed)
│       │   │   └── seed.ts
│       │   ├── modules/          # One folder per domain
│       │   │   └── <module>/
│       │   │       ├── <module>.routes.ts       # Route definitions
│       │   │       ├── <module>.controller.ts   # HTTP in/out only
│       │   │       ├── <module>.service.ts      # Business logic
│       │   │       ├── <module>.repository.ts   # All DB access
│       │   │       ├── <module>.schema.ts       # Zod request schemas
│       │   │       └── <module>.test.ts
│       │   ├── middleware/       # auth, validate, rateLimit, errorHandler
│       │   ├── utils/            # logger, errors (AppError), helpers
│       │   ├── app.ts            # Express app (no listen) — testable
│       │   └── server.ts         # Entry point: listen + graceful shutdown
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   ├── shared/                   # Shared types + Zod schemas (web & api)
│   │   ├── src/
│   │   └── package.json
│   └── config/                   # Shared tsconfig / eslint / prettier presets
│
├── data/                         # SQLite file lives here (GITIGNORED)
│   └── .gitkeep
├── docs/
│   ├── architecture.md
│   ├── database.md               # Schema + ERD notes
│   ├── api.md                    # Endpoint reference
│   ├── security.md               # Security policy and checklist
│   └── adr/                      # Architecture Decision Records
├── scripts/                      # backup-db.ts, setup scripts
├── .github/workflows/ci.yml      # install → lint → typecheck → test → audit → build
├── .husky/                       # pre-commit (lint-staged), commit-msg
├── .editorconfig
├── .env.example                  # Documented, no real secrets
├── .gitignore
├── .npmrc
├── CHANGELOG.md
├── README.md
├── package.json                  # Root scripts + devDependencies
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

### B2.1 MCTEB modules and pages

**Backend modules (`apps/api/src/modules/`)** — one per schema entity, plus auth:

| Module | Entity / scope | Notes |
|---|---|---|
| `auth` | `users` (login, register, session, lockout) | Server decides role; never trusts a client-supplied role |
| `users` | `users` (profile, admin oversight) | Admin-only role/status changes; self-lockout guard |
| `tools` | `tools` | Catalog search/filter, inventory CRUD, archive, return-to-service |
| `reservations` | `reservations` | Conflict checks, approve/reject/cancel/complete (transactional) |
| `rentals` | `rentals` | Checkout, return inspection, penalties; updates tool quantity/status |
| `payments` | `payments` | Record, verify/decline, receipt view |
| `maintenance` | `maintenance` | Report, schedule, complete, return to service |
| `feedback` | `feedback` | Submit (rental-linked), moderation (public/hidden) |
| `notifications` | `notifications` | List, mark read, deep links |
| `audit` | `audit_logs` | Written via a shared `audit.record()` service; read-only API for admins |

Cross-module rules: workflows that touch several tables (approve reservation, checkout, return, verify payment) live in the owning service and run inside a single DB transaction, calling `audit.record()` and `notifications.create()` within it.

**Shared package (`packages/shared/src/`)**
- `enums.ts` — every status/role value from A4.3 as Zod enums.
- `schemas/<entity>.ts` — request/response schemas per entity.
- `permissions.ts` — role → allowed-action matrix used by API middleware and UI navigation.
- `money.ts`, `dates.ts` — peso formatting, decimal-safe helpers, Asia/Manila display.

**Frontend routes (`apps/web/src/features/`)**

| Feature folder | Pages (see A6.3) | Roles |
|---|---|---|
| `auth` | Sign in, registration | Guest |
| `catalog` | Catalog, equipment detail | Guest, Borrower |
| `reservations` | Reservation form/detail, My reservations, staff queue | Borrower, Staff |
| `rentals` | My rentals, rental desk (checkout/return) | Borrower, Staff |
| `payments` | History, receipts, verification queue | Borrower, Staff |
| `inventory` | Inventory management | Staff, Admin |
| `maintenance` | Maintenance board | Staff, Admin |
| `feedback` | Reviews, submit, moderation | Guest, Borrower, Staff |
| `notifications` | Feed | All signed-in |
| `profile` | Profile/settings | All signed-in |
| `admin` | Users, audit log | Admin |
| `dashboard` | Role-aware dashboard | All signed-in |

**Seed (`apps/api/src/db/seed/`)**
- `fixtures/` — demo users, tools, reservations, rentals, payments, maintenance, feedback, notifications, audit (A7.1), including the added edge cases.
- `seed.ts` — refuses to run unless `NODE_ENV` is `development`/`demo` and `ALLOW_DEMO_SEED=true`; inserts parents before children in one transaction; reports inserted/skipped/invalid; idempotent (never overwrites user data).
- `validate-fixtures.ts` — checks borrower/tool consistency and chronology (A7.3) before any insert.
- Equipment illustrations in `apps/web/public/equipment/` with a fallback image.

**Additional docs:** `docs/status-transitions.md` (allowed transitions per A4.3), `docs/role-matrix.md` (A3), `docs/data-dictionary.md` (Phase 0 exit).

---

## B3. pnpm Setup

**`pnpm-workspace.yaml`**
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

**`.npmrc`**
```
engine-strict=true
auto-install-peers=true
save-exact=true
```

**Root `package.json` scripts**
```json
{
  "scripts": {
    "dev": "pnpm --parallel --filter @app/web --filter @app/api dev",
    "build": "pnpm -r build",
    "lint": "pnpm -r lint",
    "typecheck": "pnpm -r typecheck",
    "test": "pnpm -r test",
    "db:generate": "pnpm --filter @app/api db:generate",
    "db:migrate": "pnpm --filter @app/api db:migrate",
    "db:seed": "pnpm --filter @app/api db:seed",
    "audit": "pnpm audit --prod"
  },
  "packageManager": "pnpm@<pin-version>",
  "engines": { "node": ">=20" }
}
```

Conventions:
- Internal packages referenced with `workspace:*` (e.g. `"@app/shared": "workspace:*"`).
- Always commit `pnpm-lock.yaml`; CI installs with `pnpm install --frozen-lockfile`.
- Pin Node via `.nvmrc` and the `packageManager` field (Corepack).

---

## B4. Architecture Principles (Scalability + Maintainability)

1. **Layered backend:** `routes → controller → service → repository → db`. Controllers never touch SQL; services never touch `req`/`res`. Swapping SQLite for Postgres later only affects `repository` and `db/`.
2. **Feature/module-based folders** on both sides, so each feature is self-contained and can be extracted later.
3. **Single source of truth for contracts:** Zod schemas and inferred types in `packages/shared`; both the API validation and the frontend forms use them.
4. **Testable app:** `app.ts` exports the Express app, `server.ts` only starts it.
5. **Typed config:** all env vars parsed and validated once in `config/env.ts`; the app fails fast on bad config.
6. **Consistent errors:** a single `AppError` class plus a central error handler returning a uniform JSON shape (`{ error: { code, message } }`).
7. **Versioned API:** mount routes under `/api/v1`.
8. **Migrations only:** never edit the schema by hand; generate and commit migrations.
9. **Docs as code:** significant decisions recorded in `docs/adr/`.

### SQLite specifics
- Open with: `journal_mode = WAL`, `foreign_keys = ON`, `busy_timeout = 5000`, `synchronous = NORMAL`.
- One connection per process (better-sqlite3 is synchronous and fast); keep transactions short.
- DB path from env: `DATABASE_PATH=./data/app.db`.
- Scheduled backups with `VACUUM INTO` or the SQLite backup API (`scripts/backup-db.ts`); consider Litestream for continuous replication.
- Growth path: if you outgrow single-writer limits, the repository layer lets you migrate to Postgres with limited blast radius.

---

## B5. Recommended Security Protocols

### Application
| Area | Protocol |
|---|---|
| HTTP headers | `helmet` (CSP, HSTS, X-Content-Type-Options, frame-ancestors) |
| CORS | `cors` with an explicit origin allowlist from env, never `*` with credentials |
| Rate limiting | `express-rate-limit` globally; much stricter on `/auth/*` |
| Input validation | Zod on every `body`, `query`, `params`; reject unknown keys (`.strict()`) |
| SQL injection | Parameterized queries only (Drizzle / prepared statements); never string-concatenate SQL |
| XSS | React escapes by default; avoid `dangerouslySetInnerHTML`; sanitize any rich text (DOMPurify); strict CSP |
| CSRF | Use `SameSite=Lax/Strict` cookies; add CSRF tokens if using cookie auth with cross-site possibilities |
| Body limits | `express.json({ limit: '100kb' })`; limit upload size/type if uploads exist |
| Error handling | No stack traces or SQL errors to clients in production; log details server-side |
| `x-powered-by` | Disabled (`app.disable('x-powered-by')`, also covered by helmet) |

### Authentication & Authorization
- Hash passwords with **argon2id** (or bcrypt cost ≥ 12). Never store plaintext or reversible hashes.
- Prefer **server sessions or short-lived JWT access tokens in `HttpOnly; Secure; SameSite` cookies**; avoid storing tokens in `localStorage`.
- Role-based access control enforced in **middleware on the server**; never trust frontend role checks.
- Check object ownership/permissions in services (prevent IDOR).
- Login throttling, generic "invalid credentials" messages, and optional account lockout.

### Secrets & Configuration
- `.env` is gitignored; only `.env.example` is committed.
- Validate required secrets at startup (min length for JWT/session secret).
- Different secrets per environment; rotate on suspected exposure.
- Consider a pre-commit secret scanner (e.g. gitleaks).

### Data & Database
- The `.db`, `-wal`, and `-shm` files are gitignored and live outside any publicly served folder.
- Restrict file permissions (`chmod 600`) and run the process as a non-root user.
- Encrypted, tested backups stored off the machine; document restore steps.
- Store only the personal data you need; consider encrypting sensitive columns.

### Dependencies & Supply Chain
- `pnpm audit --prod` in CI; enable Dependabot or Renovate.
- Commit the lockfile and install with `--frozen-lockfile`.
- Review new dependencies (maintenance, downloads, license) before adding.
- Keep Node LTS and update regularly.

### Transport & Deployment
- HTTPS everywhere (TLS at reverse proxy such as Nginx/Caddy); redirect HTTP→HTTPS; set `trust proxy` correctly.
- Run behind a reverse proxy; do not expose Node directly.
- Separate dev, staging, and production configs.

### Logging & Monitoring
- Structured logging (`pino`); redact passwords, tokens, and cookies.
- Log auth events (login, failure, permission denied) and admin actions (audit trail table).
- Health endpoint (`/health`) that exposes no sensitive info.

### MCTEB-specific controls
- **Ownership checks (IDOR):** every borrower query is scoped by `user_id` from the session, never from the request, for reservations, rentals, payments, feedback, and notifications.
- **Role escalation:** only Administrators change `role`/`status`; staff cannot grant admin; block self-demotion and self-suspension of the last active admin.
- **Account lockout:** use the schema's login counters; generic error messages; lockout guidance shown without revealing whether the email exists.
- **Payment proof uploads:** allowlist types (JPEG/PNG/PDF), size cap, random filenames, stored outside the web root and served only through an authorized endpoint; never log proof contents.
- **Concurrency:** wrap approve/checkout/return/verify in `BEGIN IMMEDIATE` transactions so two requests cannot overbook or double-update inventory; make payment verification idempotent.
- **Audit coverage:** approvals/rejections, payment verification, suspensions, fee/penalty changes, archiving, and moderation all write an `audit_logs` row (actor, action, target, details, IP) in the same transaction.
- **Privacy:** residents' addresses, birth dates, and contact details are returned only to the owner, staff with a need, and admins; public feedback exposes first name/initial only.
- **Demo safety:** seed script is blocked in production; startup fails if known demo emails or default passwords exist when `NODE_ENV=production`.
- **Data hygiene:** never copy real resident data into demo/dev databases; encrypt backups since they contain PII.

### Process
- Branch protection with required CI checks and code review.
- Security checklist in `docs/security.md`, reviewed before each release.
- A `SECURITY.md` explaining how to report vulnerabilities.

---

## B6. Recommended Dependencies

**Backend:** `express`, `helmet`, `cors`, `express-rate-limit`, `zod`, `better-sqlite3`, `drizzle-orm`, `argon2`, `pino`, `pino-http`, `cookie-parser`, `dotenv`
**Backend dev:** `typescript`, `tsx`, `drizzle-kit`, `vitest`, `supertest`, `@types/*`
**Frontend:** `react`, `react-dom`, `react-router-dom`, `@tanstack/react-query`, `react-hook-form`, `@hookform/resolvers`, `zod`
**Frontend dev:** `vite`, `@vitejs/plugin-react`, `tailwindcss`, `postcss`, `autoprefixer`, `vitest`, `@testing-library/react`
**Root dev:** `eslint`, `typescript-eslint`, `prettier`, `husky`, `lint-staged`, `@commitlint/cli`

---

## B7. Documentation Files

### `README.md` outline
1. Project overview and purpose
2. Tech stack
3. Prerequisites (Node, pnpm via Corepack)
4. Getting started (`pnpm install`, copy `.env.example`, `pnpm db:migrate`, `pnpm dev`)
5. Project structure (condensed)
6. Available scripts
7. Environment variables table
8. Testing, linting, building
9. Deployment notes
10. Contributing (branching, commit convention) and link to `docs/`

### `CHANGELOG.md`
Follow **Keep a Changelog** + **Semantic Versioning**.
```md
# Changelog
All notable changes to this project are documented here.

## [Unreleased]
### Added
- Initial project structure.

## [0.1.0] - YYYY-MM-DD
### Added
- ...
```
Use Conventional Commits (`feat:`, `fix:`, `chore:`) so entries are easy to generate; optionally automate with Changesets.

### `.gitignore`
```gitignore
# Dependencies
node_modules/

# Build output
dist/
build/
coverage/
*.tsbuildinfo

# Environment / secrets
.env
.env.*
!.env.example

# Database (never commit)
data/*.db
data/*.db-wal
data/*.db-shm
data/*.sqlite*
backups/

# Logs
*.log
logs/
pnpm-debug.log*

# OS / editor
.DS_Store
Thumbs.db
.vscode/*
!.vscode/extensions.json
!.vscode/settings.json
.idea/

# Misc
.vite/
.cache/
```

### `.env.example`
```
NODE_ENV=development
PORT=3000
DATABASE_PATH=./data/app.db
CORS_ORIGINS=http://localhost:5173
SESSION_SECRET=change-me-min-32-chars
LOG_LEVEL=info
```

---

## B8. Technical Work per Product Phase

Technical tasks mapped onto the product phases in A8.

| Product phase (A8) | Technical tasks |
|---|---|
| **0. Decisions** | Write `docs/data-dictionary.md`, `status-transitions.md`, `role-matrix.md`; decide on schema extensions (FKs in A11 items 3–5); record choices as ADRs |
| **1. Foundation** | Init repo and pnpm workspace, tsconfig base, ESLint/Prettier, Husky, CI; Express app/server split, env validation, logger, error handler, helmet/CORS/rate limit, `/health`; SQLite client + pragmas, apply `schema.sql` as migration `0001`; Vite + Tailwind, design tokens, app shell, role-aware nav; `packages/shared` enums |
| **2. Accounts and catalog** | `auth`, `users`, `tools` modules; session cookies, RBAC middleware; catalog and inventory UI |
| **3. Reservations and rentals** | `reservations`, `rentals`, `notifications` modules; transactional conflict checks and inventory updates; concurrency tests |
| **4. Payments** | `payments` module; money helpers; proof upload handling; receipt/print view |
| **5. Maintenance, feedback, admin** | `maintenance`, `feedback`, `audit`, admin UI; audit coverage tests |
| **6. Quality and launch** | Security/accessibility/performance checks; backup + restore drill; remove demo access; `pnpm audit`; production build, reverse proxy + HTTPS; tag `v1.0.0` and update CHANGELOG |

---

## B9. Definition of Done (per feature)
- [ ] Zod schema in `packages/shared`
- [ ] Migration written and committed (schema changes reviewed per A1)
- [ ] Multi-row operations run in a transaction and write an audit row where required
- [ ] Loading, empty, success, validation, and error states implemented (A10 UX)
- [ ] Authorization checked server-side
- [ ] Tests written and passing
- [ ] Lint and typecheck clean
- [ ] `docs/api.md` updated
- [ ] CHANGELOG entry added
