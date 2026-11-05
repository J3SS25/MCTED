# API Endpoint Reference

All endpoints are versioned under `/api/v1`.

### Authentication
- `POST /api/v1/auth/register` — Register borrower account (min age 18)
- `POST /api/v1/auth/login` — Sign in and issue session cookie / bearer token
- `POST /api/v1/auth/logout` — Revoke active session
- `GET /api/v1/auth/me` — Retrieve active user session profile

### Equipment Catalog & Inventory
- `GET /api/v1/tools` — Search and filter catalog items
- `GET /api/v1/tools/:id` — Retrieve detailed tool specifications
- `POST /api/v1/tools` — [Staff/Admin] Create catalog equipment entry
- `PATCH /api/v1/tools/:id` — [Staff/Admin] Update tool details or stock
- `POST /api/v1/tools/:id/archive` — [Staff/Admin] Archive equipment from catalog

### Reservations
- `GET /api/v1/reservations` — List user's reservations (borrower) or queue (staff)
- `POST /api/v1/reservations` — Submit advance reservation request
- `GET /api/v1/reservations/:id` — Retrieve reservation details
- `PATCH /api/v1/reservations/:id/review` — [Staff/Admin] Approve or reject booking
- `POST /api/v1/reservations/:id/cancel` — Cancel pending/approved reservation

### Rentals Desk
- `GET /api/v1/rentals` — List loans
- `POST /api/v1/rentals/checkout` — [Staff/Admin] Handover and release equipment
- `POST /api/v1/rentals/:id/return` — [Staff/Admin] Process return inspection and penalties

### Payments
- `GET /api/v1/payments` — List payments (borrower) or verification queue (staff)
- `POST /api/v1/payments` — Submit payment record
- `PATCH /api/v1/payments/:id/verify` — [Staff/Admin] Verify or decline payment

### Maintenance
- `GET /api/v1/maintenance` — List maintenance tickets
- `POST /api/v1/maintenance` — Create equipment defect report
- `PATCH /api/v1/maintenance/:id` — Update repair progress or return to service

### Feedback
- `GET /api/v1/feedback/public` — Public borrower reviews
- `POST /api/v1/feedback` — Submit post-loan review
- `GET /api/v1/feedback/all` — [Staff/Admin] All reviews including hidden
- `PATCH /api/v1/feedback/:id/moderate` — [Staff/Admin] Toggle public visibility

### Users & Audit
- `GET /api/v1/users` — [Admin] List municipal accounts
- `PATCH /api/v1/users/:id/status` — [Admin] Change status (with reason)
- `PATCH /api/v1/users/:id/role` — [Admin] Change role (with reason)
- `GET /api/v1/audit` — [Admin] Query system audit trail

