import { test, expect } from '@playwright/test';

const role = process.env['PLAYWRIGHT_ROLE'];

test('signed-out browser is denied by the records API', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, storageState: undefined });
  const recordsResponse = await context.request.get('/api/records');
  const adminResponse = await context.request.get('/api/admin/core/memberships?clerk_user_id=user_probe');
  expect(recordsResponse.status()).toBe(401);
  expect(adminResponse.status()).toBe(401);
  await context.close();
});

test.describe('authenticated acceptance', () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(!process.env['PLAYWRIGHT_AUTH_STATE'], 'Set PLAYWRIGHT_AUTH_STATE after signing in a dedicated Clerk test user.');
    testInfo.annotations.push({ type: 'role', description: role ?? 'unspecified' });
  });

  test('live dashboard resolves the Core context', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Core context' })).toBeVisible();
    await expect(page.getByText('Core user id')).toBeVisible();
    await expect(page.getByText('core_dummy_web')).toBeVisible();
  });

  test('owner can create and delete a record', async ({ page }) => {
    test.skip(role !== 'owner', 'Run this scenario with the dedicated owner auth state.');
    await page.goto('/records');
    const name = `acceptance-${Date.now()}`;
    await page.getByLabel('New record').fill(name);
    await page.getByRole('button', { name: 'Create record' }).click();
    await expect(page.getByText(name)).toBeVisible();
    const row = page.getByRole('row', { name: new RegExp(name) });
    page.once('dialog', (dialog) => void dialog.accept());
    await row.getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText(name)).not.toBeVisible();
  });

  test('owner invalid input is rejected without creating a record', async ({ page }) => {
    test.skip(role !== 'owner', 'Run this scenario with the dedicated owner auth state.');
    await page.goto('/records');
    const response = await page.request.post('/api/records', {
      data: { name: ' '.repeat(3) },
      headers: { origin: new URL(page.url()).origin },
    });
    expect(response.status()).toBe(400);
  });

  test('owner cross-origin mutation attempt is rejected', async ({ page }) => {
    test.skip(role !== 'owner', 'Run this scenario with the dedicated owner auth state.');
    await page.goto('/records');
    const response = await page.request.post('/api/records', {
      data: { name: 'cross-origin-bypass-attempt' },
      headers: { origin: 'https://attacker.invalid' },
    });
    expect(response.status()).toBe(403);
  });

  test('viewer sees records but direct create is also denied', async ({ page }) => {
    test.skip(role !== 'viewer', 'Run this scenario with the dedicated viewer auth state.');
    await page.goto('/records');
    await expect(page.getByRole('heading', { name: 'Dummy Records' })).toBeVisible();
    await expect(page.getByLabel('New record')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create record' })).toBeVisible();
    await expect(page.getByLabel('Delete test by record ID')).toBeVisible();
    const response = await page.request.post('/api/records', {
      data: { name: 'viewer-bypass-attempt' },
      headers: { origin: new URL(page.url()).origin },
    });
    expect(response.status()).toBe(403);
    const deleteResponse = await page.request.delete(
      '/api/records/00000000-0000-4000-8000-000000000000',
      { headers: { origin: new URL(page.url()).origin } },
    );
    expect(deleteResponse.status()).toBe(403);
  });

  test('no-access member receives UI and direct API denial', async ({ page }) => {
    test.skip(role !== 'no-access', 'Run this scenario with the dedicated no-access auth state.');
    await page.goto('/records');
    await expect(page.getByText('403 Read denied')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create record' })).toBeVisible();
    await expect(page.getByLabel('Delete test by record ID')).toBeVisible();
    const response = await page.request.get('/api/records');
    expect(response.status()).toBe(403);
  });

  test('unlinked Clerk user cannot access records', async ({ page }) => {
    test.skip(role !== 'unlinked', 'Run this scenario with a Clerk user not yet projected into Core.');
    await page.goto('/records');
    await expect(page.getByText('waiting for its Core identity projection')).toBeVisible();
    const response = await page.request.get('/api/records');
    expect(response.status()).toBe(403);
  });
});
