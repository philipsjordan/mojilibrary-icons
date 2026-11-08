#!/usr/bin/env node
// Builds the React and Vue packages from icons/ and icons.json (ICN-159):
//   node scripts/packages/build.mjs            both packages
//   node scripts/packages/build.mjs react      one package
// Output goes to packages/<framework>/dist (not committed). Fails on an icon that is not listed, is not valid,
// or whose component name clashes with another. Sharp icons never come near this: it only reads icons/.
import fs from 'node:fs';
import path from 'node:path';
import { FRAMEWORKS, writePackage } from './emit.mjs';
import { findNameClash } from './naming.mjs';
import { parseIcon } from './svg.mjs';

const root = path.resolve(import.meta.dirname, '..', '..');

export function loadIcons(rootDir = root) {
  const manifest = JSON.parse(fs.readFileSync(path.join(rootDir, 'icons.json'), 'utf8'));
  const problems = [];
  const icons = [];
  for (const icon of manifest.icons) {
    try {
      icons.push({ name: icon.name, nodes: parseIcon(fs.readFileSync(path.join(rootDir, 'icons', icon.file), 'utf8')) });
    } catch (e) {
      problems.push(`${icon.name}: ${e.message}`);
    }
  }
  const clash = findNameClash(icons.map((i) => i.name));
  if (clash) problems.push(`component name ${clash.exported} is used by both ${clash.slugs.join(' and ')}`);
  return { version: manifest.version, icons, problems };
}

function main() {
  const wanted = process.argv.slice(2);
  const frameworks = wanted.length ? wanted : FRAMEWORKS;
  for (const f of frameworks) if (!FRAMEWORKS.includes(f)) throw new Error(`unknown package "${f}" (use ${FRAMEWORKS.join(' or ')})`);
  const { version, icons, problems } = loadIcons();
  if (problems.length) {
    console.error(`${problems.length} problem(s):\n- ${problems.slice(0, 20).join('\n- ')}`);
    process.exit(1);
  }
  for (const f of frameworks) {
    const pkgDir = path.join(root, 'packages', f);
    const count = writePackage(f, icons, path.join(pkgDir, 'src'), path.join(pkgDir, 'dist'));
    fs.copyFileSync(path.join(root, 'LICENSE'), path.join(pkgDir, 'LICENSE')); // npm ships the licence from the package folder
    console.log(`@mojilibrary/${f}: ${count} icons written to packages/${f}/dist (icons version ${version})`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === import.meta.filename) main();
