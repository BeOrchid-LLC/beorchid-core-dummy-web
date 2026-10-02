import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAdminClerkUserIds } from '../src/lib/admin-auth';

test('admin allowlist parsing trims, deduplicates, and drops empty values', () => {
  assert.deepEqual(
    [...parseAdminClerkUserIds(' user_owner, user_backup ,,user_owner ')],
    ['user_owner', 'user_backup'],
  );
});

test('an absent admin allowlist is closed', () => {
  assert.equal(parseAdminClerkUserIds(undefined).size, 0);
});
