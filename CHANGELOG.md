# Changelog

All notable changes to EdgeLoop are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Comprehensive CI/CD pipeline with GitHub Actions
  - Automated testing, linting, formatting, and type checking
  - Dependency and build caching for faster CI runs
  - Concurrency control to cancel outdated builds
  - Test coverage reporting with Codecov integration
- Integration tests for all API endpoints (36 tests total)
  - `/healthz` endpoint tests (8 tests)
  - `/readyz` endpoint tests (4 tests)
  - `/api/predictions` endpoint tests (10 tests)
  - `/api/model-status` endpoint tests (7 tests)
  - `/api/alerts` endpoint tests (6 tests)
- Pre-commit hooks with Husky for automatic quality checks
- Code coverage thresholds (70% lines/functions, 65% branches)
- CONTRIBUTING.md with comprehensive development guide
- Branch protection rules documentation
- GitHub Actions and Codecov badges in README

### Changed

- Enhanced README with detailed testing strategy and coverage information
- Updated vitest config with coverage thresholds and reporters
- Improved CI workflow with parallel caching and artifact uploads

### Developer Experience

- Pre-commit validation ensures all code meets quality standards
- Automated testing on every commit prevents regressions
- Coverage reports identify untested code paths
- Clear contribution guidelines help new developers onboard quickly

## [0.1.0] - Initial Release

### Added

- Serverless NFL prediction API platform
- TypeScript monorepo with strict mode
- Vercel deployment configuration
- Core API endpoints for predictions, model status, and alerts
- Security headers and request ID tracking
- Structured JSON logging
- Basic CI pipeline with GitHub Actions

---

## How to Update

When making changes:

1. Add your changes under `[Unreleased]`
2. Categorize using:
   - `Added` for new features
   - `Changed` for changes in existing functionality
   - `Deprecated` for soon-to-be removed features
   - `Removed` for now removed features
   - `Fixed` for any bug fixes
   - `Security` for vulnerability fixes

When releasing a new version:

1. Move `[Unreleased]` changes to a new version section
2. Add release date
3. Create a git tag: `git tag -a v1.0.0 -m "Release v1.0.0"`
4. Push tags: `git push --tags`
