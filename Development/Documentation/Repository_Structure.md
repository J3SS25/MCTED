# Repository Structure

**Municipal Community Tool and Equipment Bank (MCTEB)**  
Municipality of Basco, Batanes

---

## Monorepo Layout

```
MCTEB/
├── backend/                     # @mcteb/backend — Express REST API
├── frontend/                    # @mcteb/frontend — React 19 SPA
├── packages/
│   └── shared/                  # @mcteb/shared — Shared types, enums, Zod schemas
├── Database/                    # SQLite database file and backups
│   ├── app.db                   # Live development database (do NOT commit)
│   └── backups/                 # Hot backup files from db:backup script
├── Development/                 # Centralized developer ecosystem
│   ├── Documentation/           # Architecture and technical reference docs
│   ├── Audit/                   # Code, security, and UI/UX audit reports
│   ├── scripts/                 # Developer setup, start, stop, and test scripts
│   │   └── database/            # Database utility scripts (backup)
│   ├── setup/                   # Local development setup guide
│   ├── testing/                 # Testing strategy and guidelines
│   ├── maintenance/             # Changelog, roadmap, technical debt
│   └── reference/               # Coding standards and style guides
├── .github/                     # GitHub Actions CI workflows
├── .husky/                      # Git hook configuration (pre-commit lint)
├── .env                         # Local environment variables (not committed)
├── .env.example                 # Safe environment variable template
├── .editorconfig                # Editor formatting consistency
├── .gitignore
├── .nvmrc                       # Node.js version pin (use nvm/fnm)
├── .npmrc                       # pnpm configuration
├── .prettierrc.json             # Prettier formatting rules
├── .prettierignore
├── .lintstagedrc.json           # lint-staged pre-commit hook configuration
├── commitlint.config.cjs        # Conventional commit linting
├── eslint.config.mjs            # ESLint flat config (TypeScript-aware)
├── tsconfig.json                # Root TypeScript project references
├── tsconfig.base.json           # Shared TypeScript compiler options
├── pnpm-workspace.yaml          # pnpm monorepo workspace definition
├── pnpm-lock.yaml               # Lockfile (commit this)
├── package.json                 # Root scripts and dev tooling
├── CHANGELOG.md                 # Version history (also at Development/maintenance/)
├── README.md                    # Project overview and quick start
└── SECURITY.md                  # Security policy and vulnerability reporting
```

---

## Backend Package (`backend/`)

The backend is a layered Express application. See [Backend_Architecture.md](./Backend_Architecture.md) for the full breakdown.

```
backend/
├── db/                          # Database layer (schema, migrations, seeds)
│   ├── client.ts                # node:sqlite DatabaseSync singleton
│   ├── init.ts                  # Database file creation
│   ├── migrate.ts               # Schema migration runner
│   ├── schema.sql               # Canonical SQL schema (10 tables)
│   └── seed/                    # Demo fixture seeder
├── src/
│   ├── app.ts                   # Express application factory
│   ├── server.ts                # HTTP server entry point
│   ├── config/                  # Environment config and app constants
│   ├── middleware/              # Auth, error handler, rate limit, validation
│   ├── models/                  # TypeScript type definitions for domain entities
│   ├── repositories/            # Data access layer (SQL queries)
│   ├── services/                # Business logic and domain workflows
│   ├── controllers/             # HTTP request/response handlers
│   ├── routes/                  # Route registration and middleware application
│   ├── validators/              # Zod schemas for request validation
│   ├── utils/                   # Crypto, error classes, logger
│   └── admin/                   # Isolated Administrator-only route perimeter
├── package.json                 # @mcteb/backend
└── tsconfig.json                # Extends ../tsconfig.base.json
```

---

## Frontend Package (`frontend/`)

The frontend is a React SPA. See [Frontend_Architecture.md](./Frontend_Architecture.md) for the full breakdown.

