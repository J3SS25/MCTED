# Changelog

All notable changes to this project are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project structure (pnpm monorepo with apps/web, apps/api, packages/shared).
- SQLite database schema (db/schema.sql) with nine core entities: users, tools, reservations, rentals, payments, maintenance, feedback, notifications, audit_logs.
- Shared package with Zod enums, schemas, permissions matrix, money and date helpers.
- Backend API with all ten modules: auth, users, tools, reservations, rentals, payments, maintenance, feedback, notifications, audit.
- Frontend React application with all eleven feature modules.
- Role-aware navigation shell with light/dark theme support.
- Demo seed data with safeguards against production exposure.

## [0.1.0] - 2026-11-05

### Added
- Project plan and architecture documentation.

