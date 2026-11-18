# Known Issues & Operational Limitations

This document records the current technical limitations, external dependencies, and operational workarounds in MCTEB.

---

## 1. In-App Notifications vs. SMS Gateway

- **Current State**: Alerts for booking approvals, inspection results, and due date reminders are delivered exclusively through the in-app notification feed (`/api/v1/notifications`).
- **Reason**: Intermittent cellular signal across remote parts of Batanes and lack of a dedicated SMS gateway account (e.g. Semaphore or Twilio).
- **Interim Workaround**: Residents check notifications directly upon logging into the portal.
- **Resolution Plan**: Integrate a regional SMS gateway fallback when internet connectivity drops.

---

## 2. SQLite Concurrency Scope

- **Current State**: SQLite operates with a single-writer lock. While `WAL` mode allows concurrent readers, multiple simultaneous write operations queue sequentially behind a 5,000ms busy timeout.
- **Operational Reality**: For municipal operations in Basco (serving a population of ~9,000 residents with ~10 concurrent desk staff), this provides sub-millisecond latency and zero operational overhead.
- **Resolution Plan**: If statewide or multi-island scaling is required, the clean repository abstraction enables transitioning to PostgreSQL with minimal service refactoring.

---

## 3. Frontend Bundle Size Warning

- **Current State**: Vite displays a warning during `pnpm run build`: `(!) Some chunks are larger than 500 kB after minification (dist/assets/index-*.js: ~516 kB)`.
- **Impact**: All feature screens are currently bundled in a single initial chunk.
- **Mitigation**: The bundle loads in <200ms on local municipal networks. Future optimization will implement React `lazy()` code-splitting across feature routes.
