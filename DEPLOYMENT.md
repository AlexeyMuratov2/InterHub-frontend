# Frontend deployment (test_deploy)

## Trigger

- Workflow runs on push to `test_deploy`
- Workflow file: `.github/workflows/deploy-frontend-test.yml`

## Required GitHub Secrets

- `VPS_HOST`
- `VPS_USER`
- `VPS_SSH_KEY`
- `VPS_SSH_PORT`
- `FRONTEND_DIST_PATH` (absolute path for static files, e.g. `/opt/interhub/frontend-dist`)

## Required GitHub Variables

- `VITE_API_BASE_URL` - API origin only, e.g. `https://app.example.com` (no trailing `/api`; routes in code already use `/api/...`)

## Output target on VPS

- Frontend build artifacts are uploaded to:
  - `${FRONTEND_DIST_PATH}`

This path must match `root` path in your Caddy site config.
