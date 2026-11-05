# Database Architecture & Entity-Relationship Model

## Core Entities (db/schema.sql)

The schema defines nine core entities:

1. **`users`**: Resident borrowers, municipal staff, and administrators. Stores bcrypt/scrypt password hashes, failed login counters, lockout timestamps, and municipal barangay.
2. **`tools`**: Equipment catalog items with category, condition, total and available stock quantities, daily rental fees and deposits in centavos.
3. **`reservations`**: Advance booking requests with requested pickup/return dates, purpose, review decisions, and staff notes.
4. **`rentals`**: Physical loan handovers with due dates, initial condition inspection, return condition, inspection notes, and overdue/damage penalties.
5. **`payments`**: Payment records with official receipt reference numbers, amounts in centavos, payment method, proof URL, and staff verifications.
6. **`maintenance`**: Tool defect tickets with severity levels, technician assignment, estimated and actual costs, and return-to-service flags.
7. **`feedback`**: Post-loan ratings (1-5 stars) and comments on overall experience, tool condition, and service quality.
8. **`notifications`**: User alerts linking to reservation decisions, due dates, payment verifications, and status changes.
9. **`audit_logs`**: Immutable security audit trail recording actor, action code, target entity, IP address, and details.

