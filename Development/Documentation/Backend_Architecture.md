# Backend Architecture

## Overview

The MCTEB backend is an Express 4 REST API built with TypeScript and Node.js built-in SQLite (`node:sqlite`). It lives in the `backend/` workspace package (`@mcteb/backend`) and exposes a versioned API under `/api/v1`.

The architecture follows a strict layered approach:

```
HTTP Request → Routes → Controllers → Services → Repositories → Database
```

Each layer has one responsibility. No layer skips another.

## Directory Structure

```
backend/
├── db/                          # Database layer (outside src/ — not part of the HTTP app)
│   ├── client.ts                # DatabaseSync singleton (WAL mode, pragmas, error handling)
│   ├── init.ts                  # Creates Database/ directory and initial SQLite file
│   ├── migrate.ts               # Schema migration runner (idempotent, safe re-run)
│   ├── schema.sql               # Canonical schema definition for all 10 tables
│   └── seed/
│       ├── seed.ts              # Idempotent fixture seeder (demo accounts + catalog tools)
│       ├── reset-demo.ts        # Wipes and re-seeds demo data (development only)
│       ├── validate-fixtures.ts # Schema contract validation for seed data
│       └── fixtures/
│           └── index.ts         # Static fixture data (users, tools, etc.)
└── src/
    ├── app.ts                   # Express app factory: middleware stack, router mounting
    ├── server.ts                # HTTP server entry point: listen, graceful shutdown
    ├── config/
    │   ├── env.ts               # Zod-validated environment configuration
    │   └── constants.ts         # Application-wide constants (pagination, timeouts)
    ├── middleware/
    │   ├── auth.ts              # requireAuth, requireRole RBAC middleware
    │   ├── errorHandler.ts      # Centralized Express error handler
    │   ├── rateLimit.ts         # express-rate-limit configurations
    │   ├── validate.ts          # Zod request validation middleware factory
    │   └── index.ts             # Barrel re-export
    ├── models/
    │   └── index.ts             # TypeScript type aliases for all domain entities
    ├── repositories/            # Data access layer — raw SQLite queries only
    │   ├── audit.repository.ts
    │   ├── auth.repository.ts
    │   ├── session.repository.ts
    │   ├── feedback.repository.ts
    │   ├── maintenance.repository.ts
    │   ├── notifications.repository.ts
    │   ├── payments.repository.ts
    │   ├── rentals.repository.ts
    │   ├── reservations.repository.ts
    │   ├── tools.repository.ts
    │   ├── users.repository.ts
    │   └── index.ts
    ├── services/                # Business logic layer — domain workflows
    │   ├── audit.service.ts
    │   ├── auth.service.ts
    │   ├── users.service.ts
    │   ├── tools.service.ts
    │   ├── reservations.service.ts
    │   ├── rentals.service.ts
    │   ├── payments.service.ts
    │   ├── maintenance.service.ts
    │   ├── feedback.service.ts
    │   ├── notifications.service.ts
    │   └── index.ts
    ├── controllers/             # HTTP layer — parse request, call service, send response
    │   ├── audit.controller.ts
    │   ├── auth.controller.ts
    │   ├── users.controller.ts
    │   ├── tools.controller.ts
    │   ├── reservations.controller.ts
    │   ├── rentals.controller.ts
    │   ├── payments.controller.ts
    │   ├── maintenance.controller.ts
    │   ├── feedback.controller.ts
    │   ├── notifications.controller.ts
    │   └── index.ts
    ├── routes/                  # Route registration — maps HTTP methods to controllers
    │   ├── auth.routes.ts
    │   ├── users.routes.ts
    │   ├── tools.routes.ts
    │   ├── reservations.routes.ts
    │   ├── rentals.routes.ts
    │   ├── payments.routes.ts
    │   ├── maintenance.routes.ts
    │   ├── feedback.routes.ts
    │   ├── notifications.routes.ts
    │   ├── audit.routes.ts
    │   └── index.ts             # Assembles v1Router + mounts admin sub-router
    ├── validators/
    │   └── index.ts             # Zod schema validators for request bodies
    ├── utils/
    │   ├── crypto.ts            # Password hashing (scrypt) and token generation
    │   ├── errors.ts            # AppError, NotFoundError, UnauthorizedError classes
    │   ├── logger.ts            # Pino logger singleton
    │   └── index.ts
    └── admin/                   # Isolated administrative route perimeter
        ├── admin.service.ts     # Admin dashboard stats and system health queries
        ├── admin.controller.ts  # Admin HTTP handlers
        ├── admin.routes.ts      # /api/v1/admin — requires Administrator role
        └── index.ts
```