```
frontend/
├── public/                      # Static assets
├── src/
│   ├── app/                     # App root, router, React Query provider
│   ├── components/
│   │   ├── layout/              # AppShell, ProtectedRoute
│   │   └── ui/                  # Button, Card, Modal, Badge, etc.
│   ├── features/                # Domain-scoped screens
│   │   ├── admin/               # UsersPage, AuditLogPage
│   │   ├── auth/                # LoginPage, RegisterPage
│   │   ├── catalog/             # CatalogPage, ToolDetailPage
│   │   ├── dashboard/           # DashboardPage
│   │   ├── feedback/            # FeedbackPage, SubmitFeedbackModal
│   │   ├── inventory/           # InventoryPage, ToolFormModal
│   │   ├── maintenance/         # MaintenancePage, MaintenanceReportModal
│   │   ├── notifications/       # NotificationsPage
│   │   ├── payments/            # MyPaymentsPage, PaymentVerificationPage
│   │   ├── profile/             # ProfilePage
│   │   ├── rentals/             # RentalDeskPage, MyRentalsPage, ReturnInspectionModal
│   │   └── reservations/        # ReservationQueuePage, MyReservationsPage
│   ├── lib/                     # API client, AuthContext, ThemeContext
│   ├── styles/                  # Tailwind CSS entry point
│   └── main.tsx                 # Vite HTML entry
├── package.json                 # @mcteb/frontend
└── tsconfig.json                # Extends ../tsconfig.base.json
```

---

## Shared Package (`packages/shared/`)

```
packages/shared/
├── src/
│   ├── schemas/                 # Zod validation schemas (auth, tools, reservations…)
│   ├── types/                   # TypeScript type re-exports
│   ├── enums/                   # Domain enumerations (UserRole, ToolStatus…)
│   └── index.ts                 # Barrel re-export
├── package.json                 # @mcteb/shared
└── tsconfig.json                # Composite build — referenced by backend and frontend
```

---

## Development Directory (`Development/`)

```
Development/
├── Documentation/
│   ├── System_Overview.md
│   ├── Architecture.md
│   ├── Repository_Structure.md   ← this file
│   ├── Database_and_ERD.md
│   ├── API_Architecture.md
│   ├── Authentication_and_Security.md
│   ├── User_Roles_and_Permissions.md
│   ├── Business_Workflows.md
│   ├── Frontend_Architecture.md
│   ├── Backend_Architecture.md
│   ├── Developer_Guide.md
│   └── Architecture_Decisions.md
├── Audit/
│   ├── README.md
│   ├── Report.md                 # Development audit
│   ├── Security_Audit.md
│   ├── UI_UX_Audit.md
│   └── Prompts/                  # Reusable audit prompt templates
├── scripts/
│   ├── setup.bat                 # Windows setup shortcut
│   ├── setup.ps1                 # PowerShell automated setup
│   ├── setup.sh                  # Bash setup (Linux/macOS)
│   ├── start.bat                 # Start development servers (Windows)
│   ├── stop.bat                  # Stop development servers (Windows)
│   ├── test.bat                  # Run all tests (Windows)
│   └── database/
│       └── backup.ts             # Hot SQLite backup utility
├── setup/
│   └── LOCAL_SETUP.md            # Step-by-step local development setup guide
├── testing/
│   └── TESTING.md                # Testing strategy and guidelines
├── maintenance/
│   ├── CHANGELOG.md              # Full version history
│   ├── DEVELOPMENT_STATUS.md     # Current feature completion status
│   ├── TECHNICAL_DEBT.md         # Known technical debt and remediation plans
│   └── ROADMAP.md                # Future improvements and feature roadmap
└── reference/
    ├── CODING_STANDARDS.md
    ├── TYPESCRIPT_STANDARDS.md
    └── KNOWN_ISSUES.md
```

Legacy project content and local-only reports, when retained locally, are archived under the gitignored `Development/_legacy/` directory. They are not part of the active workspace.

---

## Database Directory (`Database/`)

```
Database/
├── app.db          # Live SQLite database — excluded from git
├── backups/        # Hot backup files created by pnpm run db:backup
└── .gitkeep        # Keeps the directory tracked in git when app.db is ignored
```

The `.gitignore` excludes `Database/app.db` and `Database/backups/*.db`. The `Database/` directory itself is tracked via `.gitkeep`.

---

## Key Files at Root

| File                  | Purpose                                                        |
| --------------------- | -------------------------------------------------------------- |
| `pnpm-workspace.yaml` | Declares `backend`, `frontend`, `packages/*` workspaces        |
| `tsconfig.json`       | Project references to `packages/shared`, `backend`, `frontend` |
| `tsconfig.base.json`  | Shared `strict`, `moduleResolution`, `target` settings         |
| `eslint.config.mjs`   | Flat ESLint config — TypeScript-aware, project-service         |
| `.prettierrc.json`    | Prettier formatting rules applied to all workspaces            |
| `package.json`        | Root scripts: `dev`, `build`, `typecheck`, `test`, `db:*`      |
| `.env.example`        | Environment variable template — copy to `.env` and configure   |
