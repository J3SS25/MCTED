# REST API Documentation

## Base URL

All API endpoints are mounted under:
`http://localhost:3000/api/v1`

## Authentication Header

Protected endpoints require either an HTTP-Only session cookie (`session_token`) or a standard Bearer Authorization header:

```http
Authorization: Bearer <session_token>
```

---

## 1. Authentication (`/api/v1/auth`)

### `POST /auth/register`

Registers a new resident borrower account. Enforces minimum 18-year-old municipal eligibility requirement.

- **Request Body**:
  ```json
  {
    "full_name": "Pedro Batanes",
    "email": "pedro@example.com",
    "password": "Password123!",
    "phone": "+639191234567",
    "birth_date": "1990-05-15",
    "barangay": "Chanarian",
    "address": "Sitio Disong, Basco, Batanes"
  }
  ```
- **Responses**:
  - `201 Created`: Returns created user profile and sets session cookie.
  - `400 Bad Request`: Validation failure (underage, invalid email, weak password).
  - `409 Conflict`: Email already registered.

### `POST /auth/login`

Authenticates a user against scrypt password hash. Enforces 15-minute lockout on 5 consecutive failures.

- **Request Body**:
  ```json
  {
    "email": "borrower@basco.gov.ph",
    "password": "Basco@2026!"
  }
  ```
- **Responses**:
  - `200 OK`: `{ "user": { ... }, "token": "..." }`
  - `401 Unauthorized`: Invalid credentials.
  - `423 Locked`: Account locked out due to excessive failed attempts.

### `POST /auth/logout`

Terminates the active session and clears the session cookie.

- **Responses**:
  - `200 OK`: `{ "message": "Logged out successfully" }`

### `GET /auth/me`

Retrieves the currently authenticated user profile.

- **Responses**:
  - `200 OK`: User record.
  - `401 Unauthorized`: No active session.

---

## 2. Equipment Catalog (`/api/v1/tools`)

### `GET /tools`

Retrieves equipment catalog items. Supports search, category filters, and availability filtering.

- **Query Parameters**:
  - `search` (string, optional): Search keyword against name or description.
  - `category` (string, optional): Filter by category (`Agricultural`, `Carpentry`, etc.).
  - `availability` (string, optional): Filter by availability status.
- **Responses**:
  - `200 OK`: `{ "items": [ ... ], "total": 7 }`

### `GET /tools/:id`

Retrieves detailed information and specifications for a single tool.

- **Responses**:
  - `200 OK`: Single tool record.
  - `404 Not Found`: Tool not found.

### `POST /tools` _(Staff & Admin Only)_

Adds a new equipment item to the municipal tool bank.

- **Request Body**:
  ```json
  {
    "name": "Heavy Duty Concrete Mixer",
    "category": "Construction",
    "description": "Electric 1-bag concrete mixer.",
    "rental_fee_centavos": 25000,
    "deposit_fee_centavos": 100000,
    "total_quantity": 2,
    "available_quantity": 2,
    "serial_number": "CM-2026-001"
  }
  ```
- **Responses**:
  - `201 Created`: Created tool record.
  - `403 Forbidden`: Unauthorized role.

### `PATCH /tools/:id` _(Staff & Admin Only)_

Updates tool specifications, condition status, or inventory counts.

### `POST /tools/:id/archive` _(Admin Only)_

Safely archives a tool when all borrowed units have been returned.

---

## 3. Reservations (`/api/v1/reservations`)

### `GET /reservations`

Lists reservations. Borrowers see only their own bookings; Staff and Admins view all.

- **Query Parameters**:
  - `status` (string, optional): Filter by status (`Pending`, `Approved`, `Rejected`, `Cancelled`, `Completed`).
- **Responses**:
  - `200 OK`: Array of reservations with tool details.

### `POST /reservations`

Submits an advance equipment booking request.

- **Request Body**:
  ```json
  {
    "tool_id": "b0000000-0000-4000-8000-000000000001",
    "quantity": 1,
    "pickup_date": "2026-11-20",
    "return_date": "2026-11-23",
    "purpose": "Land preparation for typhoon season"
  }
  ```
- **Responses**:
  - `201 Created`: Created reservation record.
  - `400 Bad Request`: Invalid date range or requested quantity exceeds available stock.

### `PATCH /reservations/:id/review` _(Staff & Admin Only)_

Approves or rejects a reservation request with staff notes.

- **Request Body**:
  ```json
  {
    "status": "Approved",
    "staff_notes": "Equipment ready for pickup at Municipal Hall."
  }
  ```

### `POST /reservations/:id/cancel`

Cancels an advance reservation. Borrowers may cancel their own pending/approved bookings.

---

## 4. Physical Rentals (`/api/v1/rentals`)

### `GET /rentals`

Lists physical loans. Scoped to the current borrower or visible to all staff.

### `POST /rentals/checkout` _(Staff & Admin Only)_

Executes physical equipment handover. Decrements available tool quantity and completes originating reservation inside an atomic transaction.

- **Request Body**:
  ```json
  {
    "reservation_id": "c0000000-0000-4000-8000-000000000001",
    "user_id": "a0000000-0000-4000-8000-000000000003",
    "tool_id": "b0000000-0000-4000-8000-000000000001",
    "quantity": 1,
    "due_date": "2026-11-25",
    "initial_condition": "Good"
  }
  ```

### `POST /rentals/:id/return` _(Staff & Admin Only)_

Records return inspection. Evaluates condition, increments available stock, and assesses damage or overdue penalties inside an atomic transaction.

- **Request Body**:
  ```json
  {
    "returned_condition": "Fair",
    "inspection_notes": "Normal wear, cleaned.",
    "overdue_penalty_centavos": 0,
    "damage_penalty_centavos": 0
  }
  ```

---

## 5. Payments & Receipts (`/api/v1/payments`)

### `GET /payments`

Lists payments.

### `POST /payments`

Submits a payment record with proof URL or reference.

- **Request Body**:
  ```json
  {
    "user_id": "a0000000-0000-4000-8000-000000000003",
    "amount_centavos": 15000,
    "payment_method": "GCash",
    "proof_url": "https://example.com/proof.jpg"
  }
  ```

### `PATCH /payments/:id/verify` _(Staff & Admin Only)_

Verifies payment and updates status to `Paid` or `Failed`. Generates official receipt reference.

---

## 6. Maintenance & Defects (`/api/v1/maintenance`)

### `GET /maintenance`

Lists maintenance tickets.

### `POST /maintenance`

Creates a defect report. Automatically sets associated tool condition to `'Under Maintenance'` and hides it from catalog.

### `PATCH /maintenance/:id` _(Staff & Admin Only)_

Updates ticket progress. When marked `'Completed'` with `return_to_service: true`, restores tool availability to `'Available'`.

---

## 7. Feedback & Reviews (`/api/v1/feedback`)

### `GET /feedback/public`

Public endpoint returning community reviews with resident surnames privacy-masked (e.g. `Maria S.`).

### `POST /feedback`

Submits a 3-axis review (overall, tool condition, staff service) on completed rentals.

### `PATCH /feedback/:id/moderate` _(Staff & Admin Only)_

Toggles public visibility of feedback.

---

## 8. Notifications (`/api/v1/notifications`)

- `GET /notifications`: User notification alert feed.
- `PATCH /notifications/:id/read`: Marks a single notification as read.
- `POST /notifications/mark-all-read`: Marks all unread alerts for the current user as read.

---

## 9. Security Audit (`/api/v1/audit`) _(Admin Only)_

- `GET /audit`: Immutable security audit log feed with actor, action code, timestamp, and IP address.
