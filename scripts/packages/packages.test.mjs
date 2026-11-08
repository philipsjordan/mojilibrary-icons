// Tests for the package generator (ICN-159). Dependency free: node --test scripts/packages/
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { attrName, iconModule, iconTypes, indexModule, writePackage } from './emit.mjs';
import { loadIcons } from './build.mjs';
import { componentName, findNameClash } from './naming.mjs';
import { parseIcon, parseXml } from './svg.mjs';

const root = path.resolve(import.meta.dirname, '..', '..');
const HEAD = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">';
const svg = (inner) => `${HEAD}\n${inner}\n</svg>\n`;
const STROKE = 'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

// ---- reading icons ----

test('an icon is read into its shapes, and the stroke settings every icon shares are dropped', () => {
  const nodes = parseIcon(svg(`<path d="M1 1L2 2" ${STROKE}/>\n<circle cx="12" cy="12" r="2" fill="currentColor" ${STROKE}/>`));
  assert.deepEqual(nodes.map((n) => n.tag), ['path', 'circle']);
  assert.deepEqual(nodes[0].attrs, [['d', 'M1 1L2 2']]);
  assert.deepEqual(nodes[1].attrs, [['cx', '12'], ['cy', '12'], ['r', '2'], ['fill', 'currentColor']]);
});

test('a stroke setting that differs from the shared one is kept (a thin dot, a custom cap)', () => {
  const nodes = parseIcon(svg(`<path d="M1 1" stroke="currentColor" stroke-width="1" stroke-linecap="butt" stroke-linejoin="round"/>`));
  assert.deepEqual(nodes[0].attrs, [['d', 'M1 1'], ['stroke-width', '1'], ['stroke-linecap', 'butt']]);
});

test('nested groups and entities are read', () => {
  const nodes = parseIcon(svg(`<g opacity="0.5"><path d="M1 1"/><path d="M2 2"/></g>`));
  assert.equal(nodes[0].tag, 'g');
  assert.equal(nodes[0].children.length, 2);
  assert.equal(parseXml('<a x="1 &amp; 2 &lt;"/>').attrs[0][1], '1 & 2 <');
});

test('anything an icon must not contain stops the build', () => {
  const bad = {
    script: svg('<script>alert(1)</script>'),
    'event handler': svg('<path d="M1 1" onload="alert(1)"/>'),
    style: svg('<path d="M1 1" style="fill:red"/>'),
    'unknown element': svg('<foreignObject/>'),
    image: svg('<image href="x.png"/>'),
    doctype: `<!DOCTYPE svg>\n${svg('<path d="M1 1"/>')}`,
    entity: `<!ENTITY x "y">\n${svg('<path d="M1 1"/>')}`,
    'wrong size': svg('<path d="M1 1"/>').replace('width="24"', 'width="32"'),
    'extra root attribute': svg('<path d="M1 1"/>').replace('<svg ', '<svg class="x" '),
    'not closed': `${HEAD}<path d="M1 1"/>`,
    'mismatched tags': svg('<g><path d="M1 1"/></path>'),
    'duplicate attribute': svg('<path d="M1 1" d="M2 2"/>'),
    'two roots': svg('<path d="M1 1"/>') + svg('<path d="M1 1"/>'),
    'no shapes': svg(''),
    'text content': svg('<g>hello</g>'),
  };
  for (const [what, source] of Object.entries(bad)) assert.throws(() => parseIcon(source), `${what} should be refused`);
});

// ---- names ----

test('component names', () => {
  assert.equal(componentName('arrow-up'), 'ArrowUp');
  assert.equal(componentName('alarm-clock-1'), 'AlarmClock1');
  assert.equal(componentName('4k-squircle'), 'Icon4kSquircle');
  assert.equal(componentName('map'), 'Map');
});

test('a clash between exported names is found', () => {
  assert.equal(findNameClash(['arrow-up', 'arrow-down']), null);
  assert.deepEqual(findNameClash(['map', 'map-icon']), { exported: 'MapIcon', slugs: ['map', 'map-icon'] });
});

// ---- generated files ----

const sample = [
  { tag: 'path', attrs: [['d', 'M1 1L2 2'], ['stroke-width', '1']], children: [] },
  { tag: 'g', attrs: [['fill-rule', 'evenodd']], children: [{ tag: 'circle', attrs: [['cx', '12']], children: [] }] },
];

test('attribute names: React camelCase, Vue as written, data and aria untouched', () => {
  assert.equal(attrName('react', 'stroke-width'), 'strokeWidth');
  assert.equal(attrName('react', 'fill-rule'), 'fillRule');
  assert.equal(attrName('react', 'aria-hidden'), 'aria-hidden');
  assert.equal(attrName('vue', 'stroke-width'), 'stroke-width');
});

