# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Genesis prediction engines (TDA, LTC, Active Inference)
- BALLDONTLIE NFL API integration (GOAT tier)
- Professional sports analytics UI/UX
- Rust backend with Axum
- Next.js 16 App Router migration

### Changed
- Migrated from Vite to Next.js 16
- Updated to React 19
- Replaced Express with Hono (interim) → Rust (target)
- Improved project structure and organization

### Fixed
- Database connection during build time
- Dependency conflicts (drizzle-orm, better-auth, ESLint)
- CI/CD workflow configuration

---

For detailed change history, see [documentation](./docs/).
