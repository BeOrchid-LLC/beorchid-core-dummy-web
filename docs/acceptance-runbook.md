# Core Dummy Web acceptance runbook

This runbook is the success gate for the authentication and integration test.
The attached milestone documents are reference material only; record actual
results against the repository and staging services.

## 1. Provision the app

From the `beorchid-core` API repository, using the staging migration credential:

```bash
npm run db:connect-app -- core_dummy_web "Core Dummy Web"
```

Save the generated Core API key immediately. It is shown once. The script uses
`local_dev_only` as the initial database password, so rotate it before staging
use and place the resulting app-role connection string in the local `.env.local`.

Run the app migration using the app role:

```bash
npm run db:migrate
```

The app role must be able to use `core_dummy_web.records` and must not have
schema or table privileges on `core`.

## 2. Configure permissions and test identities

Using Core's staging admin API:

1. Create app-scoped permissions `dummy:records:read`,
   `dummy:records:create`, and `dummy:records:delete`.
2. Create or reuse dedicated viewer, editor, and owner roles.
3. Attach read to viewer; read/create to editor; all three to owner.
4. Create a dedicated Clerk staging organization and three test users.
5. Reconcile their Clerk identities into Core.
6. Assign the corresponding app role to each membership.

Record IDs and email addresses in private evidence only. Do not put them in the
repository or in screenshots shared outside the project.

## 3. Configure Clerk and the app

Add the local URL to the correct Clerk instance's allowed web paths:

```text
http://localhost:3200
http://localhost:3200/sign-in
http://localhost:3200/sign-up
```

Set these values in `.env.local`:

```text
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CORE_API_URL=https://staging-core.example.com
CORE_API_KEY=...
DATABASE_URL=postgres://core_dummy_web_rw:<rotated-secret>@<staging-db>/beorchid_core
```

Start the app and confirm the home page says **LIVE ACCEPTANCE MODE**.

## 4. Execute the acceptance matrix

Run the Playwright suite separately with owner, viewer, and no-access storage
states. Also perform these manual checks:

- Signed-out page and API behavior return a sign-in prompt/`401`.
- A newly signed-in but unreconciled user shows the unlinked state and cannot
  access records.
- Owner can create, read, and delete a record.
- Viewer can read but receives `403` for direct create/delete attempts.
- No-access member receives a denial and cannot reach records through crafted
  requests.
- Switching Clerk organization never exposes another organization's records.
- A permission belonging to another app does not appear in this app's context.
- Core API key rotation works with the new key and fails with the revoked key.
- Core timeout/unavailability produces a controlled error and no mutation.
- Invalid record names return `400` and create no row.

## 5. Prove database isolation

Using the app database role, verify:

```sql
SELECT * FROM core_dummy_web.records;
SELECT * FROM core.users;
SELECT * FROM core.role_permissions;
```

The first query is allowed. The Core-table queries must fail with insufficient
privilege. Use the migration/admin connection only for inspection and never
place that credential in the app.

## 6. Evidence and sign-off

Record:

- app, Core API, and SDK commit SHAs;
- environment mode and Core URL hostname, excluding credentials;
- role-by-role Playwright results;
- HTTP status and response results for direct authorization bypass attempts;
- database privilege results;
- key rotation and revocation results;
- any webhook/reconciliation delay;
- unresolved infrastructure limitations.

The work is not successful until all required checks pass against real Clerk and
staging Core. Fixture mode, a successful build, or a green UI-only test is not
enough.
