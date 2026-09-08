import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugify } from '../lib/slug.mjs';

test('basic words become hyphenated lowercase', () => {
  assert.equal(slugify('Hello World'), 'hello-world');
});

test('trims whitespace and strips accents and punctuation', () => {
  assert.equal(slugify('  Café au Lait!! '), 'caf-au-lait');
});

test('collapses and trims hyphens', () => {
  assert.equal(slugify('--a--b--'), 'a-b');
});

test('empty string returns empty string', () => {
  assert.equal(slugify(''), '');
});
