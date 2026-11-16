# Project Structure & Directory Organization

## Overview

The MCTEB repository is structured as a pnpm workspace monorepo. This document details the layout, module organization, naming conventions, and guidelines for adding new functionality.

---

## Directory Tree

```text
MCTED/
├── .github/                     # Continuous Integration workflows
│   └── workflows/ci.yml         # Automated build, lint, and test checks
├── .husky/                      # Git hooks (pre-commit, commit-msg)
├── apps/
│   ├── api/                     # Express.js REST API Backend
│   │   ├── data/                # SQLite development database file (app.db)
│   │   ├── src/
│   │   │   ├── config/          # Environment variable parser and constants
│   │   │   ├── db/              # SQLite connection client, migration, seed, init
│   │   │   │   └── seed/        # Fixtures, validator, and reset scripts
│   │   │   ├── middleware/      # Auth, error handling, rate limiting, validation
│   │   │   ├── modules/         # Domain feature slices
│   │   │   │   ├── audit/       # Immutable security audit trail
│   │   │   │   ├── auth/        # Authentication, sessions, registration
│   │   │   │   ├── feedback/    # Resident ratings and moderation
│   │   │   │   ├── maintenance/ # Equipment defect tickets and repairs
│   │   │   │   ├── notifications/# User alert dispatches
│   │   │   │   ├── payments/    # Municipal receipts and verification
│   │   │   │   ├── rentals/     # Equipment handover checkout & return inspections
│   │   │   │   ├── reservations/# Advance booking requests & review queue
│   │   │   │   ├── tools/       # Catalog items and inventory stock
│   │   │   │   └── users/       # Resident and staff account oversight
│   │   │   ├── utils/           # Crypto, error classes, Pino logger
│   │   │   ├── app.ts           # Express application setup
│   │   │   ├── app.test.ts      # Integration test suite
│   │   │   └── server.ts        # HTTP listener entrypoint
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vitest.config.ts
│   │
│   └── web/                     # React 19 Frontend Single-Page Application
│       ├── src/
│       │   ├── app/             # Application shell, router definition
│       │   ├── components/      # Reusable UI component library
│       │   │   ├── layout/      # AppShell, Navbar, Sidebar, ProtectedRoute
│       │   │   └── ui/          # Button, Input, Modal, Card, Badge, Alert, etc.
│       │   ├── features/        # Feature screens organized by domain
│       │   │   ├── admin/       # UsersPage, AuditLogPage
│       │   │   ├── auth/        # LoginPage, RegisterPage
│       │   │   ├── catalog/     # CatalogPage, ToolDetailPage
│       │   │   ├── dashboard/   # Role-aware overview dashboard
│       │   │   ├── feedback/    # FeedbackPage, SubmitFeedbackModal
│       │   │   ├── inventory/   # InventoryPage, ToolFormModal
│       │   │   ├── maintenance/ # MaintenancePage, MaintenanceReportModal
│       │   │   ├── notifications/# NotificationsPage
│       │   │   ├── payments/    # MyPaymentsPage, PaymentVerificationPage, ReceiptModal
│       │   │   ├── profile/     # ProfilePage
│       │   │   ├── rentals/     # MyRentalsPage, RentalDeskPage, ReturnModal
│       │   │   └── reservations/# MyReservationsPage, QueuePage, BookingModal
│       │   ├── lib/             # API client, auth context, theme context
│       │   ├── styles/          # Tailwind entrypoint and global CSS
│       │   └── main.tsx         # React DOM mount point
│       ├── package.json
│       ├── tailwind.config.ts
│       ├── tsconfig.json
│       ├── vite.config.ts
│       └── vitest.config.ts
│
├── db/                          # Authoritative SQL schema
│   └── schema.sql               # 9 core relational tables, foreign keys, indexes
│
├── docs/                        # Centralized documentation system
│   ├── architecture/            # System architecture, data flow, ADRs
│   ├── technical/               # Database, API, security, authentication
│   ├── development/             # Setup, coding standards, demo credentials
│   ├── maintenance/             # Development status, debt, future roadmap
│   └── audits/                  # Code quality, security, and UI/UX audits
│
├── packages/
│   └── shared/                  # Shared Domain Contract & Validation Layer
│       ├── src/
│       │   ├── schemas/         # Zod schemas for all 9 entities
│       │   ├── dates.ts         # Manila timezone date formatters
│       │   ├── enums.ts         # Domain enumerations (roles, statuses)
│       │   ├── index.ts         # Package entrypoint
│       │   ├── money.ts         # Integer centavos currency helpers
│       │   ├── money.test.ts    # Unit test suite for financial conversions
│       │   └── permissions.ts   # Role-permission capability matrix
│       ├── package.json
│       └── tsconfig.json
│
├── scripts/                     # Operational & automation scripts
│   ├── backup-db.ts             # Hot SQLite backup via VACUUM INTO
│   ├── setup.ps1                # Windows automated development setup
│   └── setup.sh                 # Linux / macOS automated development setup
│
├── .editorconfig                # Universal editor formatting consistency
├── .env.example                 # Documented template for environment variables
├── .gitignore                   # Version control ignore definitions
├── .prettierrc.json             # Prettier code formatting rules
├── .prettierignore              # Prettier exclusions
├── eslint.config.mjs            # Flat ESLint configuration with TypeScript-ESLint
├── package.json                 # Monorepo root scripts and devDependencies
├── pnpm-lock.yaml               # Deterministic pnpm dependency lockfile
├── pnpm-workspace.yaml          # pnpm workspace package mappings
├── README.md                    # Primary repository guide and quick start
├── setup.bat                    # Windows batch launcher for scripts/setup.ps1
├── tsconfig.base.json           # Shared TypeScript compiler configuration
└── tsconfig.json                # Project references container
```

