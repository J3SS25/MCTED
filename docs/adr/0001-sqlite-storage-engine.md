# ADR 0001: SQLite Embedded Storage Engine

## Context
The Municipal Community Tool and Equipment Bank serves the local community of Basco, Batanes. It requires zero-config local reliability, strict referential integrity, and rapid disaster recovery while running on municipal hardware with intermittent internet connectivity.

## Decision
We adopted SQLite through `better-sqlite3` configured with Write-Ahead Logging (`WAL`), immediate busy timeout (`5000ms`), and foreign key constraints enabled.

## Consequences
- High single-node read/write speed without database service maintenance overhead.
- Simple hot backups via `VACUUM INTO` and `db.backup()`.
- Clean layered repository abstraction allows migration to PostgreSQL if multi-node writes become necessary in the future.

