# Changelog

All notable changes to this project are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.4.0] - 2026-11-17

### Added

- **Repository Reconciliation & Feature Integration**:
  - Integrated Wishlist & Borrowing Cart system (`WishlistPage`, `CartPage`, `WishlistCartContext`, `local-storage.ts`).
  - Added Borrower community tool sharing (borrowers can contribute, update, and manage their own tools without staff bottleneck).
  - Implemented dynamic SQLite schema upgrade pipeline in `backend/db/migrate.ts` (`upgradeExistingSchema()`) with automatic column backfilling and table migration.
  - Added municipal 18+ age verification with automatic calculation from birth date in `@mcteb/shared`.
  - Added Staff activity log preview directly on the main Dashboard.
  - Added Category Navigation component (`CategoryNav.tsx`) and modular `ToolCard.tsx` in frontend catalog.

### Changed

- Preserved the Batanes Niche target architecture (`backend/`, `frontend/`, `Database/`, `Development/`, `packages/shared/`) while integrating all updates from `master`.
- Normalized equipment categories to canonical values (`Agriculture`, `Fishing`) across fixtures, database, and shared enums.
- Removed deprecated legacy `apps/api` and `apps/web` files and unified all routes and services under the new layered architecture.

---

## [0.3.0] - 2026-11-17

### Added

- **Batanes Niche-Inspired Architectural Restructuring**:
  - Restructured backend into top-level `backend/` (`@mcteb/backend`) with layered architecture (`controllers`, `services`, `repositories`, `routes`, `middleware`, `models`).
  - Restructured frontend into top-level `frontend/` (`@mcteb/frontend`) with React 19, Vite, and Tailwind CSS.
  - Established dedicated `Database/` directory for SQLite live database (`Database/app.db`) and hot backups (`Database/backups/`).
  - Established centralized `development/` directory consolidating `Documentation/`, `Audit/`, `scripts/`, `setup/`, `testing/`, `maintenance/`, and `reference/`.
- **Administrative Security Perimeter**:
  - Introduced isolated `/api/v1/admin` subrouter (`backend/src/admin/`) gated strictly to the `Administrator` role.
  - Added dashboard overview, system health diagnostics, user management, and audit log inspection.
- **Cross-Platform Script Suite**:
  - Centralized operational scripts in `development/scripts/` (`setup.bat`, `setup.ps1`, `setup.sh`, `start.bat`, `stop.bat`, `test.bat`, `database/backup.ts`).
  - Preserved root-level `setup.bat` convenience launcher.

### Changed

- Updated `pnpm-workspace.yaml` and workspace package references for `@mcteb/backend` and `@mcteb/frontend`.
- Updated all technical, architectural, setup, and audit documentation to reflect the new directory structure and database paths.
- Configured ESLint, Prettier, and TypeScript project references to target the new workspace paths.

---

## [0.2.0] - 2026-11-16

### Added

- **Automated Development Setup Scripts**:
  - `scripts/setup.ps1`: Automated PowerShell development bootstrapper for Windows.
  - `setup.bat`: One-click Windows batch wrapper.
  - `scripts/setup.sh`: POSIX-compliant automated shell bootstrapper for Linux and macOS.
- **Dedicated Database Lifecycle Commands**:
  - `pnpm run db:init`: Non-destructive SQLite database initialization and connectivity verification.
  - `pnpm run db:reset-demo`: Foreign-key safe demo record reset command with environment safeguards against production execution.
  - `pnpm run db:backup`: Atomic hot database snapshot backup via SQLite `VACUUM INTO`.
- **Automated Test Suites**:
  - Vitest component testing in `apps/web/src/components/ui/Button.test.tsx` using `@testing-library/react` and `jsdom`.
- **Centralized Documentation System (21 Comprehensive Documents)**:
  - `docs/architecture/`: `SYSTEM_ARCHITECTURE.md`, `PROJECT_STRUCTURE.md`, `ARCHITECTURE_DECISIONS.md`, `DATA_FLOW.md`.
  - `docs/technical/`: `DATABASE.md`, `API_DOCUMENTATION.md`, `AUTHENTICATION.md`, `SECURITY.md`, `CONFIGURATION.md`.
  - `docs/development/`: `INSTALLATION.md`, `DEVELOPMENT_GUIDELINES.md`, `CODING_STANDARDS.md`, `TYPESCRIPT_STANDARDS.md`, `TESTING_GUIDELINES.md`, `DEMO_ACCOUNTS.md`.
  - `docs/maintenance/`: `DEVELOPMENT_STATUS.md`, `KNOWN_ISSUES.md`, `TECHNICAL_DEBT.md`, `FUTURE_IMPROVEMENTS.md`.
  - `docs/audits/`: `DEVELOPMENT_AUDIT.md`, `SECURITY_AUDIT.md`, `UI_UX_AUDIT.md`.

### Changed

- **TypeScript Standardization**:
  - Eliminated 156 emitted `.d.ts`, `.js`, `.js.map`, and `.d.ts.map` compiler artifacts accidentally committed in `apps/web/src/`.
  - Standardized application source code to 100% TypeScript (`.ts` and `.tsx`).
  - Restated compiler strictness across all workspaces (`strict: true`, `noImplicitAny: true`, `strictNullChecks: true`, `noUncheckedIndexedAccess: true`).
- **ESLint & Prettier Modernization**:
  - Installed missing `@eslint/js` and `typescript-eslint` packages.
  - Updated ESLint Flat Config (`eslint.config.mjs`) with global ignores, type-checked TypeScript parser options, Express declaration augmentations, and React event handler rules.
  - Added `.prettierignore` and formatted all 230+ repository files with Prettier.
- **Root Monorepo Scripts (`package.json`)**:
  - Added unified `dev`, `build`, `typecheck`, `lint`, `lint:fix`, `format`, `format:check`, `test`, `setup`, `db:init`, `db:reset-demo`, and `db:backup`.

### Fixed

- Fixed ESLint error caused by redundant union type constituents (`useState<any | null>(null)`) in React screens.
- Fixed Vitest exit error in `apps/web` by installing `jsdom` and adding a component test suite.
- Fixed reverse foreign-key dependency ordering in demo reset script to eliminate SQLite constraint failures.

---

## [0.1.0] - 2026-11-05

### Added

- Initial project structure (pnpm monorepo with `apps/web`, `apps/api`, `packages/shared`).
- SQLite database schema (`db/schema.sql`) with core entities: `users`, `tools`, `reservations`, `rentals`, `maintenance`, `feedback`, `notifications`, `audit_logs`.
- Shared package with Zod enums, schemas, permissions matrix, and date helpers.
- Backend API with domain modules: auth, users, tools, reservations, rentals, maintenance, feedback, notifications, audit.
- Frontend React application with all eleven feature modules.
- Role-aware navigation shell with light/dark theme support.
- Demo seed data with safeguards against production exposure.
