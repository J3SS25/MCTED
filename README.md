# Municipal Community Tool and Equipment Bank (MCTEB)

### Municipality of Basco, Province of Batanes

A standardized, TypeScript-driven civic resource platform enabling residents across the six barangays of Basco to discover, reserve, and borrow shared agricultural machinery, fishing gear, carpentry and construction equipment, electrical repair tools, and emergency storm-response implements.

---

## 🏛️ Project Overview

MCTEB provides local government autonomy and equipment preservation in an island environment subject to extreme weather and intermittent connectivity:

- **100% TypeScript Architecture**: End-to-end static type safety from database query results to React UI components.
- **Resilient Zero-Dependency SQLite Engine**: Utilizes Node.js's native `node:sqlite` (`DatabaseSync`) module running in Write-Ahead Logging (`WAL`) mode with strict foreign keys and busy timeout handlers. Zero external C++ compilation required.
- **Strict Layered Separation of Concerns**: Enforces `routes -> controller -> service -> repository -> db` across all 10 domain modules with an isolated `/api/v1/admin` route perimeter.
- **Integer Centavos Currency**: Eliminates floating-point rounding anomalies by representing all rental rates, deposit bonds, and assessed penalties as integer centavos.
- **Automated Development Setup**: Cross-platform bootstrapping via `setup.bat`, `development/scripts/setup.ps1`, and `development/scripts/setup.sh`.
- **Centralized Developer Ecosystem**: All documentation, audits, developer scripts, testing guidelines, and maintenance files consolidated under `development/`.

---

## 🛠️ Technology Stack

| Layer                                    | Technologies                                                                                                            |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Monorepo Management**                  | `pnpm` v12.15.0 workspaces, Corepack, Husky, Commitlint                                                                 |
| **Backend API (`backend/`)**             | Node.js (>= 20), Express 4, TypeScript 5.8, native `node:sqlite`, Zod 3.23, Pino 9.6, Helmet, CORS, Rate Limit          |
| **Frontend SPA (`frontend/`)**           | React 19, TypeScript 5.8, Vite 6, Tailwind CSS 3.4, TanStack Query 5, React Router 7, Lucide Icons                      |
| **Database (`Database/`)**               | Native SQLite (`DatabaseSync`), Write-Ahead Logging (`WAL`), automated hot backups (`VACUUM INTO`)                      |
| **Shared Contracts (`packages/shared`)** | Zod schemas, domain enums, role-permission matrices, integer centavos currency helpers, Manila timezone date formatters |
| **Code Quality & Testing**               | ESLint 9 (Flat Config), typescript-eslint 8, Prettier 3, Vitest 3, React Testing Library, Supertest                     |

---

## 📁 Repository Structure

```text
MCTEB/
├── backend/                     # Centralized backend application
│   ├── src/
│   │   ├── config/              # Environment and application constants
│   │   ├── middleware/          # Authentication (RBAC), error handling, rate limiting
│   │   ├── routes/              # API route registration (v1Router)
│   │   ├── controllers/         # HTTP request and response handling
│   │   ├── services/            # Business logic and domain workflows
│   │   ├── repositories/        # Database access and query operations
│   │   ├── models/              # TypeScript database models and interfaces
│   │   ├── validators/          # Request payload validators
│   │   ├── utils/               # Crypto (scrypt), AppError hierarchy, Pino logger
│   │   ├── admin/               # Isolated administrative perimeter (/api/v1/admin)
│   │   ├── app.ts               # Express application initialization
│   │   └── server.ts            # Server entry point and graceful shutdown
│   ├── db/                      # SQLite database layer
│   │   ├── client.ts            # node:sqlite DatabaseSync singleton
│   │   ├── init.ts              # Database file initialization
│   │   ├── migrate.ts           # Schema migration runner
│   │   ├── schema.sql           # Canonical SQL schema (10 tables)
│   │   └── seed/                # Idempotent fixture seeders
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                    # Independent frontend application
│   ├── public/                  # Static assets and equipment illustrations
│   ├── src/
│   │   ├── app/                 # Application initialization and routes
│   │   ├── components/          # Reusable UI primitives and AppShell layout
│   │   ├── features/            # Domain-specific screens (catalog, rentals, etc.)
│   │   ├── lib/                 # API client (Axios), AuthContext, ThemeContext
│   │   ├── styles/              # Global Tailwind CSS styling
│   │   └── main.tsx             # Vite application mount point
│   ├── package.json
│   └── tsconfig.json
│
├── Database/                    # SQLite development database and hot backups
│   ├── app.db                   # Live SQLite database file (git-ignored)
│   ├── backups/                 # Atomic hot backups (git-ignored)
│   └── .gitkeep
│
├── development/                 # Centralized developer ecosystem
│   ├── Documentation/           # System, architecture, API, and DB documentation
│   ├── Audit/                   # Development, security, and UI/UX audit reports
│   ├── scripts/                 # Cross-platform development scripts
│   │   ├── setup.bat / .ps1 / .sh
│   │   ├── start.bat / stop.bat / test.bat
│   │   └── database/backup.ts
│   ├── setup/                   # Local setup walkthroughs
│   ├── testing/                 # Test suites and testing guidelines
│   ├── maintenance/             # CHANGELOG, roadmap, and technical debt
│   └── reference/               # Coding standards and style guides
│
├── packages/
│   └── shared/                  # Shared TypeScript contracts and validation
│       ├── src/
│       │   ├── schemas/         # Zod validation schemas
│       │   ├── types/           # Type re-exports
│       │   ├── enums/           # Domain enumerations
│       │   └── index.ts         # Barrel contract exports
│       └── package.json
│
├── setup.bat                    # Windows setup launcher (calls development/scripts/setup.bat)
├── pnpm-workspace.yaml          # pnpm workspace configuration
├── tsconfig.json                # Root TypeScript project references
├── tsconfig.base.json           # Shared base TypeScript options
├── eslint.config.mjs            # Flat ESLint configuration
├── .prettierrc.json             # Prettier code formatting rules
├── .env.example                 # Environment variable template
└── README.md
```

