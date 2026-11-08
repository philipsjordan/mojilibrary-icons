// CommonJS twin of create-icon.js: the same code, written for require().
'use strict';
const { defineComponent, h } = require('vue');

function renderNode([tag, attrs, children]) {
  return h(tag, attrs, children ? children.map(renderNode) : undefined);
}

function createIcon(name, nodes) {
  return defineComponent({
    name,
    props: {
      size: { type: [Number, String], default: 24 },
      strokeWidth: { type: [Number, String], default: 2 },
      color: { type: String, default: 'currentColor' },
      title: { type: String, default: undefined },
    },
    setup(props, { attrs }) {
      return () => {
        const labelled = Boolean(props.title || attrs['aria-label'] || attrs['aria-labelledby']);
        return h(
          'svg',
          {
            xmlns: 'http://www.w3.org/2000/svg',
            width: props.size,
            height: props.size,
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: props.color,
            'stroke-width': props.strokeWidth,
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            role: labelled ? 'img' : undefined,
            'aria-hidden': labelled ? undefined : 'true',
          },
          [props.title ? h('title', props.title) : null, ...nodes.map(renderNode)],
        );
      };
    },
  });
}

module.exports = { createIcon };
