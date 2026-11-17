# 20 — System Flowcharts

> **Epistemic Classification Legend**
>
> - `[Verified from source code]` — Directly observed in repository files, schemas, configurations, or tool outputs.
> - `[Inferred from architecture]` — Logically deduced from codebase structure, middleware order, or runtime behavior.
> - `[Assumption requiring validation]` — Organizational, municipal policy, or operational assumption not codified in source code.

---

## Table of Contents

- [1. Executive Summary](#1-executive-summary)
- [2. Purpose](#2-purpose)
- [3. Scope](#3-scope)
- [4. Key Components](#4-key-components)
- [5. Architecture Diagrams](#5-architecture-diagrams)
  - [5.1 Login Flow](#51-login-flow)
  - [5.2 Registration Flow](#52-registration-flow)
  - [5.3 Search & Catalog Filter Flow](#53-search--catalog-filter-flow)
  - [5.4 Recommendation / Equipment Selection & Availability Conflict Flow](#54-recommendation--equipment-selection--availability-conflict-flow)
  - [5.5 Admin Flow (User Governance & Audit Inspection)](#55-admin-flow-user-governance--audit-inspection)
  - [5.6 Notification Flow](#56-notification-flow)
  - [5.7 Reporting & Dashboard Aggregation Flow](#57-reporting--dashboard-aggregation-flow)
- [6. Technical Details & Detailed Analysis](#6-technical-details--detailed-analysis)
- [7. Findings](#7-findings)
- [8. Risks](#8-risks)
- [9. Recommendations](#9-recommendations)
- [10. Future Enhancements](#10-future-enhancements)
- [11. References to Source Files & Cross-References](#11-references-to-source-files--cross-references)

---

## 1. Executive Summary

This document visualizes all seven core operational and technical execution flows of MCTEB using Mermaid flowcharts verified directly against the implemented TypeScript source code (`[Verified from source code]`):

1. **Login Flow** (`AuthController.login` -> `AuthService.login`)
2. **Registration Flow** (`AuthController.register` -> `AuthService.register`)
3. **Search Flow** (`CatalogPage` -> `ToolsController.list` -> `ToolsRepository.findMany`)
4. **Recommendation / Equipment Selection & Conflict Check Flow** (`ToolDetailPage` -> `ReservationsService.createReservation`) — explicitly noting no ML/recommendation engine exists
5. **Admin Flow** (`UsersPage` / `AuditLogPage` -> `UsersService` / `AuditService`)
6. **Notification Flow** (`NotificationsService.create` -> `NotificationsPage`)
7. **Reporting & Dashboard Aggregation Flow** (`DashboardPage` & `OfficialReceiptModal`)

---

## 2. Purpose

Provides unambiguous visual execution traces for onboarding engineers, security reviewers, and QA teams.

---

## 3. Scope

Covers runtime behavior across `apps/web/src/features/` and `apps/api/src/modules/` (`[Verified from source code]`).

---

## 4. Key Components

- **Auth & Lockout Flow**: `authRateLimiter`, `AuthService`, `AuthRepository`, `SessionRepository`, `crypto.ts` (`[Verified from source code]`).
- **Catalog & Booking Conflict Flow**: `ToolsRepository.findMany`, `ReservationsRepository.getActiveReservedQuantityForDates` (`[Verified from source code]`).
- **Admin Governance Flow**: `UsersService.updateUserStatus`, `updateUserRole`, `AuditService.getLogs` (`[Verified from source code]`).
- **Notifications & Reporting Flow**: `NotificationsService`, `DashboardPage`, `OfficialReceiptModal` (`[Verified from source code]`).

---

## 5. Architecture Diagrams

### 5.1 Login Flow

_(Verified against `auth.routes.ts`, `auth.controller.ts`, `auth.service.ts`, `auth.repository.ts`, `session.repository.ts` `[Verified from source code]`)_

```mermaid
flowchart TD
    Start(["User submits LoginPage form"]) --> PostLogin["POST /api/v1/auth/login"]
    PostLogin --> RL{"authRateLimiter\n<= 10 req / 15m?"}
    RL -- No --> Err429["429 AUTH_RATE_LIMIT_EXCEEDED"]
    RL -- Yes --> Zod["LoginSchema.parse(req.body)"]
    Zod -- Invalid --> Err400["400 VALIDATION_ERROR"]
    Zod -- Valid --> FindEmail["AuthRepository.findByEmail(email COLLATE NOCASE)"]
    FindEmail -- Not Found --> Err401A["401 Invalid email or password"]
    FindEmail -- Found --> LockCheck{"lockout_until > now?"}
    LockCheck -- Yes --> Err403Lock["403 Account temporarily locked"]
    LockCheck -- No --> VerifyPwd["verifyPassword(password, password_hash)\n(scrypt + timingSafeEqual)"]
    VerifyPwd -- Mismatch --> IncFail["incrementFailedAttempts()\n(if >= 5 set lockout_until = +15m)"]
    IncFail --> Err401B["401 Invalid email or password"]
    VerifyPwd -- Match --> SuspCheck{"status === 'Suspended'?"}
    SuspCheck -- Yes --> Err403Susp["403 Account suspended"]
    SuspCheck -- No --> ResetFail["resetFailedAttempts(user.id)"]
    ResetFail --> CreateSess["SessionRepository.create(token, user.id, 7d)"]
    CreateSess --> AuditLogin["AuditService.record('USER_LOGIN', ip)"]
    AuditLogin --> SetCookie["Set Cookie 'mcteb_session' (HttpOnly, SameSite=Lax)\n+ Return 200 { user, token }"]
    SetCookie --> SaveLS["Frontend auth-context saves token to localStorage"]
```

### 5.2 Registration Flow

_(Verified against `RegisterPage.tsx`, `auth.controller.ts`, `auth.service.ts`, `auth.repository.ts` `[Verified from source code]`)_

```mermaid
flowchart TD
    Start(["Resident submits RegisterPage"]) --> PostReg["POST /api/v1/auth/register"]
    PostReg --> RL{"authRateLimiter\n<= 10 req / 15m?"}
    RL -- No --> Err429["429 Too Many Requests"]
    RL -- Yes --> Zod["RegisterUserSchema.parse(req.body)\n(Checks email, min 8 pwd, BarangaySchema, YYYY-MM-DD)"]
    Zod -- Invalid --> Err400A["400 VALIDATION_ERROR"]
    Zod -- Valid --> DupCheck{"AuthRepository.findByEmail\nexists?"}
    DupCheck -- Yes --> Err409["409 Email already exists"]
    DupCheck -- No --> AgeCalc["Compute age from birth_date vs today"]
    AgeCalc --> AgeCheck{"age < 18?"}
    AgeCheck -- Yes --> Err400B["400 Must be at least 18 years old"]
    AgeCheck -- No --> HashPwd["hashPassword() (16B salt + scrypt)"]
    HashPwd --> InsertUser["AuthRepository.createBorrower()\n(role='Borrower', status='Active')"]
    InsertUser --> CreateSess["SessionRepository.create(token, user.id, 7d)"]
    CreateSess --> AuditReg["AuditService.record('USER_REGISTERED')"]
    AuditReg --> WelcomeNotif["NotificationsService.create('Welcome to MCTEB', '/catalog')"]
    WelcomeNotif --> Resp201["Set Cookie + 201 { user, token }"]
```

### 5.3 Search & Catalog Filter Flow

_(Verified against `CatalogPage.tsx`, `tools.controller.ts`, `tools.repository.ts` `[Verified from source code]`)_

```mermaid
flowchart TD
    Start(["User opens /catalog or submits search/category"]) --> BuildQS["Build URLSearchParams (search, category)"]
    BuildQS --> GetTools["GET /api/v1/tools?search=...&category=..."]
    GetTools --> ParseQ["ToolFilterSchema.parse(req.query)\n(page=1, limit=12 default)"]
    ParseQ --> BuildSQL["ToolsRepository.findMany():\nBuild WHERE clauses"]
    BuildSQL --> SearchCond{"filters.search?"}
    SearchCond -- Yes --> AddLike["Add (name LIKE %q% OR description LIKE %q% OR category LIKE %q%)"]
    SearchCond -- No --> CatCond
    AddLike --> CatCond{"filters.category / availability / condition?"}
    CatCond -- Yes --> AddEq["Add exact equality conditions"]
    CatCond -- No --> RunCount
    AddEq --> RunCount["Execute SELECT COUNT(*) FROM tools WHERE ..."]
    RunCount --> RunRows["Execute SELECT * FROM tools WHERE ... ORDER BY name ASC LIMIT ? OFFSET ?"]
    RunRows --> ReturnJSON["200 { items, total }"]
    ReturnJSON --> RenderGrid["CatalogPage renders Tool Cards or EmptyState"]
```

### 5.4 Recommendation / Equipment Selection & Availability Conflict Flow

_(Explicit Note: `[Verified from source code]` — No ML/heuristic recommendation engine exists; selection uses deterministic catalog filtering + date-range conflict checking.)_

```mermaid
flowchart TD
    Start(["Borrower selects tool -> ToolDetailPage"]) --> ParallelFetch["Fetch GET /tools/:id & GET /feedback/public?tool_id=:id"]
    ParallelFetch --> AvailUI{"availability_status === 'Available'\nAND available_quantity > 0?"}
    AvailUI -- No --> DisableBtn["Button disabled: 'Currently Unavailable'"]
    AvailUI -- Yes --> OpenModal["Open ReservationFormModal\n(Compute inclusive days & estimated PHP fee)"]
    OpenModal --> SubmitRes["POST /api/v1/reservations"]
    SubmitRes --> ParseRes["CreateReservationSchema.parse()\n(Checks pickup_date <= return_date)"]
    ParseRes --> CheckTool{"Tool exists AND\nnot Archived/Damaged?"}
    CheckTool -- No --> Err400["400 / 404 Tool unavailable"]
    CheckTool -- Yes --> OverlapSQL["getActiveReservedQuantityForDates()\nSUM(qty) WHERE status IN ('Pending','Approved')\nAND NOT (return_date < pickup OR pickup_date > return)"]
    OverlapSQL --> StockOK{"currentlyReserved + qty\n<= tool.total_quantity?"}
    StockOK -- No --> Err409["409 Conflict: Insufficient inventory"]
    StockOK -- Yes --> TxCreate["db.transaction():\nINSERT reservation (Pending)\n+ AuditService + NotificationsService"]
    TxCreate --> Resp201["201 Created -> Navigate to /my-reservations"]
```

### 5.5 Admin Flow (User Governance & Audit Inspection)

_(Verified against `UsersPage.tsx`, `AuditLogPage.tsx`, `users.service.ts`, `audit.service.ts` `[Verified from source code]`)_

```mermaid
flowchart TD
    Admin(["Administrator signed in"]) --> Choice{"Admin Action"}

    Choice -- "User Oversight (/admin/users)" --> GetUsers["GET /api/v1/users\n(requireRole('Administrator'))"]
    GetUsers --> OpenEdit["Open Manage Account Modal\n(role, status, mandatory reason)"]
    OpenEdit --> RoleChanged{"newRole !== target.role?"}
    RoleChanged -- Yes --> PatchRole["PATCH /api/v1/users/:id/role"]
    PatchRole --> GuardLastAdmin1{"target Admin & demoting &\ncountActiveAdmins <= 1?"}
    GuardLastAdmin1 -- Yes --> Err400R["400 Cannot demote sole active Admin"]
    GuardLastAdmin1 -- No --> SaveRole["Update role + Audit + Notify"]
    RoleChanged -- No --> StatusChanged
    SaveRole --> StatusChanged{"newStatus !== target.status?"}
    StatusChanged -- Yes --> PatchStatus["PATCH /api/v1/users/:id/status"]
    PatchStatus --> GuardSelf{"actor.id === id &\nSuspended?"}
    GuardSelf -- Yes --> Err400S1["400 Cannot suspend own account"]
    GuardSelf -- No --> GuardLastAdmin2{"target Admin & Suspended &\ncountActiveAdmins <= 1?"}
    GuardLastAdmin2 -- Yes --> Err400S2["400 Cannot suspend sole active Admin"]
    GuardLastAdmin2 -- No --> SaveStatus["Update status + Audit + Notify"]

    Choice -- "Audit Inspection (/admin/audit)" --> GetAudit["GET /api/v1/audit?action=...&limit=50\n(requireRole('Administrator'))"]
    GetAudit --> AuditSQL["AuditRepository.findMany()\nORDER BY datetime(created_at) DESC"]
    AuditSQL --> RenderAudit["Render table + Audit Log Detail Modal"]
```

### 5.6 Notification Flow

_(Verified against `NotificationsPage.tsx`, `notifications.controller.ts`, `notifications.service.ts` `[Verified from source code]`)_

```mermaid
flowchart TD
    Trigger["Domain Service Transaction\n(Auth / Users / Reservations / Rentals / Payments)"] --> InsertNotif["NotificationsService.create()\nINSERT INTO notifications (is_read = 0)"]
    InsertNotif --> UserNav["User navigates to /notifications"]
    UserNav --> GetNotif["GET /api/v1/notifications\n(WHERE user_id = req.user.id)"]
    GetNotif --> FeedUI["NotificationsPage renders cards with type Badge & unread dot"]
    FeedUI --> MarkOne["Click 'Mark Read' -> PATCH /:id/read\n(UPDATE is_read=1 WHERE id=? AND user_id=?)"]
    FeedUI --> MarkAll["Click 'Mark All as Read' -> POST /mark-all-read"]
    FeedUI --> DeepLink["Click 'View' (<Link to={n.link_url}>)"]
    DeepLink --> RouteCheck{"Route exists in routes.tsx?"}
    RouteCheck -- "/catalog" --> Catalog["Renders CatalogPage"]
    RouteCheck -- "/reservations/:id, /rentals/:id, /payments/:id" --> Fallback["Hits '*' wildcard -> Redirects to /dashboard"]
```

### 5.7 Reporting & Dashboard Aggregation Flow

_(Verified against `DashboardPage.tsx`, `OfficialReceiptModal.tsx` `[Verified from source code]`)_

```mermaid
flowchart TD
    DashStart(["User loads /dashboard"]) --> RoleBranch{"user.role === 'Borrower'?"}
    RoleBranch -- Yes --> FetchB["Promise.all:\n/reservations, /rentals, /payments"]
    FetchB --> ReduceB["Client counts total reservations,\nBorrowed rentals, total payments,\n+ user.status"]
    RoleBranch -- No (Staff/Admin) --> FetchS["Promise.all:\n/reservations, /rentals, /payments, /maintenance"]
    FetchS --> ReduceS["Client counts Pending reservations,\nBorrowed rentals, Pending payments,\n!Completed maintenance"]
    ReduceB & ReduceS --> RenderKPI["Render 4 KPI Summary Cards + Recent Queue"]

    ReceiptStart(["User clicks 'View Receipt' on Payment"]) --> OpenOR["OfficialReceiptModal opens\n(formatPHP, formatDate, receipt_reference)"]
    OpenOR --> PrintBtn["Click 'Print Receipt' -> window.print()"]
```

---

## 6. Technical Details & Detailed Analysis

All flowcharts above mirror actual execution paths verified line-by-line in source files (`[Verified from source code]`):

- Every backend flow uses synchronous SQLite operations (`node:sqlite`), meaning only `scrypt` password hashing/verification in Flows 5.1 and 5.2 is asynchronous (`await`) (`[Verified from source code]`).
- Flow 5.4 confirms the absence of any recommendation scoring pipeline (`[Verified from source code]`).
- Flow 5.6 documents the broken `link_url` redirect behavior verified by comparing service `link_url` strings with `apps/web/src/app/routes.tsx` (`[Verified from source code]`).

---

## 7. Findings

_(See detailed findings in [08-Business-Workflows.md](./08-Business-Workflows.md), [09-Recommendation-Engine.md](./09-Recommendation-Engine.md), [12-Notifications-and-Applications.md](./12-Notifications-and-Applications.md), and [16-Data-Analysis-Reference.md](./16-Data-Analysis-Reference.md).)_

---

## 8. Risks

1. **Broken Deep Links in Flow 5.6**: Notification `View` links for reservations, rentals, and payments redirect to `/dashboard` (`[Verified from source code]`).
2. **Client-Side Dashboard Aggregation in Flow 5.7**: Downloads entire entity lists on every `/dashboard` visit (`[Verified from source code]`).
3. **Unchecked Concurrent Approval in Flow 5.4**: `reviewReservation` does not re-check stock before marking `Approved` (`[Verified from source code]`).

---

## 9. Recommendations

1. Repair notification `link_url` destinations (`/my-reservations`, `/my-rentals`, `/my-payments`) (`[Verified from source code]`).
2. Move dashboard KPI counts into a dedicated `GET /api/v1/dashboard/stats` endpoint (`[Inferred from architecture]`).
3. Re-validate date/stock availability inside `ReservationsService.reviewReservation` (`[Verified from source code]`).

---

## 10. Future Enhancements

1. Add real-time SSE/WebSocket updates for Flow 5.6 (Notification delivery without page reload).
2. Add an actual Recommendation Flow branch into Flow 5.4 when catalog expands.

---

## 11. References to Source Files & Cross-References

| Flow                       | Source Files                                                                                                      |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 5.1 & 5.2 (Auth)           | `apps/api/src/modules/auth/*`, `apps/web/src/features/auth/*`, `apps/web/src/lib/auth-context.tsx`                |
| 5.3 & 5.4 (Search/Booking) | `apps/api/src/modules/{tools,reservations}/*`, `apps/web/src/features/{catalog,reservations}/*`                   |
| 5.5 (Admin)                | `apps/api/src/modules/{users,audit}/*`, `apps/web/src/features/admin/*`                                           |
| 5.6 (Notifications)        | `apps/api/src/modules/notifications/*`, `apps/web/src/features/notifications/NotificationsPage.tsx`, `routes.tsx` |
| 5.7 (Reporting)            | `apps/web/src/features/dashboard/DashboardPage.tsx`, `payments/OfficialReceiptModal.tsx`                          |

**Cross-References**: See [08-Business-Workflows.md](./08-Business-Workflows.md), [21-Developer-Architecture-Guide.md](./21-Developer-Architecture-Guide.md), and [22-Backend-Architecture.md](./22-Backend-Architecture.md).
