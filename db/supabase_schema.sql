-- =============================================================================
-- SYSTEM ARCHITECTURE DATABASE SCHEMA (PostgreSQL / Supabase)
-- Municipal Community Tool and Equipment Bank (MCTEB)
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. ENUMS & DOMAINS
-- -----------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('Administrator', 'Municipal Staff', 'Admin', 'Staff', 'Borrower', 'Lender');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('Active', 'Pending Verification', 'Suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE item_condition AS ENUM ('New', 'Like New', 'Excellent', 'Good', 'Fair', 'Needs Repair', 'Under Maintenance', 'Poor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE item_availability AS ENUM ('Available', 'Reserved', 'Borrowed', 'Maintenance', 'Damaged', 'Archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected', 'returned', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_gateway AS ENUM ('Cash', 'GCash', 'LANDBANK', 'Landbank', 'PayMaya', 'Maya', 'BDO', 'Bank Transfer', 'Municipal Treasury');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_status AS ENUM ('Pending', 'Paid', 'Completed', 'Failed', 'Refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- -----------------------------------------------------------------------------
-- 2. USERS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    birth_date DATE NOT NULL,
    age INTEGER CHECK (age IS NULL OR age >= 18),
    province TEXT NOT NULL DEFAULT 'Batanes',
    avatar_url TEXT,
    profile_picture_url TEXT,
    is_age_verified BOOLEAN NOT NULL DEFAULT true,
    barangay TEXT NOT NULL,
    address TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'Borrower',
    status user_status NOT NULL DEFAULT 'Active',
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    lockout_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- -----------------------------------------------------------------------------
-- 3. ITEMS (TOOLS / EQUIPMENT) TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    specifications TEXT,
    daily_rate_centavos INTEGER NOT NULL DEFAULT 0 CHECK (daily_rate_centavos >= 0),
    rental_fee_centavos INTEGER NOT NULL DEFAULT 0 CHECK (rental_fee_centavos >= 0),
    deposit_fee_centavos INTEGER NOT NULL DEFAULT 0 CHECK (deposit_fee_centavos >= 0),
    discount_percentage INTEGER NOT NULL DEFAULT 0 CHECK (discount_percentage BETWEEN 0 AND 100),
    condition item_condition NOT NULL DEFAULT 'Good',
    photo_url TEXT,
    image_url TEXT,
    availability_status item_availability NOT NULL DEFAULT 'Available',
    total_quantity INTEGER NOT NULL DEFAULT 1 CHECK (total_quantity > 0),
    available_quantity INTEGER NOT NULL DEFAULT 1 CHECK (available_quantity >= 0),
    serial_number TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_items_user_id ON public.items(user_id);
CREATE INDEX IF NOT EXISTS idx_items_category ON public.items(category);
CREATE INDEX IF NOT EXISTS idx_items_status ON public.items(availability_status);

-- -----------------------------------------------------------------------------
-- 4. BORROW REQUESTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.borrow_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE RESTRICT,
    borrower_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    lender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status request_status NOT NULL DEFAULT 'pending',
    request_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),

    CONSTRAINT chk_end_after_start CHECK (end_date >= start_date),
    CONSTRAINT chk_no_self_borrow CHECK (borrower_id <> lender_id)
);

CREATE INDEX IF NOT EXISTS idx_borrow_requests_item ON public.borrow_requests(item_id);
CREATE INDEX IF NOT EXISTS idx_borrow_requests_borrower ON public.borrow_requests(borrower_id);
CREATE INDEX IF NOT EXISTS idx_borrow_requests_lender ON public.borrow_requests(lender_id);
CREATE INDEX IF NOT EXISTS idx_borrow_requests_dates ON public.borrow_requests(item_id, start_date, end_date)
    WHERE status IN ('pending', 'approved');

-- -----------------------------------------------------------------------------
-- 5. WISHLISTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wishlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),

    CONSTRAINT uq_user_item_wishlist UNIQUE (user_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlists_user ON public.wishlists(user_id);

-- -----------------------------------------------------------------------------
-- 6. TRANSACTIONS & RECEIPTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_number VARCHAR(50) NOT NULL UNIQUE,
    request_id UUID REFERENCES public.borrow_requests(id) ON DELETE SET NULL,
    payer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    item_id UUID REFERENCES public.items(id) ON DELETE SET NULL,
    gateway payment_gateway NOT NULL,
    amount_centavos INTEGER NOT NULL CHECK (amount_centavos >= 0),
    status transaction_status NOT NULL DEFAULT 'Pending',
    gateway_reference TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_transactions_payer ON public.transactions(payer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_receipt ON public.transactions(receipt_number);

-- -----------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.borrow_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Item Policies
CREATE POLICY "Public items can be viewed" ON public.items
    FOR SELECT USING (true);

CREATE POLICY "Users can create their own items" ON public.items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners, Staff, or Admins can delete items" ON public.items
    FOR DELETE USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('Admin', 'Staff', 'Administrator', 'Municipal Staff')
        )
    );

-- Wishlist Policies
CREATE POLICY "Users can manage their own wishlist" ON public.wishlists
    FOR ALL USING (auth.uid() = user_id);

-- Borrow Requests Policies
CREATE POLICY "Users can view relevant borrow requests" ON public.borrow_requests
    FOR SELECT USING (
        auth.uid() = borrower_id OR
        auth.uid() = lender_id OR
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('Admin', 'Staff', 'Administrator', 'Municipal Staff')
        )
    );

