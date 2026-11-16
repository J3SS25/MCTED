# Architectural Decision Records (ADRs)

This document aggregates key architectural decisions made for the Municipal Community Tool and Equipment Bank (MCTEB), detailing the context, decisions, consequences, and alternatives considered.

---

## ADR-0001: Native `node:sqlite` Embedded Storage Engine

### Status: Accepted

### Context

The MCTEB system runs on municipal infrastructure in Basco, Batanes. It requires zero-configuration deployment, fast startup, crash safety, and local autonomy during connectivity outages. Traditional external database engines (PostgreSQL, MySQL) add installation friction, background daemon management, and network port vulnerabilities on local client machines.

### Decision

Adopt SQLite using Node.js's built-in `node:sqlite` (`DatabaseSync`) module, running with:

- `PRAGMA journal_mode = WAL;` (Concurrent readers while writing)
- `PRAGMA foreign_keys = ON;` (Strict referential integrity)
- `PRAGMA busy_timeout = 5000;` (Automatic retry on concurrent operations)
- `PRAGMA synchronous = NORMAL;` (Optimal durability balance)

### Consequences

- **Positive**: Zero external binaries, zero C++ compilation during `pnpm install`, 100% portable across Windows, macOS, and Linux.
- **Positive**: Atomic multi-row mutations via `BEGIN IMMEDIATE` / `COMMIT`.
- **Positive**: Online hot backups supported via SQLite's `VACUUM INTO`.
- **Negative**: Single-writer constraint requires short-lived write transactions (fully mitigated by WAL mode and in-process execution).

---

## ADR-0002: Integer Centavos Currency Representation

### Status: Accepted

### Context

Financial assessments in municipal operations include rental rates, deposit guarantees, overdue penalties, and assessed damage fees. Standard JavaScript floating-point arithmetic (`0.1 + 0.2 !== 0.3`) causes precision errors that lead to audit discrepancies.

### Decision

Store all financial values in the database, API contracts, and domain business calculations as **integers representing centavos** (1 PHP = 100 centavos). Conversion to pesos (`centavos / 100`) and localized currency formatting (`formatPHP`) occurs exclusively at the presentation layer.

### Consequences

- **Positive**: Complete avoidance of rounding errors in penalties, fee totals, and treasury receipts.
- **Positive**: Clean integer arithmetic without external BigNumber dependencies.
- **Negative**: Developers must remember not to divide or multiply by 100 prematurely in backend logic.

---

## ADR-0003: pnpm Workspace Monorepo Architecture

### Status: Accepted

### Context

The application consists of a backend API, a frontend web application, and shared domain validation schemas. Maintaining separate repositories leads to synchronization delays, mismatched data contracts, and duplicate TypeScript interfaces.

### Decision

Standardize on a **pnpm workspace monorepo** with three packages:

- `packages/shared`: Zero-dependency validation schemas, domain types, and utilities.
- `apps/api`: Express.js backend.
- `apps/web`: React 19 single-page application.

### Consequences

- **Positive**: Single source of truth for Zod validation schemas and TypeScript types.
- **Positive**: Deterministic, deduplicated dependency installation with hard symlinks.
- **Positive**: Coordinated typecheck, lint, build, and test commands from the root workspace.
- **Negative**: Requires pnpm package manager (strictly enforced via `packageManager` field in `package.json`).

---

## ADR-0004: Strict Layered Backend Architecture

### Status: Accepted

### Context

Mixing HTTP handling, business validation, transaction boundaries, and raw SQL queries inside route handlers makes applications unmaintainable, untestable, and prone to security vulnerabilities.

### Decision

Enforce a four-tier architecture across all backend domain modules:
`routes` → `controller` → `service` → `repository` → `db`

- **Routes**: URL endpoint definitions and validation middleware.
- **Controllers**: HTTP parameter parsing and response code translation.
- **Services**: Business rules, atomic transactions, notifications, and audit logging.
- **Repositories**: Parameterized SQL queries and database interaction.

### Consequences

- **Positive**: High testability — services can be tested with in-memory fixtures; repositories can be tested independently.
- **Positive**: Clear boundary for database transactions (handled exclusively in services).
- **Positive**: Prevents SQL injection by restricting all queries to parameterized statements.

---

## ADR-0005: Dual-Level Validation (Zod + Database CHECK Constraints)

### Status: Accepted

### Context

Validation must occur early to provide meaningful feedback to users, but the underlying database must remain structurally protected against corrupted state even if application code bypasses validation.

### Decision

Implement dual-level validation:

1. **Application Level**: Incoming requests are validated against shared Zod schemas (`packages/shared/src/schemas/`) via `validate()` middleware before reaching controllers.
2. **Database Level**: `db/schema.sql` enforces strict `CHECK` constraints on status enums, foreign keys with `ON DELETE RESTRICT`, and non-negative integer limits.

### Consequences

- **Positive**: Immediate, localized client error messages with field-level error details.
- **Positive**: Zero chance of illegal states entering SQLite tables.

---

## ADR-0006: Server-Enforced RBAC & Timing-Safe Hashing

### Status: Accepted

### Context

Civic applications require strict access control between resident borrowers, municipal equipment desk staff, and system administrators. Client-side role claims cannot be trusted.

### Decision

- Passwords are encrypted using **scrypt** with cryptographically secure random salts and verified via `crypto.timingSafeEqual`.
- Sessions are stored in a dedicated SQLite table and validated on each request.
- Every borrower query is server-scoped using `req.user.id` from the verified session (IDOR mitigation).
- Administrative safeguards prevent administrators from demoting the sole remaining administrator or suspending their own active account.

### Consequences

- **Positive**: Immune to timing attack enumeration and privilege escalation.
- **Positive**: Automatic 15-minute account lockout after 5 consecutive failed attempts.

---

## ADR-0007: Comprehensive TypeScript Standardization

### Status: Accepted

### Context

Mixing JavaScript and TypeScript creates runtime ambiguity, prevents reliable static analysis, and leads to accidental build artifact check-ins.

### Decision

Standardize all application source code on TypeScript (`.ts` and `.tsx`). Enable strict compiler options (`strict: true`, `noImplicitAny: true`, `strictNullChecks: true`, `forceConsistentCasingInFileNames: true`). Eliminate duplicate emitted JavaScript artifacts from source folders. JavaScript is retained only for select configuration files where required (`commitlint.config.cjs`, `eslint.config.mjs`, `postcss.config.js`).

### Consequences

- **Positive**: End-to-end type safety from database query results to React UI components.
- **Positive**: Zero ambiguity about whether a file is source code or generated output.