---

## 🚀 Automated First-Time Setup

### Windows (One-Click)

Run the automated batch wrapper from Command Prompt or PowerShell:

```cmd
setup.bat
```

Or directly in PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File development\scripts\setup.ps1
```

### Linux / macOS

```bash
chmod +x development/scripts/setup.sh
./development/scripts/setup.sh
```

The automated script automatically:

1. Verifies that Node.js (`>= 20.0.0`) and pnpm are present.
2. Creates `.env` from `.env.example` with safe development defaults (if not present).
3. Installs all monorepo dependencies deterministically with pnpm.
4. Verifies the native Node.js SQLite engine (`node:sqlite`).
5. Initializes the database and applies schema migrations (`Database/app.db`).
6. Seeds realistic demo accounts and sample equipment fixtures (`backend/db/seed/`).

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

Full credentials, permission details, and sample data relationships are documented in [User_Roles_and_Permissions.md](file:///c:/Web-Application/MCTED/development/Documentation/User_Roles_and_Permissions.md).

---

## 📜 Monorepo Scripts

All development, maintenance, and database tasks are managed via pnpm from the repository root:

| Command                  | Purpose                                                                            |
| ------------------------ | ---------------------------------------------------------------------------------- |
| `pnpm run setup`         | Full bootstrap: dependencies, database init, migrations, demo seeding              |
| `pnpm run dev`           | Starts API backend (port 3000) and frontend SPA (port 5173) in parallel            |
| `pnpm run build`         | Compiles `@mcteb/shared`, builds backend TypeScript, and bundles frontend Vite SPA |
| `pnpm run typecheck`     | Validates static TypeScript typing across all workspaces with zero emission        |
| `pnpm run lint`          | Analyzes code quality using ESLint flat configuration                              |
| `pnpm run lint:fix`      | Automatically fixes autofixable ESLint issues                                      |
| `pnpm run format`        | Formats all files across the repository using Prettier                             |
| `pnpm run format:check`  | Verifies formatting compliance without writing                                     |
| `pnpm run test`          | Executes all Vitest and Node test suites across workspaces                         |
| `pnpm run db:init`       | Safely verifies or initializes the SQLite database file without data loss          |
| `pnpm run db:migrate`    | Applies relational DDL schema and indexes to `Database/app.db`                     |
| `pnpm run db:seed`       | Seeds demo users, equipment catalog, and realistic relational fixtures             |
| `pnpm run db:reset-demo` | Safely resets only designated demo records while preserving user data              |
| `pnpm run db:backup`     | Creates an atomic hot database snapshot in `Database/backups/` using `VACUUM INTO` |
| `pnpm run audit`         | Checks installed production packages for known security vulnerabilities            |

---

## 🏛️ Municipal Policy Alignment

1. **Municipal Jurisdiction**: Borrowers must reside within one of the six barangays of Basco (Chanarian, Ihubok I, Ihubok II, Kayhuvokan, San Antonio, San Joaquin).
2. **Age Eligibility**: Borrowers must be legal adults (>= 18 years) to enter into equipment custody agreements.
3. **Emergency Civic Relief**: Emergency response equipment (e.g., portable storm generators) carries a ₱0.00 rental and deposit fee during typhoon preparation windows.
4. **Official Receipts**: All payments generate traceable municipal reference numbers (e.g., `BASCO-PAY-2026-XXXXXX`).
