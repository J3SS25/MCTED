# Changelog

All notable changes to the Municipal Community Tool & Equipment Bank (MCTEB / MCTED) project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.2.0] - 2026-11-12

### Added
- **Database Architecture Upgrade (Phase 1):**
  - Extended `users` table with `age`, `province`, `profile_picture_url`, `avatar_url`, and `is_age_verified` fields.
  - Extended `tools` table with `user_id` (ownership), `title`, `photo_url`, `daily_rate_centavos`, `condition`, and `discount_percentage`.
  - Added `borrow_requests` table with lifecycle states (`pending`, `approved`, `rejected`, `returned`) and self-borrow constraint.
  - Added `wishlists` table supporting user item saving with unique compound keys (`user_id`, `tool_id`).
  - Extended `payments` table with `gateway_reference`, `paid_at`, and expanded payment methods for the Philippine market (GCash, Maya, BDO, Landbank).
  - Created production-ready PostgreSQL / Supabase schema (`db/supabase_schema.sql`) with Row-Level Security (RLS) policies.
  - Updated SQLite migration script (`apps/api/src/db/migrate.ts`) with idempotent column-check migrations.

- **Backend Modules & API Endpoints (Phase 2):**
  - **Borrow Requests Module (`/api/v1/requests` & `/api/requests`):** Endpoints to submit rental requests, list user/staff requests, and update status.
  - **Wishlist Module (`/api/v1/wishlists` & `/api/wishlist`):** Endpoints to fetch saved items, add items, and remove items.
  - **HR & Staff Management Module (`/api/v1/hr/staff`):** Human Resources controller and service to list, invite, update roles, and decommission staff accounts.
  - **Tool Listing & Self-Removal (`/api/v1/tools` & `/api/items`):** Enabled item creation with base64 image persistence and allowed equipment owners, staff, and admins to delete listings.
  - **Philippine Payment Gateways & Receipts (`/api/v1/payments/mock-checkout`, `/:id/receipt`):** Simulated mock payment checkout for GCash, Maya, BDO, and Landbank with detailed printable receipt data generation.
  - **Local Storage Image Handling:** File storage utility (`apps/api/src/utils/fileStorage.ts`) converting base64 image payloads to static assets served under `/uploads`.
  - **Profile Avatar Uploads (`/api/v1/users/:id/avatar`, `/me/avatar`):** Endpoints allowing all user roles (Borrowers, Lenders, Staff, Admins) to upload custom avatars.
  - **Shared Zod Schemas (`@mcteb/shared`):** Added `WishlistSchema`, `BorrowRequestSchema`, updated `UserSchema`, `ToolSchema` (with `daily_rate_centavos`), `PaymentSchema`, and expanded `UserRole` and `PaymentMethod` enums.

- **Frontend Upgrades (Phase 3):**
  - **Borrow Requests Frontend View & Management Dashboard (`apps/web/src/features/requests/BorrowRequestsPage.tsx`):**
    - Dual-tabbed view separating "My Borrow Requests" from "Incoming Requests" (for item owners and staff review queue).
    - KPI metric summary cards for Total Requests, Pending Review, Approved/Active, and Returned items.
    - Status filtering (`all`, `pending`, `approved`, `rejected`, `returned`, `cancelled`) and search filter by tool or resident name.
    - Interactive action buttons for Approving, Rejecting, Marking Returned (lender/staff), and Cancelling (borrower).
  - **Borrow Request Submission Modal (`apps/web/src/features/requests/BorrowRequestModal.tsx`):**
    - Integrated equipment selector or pre-locked tool preview with category and rental fee details.
    - Start date and end date pickers with automatic duration calculation and live total rental fee estimation.
    - Strict enforcement of self-borrow prevention rule (owners blocked from submitting requests for their own listings).
    - Date validity checks (no past dates, end date must not precede start date).
  - **Catalog Detail Integration (`apps/web/src/features/catalog/ToolDetailPage.tsx`):**
    - Added "Submit Borrow Request" button alongside municipal reservations.
    - Added owner detection banner warning users that self-borrowing is prohibited on their own equipment listings.
  - **App Shell Navigation & Routes (`routes.tsx`, `AppShell.tsx`):**
    - Mounted `/requests` and `/borrow-requests` routes under `ProtectedRoute`.
    - Added "Borrow Requests" navigation links across all roles (`Borrower`, `Lender`, `Municipal Staff`, `Staff`, `Administrator`, `Admin`).
  - **UI Component Upgrades (`Badge.tsx`):**
    - Added case-insensitive status normalization to support lowercase lifecycle statuses (`pending`, `approved`, `rejected`, `returned`, `cancelled`).
  - **Password Visibility Toggle:** Show/hide password eye icon toggle in `Input.tsx`.
  - **18+ Age Validation & Extended Registration:** Enforced client-side 18+ age verification, province selection, and Borrower/Lender account type selection on `RegisterPage.tsx`.
  - **Equipment Upload & Discount Support:** Added discount percentage badge and image file picker with base64 preview in `ToolFormModal.tsx`.

### Changed
- Updated `auth.middleware.ts` to expand role aliases seamlessly between legacy (`Administrator`, `Municipal Staff`) and modern (`Admin`, `Staff`, `Lender`, `Borrower`) definitions.
- Enhanced reservation service with self-borrow prevention rules (users cannot reserve their own listed tools).
- Configured static file serving for local image uploads via Express `/uploads` route.

### Removed
- Removed the "Demo Credentials" section from the sign-in interface (`LoginPage.tsx`).

---

## [0.1.0] - 2026-11-05

### Added
- Initial project structure as a pnpm monorepo containing `apps/web`, `apps/api`, and `packages/shared`.
- Core SQLite database schema (`db/schema.sql`) covering users, tools, reservations, rentals, payments, maintenance, feedback, notifications, and audit logs.
- Shared package (`@mcteb/shared`) with Zod schemas, TypeScript types, permissions matrix, currency formatting (`formatPHP`), and date utilities.
- Modular backend Express API with initial modules: auth, users, tools, reservations, rentals, payments, maintenance, feedback, notifications, and audit logging.
- React 19 single-page application with Tailwind CSS and Lucide icons.
- Role-aware navigation layout (`AppShell.tsx`) with light and dark mode toggles.
- Seed data fixtures and initial development setup.
