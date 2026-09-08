import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugify } from '../lib/slug.mjs';

test('Hello World becomes hello-world', () => {
  assert.equal(slugify('Hello World'), 'hello-world');
});

test('  Café au Lait!!  becomes caf-au-lait', () => {
  assert.equal(slugify('  Café au Lait!! '), 'caf-au-lait');
});

test('--a--b-- becomes a-b', () => {
  assert.equal(slugify('--a--b--'), 'a-b');
});

test('empty string becomes empty string', () => {
  assert.equal(slugify(''), '');
});
