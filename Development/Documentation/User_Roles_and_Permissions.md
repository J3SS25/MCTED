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
| **Municipal Staff** | Juan dela Cruz | `staff@basco.gov.ph`    | Barangay II            | Desk operations, advance reservation review, physical loan checkout & return inspections, payment verification, tool repair tickets |
| **Borrower**        | Ana Reyes      | `borrower@basco.gov.ph` | Barangay III           | Resident borrower, advance booking submissions, payment uploads, tool ratings and reviews                                           |
| **Borrower**        | Pedro Batanes  | `farmer@basco.gov.ph`   | Barangay IV            | Resident agricultural borrower, farm equipment bookings, active loan status checks                                                  |

---

## 2. Seeded Equipment Catalog

The seed process populates seven distinct tools across six municipal categories:

| Tool Name                              | Category           |      Rental Fee      | Deposit Bond |       Stock       | Serial Number | Condition |
| -------------------------------------- | ------------------ | :------------------: | :----------: | :---------------: | ------------- | :-------: |
| **Agricultural Hand Tiller**           | Agricultural       |    ₱150.00 / day     |   ₱500.00    | 2 Total / 1 Avail | `AG-HT-001`   |   Good    |
| **Commercial Back-Pack Mist Blower**   | Agricultural       |    ₱100.00 / day     |   ₱300.00    | 3 Total / 3 Avail | `AG-MB-002`   | Excellent |
| **Heavy-Duty Concrete Mixer**          | Construction       |    ₱250.00 / day     |  ₱1,000.00   | 1 Total / 1 Avail | `CN-CM-001`   |   Good    |
| **Heavy-Duty Demolition Breaker**      | Construction       |    ₱200.00 / day     |   ₱800.00    | 2 Total / 2 Avail | `CN-DB-002`   |   Good    |
| **Compound Sliding Miter Saw**         | Carpentry          |    ₱120.00 / day     |   ₱400.00    | 2 Total / 2 Avail | `CR-MS-001`   | Excellent |
| **Deep-Water Marine GPS & Fishfinder** | Fishing            |     ₱80.00 / day     |   ₱500.00    | 4 Total / 3 Avail | `FS-GPS-001`  | Excellent |
| **Portable Storm Generator (3.5 kVA)** | Emergency Response | ₱0.00 (Civic Relief) |    ₱0.00     | 5 Total / 5 Avail | `EM-GEN-001`  | Excellent |

---

## 3. Seeded Relational Records

The seed fixtures create realistic cross-table relationships to simulate genuine application state:

1. **Approved Reservation**: Ana Reyes has an approved advance reservation for the Agricultural Hand Tiller.
2. **Pending Reservation**: Pedro Batanes has a pending advance reservation for the Marine GPS & Fishfinder.
3. **Active Rental Loan**: Ana Reyes currently has an active borrowed loan for the Agricultural Hand Tiller, due on `2026-11-25`.
4. **Verified Payment**: Payment receipt `BASCO-PAY-2026-000001` (₱150.00 via GCash) verified by staff member Juan dela Cruz.
5. **Community Feedback**: 5-star public review from Ana Reyes praising the ease of tillering in Basco's terraced terrain.
6. **System Audit Log**: Initial audit entry recording fixture initialization by `System Initializer`.

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
