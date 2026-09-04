import test from 'node:test';
import assert from 'node:assert/strict';
import { hasPermission, requirePermission, PermissionDeniedError } from '@beorchid/core-sdk';
import { PERMISSIONS } from '../src/lib/authorization';

const permissions = {
  membershipId: 'membership',
  appId: 'core_dummy_web',
  orgWide: [],
  appScoped: [PERMISSIONS.read, PERMISSIONS.create],
  effective: [PERMISSIONS.create, PERMISSIONS.read],
};

test('permission matrix defaults to deny', () => {
  assert.equal(hasPermission(null, PERMISSIONS.read), false);
  assert.equal(hasPermission(permissions, PERMISSIONS.read), true);
  assert.equal(hasPermission(permissions, PERMISSIONS.delete), false);
});

test('requirePermission throws the required key', () => {
  assert.doesNotThrow(() => requirePermission(permissions, PERMISSIONS.create));
  assert.throws(() => requirePermission(permissions, PERMISSIONS.delete), (error: unknown) => {
    return error instanceof PermissionDeniedError && error.required === PERMISSIONS.delete;
  });
});
