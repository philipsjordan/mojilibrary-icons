// The runtime shared by every icon of @mojilibrary/vue (Vue 3). Written by hand (the icon files are generated). Rules:
//  - attributes the caller passes fall through to the root <svg> only (Vue's default), and override the defaults
//  - `title` adds a <title> and role="img"; without a title or an aria-label the icon is decorative (aria-hidden)
import { defineComponent, h } from 'vue';

function renderNode([tag, attrs, children]) {
  return h(tag, attrs, children ? children.map(renderNode) : undefined);
}

export function createIcon(name, nodes) {
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
        // The <title> is added only when there is one: an empty slot would leave a comment node inside the svg.
        const children = nodes.map(renderNode);
        if (props.title) children.unshift(h('title', props.title));
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
          children,
        );
      };
    },
  });
}
