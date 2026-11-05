# Data Dictionary

## Schema Baseline: db/schema.sql

### `users`
- `id` (UUID): Primary key
- `full_name` (TEXT): Resident or staff name
- `email` (TEXT, UNIQUE): Account login identifier
- `password_hash` (TEXT): Salted scrypt key hash
- `phone` (TEXT): Contact number
- `birth_date` (TEXT, YYYY-MM-DD): Age verification for municipal policy (18+)
- `barangay` (TEXT): Barangay within Basco (Chanarian, Ihubok I, Ihubok II, Kayhuvokan, San Antonio, San Joaquin)
- `address` (TEXT): Detailed street address
- `role` (TEXT): 'Administrator', 'Municipal Staff', 'Borrower'
- `status` (TEXT): 'Active', 'Pending Verification', 'Suspended'
- `failed_login_attempts` (INTEGER): Counter for lockout throttling
- `lockout_until` (TEXT): ISO timestamp until which login is blocked

### `tools`
- `id` (UUID): Primary key
- `name` (TEXT): Tool title
- `category` (TEXT): Agriculture, Fishing, Carpentry, Construction, Electrical, Emergency Response
- `description` (TEXT): Practical purpose & guidance
- `specifications` (TEXT): Power rating, blade size, engine specs
- `availability_status` (TEXT): 'Available', 'Reserved', 'Borrowed', 'Returned', 'Maintenance', 'Damaged', 'Archived'
- `condition_status` (TEXT): 'Excellent', 'Good', 'Fair', 'Needs Repair', 'Under Maintenance'
- `rental_fee_centavos` (INTEGER): Daily rate in centavos
- `deposit_fee_centavos` (INTEGER): Security bond in centavos
- `total_quantity` (INTEGER): Total units acquired by the municipality
- `available_quantity` (INTEGER): Units currently ready on shelf

### `reservations`
- `id` (UUID): Primary key
- `user_id` (UUID): Foreign key to `users(id)`
- `tool_id` (UUID): Foreign key to `tools(id)`
- `quantity` (INTEGER): Units requested
- `pickup_date` (TEXT, YYYY-MM-DD): Intended borrowing date
- `return_date` (TEXT, YYYY-MM-DD): Intended return date
- `status` (TEXT): 'Pending', 'Approved', 'Rejected', 'Cancelled', 'Completed'
- `staff_notes` (TEXT): Comments from reviewing staff

### `rentals`
- `id` (UUID): Primary key
- `reservation_id` (UUID): Optional link to `reservations(id)`
- `user_id` (UUID): Foreign key to `users(id)`
- `tool_id` (UUID): Foreign key to `tools(id)`
- `quantity` (INTEGER): Units loaned out
- `due_date` (TEXT, YYYY-MM-DD): Required handover deadline
- `returned_at` (TEXT): Actual handover timestamp
- `status` (TEXT): 'Pending', 'Reserved', 'Borrowed', 'Returned', 'Completed'
- `initial_condition` (TEXT): Condition recorded during release inspection
- `returned_condition` (TEXT): Condition recorded during return inspection
- `overdue_penalty_centavos` (INTEGER): Late return penalty
- `damage_penalty_centavos` (INTEGER): Assessed damage recovery fee

### `payments`
- `id` (UUID): Primary key
- `receipt_reference` (TEXT, UNIQUE): Official municipal receipt number (e.g. `BASCO-PAY-2026-XXXXXX`)
- `amount_centavos` (INTEGER): Amount in centavos
- `payment_method` (TEXT): 'Cash', 'GCash', 'Bank Transfer', 'Municipal Treasury'
- `status` (TEXT): 'Pending', 'Paid', 'Failed', 'Refunded'