---

## Naming Conventions

### File Extensions

- `.ts`: Standard TypeScript logic, services, repositories, utilities, schemas.
- `.tsx`: React components and UI pages.
- `.sql`: Relational database schemas and migration scripts.
- `.json` / `.mjs`: Tooling configuration files.

### Backend Feature Modules (`apps/api/src/modules/<feature>/`)

Every domain feature adheres to standard file naming:

- `<feature>.routes.ts`: Express router defining URL endpoints and middleware.
- `<feature>.controller.ts`: Request parsing and HTTP responses.
- `<feature>.service.ts`: Business logic, permissions, atomic transactions, side-effects.
- `<feature>.repository.ts`: Parameterized database queries.

### Frontend Components (`apps/web/src/`)

- PascalCase for React components and screens (e.g., `CatalogPage.tsx`, `ToolFormModal.tsx`).
- kebab-case for utilities, context providers, and hooks (e.g., `auth-context.tsx`, `api.ts`).

---

## Guide: Adding New Functionality

### 1. Adding a New Backend Domain Module

1. Define shared data models and Zod schemas in `packages/shared/src/schemas/<module>.ts`.
2. Export the new schemas from `packages/shared/src/index.ts` and run `pnpm --filter @mcteb/shared build`.
3. If new tables are needed, update `db/schema.sql` and `docs/technical/DATABASE.md`.
4. Create `apps/api/src/modules/<module>/`:
   - `<module>.repository.ts` for database queries.
   - `<module>.service.ts` for domain rules, transactions, and audit records.
   - `<module>.controller.ts` for HTTP input/output handling.
   - `<module>.routes.ts` for endpoint definitions and validation middleware.
5. Mount the new router in `apps/api/src/app.ts` under `/api/v1/<module>`.
6. Add unit or integration tests in `apps/api/src/app.test.ts`.

### 2. Adding a New Frontend Feature Screen

1. Create a feature folder in `apps/web/src/features/<feature>/`.
2. Implement the page component (`<Feature>Page.tsx`) using shared UI components from `@/components/ui`.
3. Use `apiRequest` from `@/lib/api` or TanStack Query hooks to fetch data.
4. Register the route in `apps/web/src/app/routes.tsx`.
5. If the route requires authentication or specific roles, wrap with `<ProtectedRoute requiredRole="..." />`.
6. Add navigation links to the sidebar in `apps/web/src/components/layout/AppShell.tsx`.
