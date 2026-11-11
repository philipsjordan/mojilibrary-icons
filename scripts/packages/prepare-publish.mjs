#!/usr/bin/env node
// Prepares the packages for `npm publish` (ICN-159): the version is the icons version from icons.json, and `private`
// (kept in the repo so nothing is published by accident) is removed. Used by the publish workflow only.
// Usage: node scripts/packages/prepare-publish.mjs [--tag v0.6.0]   (with --tag the release tag must match icons.json)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SEMVER = /^\d+\.\d+\.\d+$/;

/** The package.json object ready to publish, or an error for a bad version or a tag that does not match. */
export function publishable(pkg, version, tag) {
  if (!SEMVER.test(version)) throw new Error(`icons.json version "${version}" is not x.y.z`);
  if (tag && tag !== `v${version}`) throw new Error(`release tag ${tag} does not match icons.json version ${version}`);
  const { private: _private, ...rest } = pkg;
  return { ...rest, version };
}

function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const tagIndex = process.argv.indexOf('--tag');
  const tag = tagIndex > -1 ? process.argv[tagIndex + 1] : undefined;
  const { version } = JSON.parse(fs.readFileSync(path.join(root, 'icons.json'), 'utf8'));
  for (const name of ['react', 'vue']) {
    const file = path.join(root, 'packages', name, 'package.json');
    const next = publishable(JSON.parse(fs.readFileSync(file, 'utf8')), version, tag);
    fs.writeFileSync(file, JSON.stringify(next, null, 2) + '\n');
    console.log(`prepare-publish: ${next.name}@${next.version}`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
