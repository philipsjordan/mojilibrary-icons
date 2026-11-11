# Moji icons

An open-source icon set with one cohesive style. The free rounded outline set is MIT licensed.

> Beta. Browse, customise and copy the icons at [mojilibrary.com](https://mojilibrary.com). The set is still growing.

## Use the icons

- **Copy and paste:** open [mojilibrary.com](https://mojilibrary.com), pick an icon, and copy it as SVG, JSX, React, Vue, Svelte and more. Size, stroke width and colour can be set first.
- **Download the SVGs:** every icon is a plain file in [`icons/`](icons/): `icons/arrow-up.svg`, 24x24, 2px stroke, `currentColor`, so it takes the text colour of wherever you put it.
- **React and Vue packages:** `@mojilibrary/react` and `@mojilibrary/vue`, one component per icon, tree-shakeable (one icon in an app is under 1 KB). They publish to npm with the next icon release; until then they are built from this repository (see `packages/`).

```jsx
// React (when published)
import { ArrowUp } from '@mojilibrary/react';

<ArrowUp size={20} strokeWidth={2} title="Up" />
```

```html
<!-- Any HTML: the SVG inline takes the text colour -->
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
     stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <!-- paste the shapes from icons/arrow-up.svg -->
</svg>
```

Icon names are lower-case with dashes (`arrow-up`); the component name is the same in PascalCase (`ArrowUp`). The full list, with categories and search keywords, is in [`icons.json`](icons.json).

## Contents

- `icons/`: the free SVG icons (MIT)
- `icons.json`: the manifest of published icons
- `scripts/`: validation and build scripts
- `packages/`: the React and Vue packages (`@mojilibrary/react`, `@mojilibrary/vue`), generated from the icons. Not on npm yet: they publish with the next icon release

Paid style modules are not in this repository.

## Manifest

`icons.json` lists the icons that are published (reviewed and ready), with their display name, category, tags, aliases and keywords. The website builds from it, so an SVG that is not listed does not appear on the site. CI checks the manifest against the `icons/` folder (`node scripts/validate-manifest.mjs`).

Each icon has `added`, the version it first shipped in (a renamed icon keeps the version of its old name). The top-level `releases` map holds the date of every release that added icons, for example `{ "0.3.0": "2026-10-05" }`. The website shows a small "New" dot on the icons from the newest icon-adding release, for 30 days after its date; a release that adds no icons does not change that.

## Found a problem, or want an icon?

Open an issue and pick a template:

- **Icon issue**: something is wrong with an existing icon
- **Icon request**: ask for a new icon

## Versioning

One version for the whole library, following semver:

- Major: breaking changes (icon renamed or removed, grid or stroke spec change)
- Minor: new icons
- Patch: fixes

## Licence

MIT, see [LICENSE](LICENSE).
