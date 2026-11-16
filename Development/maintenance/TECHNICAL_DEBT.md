# Technical Debt Log

This document tracks identified technical debt, historical remediation efforts, and pending architectural improvements in MCTEB.

---

## 1. Resolved Technical Debt

| Item                                     | Severity | Resolution Summary                                                                                                                                                                                              |                                                               Status                                                               |
| ---------------------------------------- | :------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------: | ------------ |
| **Emitted JS Artifacts in Source Tree**  |   High   | 156 compiled `.js`, `.d.ts`, `.js.map`, and `.d.ts.map` files were accidentally committed in `frontend/src/`. All duplicate artifacts were purged, and `frontend/tsconfig.json` was locked with `noEmit: true`. |                                                            **Resolved**                                                            |
| **Missing ESLint & TypeScript Tooling**  |   High   | Root `eslint.config.mjs` imported `@eslint/js` and `typescript-eslint`, which were missing from root `devDependencies`. Installed matching versions and calibrated flat config rules.                           |                                                            **Resolved**                                                            |
| **Missing Test Dependencies in Web SPA** |  Medium  | `frontend/vitest.config.ts` specified `environment: 'jsdom'`, but `jsdom` was missing from dependencies, causing Vitest to exit with code 1. Installed `jsdom` and added Button component test suite.           |                                                            **Resolved**                                                            |
| **Redundant Union Type Constituents**    |  Medium  | Several React pages declared `useState<any                                                                                                                                                                      | null>(null)`, triggering ESLint errors (`@typescript-eslint/no-redundant-type-constituents`). Cleaned up and standardized typings. | **Resolved** |
| **Missing Automated Setup Scripts**      |  Medium  | Developers previously had to manually guess initialization and migration sequences. Authored cross-platform `development/scripts/setup.ps1`, `setup.bat`, and `development/scripts/setup.sh`.                   |                                                            **Resolved**                                                            |
| **Missing Dedicated Demo Reset Command** |  Medium  | No command existed to reset test data without manually wiping the database file. Implemented `pnpm run db:reset-demo` with foreign-key safe reverse deletion and environment safeguards.                        |                                                            **Resolved**                                                            |
| **Incomplete Root Package Scripts**      |   Low    | Root `package.json` lacked unified `lint`, `format`, `test`, `db:init`, and `db:reset-demo` scripts. Synchronized all monorepo scripts.                                                                         |                                                            **Resolved**                                                            |

---

## 2. Pending & Tracked Debt

### 1. Code-Splitting for Frontend Routes

- **Description**: All 14 React page components in `frontend/src/app/routes.tsx` are imported statically, causing Vite to build a single 516 kB JavaScript bundle.
- **Remediation Plan**: Refactor `routes.tsx` to use `React.lazy()` and `<Suspense>` to enable route-level chunk splitting.
- **Priority**: Low (application loads in <200ms on municipal LAN).

### 2. Digital Signature / Receipt Export to PDF

- **Description**: The official municipal receipt modal renders a print-friendly HTML view.
- **Remediation Plan**: Introduce a dedicated PDF generation service (e.g. `@react-pdf/renderer` or server-side headless rendering) to export digitally signed municipal clearance certificates.
- **Priority**: Medium.
