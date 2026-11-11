import test from 'node:test';
import assert from 'node:assert/strict';
import { publishable } from './prepare-publish.mjs';

const pkg = { name: '@mojilibrary/react', version: '0.0.0', private: true, license: 'MIT' };

test('the icons version is used and private is removed', () => {
  assert.deepEqual(publishable(pkg, '0.6.0'), { name: '@mojilibrary/react', version: '0.6.0', license: 'MIT' });
});

test('a matching release tag is accepted, a different one is refused', () => {
  assert.equal(publishable(pkg, '0.6.0', 'v0.6.0').version, '0.6.0');
  assert.throws(() => publishable(pkg, '0.6.0', 'v0.7.0'), /does not match/);
});

test('a version that is not x.y.z is refused', () => {
  assert.throws(() => publishable(pkg, '0.6', undefined), /not x.y.z/);
  assert.throws(() => publishable(pkg, '1.0.0-beta.1', undefined), /not x.y.z/);
});
