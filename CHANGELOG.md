# Changelog

All notable changes to the icon set. One version for the whole library, following semver (see the README): major for breaking changes, minor for new icons, patch for fixes.

## 0.5.1 - 2026-11-09

**1000 icons (no change).** Fixes five icons from 0.5.0 that looked wrong on the website or in Figma.

### Fixed

- `opacity`, `palette`, `contrast`: they looked different on the website. The website draws every icon with round corners and a 2px outline on the whole SVG, and these three relied on defaults. The checker squares in `opacity` came out rounded, and the filled dots in `palette` and the filled half of `contrast` got a 2px outline and looked too big. The SVGs now say what they mean on their own, so they look the same everywhere.
- `anchor-handles`: the two handle lines now run into the centre square instead of stopping just short of it.
- `brightness`: one stripe in the right half of the core instead of two short stubs.

## 0.5.0 - 2026-11-08

**1000 icons (+50).** Design tools and image effects: boolean shapes, paths and anchors, easing curves, colour and paint, measuring, plus effects like blur and opacity.

### Added (50)

- Boolean: `union`, `subtract`, `intersect`, `exclude`, `flatten`
- Paths and anchors: `pen-path`, `node-select`, `vector`, `anchor-handles`, `anchor-add`, `anchor-remove`
- Easing: `ease-linear`, `ease-in`, `ease-out`, `ease-in-out`
- Effects: `gradient`, `contrast`, `opacity`, `blur`, `motion-blur`, `mask`
- Image adjustments: `brightness`, `saturation`, `hue`, `curves`
- Colour and paint: `color-swatch`, `palette`, `paint-bucket`, `paintbrush`, `paintbrush-sparkle`, `eye-dropper`
- Canvas and layout: `frame`, `frame-plus`, `zoom-fit`, `wireframe`, `pixel-grid`, `collage`, `theme`, `screen-cursor`
- Drawing and measuring: `set-square`, `compass`, `pencil-ruler`, `measure-horizontal`, `measure-vertical`, `angle`, `hatch`
- Selection and transform: `lasso`, `warp`
- Animation: `keyframe`, `keyframes`

### Changed

- Two new categories: `design` (40 icons) and `effects` (10 icons).

## 0.4.1 - 2026-10-22

**950 icons (no change).** Fixes the dashes on two icons.

### Fixed

- `status-backlog` and `cycle-upcoming`: the dashed outline exported with uneven, shifted dashes that did not match the design. The dashes are now drawn as six separate strokes, centred on the corners, exactly as in Figma.

## 0.4.0 - 2026-10-22

**950 icons (+32).** Wave 1: status and cycle hexagons, Wi-Fi/Bluetooth/battery states, alarm clocks, scan and sparkle, and a few dev icons.

### Added (32)

- Wi-Fi and Bluetooth: `wifi-off`, `wifi-low`, `wifi-medium`, `bluetooth-off`
- Battery: `battery-plus`, `battery-alert`
- Clocks: `alarm-clock-check`, `alarm-clock-snooze`, `alarm-clock-sparkle`
- Status (hexagon): `status-todo`, `status-backlog`, `status-in-progress`, `status-in-review`, `status-done`, `status-canceled`, `status-blocked`, `status-duplicate`, `status-pending`
- Cycles (hexagon): `cycle-upcoming`, `cycle-next`, `cycle-current`
- Dev: `issues`, `reviews`, `cloud-terminal`, `cloud-code`
- Scan and shapes: `scan-data`, `sparkle-large`
- Other: `calculator`, `edit-squircle`, `incognito`, `cctv`, `clipboard-type`

### Changed

- `tablet-1` and `tablet-2` are now in the `device` category (they were in `object`), next to `smartphone`.

## 0.3.1 - 2026-10-06

No icon changes.

### Changed

- `icons.json` now records when each icon first shipped (`added`) and the date of every icon-adding release (`releases`). The website uses this for a small "New" dot on newly added icons. A renamed icon keeps the version of its old name.

## 0.3.0 - 2026-10-05

New icons, a clearer naming scheme and a tidier set of categories. 918 icons, listed in `icons.json`.

### Added (6)

- `arrow-up-to-line`, `arrow-down-to-line`, `arrow-left-to-line`, `arrow-right-to-line`
- `dots-grid` (3x3 dots, the usual "apps" icon)
- `dot` (solid 6px disc)

### Renamed (32)

The container (circle or squircle) now comes right after the subject, and diagonals use words instead of `bl`, `br`, `tl`, `tr`. The old names still work: they are kept as search aliases in `icons.json`, so search and existing links keep finding the icons.

- `arrow-{up,down,left,right}-circle` and `-squircle` are now `arrow-circle-{up,down,left,right}` and `arrow-squircle-{up,down,left,right}`
- `arrow-{tl,tr,bl,br}-circle` and `-squircle` are now `arrow-circle-{up-left,up-right,down-left,down-right}` and `arrow-squircle-{...}`
- `chevron-{up,down,left,right}-circle` and `-squircle` are now `chevron-circle-{...}` and `chevron-squircle-{...}`
- `diamond-shape-arrow-{tl,tr,bl,br}` are now `diamond-shape-arrow-{up-left,up-right,down-left,down-right}`
- `rotate-{left,right}-squircle` and `rotate-{left,right}-squircle-2` are now `rotate-squircle-{left,right}` and `rotate-squircle-{left,right}-2`

### Changed

- Categories reworked (93 icons moved): `misc` is gone, its icons moved to better homes (device, commerce, object, arrow, action, feedback and others), and there is a new `shape` category. The five cloud-with-modifier icons that belong to cloud storage (`cloud-check`, `cloud-upload` and so on) moved from weather to `dev`; `sun` and `moon` are in weather; the `quill` icons are in action. 19 categories in total.

### Fixed

- `stack-small`: the left and right points of the diamond are sharp again, like `stack`, instead of rounded into a blob.

### Figma file

- Layers in all icon frames now use the Scale constraint, so resized instances scale cleanly. SVGs are unchanged by this.

## 0.2.0 - 2026-10-03

All icons redrawn on the V2 spec. This is a visible change to every icon (allowed before 1.0).

- Every icon was redrawn by hand: 20x20 live area (2px padding), 2.5 base corner radius, same 2px stroke with round caps and joins.
- 912 icons, listed in `icons.json`: 261 new and 651 replaced.
- Renamed: `chat-close` is now `chat-x`, `seo` is now `search-bar`.
- Strokes use `currentColor`, so icons follow the text colour.

## 0.1.0 - 2026-10-01

First release of the free icon set.

- 644 icons in `icons/`, listed in `icons.json` (name, display name, category, tags, aliases, keywords).
- MIT licensed, see LICENSE.
- The roooks.xyz website builds from this release.
