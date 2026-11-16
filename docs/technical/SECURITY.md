# Security Architecture & Protocols

This document specifies the defensive protocols, access control mechanisms, and hardening standards implemented across MCTEB.

---

## 1. Role-Based Access Control (RBAC)

The system supports three distinct authenticated user roles alongside unauthenticated guest access. Permissions are server-enforced at the route middleware level.

### Permission Capability Matrix

| System Capability                             | Guest |   Borrower   | Municipal Staff | Administrator |
| --------------------------------------------- | :---: | :----------: | :-------------: | :-----------: |
| Browse Equipment Catalog                      |  Yes  |     Yes      |       Yes       |      Yes      |
| View Public Community Reviews                 |  Yes  | Yes (Masked) |   Yes (Full)    |  Yes (Full)   |
| Submit Tool Reservation                       |  No   |     Yes      |       No        |      No       |
| View Own Bookings & Loan History              |  No   |  Yes (Self)  |   Yes (Self)    |  Yes (Self)   |
| Submit Rental Payments & Receipts             |  No   |     Yes      |       No        |      No       |
| Post Tool Experience Feedback                 |  No   |     Yes      |       No        |      No       |
| Review Advance Booking Queue                  |  No   |      No      |       Yes       |      Yes      |
| Execute Handover Checkout & Return Inspection |  No   |      No      |       Yes       |      Yes      |
| Manage Equipment Catalog CRUD                 |  No   |      No      |       Yes       |      Yes      |
| Verify Municipal Payments & Issue Receipts    |  No   |      No      |       Yes       |      Yes      |
| Manage Maintenance & Repair Tickets           |  No   |      No      |       Yes       |      Yes      |
| Moderate Resident Feedback                    |  No   |      No      |       Yes       |      Yes      |
| Modify User Roles & Account Status            |  No   |      No      |       No        |      Yes      |
| Review System Audit Trail                     |  No   |      No      |       No        |      Yes      |
| Perform Database Backup                       |  No   |      No      |       No        |   Yes (CLI)   |

---

## 2. Insecure Direct Object Reference (IDOR) Prevention

Client-provided identifiers are never trusted blindly for ownership verification.

### Defense Rules

1. **Borrower Resource Scoping**: In user-scoped routes (reservations, rentals, payments, notifications), queries enforce:
   ```typescript
   // In service layer:
   if (currentUser.role === 'Borrower' && record.user_id !== currentUser.id) {
     throw AppError.forbidden('You are not authorized to access this record');
   }
   ```
2. **Session ID Binding**: When a borrower creates a reservation or payment, the `user_id` is automatically populated from `req.user.id` (extracted from the cryptographically verified session token), preventing borrowers from forging bookings under other residents' names.

---

## 3. Rate Limiting Policy

Network requests are throttled using `express-rate-limit` to protect against DoS attacks, automated credential stuffing, and brute force:

| Scope              | Limit        | Window     | Applies To                                    |
| ------------------ | ------------ | ---------- | --------------------------------------------- |
| **Global API**     | 300 requests | 15 minutes | All `/api/v1/*` routes                        |
| **Authentication** | 10 requests  | 15 minutes | `/api/v1/auth/login`, `/api/v1/auth/register` |

Exceeding the rate limit returns an HTTP 429 status with a `Retry-After` header.

---

## 4. HTTP Security Headers (Helmet)

Helmet is configured at the Express application root (`apps/api/src/app.ts`), setting defensive HTTP response headers:

- `Content-Security-Policy`: Restricts script and asset origins.
- `X-Frame-Options`: `SAMEORIGIN` (mitigates clickjacking).
- `X-Content-Type-Options`: `nosniff` (prevents MIME sniffing).
- `Strict-Transport-Security`: Enforces HTTPS in production (`max-age=31536000; includeSubDomains`).
- `Referrer-Policy`: `no-referrer`.

---

## 5. Input Validation & Parameterized Queries

- **Zod Schema Validation**: Every request body is validated against a strict Zod schema via `validate()` middleware before reaching controller logic. Extra unvalidated properties are rejected.
- **SQL Injection Prevention**: All queries execute through parameterized SQLite statements (`rawDb.prepare('... WHERE email = ?').get(email)`). Direct string concatenation into SQL statements is prohibited.

---

## 6. Community Feedback Privacy Masking

To protect resident privacy under Philippine data privacy standards:

- Public feedback endpoints (`GET /api/v1/feedback/public`) automatically mask resident surnames (e.g. `Maria Santos` becomes `Maria S.`, `Juan dela Cruz` becomes `Juan d.`).
- Resident contact numbers and physical street addresses are stripped from public responses.

---

## 7. Immutable Security Audit Logging

All mutating administrative, financial, and inventory actions generate an immutable record in `audit_logs`:

- Records captured: Actor name, Actor ID, Event code (e.g., `CHECKOUT_COMPLETED`, `ROLE_UPDATED`), Target entity, Target ID, Timestamp, and IP address.
- Audit records can only be queried by Administrators and cannot be updated or deleted through the API.
