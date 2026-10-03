import test from 'node:test';
import assert from 'node:assert/strict';
import { isSameOrigin, isStrictSameOrigin } from '../src/lib/request';

test('same-origin requests are accepted', () => {
  assert.equal(isSameOrigin(new Request('http://localhost:3200/api/records', { headers: { origin: 'http://localhost:3200' } })), true);
  assert.equal(isSameOrigin(new Request('http://localhost:3200/api/records')), true);
});

test('cross-origin mutations are rejected', () => {
  assert.equal(isSameOrigin(new Request('http://localhost:3200/api/records', { headers: { origin: 'https://evil.example' } })), false);
});

test('same-origin mutations honor the trusted reverse-proxy host', () => {
  const request = new Request('http://container:3200/api/records', {
    headers: {
      origin: 'https://dummy.example',
      'x-forwarded-host': 'dummy.example',
      'x-forwarded-proto': 'https',
    },
  });
  assert.equal(isSameOrigin(request), true);
});

test('same-origin mutations reject an origin that differs from the proxy host', () => {
  const request = new Request('http://container:3200/api/records', {
    headers: {
      origin: 'https://evil.example',
      'x-forwarded-host': 'dummy.example',
      'x-forwarded-proto': 'https',
    },
  });
  assert.equal(isSameOrigin(request), false);
});

test('admin mutations require an explicit matching origin', () => {
  assert.equal(isStrictSameOrigin(new Request('https://dummy.example/api/admin/core/roles')), false);
  assert.equal(isStrictSameOrigin(new Request('https://dummy.example/api/admin/core/roles', { headers: { origin: 'https://dummy.example' } })), true);
  assert.equal(isStrictSameOrigin(new Request('https://dummy.example/api/admin/core/roles', { headers: { origin: 'https://evil.example' } })), false);
});

test('admin same-origin checks honor the trusted reverse-proxy host', () => {
  const request = new Request('http://container:3200/api/admin/core/roles', {
    headers: {
      origin: 'https://dummy.example',
      'x-forwarded-host': 'dummy.example',
      'x-forwarded-proto': 'https',
    },
  });
  assert.equal(isStrictSameOrigin(request), true);
});
