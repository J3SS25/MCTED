# Technical Architecture

## Municipal Community Tool and Equipment Bank (MCTEB)
**Municipality of Basco, Batanes**

### 1. Monorepo Structure

MCTEB is implemented as a pnpm workspace monorepo consisting of:
- `apps/api`: Express.js backend with SQLite, organized in domain feature modules (`auth`, `users`, `tools`, `reservations`, `rentals`, `payments`, `maintenance`, `feedback`, `notifications`, `audit`).
- `apps/web`: React 19 + Vite frontend styled with Tailwind CSS, utilizing React Router and TanStack Query.
- `packages/shared`: Shared Zod validation schemas, domain enums, permissions matrices, and money/date utilities.

### 2. Layered Backend Design

Each domain module in `apps/api/src/modules/` adheres strictly to:
`routes` → `controller` → `service` → `repository` → `db`

- **Controllers** handle HTTP requests, parse inputs via Zod, and return JSON responses.
- **Services** orchestrate business logic, execute database transactions, trigger audit log rows, and dispatch user notifications.
- **Repositories** execute parameterized SQL queries against SQLite without mixing business logic.

### 3. Data Storage

SQLite operates with the following pragmas:
- `journal_mode = WAL`
- `foreign_keys = ON`
- `busy_timeout = 5000`
- `synchronous = NORMAL`

Multi-row mutations (reservation review, equipment checkout, return inspection with stock return, payment verification) run inside atomic transactions.

