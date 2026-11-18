# Installation & Development Environment Setup Guide

This guide provides step-by-step instructions for preparing the development environment, configuring dependencies, initializing SQLite, and launching the MCTEB application.

---

## 1. Prerequisites

Before setting up the project, ensure your workstation meets the following minimum requirements:

| Component            | Minimum Version                         | Recommended Version     | Verification Command |
| -------------------- | --------------------------------------- | ----------------------- | -------------------- |
| **Node.js**          | `>= 20.0.0`                             | `22.x` or `24.x`        | `node --version`     |
| **pnpm**             | `12.x`                                  | `12.15.0`               | `pnpm --version`     |
| **Operating System** | Windows 10/11, macOS 12+, Ubuntu 22.04+ | Any 64-bit OS           | -                    |
| **SQLite**           | Built-in via `node:sqlite`              | Node.js built-in engine | See below            |

> [!NOTE]
> MCTEB utilizes Node.js's native `node:sqlite` engine (`DatabaseSync`), which is built directly into Node 20+. You do **not** need to install separate SQLite CLI binaries or external C++ compilers.

### Installing pnpm

If pnpm is not already installed:

```bash
# Via Corepack (recommended):
corepack enable
corepack prepare pnpm@12.15.0 --activate

# Or via npm globally:
npm install -g pnpm@12.15.0
```

---

## 2. Automated Setup (Recommended)

MCTEB provides automated bootstrapping scripts that verify runtimes, prepare `.env`, install dependencies, verify SQLite, apply database schema migrations, and seed realistic demo fixtures.

### Windows (PowerShell / Command Prompt)

Run either:

```cmd
setup.bat
```

Or directly in PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File Development\scripts\setup.ps1
```

### Linux / macOS (Bash)

```bash
chmod +x Development/scripts/setup.sh
./Development/scripts/setup.sh
```

---

## 3. Manual Setup Workflow

If you prefer to execute the installation steps manually:

### Step 1: Clone Repository

```bash
git clone https://github.com/YourOrg/MCTED.git
cd MCTED
```

### Step 2: Configure Environment

Copy the safe development template:

```bash
cp .env.example .env
```

### Step 3: Install Dependencies

```bash
pnpm install
```

### Step 4: Build Shared Domain Package

```bash
pnpm --filter @mcteb/shared build
```

### Step 5: Initialize SQLite Database

Ensure data directory exists and verify SQLite connectivity:

```bash
pnpm run db:init
```

### Step 6: Apply Database Schema Migrations

Applies tables, check constraints, and performance indexes from `backend/db/schema.sql`:

```bash
pnpm run db:migrate
```

### Step 7: Seed Demo Personas & Catalog Tools

Populates 4 realistic demo users, 7 catalog tools, sample bookings, loans, and reviews:

```bash
pnpm run db:seed
```

---

## 4. Running the Development Application

Start both the Express backend API and the Vite React frontend in parallel:

```bash
pnpm run dev
```

### Accessing the Applications

- **Frontend SPA**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:3000/api/v1](http://localhost:3000/api/v1)
- **API Health Check**: [http://localhost:3000/health](http://localhost:3000/health)

Log in using any of the documented development credentials (see [User_Roles_and_Permissions.md](../Documentation/User_Roles_and_Permissions.md)).

---

## 5. Available Development Commands

| Command                  | Purpose                                                                                  |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| `pnpm run dev`           | Starts frontend (port 5173) and backend API (port 3000) concurrently                     |
| `pnpm run build`         | Compiles `@mcteb/shared`, compiles backend TypeScript, and builds production Vite bundle |
| `pnpm run typecheck`     | Validates TypeScript static types across all workspaces with `--noEmit`                  |
| `pnpm run lint`          | Analyzes code quality using ESLint and typescript-eslint                                 |
| `pnpm run lint:fix`      | Automatically fixes autofixable ESLint issues                                            |
| `pnpm run format`        | Formats the entire codebase using Prettier                                               |
| `pnpm run format:check`  | Checks formatting compliance against Prettier rules                                      |
| `pnpm run test`          | Runs all Vitest and Node test suites across workspaces                                   |
| `pnpm run db:init`       | Safely verifies or initializes the SQLite database file                                  |
| `pnpm run db:migrate`    | Applies database DDL schema from `backend/db/schema.sql`                                 |
| `pnpm run db:seed`       | Populates demo accounts, sample tools, and fixtures (idempotent)                         |
| `pnpm run db:reset-demo` | Safely removes only designated demo records while preserving user data                   |
| `pnpm run db:backup`     | Creates an atomic hot backup snapshot in `Database/backups/` using `VACUUM INTO`         |

---

## 6. Troubleshooting

### Port 3000 or 5173 Already in Use

Edit the `PORT` in `.env` (for backend) or pass `--port <new_port>` to Vite in `frontend/package.json`.

### Node.js Version Error

If you receive `node:sqlite is not defined` or syntax errors, verify your Node version:

```bash
node -v
```

Upgrade to Node.js >= 20.0.0.