test('an icon module lists its shapes, exports the name, NameIcon and a default', () => {
  const react = iconModule('react', 'esm', 'arrow-up', sample);
  assert.ok(react.includes("import { createIcon } from '../create-icon.js';"));
  assert.ok(react.includes("export const ArrowUp = createIcon('ArrowUp', ["));
  assert.ok(react.includes("['path', { d: \"M1 1L2 2\", strokeWidth: \"1\" }]"));
  assert.ok(react.includes("['g', { fillRule: \"evenodd\" }, ["), 'children are nested');
  assert.ok(react.includes('export { ArrowUp as ArrowUpIcon };') && react.includes('export default ArrowUp;'));
  const vue = iconModule('vue', 'esm', 'arrow-up', sample);
  assert.ok(vue.includes('"stroke-width": "1"') && vue.includes('"fill-rule": "evenodd"'));
  const cjs = iconModule('react', 'cjs', 'arrow-up', sample);
  assert.ok(cjs.includes("require('../create-icon.cjs')") && cjs.includes('module.exports.ArrowUpIcon = ArrowUp;'));
  assert.ok(iconTypes('arrow-up').includes('export declare const ArrowUp: Icon;'));
  assert.ok(indexModule('esm', ['a', 'b']).includes("export { A, AIcon } from './icons/a.js';"));
});

test('generated modules are valid JavaScript (ES module and CommonJS)', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'moji-pkg-'));
  try {
    for (const framework of ['react', 'vue']) {
      fs.writeFileSync(path.join(dir, `${framework}.mjs`), iconModule(framework, 'esm', 'arrow-up', sample));
      fs.writeFileSync(path.join(dir, `${framework}.cjs`), iconModule(framework, 'cjs', 'arrow-up', sample));
      fs.writeFileSync(path.join(dir, `${framework}-index.mjs`), indexModule('esm', ['a', 'b']));
      fs.writeFileSync(path.join(dir, `${framework}-index.cjs`), indexModule('cjs', ['a', 'b']));
    }
    for (const file of fs.readdirSync(dir)) execFileSync(process.execPath, ['--check', path.join(dir, file)]);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('output is deterministic and the icon order does not matter', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'moji-pkg-'));
  try {
    const icons = [{ name: 'b-icon', nodes: sample }, { name: 'a-icon', nodes: sample }];
    const read = (d) => fs.readdirSync(d, { recursive: true }).sort().map((f) => [f, fs.statSync(path.join(d, f)).isFile() ? fs.readFileSync(path.join(d, f), 'utf8') : '']);
    writePackage('react', icons, path.join(root, 'packages/react/src'), path.join(dir, 'one'));
    writePackage('react', [...icons].reverse(), path.join(root, 'packages/react/src'), path.join(dir, 'two'));
    assert.deepEqual(read(path.join(dir, 'one')), read(path.join(dir, 'two')));
    const files = read(path.join(dir, 'one')).map(([f]) => f);
    for (const f of ['index.js', 'index.cjs', 'index.d.ts', 'types.d.ts', 'create-icon.js', 'create-icon.cjs', 'icons/a-icon.js', 'icons/a-icon.cjs', 'icons/a-icon.d.ts']) {
      assert.ok(files.includes(f), `${f} is written`);
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// ---- every real icon ----

test('every icon in the manifest can be built, with no name clashes', () => {
  const { icons, problems } = loadIcons();
  assert.deepEqual(problems, []);
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'icons.json'), 'utf8'));
  assert.equal(icons.length, manifest.icons.length);
  assert.ok(icons.every((i) => !/-sharp$/.test(i.name)), 'no Sharp icon is in the free packages');
});

// ---- the hand-written runtime, run against a stand-in for React and Vue ----

function loadRuntime(file, fakeModule) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const module = { exports: {} };
  const requireStub = (name) => {
    assert.ok(name in fakeModule, `unexpected require(${name})`);
    return fakeModule[name];
  };
  vm.runInNewContext(source, { module, exports: module.exports, require: requireStub, Boolean }, { filename: file });
  return module.exports;
}

const fakeReact = {
  react: {
    createElement: (type, props, ...children) => ({ type, props: props ?? {}, children: children.flat() }),
    forwardRef: (render) => (props, ref) => render(props ?? {}, ref),
  },
};

