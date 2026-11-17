# ==============================================================================
# MCTEB Automated Development Setup Script (Windows PowerShell)
# Municipal Community Tool and Equipment Bank – Municipality of Basco, Batanes
# ==============================================================================

[CmdletBinding()]
param(
    [switch]$SkipSeed,
    [switch]$CI
)

$ErrorActionPreference = "Stop"

function Write-Step { param([string]$Message); Write-Host "`n==> $Message" -ForegroundColor Cyan }
function Write-Success { param([string]$Message); Write-Host " [OK] $Message" -ForegroundColor Green }
function Write-Warn { param([string]$Message); Write-Host " [WARN] $Message" -ForegroundColor Yellow }
function Write-Err { param([string]$Message); Write-Host " [ERROR] $Message" -ForegroundColor Red }

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host " Municipal Community Tool and Equipment Bank (MCTEB) - Development Setup" -ForegroundColor Cyan
Write-Host " Basco, Batanes | Automated Environment Bootstrapper" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan

# 1. Check Node.js runtime
Write-Step "1/7 Checking Node.js runtime..."
try {
    $nodeVersionOutput = node --version
    $nodeMajor = [int]($nodeVersionOutput.TrimStart('v').Split('.')[0])
    if ($nodeMajor -lt 20) {
        Write-Err "Node.js >= 20.0.0 is required. Found: $nodeVersionOutput"
        exit 1
    }
    Write-Success "Node.js $nodeVersionOutput detected (Node >= 20 required)."
} catch {
    Write-Err "Node.js is not installed or not in PATH. Please install Node.js 20+ from https://nodejs.org"
    exit 1
}

# 2. Check Package Manager (pnpm)
Write-Step "2/7 Checking pnpm package manager..."
try {
    $pnpmVersion = pnpm --version
    Write-Success "pnpm $pnpmVersion detected."
} catch {
    Write-Warn "pnpm is not found in PATH. Attempting Corepack preparation..."
    try {
        corepack enable
        corepack prepare pnpm@12.15.0 --activate
        $pnpmVersion = pnpm --version
        Write-Success "Activated pnpm $pnpmVersion via Corepack."
    } catch {
        Write-Err "Failed to activate pnpm. Please install pnpm globally: npm install -g pnpm"
        exit 1
    }
}

# 3. Environment Configuration Check
Write-Step "3/7 Checking local environment configuration..."
# This script lives in Development/scripts/ — root is two levels up
$rootDir = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$envFile = Join-Path $rootDir ".env"
$envExample = Join-Path $rootDir ".env.example"

if (-not (Test-Path $envFile)) {
    if (Test-Path $envExample) {
        Copy-Item $envExample $envFile
        Write-Success "Created .env from .env.example (safe development defaults)."
    } else {
        Write-Warn ".env.example not found. Creating minimal development .env..."
        @"
NODE_ENV=development
PORT=3000
DATABASE_PATH=./Database/app.db
CORS_ORIGINS=http://localhost:5173
SESSION_SECRET=dev-secret-key-min-32-chars-basco-batanes-2026
LOG_LEVEL=info
ALLOW_DEMO_SEED=true
"@ | Out-File -FilePath $envFile -Encoding utf8
        Write-Success "Created minimal .env file."
    }
} else {
    Write-Success "Existing .env detected (preserved, not overwritten)."
}

# 4. Install Project Dependencies
Write-Step "4/7 Installing monorepo dependencies with pnpm..."
Push-Location $rootDir
try {
    pnpm install
    Write-Success "Monorepo dependencies installed successfully."
} catch {
    Write-Err "Dependency installation failed."
    Pop-Location
    exit 1
}

# 5. Verify SQLite Availability
Write-Step "5/7 Verifying SQLite engine..."
$sqliteTest = node -e "try { const { DatabaseSync } = require('node:sqlite'); new DatabaseSync(':memory:'); console.log('OK'); } catch (e) { process.exit(1); }"
if ($sqliteTest -match "OK") {
    Write-Success "Built-in Node.js SQLite engine (node:sqlite) verified."
} else {
    Write-Err "Built-in SQLite is unavailable in this Node.js distribution."
    Pop-Location
    exit 1
}

# 6. Database Initialization & Schema Migrations
Write-Step "6/7 Initializing development database and applying schema..."
try {
    pnpm run db:init
    pnpm run db:migrate
    Write-Success "Database initialized and schema migrations applied."
} catch {
    Write-Err "Database initialization or migration failed."
    Pop-Location
    exit 1
}

# 7. Seed Demo Accounts & Fixtures
if (-not $SkipSeed) {
    Write-Step "7/7 Seeding demo accounts and municipal equipment catalog..."
    try {
        pnpm run db:seed
        Write-Success "Demo accounts, catalog tools, and test fixtures seeded."
    } catch {
        Write-Err "Database seeding failed."
        Pop-Location
        exit 1
    }
} else {
    Write-Step "7/7 Skipping demo seeding (--SkipSeed specified)."
}

Pop-Location

Write-Host "`n================================================================================" -ForegroundColor Green
Write-Host " MCTEB Development Environment Setup Complete!" -ForegroundColor Green
Write-Host "================================================================================" -ForegroundColor Green
Write-Host @"

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

Full credentials: Development/Documentation/User_Roles_and_Permissions.md
"@ -ForegroundColor Yellow
