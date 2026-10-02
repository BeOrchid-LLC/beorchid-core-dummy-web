import test from 'node:test';
import assert from 'node:assert/strict';
import { CoreAdminApiError, createCoreAdminClient } from '../src/lib/core-admin';

const config = {
  baseUrl: 'https://core.example.test',
  adminApiKey: 'admin-secret',
  appApiKey: 'app-secret',
  appId: '00000000-0000-4000-8000-000000000010',
};

test('role creation uses only the server-side admin credential', async () => {
  const captured: Array<{ url: string; init?: RequestInit }> = [];
  const client = createCoreAdminClient(config, async (input, init) => {
    captured.push({ url: String(input), init });
    return new Response(JSON.stringify({
      id: '00000000-0000-4000-8000-000000000011',
      key: 'dummy_owner',
      name: 'Dummy Owner',
      description: null,
      isSystem: false,
    }), { status: 201 });
  });

  const role = await client.createRole({ key: 'dummy_owner', name: 'Dummy Owner' });
  assert.equal(role.key, 'dummy_owner');
  const request = captured[0];
  assert.ok(request);
  assert.equal(request.url, 'https://core.example.test/v1/admin/roles');
  assert.equal(new Headers(request.init?.headers).get('authorization'), 'Bearer admin-secret');
  assert.equal(new Headers(request.init?.headers).get('x-beorchid-app'), null);
});

test('permission attachment always uses the configured app id', async () => {
  let submitted: unknown;
  const client = createCoreAdminClient(config, async (_input, init) => {
    submitted = JSON.parse(String(init?.body));
    return new Response(JSON.stringify({
      permissionId: '00000000-0000-4000-8000-000000000012',
      permissionKey: 'dummy:records:read',
    }), { status: 201 });
  });

  await client.attachPermission('00000000-0000-4000-8000-000000000011', {
    key: 'dummy:records:read',
  });
  assert.deepEqual(submitted, {
    key: 'dummy:records:read',
    appId: config.appId,
  });
});

test('membership lookup uses the app credential and fixed app header', async () => {
  let captured: RequestInit | undefined;
  const client = createCoreAdminClient(config, async (_input, init) => {
    captured = init;
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await client.listMemberships('user_owner');
  const headers = new Headers(captured?.headers);
  assert.equal(headers.get('authorization'), 'Bearer app-secret');
  assert.equal(headers.get('x-beorchid-app'), 'core_dummy_web');
});

test('upstream credential errors do not expose response internals beyond a bounded message', async () => {
  const client = createCoreAdminClient(config, async () => new Response(
    JSON.stringify({ error: 'unauthorized' }),
    { status: 401 },
  ));

  await assert.rejects(
    () => client.createRole({ key: 'dummy_owner', name: 'Dummy Owner' }),
    (error: unknown) => error instanceof CoreAdminApiError && error.status === 401 && error.message === 'unauthorized',
  );
});
