# Coding Standards & Engineering Conventions

This document outlines the mandatory programming patterns, error-handling conventions, and architectural rules for all code in MCTEB.

---

## 1. Architectural Boundaries

### Backend Architecture (`backend/src/`)

Code must strictly respect the layered pattern:

1. **Routes (`backend/src/routes/*.routes.ts`, `backend/src/admin/*.routes.ts`)**:

   - Only responsible for registering HTTP method verbs, path strings, and applying middleware (`requireAuth`, `requireRole`, `validate`).
   - Must never execute database queries or construct custom domain responses directly.

2. **Controllers (`backend/src/controllers/*.controller.ts`, `backend/src/admin/*.controller.ts`)**:

   - Parse route parameters (`req.params`), query strings (`req.query`), and validated bodies (`req.body`).
   - Call appropriate service methods.
   - Return appropriate HTTP status codes (`200 OK`, `201 Created`, `204 No Content`).
   - Never write SQL queries or orchestrate multiple database mutations.

3. **Services (`backend/src/services/*.service.ts`, `backend/src/admin/*.service.ts`)**:

   - Encapsulate all domain business rules.
   - Open and manage atomic database operations (`db.atomic()`).
   - Trigger side-effects (e.g., dispatching notifications, recording audit log entries).
   - Never interact with Express `req` or `res` objects.

4. **Repositories (`backend/src/repositories/*.repository.ts`)**:
   - Execute parameterized SQLite queries.
   - Never contain business policy checks (e.g., age checks, permission rules).
   - Return clean typed records.

---

## 2. Error Handling & HTTP Status Codes

Backend error handling is centralized in `backend/src/utils/errors.ts` and `backend/src/middleware/errorHandler.ts`.

### Standard Error Hierarchy (`AppError`)

Always throw typed `AppError` instances from services:

```typescript
import { AppError } from '../../utils/errors.js';

// 400 Bad Request
throw AppError.badRequest('Borrower must be at least 18 years old');

// 401 Unauthorized
throw AppError.unauthorized('Invalid email or password');

// 403 Forbidden
throw AppError.forbidden('Only Municipal Staff can approve reservations');

// 404 Not Found
throw AppError.notFound('Tool not found with ID: ' + id);

// 409 Conflict
throw AppError.conflict('Email address is already registered');

// 423 Locked
throw AppError.locked('Account locked. Please try again in 15 minutes');
```

The centralized error middleware catches all thrown `AppError` instances, logs them via Pino with correlation context, and formats a clean JSON payload:

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Borrower must be at least 18 years old",
    "status": 400
  }
}
```

---

## 3. Logging Standards

- **Never use `console.log`** in backend application code (`backend/src`).
- Use the structured Pino logger from `backend/src/utils/logger.ts`:

  ```typescript
  import { logger } from '../../utils/logger.js';

  // Informational message
  logger.info({ userId, toolId }, 'Tool successfully released');

  // Warning
  logger.warn({ email, attempts }, 'Failed login attempt recorded');

  // Error with stack trace
  logger.error({ error, reservationId }, 'Failed to complete reservation operation');
  ```

---

## 4. Localized Date Conventions

- **Storage**: All timestamps and date strings in SQLite are stored as ISO 8601 strings (`2026-11-20T10:30:00Z`) or standard date strings (`YYYY-MM-DD`).
- **Presentation**: Localized to Philippine Standard Time (`Asia/Manila`) via `formatDate()` and `formatDateTime()` in `@mcteb/shared/src/dates.ts`.
