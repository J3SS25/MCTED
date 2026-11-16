#!/usr/bin/env bash
# ==============================================================================
# MCTEB Automated Development Setup Script (Linux / macOS)
# Municipal Community Tool and Equipment Bank — Municipality of Basco, Batanes
# ==============================================================================

set -euo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

write_step() {
  echo -e "\n${CYAN}==> $1${NC}"
}

write_success() {
  echo -e " ${GREEN}[OK] $1${NC}"
}

write_warn() {
  echo -e " ${YELLOW}[WARN] $1${NC}"
}

write_err() {
  echo -e " ${RED}[ERROR] $1${NC}"
}

echo -e "${CYAN}================================================================================${NC}"
echo -e "${CYAN} Municipal Community Tool and Equipment Bank (MCTEB) - Development Setup${NC}"
echo -e "${CYAN} Basco, Batanes | Automated Environment Bootstrapper${NC}"
echo -e "${CYAN}================================================================================${NC}"

# 1. Check Node.js
write_step "1/7 Checking Node.js runtime..."
if ! command -v node >/dev/null 2>&1; then
  write_err "Node.js is not installed. Please install Node.js >= 20 from https://nodejs.org"
  exit 1
fi

NODE_VERSION=$(node -v)
NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d'.' -f1 | tr -d 'v')
if [ "$NODE_MAJOR" -lt 20 ]; then
  write_err "Node.js >= 20.0.0 is required. Found: $NODE_VERSION"
  exit 1
fi
write_success "Node.js $NODE_VERSION detected (Node >= 20 required)."

# 2. Check pnpm
write_step "2/7 Checking pnpm package manager..."
if ! command -v pnpm >/dev/null 2>&1; then
  write_warn "pnpm not found. Attempting Corepack preparation..."
  if command -v corepack >/dev/null 2>&1; then
    corepack enable
    corepack prepare pnpm@12.15.0 --activate
    write_success "pnpm activated via Corepack."
  else
    write_err "Neither pnpm nor corepack was found. Please install pnpm: npm install -g pnpm"
    exit 1
  fi
else
  PNPM_VERSION=$(pnpm --version)
  write_success "pnpm $PNPM_VERSION detected."
fi

# 3. Environment Configuration
write_step "3/7 Checking local environment configuration..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

if [ ! -f "$ROOT_DIR/.env" ]; then
  if [ -f "$ROOT_DIR/.env.example" ]; then
    cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"
    write_success "Created .env from .env.example (safe development defaults)."
  else
    write_warn "Creating minimal development .env..."
    cat <<EOF > "$ROOT_DIR/.env"
NODE_ENV=development
PORT=3000
DATABASE_PATH=./Database/app.db
CORS_ORIGINS=http://localhost:5173
SESSION_SECRET=dev-secret-key-min-32-chars-basco-batanes-2026
LOG_LEVEL=info
ALLOW_DEMO_SEED=true
EOF
    write_success "Created minimal .env file."
  fi
else
  write_success "Existing .env detected (preserved, not overwritten)."
fi

# 4. Install Dependencies
write_step "4/7 Installing monorepo dependencies with pnpm..."
cd "$ROOT_DIR"
pnpm install
write_success "Monorepo dependencies installed successfully."

# 5. Verify SQLite Engine
write_step "5/7 Verifying SQLite engine..."
if node -e "const { DatabaseSync } = require('node:sqlite'); new DatabaseSync(':memory:'); console.log('OK');" >/dev/null 2>&1; then
  write_success "Built-in Node.js SQLite engine (node:sqlite) verified."
else
  write_err "Built-in SQLite engine is unavailable in this Node.js distribution."
  exit 1
fi

# 6. Initialize & Migrate Database
write_step "6/7 Initializing development database and applying schema..."
pnpm run db:init
pnpm run db:migrate
write_success "Database initialized and schema migrations applied (backend/db/schema.sql)."

# 7. Seed Demo Fixtures
if [ "${1:-}" != "--skip-seed" ]; then
  write_step "7/7 Seeding demo accounts and municipal equipment catalog..."
  pnpm run db:seed
  write_success "Demo accounts, catalog tools, and test fixtures seeded."
else
  write_step "7/7 Skipping demo seeding (--skip-seed specified)."
fi

echo -e "\n${GREEN}================================================================================${NC}"
echo -e "${GREEN} MCTEB Development Environment Setup Complete!${NC}"
echo -e "${GREEN}================================================================================${NC}"
echo -e "${YELLOW}
Quick Start Commands:
  pnpm run dev          # Start backend API (port 3000) and frontend SPA (port 5173)
  pnpm run test         # Run integration and unit test suites
  pnpm run typecheck    # Validate TypeScript type safety across workspaces
  pnpm run lint         # Check code quality with ESLint
  pnpm run format:check # Verify code formatting with Prettier

Demo Accounts (Password for all: Basco@2026!):
  Administrator:    admin@basco.gov.ph    (Maria Santos - Full municipal oversight)
  Municipal Staff:  staff@basco.gov.ph    (Juan dela Cruz - Desk operations & verification)
  Borrower:         borrower@basco.gov.ph (Ana Reyes - Resident tool reservations)
  Borrower:         farmer@basco.gov.ph   (Pedro Batanes - Resident farmer loans)

Full credentials and account matrix: development/Documentation/User_Roles_and_Permissions.md
${NC}"
