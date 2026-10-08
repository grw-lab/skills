# Reading each source

Read this when picking a source or when a source gives odd results.

## Live page (best)

Computed styles are what the browser actually paints: `var()` resolved, units in px, inheritance applied, dead CSS ignored.

1. Open the page. With browser automation, navigate to it; without, ask the user to paste the snippet into the devtools console.
2. Run `scripts/computed-styles.js`. It returns (and copies) CSS-like text, one rule per visible element, plus `:root` custom properties and `@media` conditions.
3. Save it as `computed-<page>.css`. Repeat for 3 to 5 page types; one page misses form, table, and error styles.
4. `node scripts/extract.mjs computed-*.css --out report.json --summary`

Notes:

- Computed sizes are in px. `draft.mjs` converts to rem with `--base` (default 16).
- Line heights come out in px (`24.65px` for 17px × 1.45). Divide by the font size to recover the unitless ratio before naming.
- Letter spacing comes out in px too. Divide by font size for em.
- Cross-origin stylesheets cannot be read for `@media` rules or custom properties. The snippet skips them silently.
- Hover, focus, and active states are not captured. Read them from the CSS files, or trigger them with automation before running the snippet.

## CSS files

`extract.mjs` reads plain CSS, including compiled Sass, Less, and Tailwind output.

- It includes unused CSS. Prefer values with higher counts, and confirm one-offs on the page.
- Values written as `var(--x)` count toward the custom property, and color custom properties add their reference count to the color.
- `font` shorthand is parsed for size, line height, and weight.
- `@font-face` blocks contribute font family names only.
- Minified files work. Source maps are not needed.
- Sass/Less source with variables (`$brand`, `@brand`) is not parsed; compile first or read the variables by hand.

## Tailwind

If the project already uses Tailwind, the config or `@theme` block is the declared system. Do not re-extract it. Instead:

- Read `tailwind.config.*` (v3) or the CSS `@theme` blocks (v4).
- Search templates for arbitrary values (`text-[13px]`, `bg-[#1d1d1f]`, `p-[18px]`). These are the off-system values to consolidate.
- Count which theme values are actually used before trimming.

## Figma

- Prefer exported variables (collections and modes) over layer styles. Variables carry names and aliases.
- If only a screenshot of the Figma file is available, treat it as a screenshot (estimates).
- Figma line heights are often in px or percent; convert to unitless.

## Screenshots (estimates only)

When there is no code:

- Sample flat areas for colors, not anti-aliased edges or gradients. JPEG compression shifts colors; prefer PNG.
- Estimate sizes against a known reference (a 16px body line, an icon at 24px).
- Round to a sensible scale (4px grid, common type steps).
- Mark the whole token file with `"_confidence": "estimated from screenshots"` and say so in the report.

## Mixed sources

When code and design disagree, report both and ask which is the source of truth. Do not average them.
