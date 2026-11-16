# Future Improvements & Architectural Roadmap

This document outlines strategic enhancements planned for future phases of the Municipal Community Tool and Equipment Bank (MCTEB).

---

## 1. Feature Roadmap

### Phase 2: Hardware & Desk Automation

- **Barcode & QR Tagging**:
  - Generate printable QR asset tags with equipment serial codes.
  - Enable webcam and handheld USB 2D barcode scanner input at the rental checkout desk for one-click tool handover.
- **Digital Equipment Inspection Signatures**:
  - Add signature pad component to `frontend` allowing borrowers and desk staff to digitally sign condition inspections on tablet devices.

### Phase 3: Payment & Messaging Automation

- **Payment Gateway Webhook Callbacks**:
  - Integrate direct webhook verification via Maya Enterprise or GCash Merchant APIs.
  - Automatically transition payment records to `'Paid'` and issue official receipts upon webhook signature validation.
- **Cellular SMS Notifications**:
  - Integrate regional SMS gateway (Semaphore API) to dispatch text alerts for overdue tools, booking approvals, and severe weather equipment availability.

### Phase 4: Island-Wide Distributed Offline Sync

- **Progressive Web App (PWA) Offline Mode**:
  - Implement service worker caching and IndexedDB queueing for municipal desk tablets stationed in Sabtang and Itbayat islands where satellite internet fluctuates.
  - Background sync queued loans when satellite connection is restored.

---

## 2. Architectural Evolution

### Transitioning to PostgreSQL (If Scaled Beyond Single Municipal Server)

If the tool bank is expanded into a province-wide network across all six municipalities of Batanes:

1. Replace `backend/db/client.ts` with a `pg` or `kysely` connection pool.
2. The 4-tier layer pattern (`routes -> controller -> service -> repository`) ensures zero rewrite of service business logic.
3. Repositories will update their SQL syntax from SQLite pragmas to PostgreSQL parameterized queries.
