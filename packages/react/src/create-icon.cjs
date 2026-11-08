// CommonJS twin of create-icon.js: the same code, written for require().
'use strict';
const { createElement, forwardRef } = require('react');

function renderNode([tag, attrs, children], key) {
  return createElement(tag, { key, ...attrs }, ...(children ? children.map(renderNode) : []));
}

function createIcon(name, nodes) {
  const Icon = forwardRef(function Icon({ size = 24, strokeWidth = 2, color = 'currentColor', title, ...props }, ref) {
    const labelled = Boolean(title || props['aria-label'] || props['aria-labelledby']);
    return createElement(
      'svg',
      {
        ref,
        xmlns: 'http://www.w3.org/2000/svg',
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: color,
        strokeWidth,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        role: labelled ? 'img' : undefined,
        'aria-hidden': labelled ? undefined : 'true',
        ...props,
      },
      title ? createElement('title', { key: 'title' }, title) : null,
      ...nodes.map(renderNode),
    );
  });
  Icon.displayName = name;
  return Icon;
}

module.exports = { createIcon };
