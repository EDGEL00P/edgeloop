# Platform - Golden Path

This directory contains the "golden path" for creating and deploying services consistently across teams.

## Structure

- `templates/` - Service templates/scaffolds
- `ci/` - Reusable CI/CD workflows
- `deploy/` - Helm/kustomize/terraform modules
- `local-dev/` - Docker Compose, devcontainer, task runners

## Philosophy

Platform provides:
1. **Consistency** - All services follow same patterns (healthchecks, logging, tracing)
2. **Speed** - New services can be created quickly from templates
3. **Safety** - Boundary enforcement, linting, testing built-in
4. **Observability** - Standard logging/tracing/metrics

## Usage

### Create New Service

```bash
# Copy template
cp -r platform/templates/service-template services/my-new-service

# Customize for your domain
# Add to libs/contracts/
# Generate SDKs
```

### CI/CD

All services use `platform/ci/` workflows:
- Build/test
- Lint/boundary checks
- Deploy

### Local Development

Use `platform/local-dev/` for consistent dev experience:
- Docker Compose for all services
- Task runners
- Dev containers
