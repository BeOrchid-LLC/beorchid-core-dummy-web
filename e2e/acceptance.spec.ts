import { test, expect } from '@playwright/test';

const role = process.env['PLAYWRIGHT_ROLE'];

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

test('viewer sees records but no mutation controls', async ({ page }) => {
  test.skip(role !== 'viewer', 'Run this scenario with the dedicated viewer auth state.');
  await page.goto('/records');
  await expect(page.getByRole('heading', { name: 'Dummy Records' })).toBeVisible();
  await expect(page.getByLabel('New record')).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Delete' })).not.toBeVisible();
});

test('no-access member receives a denial', async ({ page }) => {
  test.skip(role !== 'no-access', 'Run this scenario with the dedicated no-access auth state.');
  await page.goto('/records');
  await expect(page.getByText('Access denied')).toBeVisible();
});
