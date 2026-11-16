# Municipal Community Tool and Equipment Bank (MCTEB)

### Municipality of Basco, Province of Batanes

A standardized, TypeScript-driven civic resource platform enabling residents across the six barangays of Basco to discover, reserve, and borrow shared agricultural machinery, fishing gear, carpentry and construction equipment, electrical repair tools, and emergency storm-response implements.

---

## 🏛️ Project Overview

MCTEB provides local government autonomy and equipment preservation in an island environment subject to extreme weather and intermittent connectivity:

- **100% TypeScript Architecture**: End-to-end static type safety from database query results to React UI components.
- **Resilient Zero-Dependency SQLite Engine**: Utilizes Node.js's native `node:sqlite` (`DatabaseSync`) module running in Write-Ahead Logging (`WAL`) mode with strict foreign keys and busy timeout handlers. Zero external C++ compilation required.
- **Strict Layered Separation of Concerns**: Enforces `routes -> controller -> service -> repository -> db` across all 10 domain modules.
- **Integer Centavos Currency**: Eliminates floating-point rounding anomalies by representing all rental rates, deposit bonds, and assessed penalties as integer centavos.
- **Automated Development Setup**: Cross-platform bootstrapping via `setup.bat`, `scripts/setup.ps1`, and `scripts/setup.sh`.
- **Comprehensive Documentation System**: Modeled on modern architectural reference standards, structured into five categorized directories.

---

## 🛠️ Technology Stack

| Layer                                    | Technologies                                                                                                            |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Monorepo Management**                  | `pnpm` v12.15.0 workspaces, Corepack, Husky, Commitlint                                                                 |
| **Backend API (`apps/api`)**             | Node.js (>= 20), Express 4, TypeScript 5.8, native `node:sqlite`, Zod 3.23, Pino 9.6, Helmet, CORS, Rate Limit          |
| **Frontend SPA (`apps/web`)**            | React 19, TypeScript 5.8, Vite 6, Tailwind CSS 3.4, TanStack Query 5, React Router 7, Lucide Icons                      |
| **Shared Contracts (`packages/shared`)** | Zod schemas, domain enums, role-permission matrices, integer centavos currency helpers, Manila timezone date formatters |
| **Code Quality & Testing**               | ESLint 9 (Flat Config), typescript-eslint 8, Prettier 3, Vitest 3, React Testing Library, Supertest                     |

---

## 🚀 Automated First-Time Setup

### Windows (One-Click)

Run the automated batch wrapper from Command Prompt or PowerShell:

```cmd
setup.bat
```

Or directly in PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\setup.ps1
```

### Linux / macOS

```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

The automated script automatically:

1. Verifies that Node.js (`>= 20.0.0`) and pnpm are present.
2. Creates `.env` from `.env.example` with safe development defaults (if not present).
3. Installs all monorepo dependencies deterministically with pnpm.
4. Verifies the native Node.js SQLite engine.
5. Initializes the database and applies schema migrations (`db/schema.sql`).
6. Seeds realistic demo accounts and sample equipment fixtures (`apps/api/src/db/seed/`).

---

## 💻 Manual Setup & Startup

```bash
# 1. Clone repository
git clone https://github.com/YourOrg/MCTED.git
cd MCTED

# 2. Configure environment
cp .env.example .env

# 3. Install dependencies
pnpm install

# 4. Initialize database, migrate schema, and seed demo records
pnpm run db:init
pnpm run db:migrate
pnpm run db:seed

# 5. Launch development servers (Frontend + Backend concurrently)
pnpm run dev
```

### Application URLs

