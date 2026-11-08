// Component names from icon slugs (ICN-159). The same rule as the website's code tabs (src/lib/snippets.ts there).

/** "arrow-up" becomes "ArrowUp". A name that would start with a digit gets the prefix "Icon" ("4k-squircle" becomes "Icon4kSquircle"). */
export function componentName(slug) {
  const name = slug
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join('');
  if (!name) return 'Icon';
  return /^[0-9]/.test(name) ? `Icon${name}` : name;
}

/**
 * Every icon is exported as `Name` and as `NameIcon` (so `Map` can also be imported as `MapIcon` without shadowing the
 * JavaScript global). Returns the first clash between those names, or null.
 */
export function findNameClash(slugs) {
  const seen = new Map();
  for (const slug of slugs) {
    const name = componentName(slug);
    for (const exported of [name, `${name}Icon`]) {
      const other = seen.get(exported);
      if (other && other !== slug) return { exported, slugs: [other, slug] };
      seen.set(exported, slug);
    }
  }
  return null;
}
