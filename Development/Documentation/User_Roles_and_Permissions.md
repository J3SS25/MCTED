# Development Demo Accounts & Sample Fixtures

This document details the development-only demo user accounts, equipment catalog items, and sample records populated by `pnpm run db:seed`.

> [!WARNING]
> These credentials and accounts are intended exclusively for local development, automated testing, and demonstration purposes. Never use these passwords or demo accounts in production environments.

---

## 1. Demo User Accounts

All development demo accounts share the standard password:
**`Basco@2026!`**

| Role                | Full Name      | Email                   | Barangay               | Primary Purpose / Permissions                                                                                                       |
| ------------------- | -------------- | ----------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Administrator**   | Maria Santos   | `admin@basco.gov.ph`    | Barangay I (Poblacion) | Full municipal administration, user role/status modification, audit log inspection, catalog CRUD                                    |
| **Municipal Staff** | Juan dela Cruz | `staff@basco.gov.ph`    | Barangay II            | Desk operations, advance reservation review, physical loan handover & return inspections, tool repair tickets |
| **Borrower**        | Ana Reyes      | `borrower@basco.gov.ph` | Barangay III           | Resident borrower, advance booking submissions, community tool uploads, tool ratings and reviews              |
| **Borrower**        | Pedro Batanes  | `farmer@basco.gov.ph`   | Barangay IV            | Resident agricultural borrower, farm equipment bookings, active loan status checks                            |

---

## 2. Seeded Equipment Catalog

The seed process populates seven distinct tools across municipal categories:

| Tool Name                    | Category        |       Stock       | Serial Number | Condition |
| ---------------------------- | --------------- | :---------------: | ------------- | :-------: |
| **Agricultural Hand Tiller** | Agriculture     | 2 Total / 2 Avail | `TLR-2024-001`|   Good    |
| **Honda Generator 3.5kVA**   | Power Equipment | 3 Total / 2 Avail | `GEN-2024-001`| Excellent |
| **Concrete Mixer (1-Bag)**   | Construction    | 2 Total / 2 Avail | `CMX-2024-001`|   Good    |
| **Water Pump 2-inch**        | Agriculture     | 4 Total / 4 Avail | `WPM-2024-001`|   Good    |
| **Circular Saw 7-1/4"**      | Construction    | 3 Total / 3 Avail | `SAW-2024-001`|   Good    |
| **Backpack Sprayer 20L**     | Agriculture     | 10 Total / 9 Avail| `SPR-2024-001`|   Good    |
| **Marine GPS Handheld**      | Fishing         | 5 Total / 5 Avail | `GPS-2024-001`| Excellent |

---

## 3. Seeded Relational Records

The seed fixtures create realistic cross-table relationships to simulate genuine application state:

1. **Approved Reservation**: Ana Reyes has an approved advance reservation for the Agricultural Hand Tiller.
2. **Pending Reservation**: Pedro Batanes has a pending advance reservation for the Backpack Sprayer 20L.
3. **Active Rental Loan**: Ana Reyes currently has an active borrowed loan for the Agricultural Hand Tiller, due on `2026-11-14`.
4. **Community Feedback**: 5-star public review from Ana Reyes praising the tiller condition and staff support.
5. **System Audit Log**: Initial audit entry recording fixture initialization by `System Initializer`.

---

## 4. Seeding & Reset Commands

### Seed Demo Fixtures

Populate or refresh demo data without wiping existing tables:

```bash
pnpm run db:seed
```

_Note: Seeding is idempotent and uses `INSERT OR IGNORE`. It preserves existing non-demo records._

### Reset Demo Records

Safely remove only designated demo records while preserving user-created development data:

```bash
pnpm run db:reset-demo -- --force
```

### Environmental Safeguard

Both `db:seed` and `db:reset-demo` check `NODE_ENV`. If executed in an environment where `NODE_ENV=production`, the scripts refuse to execute unless `ALLOW_DEMO_SEED=true` is explicitly configured.
