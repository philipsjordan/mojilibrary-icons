// Tree-shaking check (ICN-159): an app that imports a few icons must only contain those icons.
// Bundled with esbuild (dev dependency, test only), the way an app bundler would, with react and vue left external.
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';
import { writePackage } from './emit.mjs';
import { loadIcons } from './build.mjs';

const root = path.resolve(import.meta.dirname, '..', '..');
// Its own build folder (inside the repo, so react and vue resolve): test files run in parallel.
const out = path.join(root, '.test-out', 'treeshake');
// The layout of an installed package: package.json next to dist (its sideEffects flag is what lets bundlers drop unused icons).
const dist = (fw, ...p) => path.join(out, fw, 'dist', ...p);
const { icons } = loadIcons();
before(() => {
  for (const fw of ['react', 'vue']) {
    writePackage(fw, icons, path.join(root, 'packages', fw, 'src'), dist(fw));
    fs.copyFileSync(path.join(root, 'packages', fw, 'package.json'), path.join(out, fw, 'package.json'));
  }
});
after(() => fs.rmSync(out, { recursive: true, force: true }));

async function bundle(fw, code) {
  const result = await build({
    stdin: { contents: code, resolveDir: root, loader: 'js' },
    bundle: true,
    write: false,
    format: 'esm',
    minify: true,
    treeShaking: true,
    external: [fw === 'react' ? 'react' : 'vue'],
    logLevel: 'silent',
  });
  return result.outputFiles[0].text;
}

// A path segment that only one icon has: the first path of each icon.
const firstPath = (name) => fs.readFileSync(path.join(root, 'icons', `${name}.svg`), 'utf8').match(/ d="([^"]+)"/)[1].slice(0, 40);

for (const fw of ['react', 'vue']) {
  test(`${fw}: importing three icons from the package root bundles only those three`, async () => {
    const out = await bundle(fw, `import { ArrowUp, Union, Dot } from '${dist(fw, 'index.js')}'; console.log(ArrowUp, Union, Dot);`);
    for (const name of ['arrow-up', 'union']) assert.ok(out.includes(firstPath(name)), `${name} is in the bundle`);
    for (const other of ['folder-open', 'calendar', 'bell-1', 'chat-sparkle', 'status-todo']) {
      if (icons.some((i) => i.name === other)) assert.ok(!out.includes(firstPath(other)), `${other} must not be in the bundle`);
    }
    assert.ok(out.length < 6000, `bundle is small, got ${out.length} bytes`);
  });

  test(`${fw}: importing from a per-icon entry point bundles just that icon`, async () => {
    const out = await bundle(fw, `import Icon from '${dist(fw, 'icons/arrow-up.js')}'; console.log(Icon);`);
    assert.ok(out.includes(firstPath('arrow-up')));
    assert.ok(!out.includes(firstPath('union')));
    assert.ok(out.length < 3000, `got ${out.length} bytes`);
  });

  test(`${fw}: the whole set is not pulled in by one import (index is side-effect free)`, async () => {
    const out = await bundle(fw, `import { Union } from '${dist(fw, 'index.js')}'; console.log(Union);`);
    const full = await bundle(fw, `import * as all from '${dist(fw, 'index.js')}'; console.log(Object.keys(all).length);`);
    assert.ok(full.length > out.length * 50, `the full set (${full.length}) is far bigger than one icon (${out.length})`);
  });
}
