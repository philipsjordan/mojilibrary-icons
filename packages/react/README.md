# @mojilibrary/react

Moji icons as React components. One cohesive outline style, tree-shakeable, accessible.

> Not published yet. The package name and the icon names are locked after v0.6.0.

```jsx
import { ArrowUp } from '@mojilibrary/react';

<ArrowUp size={20} strokeWidth={1.5} color="#d83f20" />
```

Import a single icon (smallest possible bundle):

```jsx
import ArrowUp from '@mojilibrary/react/icons/arrow-up';
```

## Props

| Prop | Default | |
| --- | --- | --- |
| `size` | `24` | Width and height in pixels. |
| `strokeWidth` | `2` | |
| `color` | `currentColor` | The icon takes the text colour unless you set one. |
| `title` | none | Adds an accessible name. Without a `title` or `aria-label` the icon is hidden from screen readers. |

Everything else (`className`, `style`, `onClick`, `data-*`, a `ref`) goes to the `<svg>` element.
Every icon is also exported as `NameIcon` (for example `MapIcon`), so a name like `Map` never shadows a JavaScript global.

Licence: MIT. Website: [mojilibrary.com](https://mojilibrary.com).