- **Web Application**: [http://localhost:5173](http://localhost:5173)
- **API Backend**: [http://localhost:3000/api/v1](http://localhost:3000/api/v1)
- **Health Check**: [http://localhost:3000/health](http://localhost:3000/health)

---

## 👤 Development Demo Accounts

All development demo accounts authenticate with the password: **`Basco@2026!`**

| Persona            | Role              | Email                   | Barangay               | Primary Purpose                                  |
| ------------------ | ----------------- | ----------------------- | ---------------------- | ------------------------------------------------ |
| **Maria Santos**   | `Administrator`   | `admin@basco.gov.ph`    | Barangay I (Poblacion) | User management, audit logs, catalog CRUD        |
| **Juan dela Cruz** | `Municipal Staff` | `staff@basco.gov.ph`    | Barangay II            | Reservation review, checkouts, returns, payments |
| **Ana Reyes**      | `Borrower`        | `borrower@basco.gov.ph` | Barangay III           | Tool bookings, payment uploads, reviews          |
| **Pedro Batanes**  | `Borrower`        | `farmer@basco.gov.ph`   | Barangay IV            | Agricultural equipment loans & tracking          |

Full credentials, permission details, and sample data relationships are documented in [DEMO_ACCOUNTS.md](file:///c:/Web-Application/MCTED/docs/development/DEMO_ACCOUNTS.md).

---

## 📜 Monorepo NPM Scripts

All development, maintenance, and database tasks are managed via pnpm from the repository root:

| Command                  | Purpose                                                                            |
| ------------------------ | ---------------------------------------------------------------------------------- |
| `pnpm run setup`         | Full bootstrap: dependencies, database init, migrations, demo seeding              |
| `pnpm run dev`           | Starts API backend (port 3000) and frontend SPA (port 5173) in parallel            |
| `pnpm run build`         | Compiles `@mcteb/shared`, builds backend TypeScript, and bundles frontend Vite SPA |
| `pnpm run typecheck`     | Validates static TypeScript typing across all 3 workspaces with zero emission      |
| `pnpm run lint`          | Analyzes code quality using ESLint flat configuration                              |
| `pnpm run lint:fix`      | Automatically fixes autofixable ESLint issues                                      |
| `pnpm run format`        | Formats all files across the repository using Prettier                             |
| `pnpm run format:check`  | Verifies formatting compliance without writing                                     |
| `pnpm run test`          | Executes all Vitest and Node test suites across workspaces                         |
| `pnpm run db:init`       | Safely verifies or initializes the SQLite database file without data loss          |
| `pnpm run db:migrate`    | Applies relational DDL schema and indexes from `db/schema.sql`                     |
| `pnpm run db:seed`       | Seeds demo users, equipment catalog, and realistic relational fixtures             |
| `pnpm run db:reset-demo` | Safely resets only designated demo records while preserving user data              |
| `pnpm run db:backup`     | Creates an atomic hot database snapshot in `backups/` using `VACUUM INTO`          |
| `pnpm run audit`         | Checks installed production packages for known security vulnerabilities            |

---

## 📚 Centralized Documentation System

The project documentation is organized into five structured categories within `docs/`:

```text
docs/
├── architecture/
│   ├── SYSTEM_ARCHITECTURE.md     # Layered design, monorepo packages, component diagram
│   ├── PROJECT_STRUCTURE.md       # Directory layout, responsibilities, naming conventions
│   ├── ARCHITECTURE_DECISIONS.md  # Architectural Decision Records (ADRs 0001–0007)
│   └── DATA_FLOW.md               # Sequence diagrams for auth, reservations, checkouts
│
├── technical/
│   ├── DATABASE.md                # SQLite pragmas, schema DDL, foreign keys, indexes
│   ├── API_DOCUMENTATION.md       # Comprehensive REST endpoint contracts and payloads
│   ├── AUTHENTICATION.md          # Scrypt cryptography, timingSafeEqual, account lockout
│   ├── SECURITY.md                # RBAC matrix, IDOR defense, rate limits, audit logging
│   └── CONFIGURATION.md           # Environment variables, ports, session secret keys
│
├── development/
│   ├── INSTALLATION.md            # Prerequisites, setup scripts, and manual walkthrough
│   ├── DEVELOPMENT_GUIDELINES.md  # Git branching, Conventional Commits, PR standards
│   ├── CODING_STANDARDS.md        # 4-tier layer pattern, AppError hierarchy, Pino logging
│   ├── TYPESCRIPT_STANDARDS.md    # Strict typing rules, Zod schema inference, banned any
│   ├── TESTING_GUIDELINES.md      # Backend integration, component, and unit test suites
│   └── DEMO_ACCOUNTS.md           # Demo roles, credentials, catalog items, reset guide
│
├── maintenance/
│   ├── DEVELOPMENT_STATUS.md      # Feature completion table and verified health metrics
│   ├── KNOWN_ISSUES.md            # Documented limitations and operational workarounds
│   ├── TECHNICAL_DEBT.md          # Resolved and tracked technical debt items
│   └── FUTURE_IMPROVEMENTS.md     # Phase 2–4 roadmap: QR asset tags, SMS, offline PWA
│
└── audits/
    ├── DEVELOPMENT_AUDIT.md       # Codebase audit findings, JS vs TS audit, fixes
    ├── SECURITY_AUDIT.md          # Vulnerability assessment, brute-force & IDOR tests
    └── UI_UX_AUDIT.md             # Civic green design system, WCAG AA, mobile responsiveness
```

---

## 🏛️ Municipal Policy Alignment

1. **Municipal Jurisdiction**: Borrowers must reside within one of the six barangays of Basco (Chanarian, Ihubok I, Ihubok II, Kayhuvokan, San Antonio, San Joaquin).
2. **Age Eligibility**: Borrowers must be legal adults (>= 18 years) to enter into equipment custody agreements.
3. **Emergency Civic Relief**: Emergency response equipment (e.g., portable storm generators) carries a ₱0.00 rental and deposit fee during typhoon preparation windows.
4. **Official Receipts**: All payments generate traceable municipal reference numbers (e.g., `BASCO-PAY-2026-XXXXXX`).
