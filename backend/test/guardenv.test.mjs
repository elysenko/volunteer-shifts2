import { test } from 'node:test';
import assert from 'node:assert/strict';

test('COLOSSUS_GUARD_TOKEN is present', () => {
  assert.equal(process.env.COLOSSUS_GUARD_TOKEN, 'present');
});
