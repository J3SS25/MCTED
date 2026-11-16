# Configuration & Environment Variables Reference

This document details all configuration options, environment variables, defaults, and port allocations for MCTEB.

---

## 1. Environment Variables (`.env`)

MCTEB loads configuration from a `.env` file located at the repository root. A template is provided in `.env.example`.

| Variable          | Type    | Default                 | Required in Production | Description                                                             |
| ----------------- | ------- | ----------------------- | :--------------------: | ----------------------------------------------------------------------- |
| `NODE_ENV`        | String  | `development`           |          Yes           | Runtime environment (`development`, `production`, `test`)               |
| `PORT`            | Number  | `3000`                  |           No           | Port on which Express API backend listens                               |
| `DATABASE_PATH`   | String  | `./data/app.db`         |           No           | Path to SQLite database file                                            |
| `CORS_ORIGINS`    | String  | `http://localhost:5173` |          Yes           | Comma-separated allowlist of allowed frontend origins                   |
| `SESSION_SECRET`  | String  | _dev fallback_          |        **Yes**         | Secret key for session encryption (min 32 characters)                   |
| `LOG_LEVEL`       | String  | `info`                  |           No           | Pino logging level (`fatal`, `error`, `warn`, `info`, `debug`, `trace`) |
| `ALLOW_DEMO_SEED` | Boolean | `false`                 |           No           | Safety flag required to execute demo seeding in production              |

---

## 2. Configuration Resolution (`apps/api/src/config/env.ts`)

The backend validates and resolves environment variables at boot using Zod. If a required variable is missing or malformed, the server exits immediately with a descriptive error.

### Database Path Resolution

`DATABASE_PATH` supports relative paths. When running inside `apps/api`, relative paths are resolved relative to `apps/api/` (defaulting to `apps/api/data/app.db`), ensuring consistency whether running directly from `apps/api` or from the monorepo root.

### Generating a Secure Session Secret

In production, generate a cryptographically secure 32-character secret:

```bash
# Linux / macOS / Git Bash
openssl rand -hex 32

# Windows PowerShell
-join ((1..32) | ForEach-Object { '{0:x2}' -f (Get-Random -Max 256) })
```

---

## 3. Port & Network Allocation

| Service                         | Protocol   | Default Port | Internal / Public      |
| ------------------------------- | ---------- | ------------ | ---------------------- |
| **Backend API** (`@mcteb/api`)  | HTTP       | `3000`       | Public / Reverse Proxy |
| **Frontend SPA** (`@mcteb/web`) | HTTP       | `5173`       | Developer Vite Server  |
| **SQLite WAL Engine**           | In-Process | N/A          | Local File (`app.db`)  |

In production deployments, a reverse proxy (e.g., Caddy or Nginx) typically terminates SSL on port 443, serves the built static frontend assets from `apps/web/dist`, and proxies `/api/*` traffic to port 3000.
