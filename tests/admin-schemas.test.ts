import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assignAppRoleSchema,
  attachPermissionSchema,
  createRoleSchema,
  membershipLookupSchema,
} from '../src/lib/admin-schemas';

test('admin input schemas accept the intended onboarding values', () => {
  assert.equal(createRoleSchema.parse({ key: 'dummy_owner', name: 'Dummy Owner' }).key, 'dummy_owner');
  assert.equal(
    attachPermissionSchema.parse({ key: 'dummy:records:delete' }).key,
    'dummy:records:delete',
  );
  assert.equal(
    membershipLookupSchema.parse({ clerkUserId: 'user_acceptance-owner' }).clerkUserId,
    'user_acceptance-owner',
  );
  assert.equal(
    assignAppRoleSchema.parse({ roleId: '00000000-0000-4000-8000-000000000001' }).roleId,
    '00000000-0000-4000-8000-000000000001',
  );
});

test('admin input schemas reject cross-app and malformed identifiers', () => {
  assert.equal(createRoleSchema.safeParse({ key: 'Owner!', name: 'Owner' }).success, false);
  assert.equal(attachPermissionSchema.safeParse({ key: 'delete' }).success, false);
  assert.equal(membershipLookupSchema.safeParse({ clerkUserId: 'not-a-clerk-id' }).success, false);
  assert.equal(assignAppRoleSchema.safeParse({ roleId: 'not-a-uuid' }).success, false);
});
