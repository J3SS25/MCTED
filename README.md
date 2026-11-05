# MCTEB — Municipal Community Tool & Equipment Bank
### Municipality of Basco, Province of Batanes

MCTEB is a full-stack civic platform that enables residents of Basco to discover, reserve, and borrow shared agricultural, carpentry, marine, construction, electrical, and emergency response equipment. Municipal staff oversee inventory, manage reservations, verify payments, and coordinate handovers and return inspections.

---

## 🛠️ Tech Stack

- **Monorepo**: pnpm workspaces
- **Backend**: Node.js, TypeScript, Express, SQLite (`better-sqlite3`), Zod, Pino structured logging
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, React Router, Lucide icons
- **Shared Package**: `@mcteb/shared` (Zod schemas, enums, permissions matrix, money/date utilities)

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js >= 20.0.0
- pnpm >= 9.0.0

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/<org>/MCTED.git
cd MCTED

# Install monorepo dependencies
pnpm install
```

### 3. Environment Configuration
Copy the example environment file:
```bash
cp .env.example .env
```

### 4. Database Setup & Demo Seed
```bash
# Initialize SQLite schema and seed demo records
pnpm db:migrate
pnpm db:seed
```

### 5. Running the Application
```bash
# Start both backend API (port 3000) and frontend Web (port 5173) in parallel
pnpm dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 👤 Demo Persona Accounts

| Persona | Role | Email | Password |
|---|---|---|---|
| **Elena Valiente** | Administrator | `admin@basco.gov.ph` | `Basco@2026!` |
| **Mateo Castillejos** | Municipal Staff | `staff@basco.gov.ph` | `Basco@2026!` |
| **Maria Clara Abad** | Borrower | `maria.c@basco.net` | `Basco@2026!` |
| **Juan Dela Cruz** | Borrower | `juan.d@basco.net` | `Basco@2026!` |

---

## 📁 Repository Organization

```
├── apps/
│   ├── api/            # Express backend (routes, controllers, services, repositories)
│   └── web/            # React + Vite frontend (features, components, layouts)
├── packages/
│   └── shared/         # Zod schemas, enums, role permissions, money/date helpers
├── db/
│   └── schema.sql      # Authoritative 9-entity database schema
├── docs/               # Architecture, database, API, security, and ADR docs
├── data/               # SQLite database directory (gitignored)
└── scripts/            # Database backup scripts
```

---

## 🧪 Testing & Quality

```bash
# Run unit & integration test suites
pnpm test

# Typecheck all packages and applications
pnpm typecheck

# Run linter
pnpm lint
```

---

## 🏛️ Municipal Policy Notes
- **Residency**: Borrowers must reside in one of the 6 barangays of Basco.
- **Age Requirement**: Borrowers must be at least 18 years of age.
- **Currency**: All rental and deposit fees are stored in integer centavos to avoid rounding anomalies.
- **Receipts**: Official municipal receipts are generated with traceable reference numbers (e.g. `BASCO-PAY-2026-XXXXXX`).

