-- Municipal Community Tool and Equipment Bank (MCTEB)
-- Municipality of Basco, Batanes
-- Authoritative Database Schema: Core Entities & Modern Upgrades

PRAGMA foreign_keys = ON;

-- 1. Users table
-- Supports: Admin, Staff, Borrower, Lender, 18+ verification, province, age, profile pictures
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    phone TEXT NOT NULL,
    birth_date TEXT NOT NULL,
    age INTEGER CHECK(age IS NULL OR age >= 18),
    province TEXT NOT NULL DEFAULT 'Batanes',
    profile_picture_url TEXT,
    avatar_url TEXT,
    is_age_verified INTEGER NOT NULL DEFAULT 1 CHECK(is_age_verified IN (0, 1)),
    barangay TEXT NOT NULL,
    address TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('Administrator', 'Municipal Staff', 'Admin', 'Staff', 'Borrower', 'Lender')),
    status TEXT NOT NULL DEFAULT 'Active' CHECK(status IN ('Active', 'Pending Verification', 'Suspended')),
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    lockout_until TEXT,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

-- 2. Tools / Items table
-- Supports tool uploads by lenders/users, user ownership, discount badges, and self-removal
CREATE TABLE IF NOT EXISTS tools (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    title TEXT,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    specifications TEXT,
    availability_status TEXT NOT NULL DEFAULT 'Available' CHECK(availability_status IN ('Available', 'Reserved', 'Borrowed', 'Returned', 'Maintenance', 'Damaged', 'Archived')),
    condition_status TEXT NOT NULL DEFAULT 'Good' CHECK(condition_status IN ('Excellent', 'Good', 'Fair', 'Needs Repair', 'Under Maintenance', 'New', 'Like New', 'Poor')),
    condition TEXT DEFAULT 'Good',
    rental_fee_centavos INTEGER NOT NULL DEFAULT 0,
    daily_rate_centavos INTEGER NOT NULL DEFAULT 0,
    deposit_fee_centavos INTEGER NOT NULL DEFAULT 0,
    discount_percentage INTEGER NOT NULL DEFAULT 0 CHECK(discount_percentage BETWEEN 0 AND 100),
    total_quantity INTEGER NOT NULL DEFAULT 1,
    available_quantity INTEGER NOT NULL DEFAULT 1,
    serial_number TEXT,
    image_url TEXT,
    photo_url TEXT,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

-- 3. Reservations table (Advance Booking Workflow)
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

-- 4. Borrow Requests table (P2P & Self-Borrow Prevention Workflow)
CREATE TABLE IF NOT EXISTS borrow_requests (
    id TEXT PRIMARY KEY,
    item_id TEXT NOT NULL REFERENCES tools(id) ON DELETE RESTRICT,
    borrower_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lender_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'returned', 'cancelled')),
    request_message TEXT,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    CHECK (end_date >= start_date),
    CHECK (borrower_id <> lender_id)
);

-- 5. Rentals table (Active physical handovers)
CREATE TABLE IF NOT EXISTS rentals (
    id TEXT PRIMARY KEY,
    reservation_id TEXT REFERENCES reservations(id) ON DELETE SET NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    tool_id TEXT NOT NULL REFERENCES tools(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 1,
    due_date TEXT NOT NULL,
    returned_at TEXT,
    status TEXT NOT NULL DEFAULT 'Borrowed' CHECK(status IN ('Pending', 'Reserved', 'Borrowed', 'Returned', 'Completed')),
    initial_condition TEXT NOT NULL CHECK(initial_condition IN ('Excellent', 'Good', 'Fair', 'Needs Repair', 'Under Maintenance', 'New', 'Like New', 'Poor')),
    returned_condition TEXT CHECK(returned_condition IN ('Excellent', 'Good', 'Fair', 'Needs Repair', 'Under Maintenance', 'New', 'Like New', 'Poor')),
    inspection_notes TEXT,
    overdue_penalty_centavos INTEGER NOT NULL DEFAULT 0,
    damage_penalty_centavos INTEGER NOT NULL DEFAULT 0,
    released_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    received_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

-- 6. Wishlists table (User cart / saved items)
CREATE TABLE IF NOT EXISTS wishlists (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tool_id TEXT NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    UNIQUE(user_id, tool_id)
);

-- 7. Payments & Transactions table (Simulated Philippine Gateways & Municipal Treasury)
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    receipt_reference TEXT NOT NULL UNIQUE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    reservation_id TEXT REFERENCES reservations(id) ON DELETE SET NULL,
    rental_id TEXT REFERENCES rentals(id) ON DELETE SET NULL,
    tool_id TEXT REFERENCES tools(id) ON DELETE SET NULL,
    amount_centavos INTEGER NOT NULL,
    payment_method TEXT NOT NULL CHECK(payment_method IN ('Cash', 'GCash', 'LANDBANK', 'Landbank', 'PayMaya', 'Maya', 'BDO', 'Bank Transfer', 'Municipal Treasury')),
    status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending', 'Paid', 'Failed', 'Refunded')),
    gateway_reference TEXT,
    proof_url TEXT,
    verified_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    verified_at TEXT,
    paid_at TEXT,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

-- 8. Maintenance table
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

-- 9. Feedback table
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

-- 10. Notifications table
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

-- 11. Audit Logs table
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

-- 12. Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    expires_at TEXT NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_tools_category ON tools(category);
CREATE INDEX IF NOT EXISTS idx_tools_availability ON tools(availability_status);
CREATE INDEX IF NOT EXISTS idx_tools_user_id ON tools(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_user ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_tool ON reservations(tool_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_borrow_requests_item ON borrow_requests(item_id);
CREATE INDEX IF NOT EXISTS idx_borrow_requests_borrower ON borrow_requests(borrower_id);
CREATE INDEX IF NOT EXISTS idx_borrow_requests_lender ON borrow_requests(lender_id);
CREATE INDEX IF NOT EXISTS idx_borrow_requests_dates ON borrow_requests(item_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_rentals_user ON rentals(user_id);
CREATE INDEX IF NOT EXISTS idx_rentals_tool ON rentals(tool_id);
CREATE INDEX IF NOT EXISTS idx_rentals_status ON rentals(status);
CREATE INDEX IF NOT EXISTS idx_wishlists_user ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_tool ON wishlists(tool_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_tool ON maintenance(tool_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance(status);
CREATE INDEX IF NOT EXISTS idx_feedback_tool ON feedback(tool_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
