// The runtime shared by every icon of @mojilibrary/react: one small function that turns an icon's shapes into a
// component. Written by hand (the icon files are generated). Rules:
//  - extra props go to the root <svg> only, never to the shapes; they are spread last, so they override size, colour, aria
//  - `title` adds a <title> and role="img"; without a title or an aria-label the icon is decorative (aria-hidden)
import { createElement, forwardRef } from 'react';

function renderNode([tag, attrs, children], key) {
  return createElement(tag, { key, ...attrs }, ...(children ? children.map(renderNode) : []));
}

export function createIcon(name, nodes) {
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