test('React runtime: defaults, overrides, title, accessibility, props on the root only', () => {
  const { createIcon } = loadRuntime('packages/react/src/create-icon.cjs', fakeReact);
  const Icon = createIcon('Union', [['path', { d: 'M1 1' }], ['g', { opacity: '0.5' }, [['circle', { cx: '12' }]]]]);
  const plain = Icon({});
  assert.equal(plain.type, 'svg');
  assert.deepEqual(
    { w: plain.props.width, h: plain.props.height, stroke: plain.props.stroke, sw: plain.props.strokeWidth, cap: plain.props.strokeLinecap, vb: plain.props.viewBox },
    { w: 24, h: 24, stroke: 'currentColor', sw: 2, cap: 'round', vb: '0 0 24 24' },
  );
  assert.equal(plain.props['aria-hidden'], 'true');
  assert.equal(plain.props.role, undefined);
  assert.deepEqual([...plain.children.filter(Boolean).map((c) => c.type)], ['path', 'g']);
  assert.equal(plain.children.filter(Boolean)[1].children[0].type, 'circle', 'groups nest');

  const custom = Icon({ size: 32, strokeWidth: 1.5, color: '#d83f20', className: 'x', onClick: 'fn', 'data-id': '7' });
  assert.equal(custom.props.width, 32);
  assert.equal(custom.props.stroke, '#d83f20');
  assert.equal(custom.props.className, 'x');
  assert.equal(custom.props.onClick, 'fn');
  assert.equal(custom.props['data-id'], '7');
  for (const child of custom.children.filter(Boolean)) {
    assert.equal(child.props.className, undefined, 'props never reach the shapes');
    assert.equal(child.props.onClick, undefined);
  }

  const titled = Icon({ title: 'Union' });
  assert.equal(titled.props.role, 'img');
  assert.equal(titled.props['aria-hidden'], undefined);
  assert.equal(titled.children[0].type, 'title');
  assert.equal(titled.children[0].children[0], 'Union');
  assert.equal(Icon({ 'aria-label': 'x' }).props['aria-hidden'], undefined, 'an aria-label makes it an image too');
  assert.equal(Icon({ 'aria-hidden': 'false', role: 'presentation' }).props.role, 'presentation', 'callers can override the aria attributes');
  assert.equal(Icon.displayName ?? createIcon('X', []).displayName, 'Union');
});

const fakeVue = {
  vue: {
    defineComponent: (options) => options,
    h: (type, props, children) => ({ type, props: props ?? {}, children: Array.isArray(children) ? children.filter(Boolean) : children }),
  },
};

test('Vue runtime: defaults, title, accessibility, shapes inside the root', () => {
  const { createIcon } = loadRuntime('packages/vue/src/create-icon.cjs', fakeVue);
  const Icon = createIcon('Union', [['path', { d: 'M1 1' }], ['g', { opacity: '0.5' }, [['circle', { cx: '12' }]]]]);
  assert.equal(Icon.name, 'Union');
  assert.deepEqual([...Object.keys(Icon.props)].sort(), ['color', 'size', 'strokeWidth', 'title']);
  const render = (props = {}, attrs = {}) => Icon.setup({ size: 24, strokeWidth: 2, color: 'currentColor', title: undefined, ...props }, { attrs })();
  const plain = render();
  assert.equal(plain.type, 'svg');
  assert.equal(plain.props['stroke-width'], 2);
  assert.equal(plain.props['stroke-linecap'], 'round');
  assert.equal(plain.props['aria-hidden'], 'true');
  assert.deepEqual([...plain.children.map((c) => c.type)], ['path', 'g']); // spread: the list comes from another JavaScript context
  assert.equal(plain.children[1].children[0].type, 'circle');
  const titled = render({ title: 'Union' });
  assert.equal(titled.props.role, 'img');
  assert.equal(titled.props['aria-hidden'], undefined);
  assert.equal(titled.children[0].type, 'title');
  assert.equal(render({}, { 'aria-label': 'x' }).props['aria-hidden'], undefined);
  assert.equal(render({ size: 32, color: '#000' }).props.width, 32);
});

test('the ES module and CommonJS runtimes contain the same code', () => {
  const body = (file) =>
    fs
      .readFileSync(path.join(root, file), 'utf8')
      .split('\n')
      .filter((l) => !/^\s*\/\//.test(l) && !/^(import |const \{ .* \} = require|module\.exports|'use strict')/.test(l))
      .join('\n')
      .replace('export function createIcon', 'function createIcon')
      .trim();
  for (const fw of ['react', 'vue']) {
    assert.equal(body(`packages/${fw}/src/create-icon.js`), body(`packages/${fw}/src/create-icon.cjs`), `${fw} runtimes differ`);
  }
});

// ---- the package manifests ----

test('package manifests: private until the first publish, locked name, light and tree-shakeable', () => {
  for (const fw of ['react', 'vue']) {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'packages', fw, 'package.json'), 'utf8'));
    assert.equal(pkg.name, `@mojilibrary/${fw}`);
    assert.equal(pkg.private, true, 'private stays true until the publish step removes it (after the slug lock)');
    assert.equal(pkg.license, 'MIT');
    assert.equal(pkg.sideEffects, false);
    assert.deepEqual(pkg.files, ['dist', 'README.md', 'LICENSE']);
    assert.deepEqual(Object.keys(pkg.exports['.']), ['types', 'import', 'require']);
    assert.ok(pkg.exports['./icons/*'].import.endsWith('/*.js'));
    assert.deepEqual(Object.keys(pkg.peerDependencies), [fw]);
    assert.equal(pkg.dependencies, undefined, 'no runtime dependencies');
  }
});
