import test from 'node:test'; import assert from 'node:assert'; test('never', () => assert.fail('intentional always-failing guard'));
