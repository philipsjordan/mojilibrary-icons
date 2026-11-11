#!/usr/bin/env node
// Builds the React and Vue packages twice and fails if any file differs (ICN-159, "Package quality checklist" item 1).
// The same icons must always give byte-identical output: no timestamps, stable ordering.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const dists = ['packages/react/dist', 'packages/vue/dist'];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

/** One hash over every file's relative path and bytes, in sorted order. */
export function hashTree(dir) {
  const h = createHash('sha256');
  for (const file of walk(dir).sort()) {
    h.update(path.relative(dir, file));
    h.update('\0');
    h.update(fs.readFileSync(file));
    h.update('\0');
  }
  return h.digest('hex');
}

function build() {
  execFileSync('node', ['scripts/packages/build.mjs'], { cwd: root, stdio: 'ignore' });
  return dists.map((d) => hashTree(path.join(root, d)));
}

const first = build();
const second = build();
const bad = dists.filter((_, i) => first[i] !== second[i]);
if (bad.length) {
  console.error(`check-reproducible: building twice gave different output for: ${bad.join(', ')}`);
  process.exit(1);
}
console.log(`check-reproducible: two builds are byte-identical (${dists.join(', ')})`);
