# Vercel Ops (SDK)

This project includes a Vercel SDK helper script to standardize operational
tasks like integrations discovery, deployment logs, access groups, firewall
status, and rolling release checks.

## Quick start

```bash
export VERCEL_TOKEN="..."
export VERCEL_TEAM_ID="team_..."
export VERCEL_PROJECT="edgeloop"
export VERCEL_PROJECT_ID="prj_..."
```

Run helpers:

```bash
npm run vercel:integrations
npm run vercel:logs -- --url edgeloop.vercel.app
npm run vercel:projects
npm run vercel:project -- --project edgeloop
npm run vercel:teams
npm run vercel:firewall -- --project prj_...
npm run vercel:rolling-release -- --project edgeloop
npm run vercel:access-groups
```

## Environment variables

- `VERCEL_TOKEN` (required)
- `VERCEL_TEAM_ID` or `VERCEL_TEAM_SLUG` (optional)
- `VERCEL_PROJECT` (optional)
- `VERCEL_PROJECT_ID` (optional)
- `VERCEL_DEPLOYMENT` (optional)
- `VERCEL_ACCESS_GROUP` (optional)
- `VERCEL_FIREWALL_CONFIG_VERSION` (optional, defaults to `active`)
- `VERCEL_INTEGRATIONS_VIEW` (optional, `account` or `project`)

## Notes

- The script is read-only by default.
- Commands accept flags; run `npm run vercel:ops -- help` for full usage.
