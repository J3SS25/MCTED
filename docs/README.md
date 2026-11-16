# Documentation Index & Architecture Notice

> [!NOTE]
> As part of the Batanes Niche-inspired architectural restructuring, the comprehensive project documentation and technical references have been organized into the [`Development/`](file:///c:/Web-Application/MCTED/Development/) directory.

---

## Documentation Navigation Guide

### 1. System Architecture & Repository Layout

- **[System Overview](file:///c:/Web-Application/MCTED/Development/Documentation/System_Overview.md)**: Executive summary, civic domain models, and high-level architecture.
- **[Repository Structure](file:///c:/Web-Application/MCTED/Development/Documentation/Repository_Structure.md)**: Monorepo layout, workspace packages (`backend/`, `frontend/`, `packages/shared/`, `Database/`, `Development/`).
- **[System Architecture](file:///c:/Web-Application/MCTED/Development/Documentation/Architecture.md)**: Layered architecture, separation of concerns, and data integrity guarantees.
- **[Backend Architecture](file:///c:/Web-Application/MCTED/Development/Documentation/Backend_Architecture.md)**: Detailed breakdown of Express layers, models, repositories, and services.
- **[Frontend Architecture](file:///c:/Web-Application/MCTED/Development/Documentation/Frontend_Architecture.md)**: React 19 SPA structure, TanStack Query, AppShell, and routing.
- **[Architecture Decisions (ADRs)](file:///c:/Web-Application/MCTED/Development/Documentation/Architecture_Decisions.md)**: Record of architectural design decisions.

### 2. Technical & Data References

- **[Database & ERD](file:///c:/Web-Application/MCTED/Development/Documentation/Database_and_ERD.md)**: SQLite engine, WAL mode, foreign keys, 10 relational entities, and backup procedures.
- **[REST API Architecture](file:///c:/Web-Application/MCTED/Development/Documentation/API_Architecture.md)**: Complete endpoint documentation including `/api/v1/admin`.
- **[Authentication & Security](file:///c:/Web-Application/MCTED/Development/Documentation/Authentication_and_Security.md)**: Scrypt hashing, timing-safe verification, brute force lockout, and RBAC.
- **[User Roles & Permissions](file:///c:/Web-Application/MCTED/Development/Documentation/User_Roles_and_Permissions.md)**: Role capability matrix, barangays of Basco, and demo account credentials.
- **[Business Workflows](file:///c:/Web-Application/MCTED/Development/Documentation/Business_Workflows.md)**: Sequence diagrams for reservations, handovers, returns, and payments.

### 3. Engineering, Setup & Testing

- **[Local Setup Guide](file:///c:/Web-Application/MCTED/Development/setup/LOCAL_SETUP.md)**: Installation, prerequisites, automated setup, and environment configuration.
- **[Developer Guide](file:///c:/Web-Application/MCTED/Development/Documentation/Developer_Guide.md)**: Daily developer workflows, conventional commits, and PR checklist.
- **[Testing Guidelines](file:///c:/Web-Application/MCTED/Development/testing/TESTING.md)**: Multi-tier testing strategy, Vitest commands, and unit/integration suites.
- **[Coding Standards](file:///c:/Web-Application/MCTED/Development/reference/CODING_STANDARDS.md)**: Layering conventions, Pino logging, integer centavos, and date formatting.
- **[TypeScript Standards](file:///c:/Web-Application/MCTED/Development/reference/TYPESCRIPT_STANDARDS.md)**: 100% TypeScript requirement, compiler strictness, and zero emitted artifacts.

### 4. Audits & Maintenance

- **[Development Audit](file:///c:/Web-Application/MCTED/Development/Audit/Report.md)**: Code quality review, dependency audit, and remediation report.
- **[Security Audit](file:///c:/Web-Application/MCTED/Development/Audit/Security_Audit.md)**: Defensive security evaluations and threat mitigations.
- **[UI/UX Audit](file:///c:/Web-Application/MCTED/Development/Audit/UI_UX_Audit.md)**: Accessibility (WCAG 2.1 AA) and visual design system review.
- **[Development Status](file:///c:/Web-Application/MCTED/Development/maintenance/DEVELOPMENT_STATUS.md)**: Live status matrix and quality gate pass verification.
- **[Technical Debt](file:///c:/Web-Application/MCTED/Development/maintenance/TECHNICAL_DEBT.md)**: Resolved and tracked technical debt items.
- **[Roadmap](file:///c:/Web-Application/MCTED/Development/maintenance/ROADMAP.md)**: Future phases (PWA offline sync, automated webhooks, SMS alerts).
