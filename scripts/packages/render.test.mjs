// Render tests with the real React and Vue (dev dependencies only), ICN-159.
// The packages are built from the real icons first, then imported like a user would (ES module and CommonJS).
import test, { before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { createSSRApp, h } from 'vue';
import { renderToString } from '@vue/server-renderer';
import { writePackage } from './emit.mjs';
import { loadIcons } from './build.mjs';
import { parseXml } from './svg.mjs';

const root = path.resolve(import.meta.dirname, '..', '..');
const require = createRequire(import.meta.url);
const dist = (fw, ...p) => path.join(root, 'packages', fw, 'dist', ...p);
const load = (fw, file) => import(pathToFileURL(dist(fw, file)).href);

const { icons, problems } = loadIcons();
before(() => {
  assert.deepEqual(problems, []);
  for (const fw of ['react', 'vue']) writePackage(fw, icons, path.join(root, 'packages', fw, 'src'), dist(fw));
});

const reactHtml = (Icon, props) => renderToStaticMarkup(createElement(Icon, props));
const vueHtml = (Icon, props, attrs = {}) => renderToString(createSSRApp({ render: () => h(Icon, { ...props, ...attrs }) }));
const count = (text, needle) => text.split(needle).length - 1;

/** The shapes of rendered markup as plain data, to compare with the source file. */
const shapes = (markup) => {
  const walk = (n) => ({ tag: n.tag, attrs: Object.fromEntries(n.attrs), children: n.children.filter((c) => c.tag !== 'title').map(walk) });
  return parseXml(markup.replace(/<!--.*?-->/g, '')).children.filter((c) => c.tag !== 'title').map(walk);
};
const sourceShapes = (name) => {
  const strip = (n) => ({ tag: n.tag, attrs: Object.fromEntries(n.attrs), children: n.children.map(strip) });
  return parseXml(fs.readFileSync(path.join(root, 'icons', `${name}.svg`), 'utf8')).children.map(strip);
};
// The source repeats the stroke settings on every shape; the packages put them on the root. Compare the geometry only.
const HOISTED = { stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
const dehoist = (list) =>
  list.map((n) => ({
    tag: n.tag,
    attrs: Object.fromEntries(Object.entries(n.attrs).filter(([k, v]) => HOISTED[k] !== v)),
    children: dehoist(n.children),
  }));

test('React: an icon renders with the defaults', async () => {
  const { ArrowUp, ArrowUpIcon } = await load('react', 'index.js');
  assert.equal(ArrowUp, ArrowUpIcon);
  const html = reactHtml(ArrowUp, {});
  assert.match(html, /^<svg /);
  for (const part of ['xmlns="http://www.w3.org/2000/svg"', 'width="24"', 'height="24"', 'viewBox="0 0 24 24"', 'fill="none"', 'stroke="currentColor"', 'stroke-width="2"', 'stroke-linecap="round"', 'stroke-linejoin="round"', 'aria-hidden="true"']) {
    assert.ok(html.includes(part), `should contain ${part}`);
  }
  assert.ok(!html.includes('role='), 'a decorative icon has no role');
  assert.ok(!html.includes('<title'));
});

test('React: props override the defaults and go to the root only', async () => {
  const { Union } = await load('react', 'index.js');
  const html = reactHtml(Union, { size: 40, strokeWidth: 1.5, color: '#d83f20', className: 'icon', 'data-id': '7', style: { opacity: 0.5 } });
  assert.ok(html.includes('width="40"') && html.includes('height="40"'));
  assert.ok(html.includes('stroke-width="1.5"') && html.includes('stroke="#d83f20"'));
  assert.equal(count(html, 'class="icon"'), 1, 'className only on the root');
  assert.equal(count(html, 'data-id="7"'), 1);
  assert.ok(html.startsWith('<svg ') && html.indexOf('class="icon"') < html.indexOf('>'), 'on the <svg> tag itself');
  assert.ok(html.includes('style="opacity:0.5"'));
});

test('React: a title or aria-label makes the icon an image', async () => {
  const { Dot } = await load('react', 'index.js');
  const titled = reactHtml(Dot, { title: 'Status' });
  assert.ok(titled.includes('<title>Status</title>') && titled.includes('role="img"') && !titled.includes('aria-hidden'));
  const labelled = reactHtml(Dot, { 'aria-label': 'Status' });
  assert.ok(labelled.includes('role="img"') && !labelled.includes('aria-hidden'));
  assert.ok(reactHtml(Dot, { 'aria-hidden': 'false' }).includes('aria-hidden="false"'), 'callers can override');
});

test('React: every icon renders exactly its source shapes', () => {
  // One pass over the 1000 icons through the per-icon ES modules.
  return Promise.all(icons.map(async ({ name }) => {
    const mod = await load('react', `icons/${name}.js`);
    const Icon = mod.default;
    assert.equal(typeof Icon, 'object', `${name} is a component`);
    assert.deepEqual(dehoist(shapes(reactHtml(Icon, {}))), dehoist(sourceShapes(name)), name);
  }));
});

test('React: the CommonJS build works and matches the ES module build', async () => {
  const cjs = require(dist('react', 'index.cjs'));
  const esm = await load('react', 'index.js');
  assert.equal(typeof cjs.ArrowUp, 'object');
  assert.equal(reactHtml(cjs.ArrowUp, {}), reactHtml(esm.ArrowUp, {}));
  const single = require(dist('react', 'icons/arrow-up.cjs'));
  assert.equal(reactHtml(single, {}), reactHtml(esm.ArrowUp, {}), 'the CommonJS per-icon module is the component');
  assert.equal(reactHtml(single.ArrowUp, {}), reactHtml(esm.ArrowUp, {}));
  assert.equal(reactHtml(single.ArrowUpIcon, {}), reactHtml(esm.ArrowUp, {}));
  assert.equal(esm.ArrowUp.displayName, 'ArrowUp');
});

test('React: the component names a user types exist, including digit prefixes and the NameIcon aliases', async () => {
  const mod = await load('react', 'index.js');
  for (const name of ['AlarmClock1', 'Icon4kSquircle', 'MapIcon', 'Map', 'Frame', 'Union']) {
    if (name === 'Icon4kSquircle' && !icons.some((i) => i.name === '4k-squircle')) continue; // not shipped yet
    assert.ok(mod[name], `${name} is exported`);
  }
  assert.equal(Object.keys(mod).length, icons.length * 2, 'every icon twice: Name and NameIcon');
});

test('Vue: an icon renders with the defaults', async () => {
  const { ArrowUp, ArrowUpIcon } = await load('vue', 'index.js');
  assert.equal(ArrowUp, ArrowUpIcon);
  const html = await vueHtml(ArrowUp, {});
  assert.match(html, /^<svg /);
  for (const part of ['xmlns="http://www.w3.org/2000/svg"', 'width="24"', 'height="24"', 'viewBox="0 0 24 24"', 'fill="none"', 'stroke="currentColor"', 'stroke-width="2"', 'stroke-linecap="round"', 'stroke-linejoin="round"', 'aria-hidden="true"']) {
    assert.ok(html.includes(part), `should contain ${part}`);
  }
  assert.ok(!html.includes('role=') && !html.includes('<title'));
  assert.ok(!html.includes('<!--'), 'no empty comment nodes inside the svg');
});

test('Vue: props override the defaults, attributes fall through to the root only', async () => {
  const { Union } = await load('vue', 'index.js');
  const html = await vueHtml(Union, { size: 40, strokeWidth: 1.5, color: '#d83f20' }, { class: 'icon', 'data-id': '7' });
  assert.ok(html.includes('width="40"') && html.includes('height="40"'));
  assert.ok(html.includes('stroke-width="1.5"') && html.includes('stroke="#d83f20"'));
  assert.equal(count(html, 'class="icon"'), 1);
  assert.equal(count(html, 'data-id="7"'), 1);
  assert.ok(html.indexOf('class="icon"') < html.indexOf('>'), 'on the <svg> tag itself');
});

test('Vue: a title or aria-label makes the icon an image', async () => {
  const { Dot } = await load('vue', 'index.js');
  const titled = await vueHtml(Dot, { title: 'Status' });
  assert.ok(titled.includes('<title>Status</title>') && titled.includes('role="img"') && !titled.includes('aria-hidden'));
  const labelled = await vueHtml(Dot, {}, { 'aria-label': 'Status' });
  assert.ok(labelled.includes('role="img"') && !labelled.includes('aria-hidden'));
});

test('Vue: every icon renders exactly its source shapes', async () => {
  for (const { name } of icons) {
    const Icon = (await load('vue', `icons/${name}.js`)).default;
    assert.deepEqual(dehoist(shapes(await vueHtml(Icon, {}))), dehoist(sourceShapes(name)), name);
  }
});

test('Vue: the CommonJS build works and matches the ES module build', async () => {
  const cjs = require(dist('vue', 'index.cjs'));
  const esm = await load('vue', 'index.js');
  assert.equal(await vueHtml(cjs.ArrowUp, {}), await vueHtml(esm.ArrowUp, {}));
  const single = require(dist('vue', 'icons/arrow-up.cjs'));
  assert.equal(await vueHtml(single, {}), await vueHtml(esm.ArrowUp, {}));
  assert.equal(esm.ArrowUp.name, 'ArrowUp');
  assert.equal(Object.keys(esm).length, icons.length * 2);
});

test('the built package folders contain what npm should ship', () => {
  for (const fw of ['react', 'vue']) {
    const files = fs.readdirSync(dist(fw));
    for (const f of ['index.js', 'index.cjs', 'index.d.ts', 'types.d.ts', 'create-icon.js', 'create-icon.cjs', 'icons']) assert.ok(files.includes(f), `${fw}/dist/${f}`);
    assert.equal(fs.readdirSync(dist(fw, 'icons')).length, icons.length * 3, 'a module, a CommonJS module and types per icon');
  }
});
