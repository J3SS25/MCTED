# Data Flow Documentation

This document diagrams the primary operational workflows and data transitions in the Municipal Community Tool and Equipment Bank (MCTEB).

---

## 1. Authentication & Session Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Resident / Staff
    participant Web as frontend (React SPA)
    participant Rate as rateLimit Middleware
    participant AuthCtrl as auth.controller
    participant AuthSvc as auth.service
    participant Crypto as utils/crypto (scrypt)
    participant UserRepo as users.repository
    participant SessRepo as session.repository
    participant DB as SQLite (app.db)

    User->>Web: Enter email & password
    Web->>Rate: POST /api/v1/auth/login
    Rate->>AuthCtrl: Allow (within 10 req / 15 min)
    AuthCtrl->>AuthSvc: login(email, password)
    AuthSvc->>UserRepo: findByEmail(email)
    UserRepo->>DB: SELECT * FROM users WHERE email = ?
    DB-->>UserRepo: user record

    alt User locked out
        AuthSvc-->>AuthCtrl: Throw 423 Account Locked
        AuthCtrl-->>Web: Error response with remaining minutes
    else Verify Password
        AuthSvc->>Crypto: verifyPassword(password, hash)
        Crypto-->>AuthSvc: isValid (timingSafeEqual)
        alt Invalid Password
            AuthSvc->>UserRepo: incrementFailedAttempts(id)
            AuthSvc-->>AuthCtrl: Throw 401 Invalid Credentials
        else Valid Password
            AuthSvc->>UserRepo: resetFailedAttempts(id)
            AuthSvc->>SessRepo: create(token, userId, 7 days)
            SessRepo->>DB: INSERT INTO sessions ...
            AuthSvc-->>AuthCtrl: { user, token }
            AuthCtrl-->>Web: Set httpOnly cookie + JSON token
            Web-->>User: Navigate to Dashboard
        end
    end
```

---

## 2. Reservation Lifecycle Flow

```mermaid
sequenceDiagram
    autonumber
    actor Borrower as Resident Borrower
    actor Staff as Municipal Staff
    participant Web as frontend (React SPA)
    participant ResSvc as reservations.service
    participant ToolRepo as tools.repository
    participant ResRepo as reservations.repository
    participant NotifSvc as notifications.service
    participant AuditSvc as audit.service
    participant DB as SQLite (app.db)

    Borrower->>Web: Submit booking (tool, dates, purpose)
    Web->>ResSvc: POST /api/v1/reservations
    ResSvc->>ToolRepo: findById(toolId)
    ToolRepo->>DB: Check stock & availability
    ResSvc->>ResRepo: create(status: 'Pending')
    ResRepo->>DB: INSERT INTO reservations ...
    ResSvc->>AuditSvc: log('RESERVATION_CREATED')
    ResSvc-->>Web: 201 Created (Pending)

    Note over Staff, Web: Municipal Staff Review Queue
    Staff->>Web: Review Pending Queue
    Staff->>ResSvc: PATCH /api/v1/reservations/:id/review (Approved)

    rect rgb(240, 248, 255)
        Note over ResSvc, DB: Atomic Transaction (BEGIN IMMEDIATE)
        ResSvc->>ResRepo: updateStatus(id, 'Approved', notes, staffId)
        ResSvc->>NotifSvc: dispatch(userId, 'Reservation Approved', link)
        ResSvc->>AuditSvc: log('RESERVATION_APPROVED')
    end
    ResSvc-->>Web: 200 OK
```

---

## 3. Physical Handover Checkout & Return Inspection Flow

```mermaid
sequenceDiagram
    autonumber
    actor Staff as Desk Staff
    actor Borrower as Resident Borrower
    participant Web as frontend (React SPA)
    participant RentalSvc as rentals.service
    participant ToolRepo as tools.repository
    participant RentalRepo as rentals.repository
    participant DB as SQLite (app.db)

    Note over Borrower, Staff: Handover Checkout
    Borrower->>Staff: Arrives at Municipal Tool Bank Desk
    Staff->>Web: Checkout tool (record condition, serial number)
    Web->>RentalSvc: POST /api/v1/rentals/checkout

    rect rgb(240, 255, 240)
        Note over RentalSvc, DB: Atomic Checkout Transaction
        RentalSvc->>ToolRepo: decrementAvailableQuantity(toolId, qty)
        RentalSvc->>RentalRepo: create(status: 'Borrowed', dueDate, condition)
        RentalSvc->>DB: UPDATE reservations SET status = 'Completed'
    end
    RentalSvc-->>Web: 201 Created (Handover receipt generated)

    Note over Borrower, Staff: Return Inspection
    Borrower->>Staff: Returns equipment to desk
    Staff->>Web: Inspect tool condition & check overdue days
    Web->>RentalSvc: POST /api/v1/rentals/:id/return

    rect rgb(255, 245, 240)
        Note over RentalSvc, DB: Atomic Return Transaction
        RentalSvc->>RentalRepo: recordReturn(returnedCondition, notes, penalties)
        RentalSvc->>ToolRepo: incrementAvailableQuantity(toolId, qty)
        alt Tool Damaged
            RentalSvc->>ToolRepo: updateConditionStatus(toolId, 'Needs Repair')
            RentalSvc->>DB: INSERT INTO maintenance (auto defect ticket)
        end
    end
    RentalSvc-->>Web: 200 OK (Inspection summary with penalty assessment)
```

---

## 4. Payment Submission & Treasury Verification Flow

```mermaid
sequenceDiagram
    autonumber
    actor Borrower as Resident Borrower
    actor Staff as Treasury / Staff
    participant Web as frontend (React SPA)
    participant PaySvc as payments.service
    participant PayRepo as payments.repository
    participant NotifSvc as notifications.service
    participant DB as SQLite (app.db)

    Borrower->>Web: Submit payment (method: Cash/GCash, amount, proof URL)
    Web->>PaySvc: POST /api/v1/payments
    PaySvc->>PayRepo: create(receipt_reference: BASCO-PAY-2026-XXXXXX, status: 'Pending')
    PayRepo->>DB: INSERT INTO payments ...
    PaySvc-->>Web: 201 Created (Reference provided)

    Staff->>Web: View Payment Verification Queue
    Staff->>PaySvc: PATCH /api/v1/payments/:id/verify (status: 'Paid')
    PaySvc->>PayRepo: updateStatus(id, 'Paid', staffId, verifiedAt)
    PaySvc->>NotifSvc: dispatch(userId, 'Payment Verified', receiptRef)
    PaySvc-->>Web: 200 OK (Official Municipal Receipt printable)
```
