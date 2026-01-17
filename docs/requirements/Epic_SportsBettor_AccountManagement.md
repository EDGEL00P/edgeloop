
# Account Management

## Overview
This epic defines all user account features: onboarding, identity, authentication, preferences, bankroll tracking, and privacy controls.

## Goals
- Provide secure, frictionless account creation and management.
- Protect user data and comply with privacy/security best practices.
- Expose account-level settings for personalized recommendations and bankroll management.

## Features
- Signup / login: email, OAuth providers (optional), passwordless option.
- Multi-factor authentication (MFA) for sensitive actions.
- Account dashboard with balance, transaction history, and bet history.
- Preferences: notification settings, market filters, display options.
- Roles & permissions for advanced account types.

## Acceptance Criteria
- Secure password storage (bcrypt/argon2) and rate-limited auth endpoints.
- MFA available and can be enabled by users.
- Account dashboard displays accurate balance and bet history within 5 seconds of update.
- Privacy controls allow export/delete of account data per GDPR/CCPA guidelines.

## Security & Compliance
- Enforce strong password policies and account lockouts after repeated failures.
- Role-based access control for any admin-level functionality.
- Audit logging for authentication events and critical account actions.

## UI / UX Requirements
- Clear account flows with progressive disclosure of advanced features.
- Use ESPN-themed UI: clean type, strong hierarchy, and minimal accent highlights for actions.
- Accessibility: forms labelled, error states announced, keyboard navigable.

## Implementation Notes
Backed by `server/auth` and `server/betting` services; implement rate limits and monitoring.
