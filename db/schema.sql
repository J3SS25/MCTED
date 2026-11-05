-- Municipal Community Tool and Equipment Bank (MCTEB)
-- Municipality of Basco, Batanes
-- Authoritative Database Schema: 9 Core Entities

PRAGMA foreign_keys = ON;

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    phone TEXT NOT NULL,
    birth_date TEXT NOT NULL,
    barangay TEXT NOT NULL,
    address TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('Administrator', 'Municipal Staff', 'Borrower')),
    status TEXT NOT NULL DEFAULT 'Active' CHECK(status IN ('Active', 'Pending Verification', 'Suspended')),
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    lockout_until TEXT,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

-- 2. Tools table
CREATE TABLE IF NOT EXISTS tools (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    specifications TEXT,
    availability_status TEXT NOT NULL DEFAULT 'Available' CHECK(availability_status IN ('Available', 'Reserved', 'Borrowed', 'Returned', 'Maintenance', 'Damaged', 'Archived')),
    condition_status TEXT NOT NULL DEFAULT 'Good' CHECK(condition_status IN ('Excellent', 'Good', 'Fair', 'Needs Repair', 'Under Maintenance')),
    rental_fee_centavos INTEGER NOT NULL DEFAULT 0,
    deposit_fee_centavos INTEGER NOT NULL DEFAULT 0,
    total_quantity INTEGER NOT NULL DEFAULT 1,
    available_quantity INTEGER NOT NULL DEFAULT 1,
    serial_number TEXT,
    image_url TEXT,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

-- 3. Reservations table
CREATE TABLE IF NOT EXISTS reservations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    tool_id TEXT NOT NULL REFERENCES tools(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 1,
    pickup_date TEXT NOT NULL,
    return_date TEXT NOT NULL,
    purpose TEXT,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending', 'Approved', 'Rejected', 'Cancelled', 'Completed')),
    staff_notes TEXT,
    reviewed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

-- 4. Rentals table
CREATE TABLE IF NOT EXISTS rentals (
    id TEXT PRIMARY KEY,
    reservation_id TEXT REFERENCES reservations(id) ON DELETE SET NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    tool_id TEXT NOT NULL REFERENCES tools(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 1,
    due_date TEXT NOT NULL,
    returned_at TEXT,
    status TEXT NOT NULL DEFAULT 'Borrowed' CHECK(status IN ('Pending', 'Reserved', 'Borrowed', 'Returned', 'Completed')),
    initial_condition TEXT NOT NULL CHECK(initial_condition IN ('Excellent', 'Good', 'Fair', 'Needs Repair', 'Under Maintenance')),
    returned_condition TEXT CHECK(returned_condition IN ('Excellent', 'Good', 'Fair', 'Needs Repair', 'Under Maintenance')),
    inspection_notes TEXT,
    overdue_penalty_centavos INTEGER NOT NULL DEFAULT 0,
    damage_penalty_centavos INTEGER NOT NULL DEFAULT 0,
    released_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    received_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

-- 5. Payments table
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    receipt_reference TEXT NOT NULL UNIQUE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    reservation_id TEXT REFERENCES reservations(id) ON DELETE SET NULL,
    rental_id TEXT REFERENCES rentals(id) ON DELETE SET NULL,
    tool_id TEXT REFERENCES tools(id) ON DELETE SET NULL,
    amount_centavos INTEGER NOT NULL,
    payment_method TEXT NOT NULL CHECK(payment_method IN ('Cash', 'GCash', 'Bank Transfer', 'Municipal Treasury')),
    status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending', 'Paid', 'Failed', 'Refunded')),
    proof_url TEXT,
    verified_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    verified_at TEXT,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

-- 6. Maintenance table
CREATE TABLE IF NOT EXISTS maintenance (
    id TEXT PRIMARY KEY,
    tool_id TEXT NOT NULL REFERENCES tools(id) ON DELETE RESTRICT,
    rental_id TEXT REFERENCES rentals(id) ON DELETE SET NULL,
    reported_by TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    issue_description TEXT NOT NULL,
    severity TEXT NOT NULL CHECK(severity IN ('Minor', 'Moderate', 'Severe', 'Critical')),
    status TEXT NOT NULL DEFAULT 'Reported' CHECK(status IN ('Reported', 'Scheduled', 'In Progress', 'Completed', 'Decommissioned')),
    technician_name TEXT,
    estimated_cost_centavos INTEGER NOT NULL DEFAULT 0,
    actual_cost_centavos INTEGER NOT NULL DEFAULT 0,
    scheduled_date TEXT,
    completed_at TEXT,
    resolution_notes TEXT,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

-- 7. Feedback table
CREATE TABLE IF NOT EXISTS feedback (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    tool_id TEXT NOT NULL REFERENCES tools(id) ON DELETE RESTRICT,
    rental_id TEXT REFERENCES rentals(id) ON DELETE SET NULL,
    overall_rating INTEGER NOT NULL CHECK(overall_rating BETWEEN 1 AND 5),
    tool_condition_rating INTEGER NOT NULL CHECK(tool_condition_rating BETWEEN 1 AND 5),
    service_rating INTEGER NOT NULL CHECK(service_rating BETWEEN 1 AND 5),
    comments TEXT NOT NULL,
    is_public INTEGER NOT NULL DEFAULT 1 CHECK(is_public IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

-- 8. Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('info', 'success', 'warning', 'danger')),
    link_url TEXT,
    is_read INTEGER NOT NULL DEFAULT 0 CHECK(is_read IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

-- 9. Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    actor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    actor_name TEXT NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    details TEXT,
    ip_address TEXT,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_tools_category ON tools(category);
CREATE INDEX IF NOT EXISTS idx_tools_availability ON tools(availability_status);
CREATE INDEX IF NOT EXISTS idx_reservations_user ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_tool ON reservations(tool_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_rentals_user ON rentals(user_id);
CREATE INDEX IF NOT EXISTS idx_rentals_tool ON rentals(tool_id);
CREATE INDEX IF NOT EXISTS idx_rentals_status ON rentals(status);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_tool ON maintenance(tool_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance(status);
CREATE INDEX IF NOT EXISTS idx_feedback_tool ON feedback(tool_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

