# Moji icons

An open-source icon set with one cohesive style. The free rounded outline set is MIT licensed.

> Beta. Browse, customise and copy the icons at [mojilibrary.com](https://mojilibrary.com). The set is still growing.

## Contents

- `icons/`: the free SVG icons (MIT)
- `icons.json`: the manifest of published icons
- `scripts/`: validation and build scripts
- `packages/`: the React and Vue packages (`@mojilibrary/react`, `@mojilibrary/vue`), generated from the icons. Work in progress: not published yet

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
