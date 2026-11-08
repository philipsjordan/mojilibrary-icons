// Reads an icon SVG into a small node tree, and refuses anything an icon must not contain (ICN-159).
// The icon files are flat, generated and checked by xmllint in CI, so this is a small purpose-built reader,
// not a general XML parser: no entities beyond the five XML ones, no doctype, no namespaces, no scripts.

/** The elements and attributes an icon may use. Anything else stops the build, so nothing unexpected is shipped. */
export const ELEMENTS = new Set(['path', 'circle', 'rect', 'ellipse', 'line', 'polyline', 'polygon', 'g']);
export const ATTRIBUTES = new Set([
  'd', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'width', 'height', 'points', 'transform',
  'fill', 'fill-rule', 'fill-opacity', 'clip-rule', 'opacity',
  'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray', 'stroke-dashoffset',
  'stroke-miterlimit', 'stroke-opacity',
]);

/** The stroke settings that live on the root <svg> in the packages (and on the website), so icons do not repeat them. */
const HOISTED = [
  ['stroke', 'currentColor'],
  ['stroke-width', '2'],
  ['stroke-linecap', 'round'],
  ['stroke-linejoin', 'round'],
];

const ROOT_EXPECTED = { width: '24', height: '24', viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' };

const ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'" };
const decode = (s) => s.replace(/&(amp|lt|gt|quot|apos);/g, (m) => ENTITIES[m]);

/** Parses markup into `{ tag, attrs: [[name, value]], children }`. Throws on anything unexpected. */
export function parseXml(source) {
  if (/<!DOCTYPE|<!ENTITY|<\?(?!xml )|<!\[CDATA\[/i.test(source)) throw new Error('doctype, entity, processing instruction or CDATA found');
  const text = source.replace(/<\?xml[^?]*\?>/, '').replace(/<!--[\s\S]*?-->/g, '');
  const stack = [];
  let root = null;
  const tagRe = /<(\/?)([A-Za-z][\w:-]*)((?:\s+[\w:-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>/g;
  let pos = 0;
  for (let m; (m = tagRe.exec(text)); ) {
    if (text.slice(pos, m.index).trim()) throw new Error(`unexpected text "${text.slice(pos, m.index).trim().slice(0, 20)}"`);
    pos = tagRe.lastIndex;
    const [, closing, tag, rawAttrs, selfClosing] = m;
    if (closing) {
      const open = stack.pop();
      if (!open || open.tag !== tag) throw new Error(`</${tag}> does not match`);
      continue;
    }
    const attrs = [];
    for (const a of rawAttrs.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
      if (attrs.some(([n]) => n === a[1])) throw new Error(`${tag}: duplicate attribute ${a[1]}`);
      attrs.push([a[1], decode(a[2] ?? a[3])]);
    }
    const node = { tag, attrs, children: [] };
    if (stack.length) stack[stack.length - 1].children.push(node);
    else if (root) throw new Error('more than one root element');
    else root = node;
    if (!selfClosing) stack.push(node);
  }
  if (text.slice(pos).trim()) throw new Error('unexpected text after the last tag');
  if (stack.length) throw new Error(`<${stack[stack.length - 1].tag}> is not closed`);
  if (!root) throw new Error('no element found');
  return root;
}

function clean(node) {
  if (!ELEMENTS.has(node.tag)) throw new Error(`element <${node.tag}> is not allowed in an icon`);
  const attrs = node.attrs.filter(([name, value]) => !HOISTED.some(([n, v]) => n === name && v === value));
  for (const [name] of attrs) if (!ATTRIBUTES.has(name)) throw new Error(`<${node.tag}> attribute "${name}" is not allowed in an icon`);
  return { tag: node.tag, attrs, children: node.children.map(clean) };
}

/** An icon file as the list of its children (the shapes), with the root settings checked and the shared stroke attributes removed. */
export function parseIcon(source) {
  const root = parseXml(source);
  if (root.tag !== 'svg') throw new Error(`the root element is <${root.tag}>, not <svg>`);
  for (const [name, expected] of Object.entries(ROOT_EXPECTED)) {
    const found = root.attrs.find(([n]) => n === name)?.[1];
    if (found !== expected) throw new Error(`root ${name} is "${found}", expected "${expected}"`);
  }
  for (const [name] of root.attrs) if (!(name in ROOT_EXPECTED)) throw new Error(`root attribute "${name}" is not expected`);
  if (!root.children.length) throw new Error('the icon has no shapes');
  return root.children.map(clean);
}
