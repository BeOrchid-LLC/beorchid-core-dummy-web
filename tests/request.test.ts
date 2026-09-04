import test from 'node:test';
import assert from 'node:assert/strict';
import { isSameOrigin } from '../src/lib/request';

test('same-origin requests are accepted', () => {
  assert.equal(isSameOrigin(new Request('http://localhost:3200/api/records', { headers: { origin: 'http://localhost:3200' } })), true);
  assert.equal(isSameOrigin(new Request('http://localhost:3200/api/records')), true);
});

test('cross-origin mutations are rejected', () => {
  assert.equal(isSameOrigin(new Request('http://localhost:3200/api/records', { headers: { origin: 'https://evil.example' } })), false);
});
