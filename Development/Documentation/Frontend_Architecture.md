# Frontend Architecture

## Overview

The MCTEB frontend is a React 19 single-page application (SPA) built with Vite and TypeScript. It lives in the `frontend/` workspace package (`@mcteb/frontend`) and communicates exclusively with the backend API over HTTP.

## Directory Structure

```
frontend/
├── public/                   # Static assets served as-is
├── src/
│   ├── app/                  # Application initialization and routing
│   │   ├── App.tsx           # Root component with QueryClient and AuthProvider
│   │   └── routes.tsx        # react-router-dom v7 route definitions
│   ├── components/
│   │   ├── layout/           # Structural layout components
│   │   │   ├── AppShell.tsx  # Navigation sidebar and page layout wrapper
│   │   │   └── ProtectedRoute.tsx # Auth-guarded route wrapper
│   │   └── ui/               # Reusable primitive UI components
│   │       ├── Alert.tsx
│   │       ├── Badge.tsx
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── EmptyState.tsx
│   │       ├── Input.tsx
│   │       ├── Modal.tsx
│   │       └── Skeleton.tsx
│   ├── features/             # Domain-scoped screens and feature modules
│   │   ├── admin/            # Administrator-only screens
│   │   │   ├── AuditLogPage.tsx
│   │   │   └── UsersPage.tsx
│   │   ├── auth/             # Authentication screens
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   ├── catalog/          # Public equipment catalog
│   │   │   ├── CatalogPage.tsx
│   │   │   └── ToolDetailPage.tsx
│   │   ├── dashboard/        # Role-aware landing dashboard
│   │   │   └── DashboardPage.tsx
│   │   ├── feedback/         # Borrower feedback and ratings
│   │   │   ├── FeedbackPage.tsx
│   │   │   └── SubmitFeedbackModal.tsx
│   │   ├── inventory/        # Staff tool catalog management
│   │   │   ├── InventoryPage.tsx
│   │   │   └── ToolFormModal.tsx
│   │   ├── maintenance/      # Maintenance and repair records
│   │   │   ├── MaintenancePage.tsx
│   │   │   └── MaintenanceReportModal.tsx
│   │   ├── notifications/    # In-app notification center
│   │   │   └── NotificationsPage.tsx
│   │   ├── profile/          # User account profile management
│   │   │   └── ProfilePage.tsx
│   │   ├── rentals/          # Active rental desk operations
│   │   │   ├── MyRentalsPage.tsx
│   │   │   ├── RentalDeskPage.tsx
│   │   │   └── ReturnInspectionModal.tsx
│   │   └── reservations/     # Reservation workflow
│   │       ├── MyReservationsPage.tsx
│   │       ├── ReservationFormModal.tsx
│   │       └── ReservationQueuePage.tsx
│   ├── lib/                  # Shared frontend libraries and singletons
│   │   ├── api.ts            # Axios-based API client with auth interceptor
│   │   ├── auth-context.tsx  # AuthContext — user state, login/logout
│   │   └── theme-context.tsx # ThemeContext — light/dark mode preference
│   ├── main.tsx              # Vite entry point — mounts React app to #root
│   └── styles/
│       └── index.css         # Tailwind base, components, utilities imports
├── index.html                # Vite HTML entry template
├── vite.config.ts            # Vite configuration with `/api` proxy to :3000
├── tailwind.config.ts        # Tailwind CSS configuration
├── postcss.config.js         # PostCSS configuration
├── tsconfig.json             # Extends ../tsconfig.base.json
├── vitest.config.ts          # Vitest test runner configuration
└── package.json              # @mcteb/frontend workspace package
```

## Technology Stack

| Concern         | Library                         |
| --------------- | ------------------------------- |
| Framework       | React 19                        |
| Bundler         | Vite 6                          |
| Routing         | react-router-dom v7             |
| Server state    | @tanstack/react-query v5        |
| Form management | react-hook-form v7              |
| Validation      | Zod (from @mcteb/shared)        |
| Styling         | Tailwind CSS v3                 |
| Icons           | lucide-react                    |
| Testing         | Vitest + @testing-library/react |

## State Management

MCTEB uses a layered approach:

1. **Server state** — React Query (`@tanstack/react-query`) handles all API data: fetching, caching, refetching, and mutations.
2. **Auth state** — `AuthContext` (`src/lib/auth-context.tsx`) persists the current user and JWT token in memory and localStorage.
3. **UI state** — Local `useState` within each component; lifted only when necessary.
4. **Theme state** — `ThemeContext` manages the dark/light mode preference in localStorage.

No global state library (Redux, Zustand, etc.) is used. React Query is sufficient for all server-driven state.

## API Communication

All HTTP calls go through `src/lib/api.ts`, which:

- Configures Axios with the base URL `/api/v1`
- Attaches `Authorization: Bearer <token>` from localStorage on every request
- Handles 401 responses by clearing auth state and redirecting to `/login`

The Vite dev server proxies `/api` requests to `http://localhost:3000`, avoiding CORS issues in development.

## Route Authorization

Routes are protected using `ProtectedRoute` (`src/components/layout/ProtectedRoute.tsx`), which:

- Redirects unauthenticated users to `/login`
- Checks the user's `role` against the route's `allowedRoles` prop
- Returns a `403 Forbidden` message for insufficient permissions

This is a **UX safeguard only**. All authorization is enforced server-side.

## Shared Types

Types shared between frontend and backend (DTOs, enums, Zod schemas) live in `packages/shared` (`@mcteb/shared`). The frontend imports these directly:

```typescript
import { UserRole, ReservationStatus } from '@mcteb/shared';
```
