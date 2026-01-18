# Environment Configuration

Environment-specific configuration and IaC for each deployment environment.

## Structure

```
infra/env/
├── dev/          # Development environment config
├── staging/      # Staging environment config
└── prod/         # Production environment config
```

## Usage

Each environment directory contains:
- Environment variables template (`.env.example`)
- Terraform/Pulumi configuration (if using IaC)
- Kubernetes manifests (if using k8s)
- Service discovery config

## Registry + Doctor

The repo centralizes environment variables in `infra/env/registry.ts`.
Use the doctor to check coverage and missing required vars:

```bash
npm run env:doctor
```

For JSON output:

```bash
npm run env:doctor:json
```

## Vercel Environments

For Vercel deployments, environment variables are managed in the Vercel dashboard:
- Development
- Preview
- Production

See `vercel.json` for environment-specific configuration.