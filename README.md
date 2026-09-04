# Core Dummy Web

An independent Next.js acceptance harness for BeOrchid Core. It proves a new
web app can use Clerk for authentication, `@beorchid/core-sdk` for Core identity
and permissions, and an app-owned PostgreSQL schema for organization-scoped data.

This is a test app, not a product. A green local fixture run is smoke coverage;
the acceptance gate requires a real Clerk account and staging Core API.

## Run locally

Use Node 22 (`.nvmrc`) and npm.

```bash
npm install
git submodule update --init --recursive
Copy-Item .env.example .env.local
npm run db:migrate
npm run dev
```

The app runs at `http://localhost:3200`. With Clerk and Core variables unset,
the development fixture can show the SDK seam. It is explicitly labelled
SMOKE MODE and must never be used as acceptance evidence.

## Live staging setup

Follow [`docs/acceptance-runbook.md`](docs/acceptance-runbook.md) before adding
real values to `.env.local`. The runbook covers app registration, database role
rotation, permissions, dedicated test identities, Clerk organization setup,
and key rotation. Never put the migration credential in this app.

## Commands

```bash
npm run typecheck
npm run test
npm run build
npm run db:migrate
```

For browser acceptance, first create a Playwright storage state by signing in
manually as one dedicated test user. Then run the role-specific suite:

```powershell
$env:ACCEPTANCE_BASE_URL = 'http://localhost:3200'
$env:PLAYWRIGHT_AUTH_STATE = 'playwright/.auth/owner.json'
$env:PLAYWRIGHT_ROLE = 'owner'
npx playwright test
```

Auth state files and reports are ignored and must not be committed.

## Security boundaries

- `CORE_API_KEY`, `CLERK_SECRET_KEY`, and `DATABASE_URL` are server-only.
- The app uses a fixed `core_dummy_web` app key; the browser cannot choose an app.
- Every records route resolves Core context and enforces a permission server-side.
- Every query is filtered by the organization ID returned by Core.
- The app queries only `core_dummy_web.records`; it never queries Core tables.
- Cross-origin mutations are rejected when an Origin header is present.
