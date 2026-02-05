# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2026-02-05

### Added
- Codecov configuration with project and patch thresholds and server-only coverage flags.
- Structured logging via winston and optional Prometheus-compatible metrics endpoint.
- Fixtures for e2e payloads to keep test data consistent.
- Expanded seed data covering multiple owners, managers, properties, contracts, payments, maintenance, documents, messages, reviews, notifications, and sessions.

### Changed
- Tightened RBAC on payments, messages, documents, maintenance, and reviews routes to owner/manager (admin bypass remains).
- E2E flows hardened with cross-entity assertions and RBAC coverage.

### Fixed
- E2E database bootstrap and schema isolation reliability.
- TypeScript typing for metrics endpoint and express request typing.

### Tests
- `npm run test:ci`
- `npm run test:e2e` (requires PostgreSQL reachable at `localhost:5433`)