## Domain Modules

| Domain            | Repository    | Service       | Controller    | Routes                                                   |
| ----------------- | ------------- | ------------- | ------------- | -------------------------------------------------------- |
| Authentication    | auth, session | auth          | auth          | POST /auth/register, /auth/login, /auth/logout, /auth/me |
| Users             | users         | users         | users         | GET/PATCH/DELETE /users                                  |
| Tools & Equipment | tools         | tools         | tools         | GET/POST/PATCH/DELETE /tools                             |
| Reservations      | reservations  | reservations  | reservations  | Full CRUD + status transitions                           |
| Rentals           | rentals       | rentals       | rentals       | Checkout, return, inspection                             |
| Payments          | payments      | payments      | payments      | Payment records + verification                           |
| Maintenance       | maintenance   | maintenance   | maintenance   | Maintenance reports                                      |
| Feedback          | feedback      | feedback      | feedback      | Ratings and reviews                                      |
| Notifications     | notifications | notifications | notifications | In-app notifications                                     |
| Audit Logs        | audit         | audit         | audit         | Read-only admin audit trail                              |
| Admin Dashboard   | —             | admin         | admin         | /api/v1/admin/\* (Administrator only)                    |

## Layer Responsibilities

### Repositories (`src/repositories/`)

- Execute raw SQL against the `node:sqlite` DatabaseSync instance
- Accept typed parameters, return typed rows
- **No business logic.** No HTTP concepts.
- Handle transactions internally for multi-statement operations

### Services (`src/services/`)

- Implement MCTEB business rules and domain workflows
- Call one or more repositories to fulfill a request
- Throw typed `AppError` instances for domain violations
- **No HTTP concepts.** No `req`/`res`.

### Controllers (`src/controllers/`)

- Parse and validate `req.body`, `req.params`, `req.query`
- Call the appropriate service method
- Send the HTTP response with correct status codes
- Delegate error handling to `errorHandler` middleware via `next(err)`

### Routes (`src/routes/`)

- Declare the HTTP method + path for each endpoint
- Apply middleware (auth, rate limiting, validation) in the correct order
- Mount to the v1Router assembled in `src/routes/index.ts`

## Authentication & Authorization

- JWT Bearer tokens in the `Authorization` header
- Sessions tracked in the `sessions` table (token rotation on login)
- `requireAuth` middleware validates the token and attaches `req.user`
- `requireRole(...roles)` middleware enforces RBAC per route
- Admin routes in `src/admin/admin.routes.ts` always require `Administrator` role

## Database

- Driver: `node:sqlite` (Node.js 22.5+ built-in experimental API)
- Schema: `backend/db/schema.sql` — 10 tables
- Migrations: `backend/db/migrate.ts` — idempotent, safe to re-run
- Database file: `Database/app.db` at the monorepo root
- WAL mode and foreign key enforcement enabled on every connection

## Configuration

All configuration is loaded at startup by `src/config/env.ts` using Zod validation. The server refuses to start if required variables are missing or malformed.

Required environment variables:

```
NODE_ENV        development | production | test
PORT            HTTP listen port (default: 3000)
DATABASE_PATH   Path to SQLite database file (default: ./Database/app.db)
CORS_ORIGINS    Comma-separated allowed CORS origins
SESSION_SECRET  Minimum 32-character secret for token signing
LOG_LEVEL       pino log level (debug | info | warn | error)
```

See `.env.example` at the repository root.
