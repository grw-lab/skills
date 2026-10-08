# Output formats

Read this when the user needs a specific format or a tool rejects the output.

## CSS custom properties (`tokens.css`)

```css
:root {
	--color-gray-900: #111827;
	--color-text: var(--color-gray-900);
	--text-base: 1rem;
	--text-base--line-height: 1.5;
	--spacing-4: 1rem;
}
```

- Semantic tokens reference primitives with `var()`, so changing a primitive updates every role that uses it.
- Custom properties cannot be used in `@media` conditions. Breakpoint tokens are documentation; use the raw values in media queries.
- `--prefix ds-` on `emit.mjs` gives `--ds-color-...` to avoid clashes.

## Tailwind v4 (`theme.css`)

Tailwind v4 is configured in CSS with `@theme`. Variables in its namespaces create utilities:

| Namespace | Utilities |
|---|---|
| `--color-*` | `bg-*`, `text-*`, `border-*`, `fill-*`, ... |
| `--font-*` | `font-*` (family) |
| `--font-weight-*` | `font-*` (weight) |
| `--text-*` (+ `--text-*--line-height`, `--letter-spacing`, `--font-weight`) | `text-*` (size) |
| `--spacing-*` | `p-*`, `m-*`, `gap-*`, `w-*`, ... |
| `--radius-*` | `rounded-*` |
| `--shadow-*` | `shadow-*` |
| `--breakpoint-*` | `sm:`, `md:`, ... variants |
| `--ease-*` | `ease-*` |
| `--tracking-*` | `tracking-*` (letter spacing) |
| `--leading-*` | `leading-*` (line height) |
| `--inset-shadow-*`, `--drop-shadow-*`, `--blur-*` | `inset-shadow-*`, `drop-shadow-*`, `blur-*` |
| `--container-*` | `@sm:` container variants, `max-w-*` |
| `--aspect-*`, `--perspective-*`, `--animate-*` | `aspect-*`, `perspective-*`, `animate-*` |

Notes:

- Aliases are resolved to raw values in `theme.css`, so it does not depend on other variables.
- Durations and z-index are not theme namespaces in v4; they are emitted in a separate `:root` block and used with arbitrary values such as `duration-(--duration-fast)` and `z-(--z-modal)`.
- Defining a name that Tailwind already has (for example `--color-white` or `--ease-out`) overrides the default. To drop all defaults in a namespace, add `--color-*: initial;` at the top of `@theme`.
- v4 can also derive spacing from one base value (`--spacing: 0.25rem`). Named `--spacing-*` steps work too and make the scale explicit.

## Tailwind v3 (`tailwind.config.js`)

Values go in `theme.extend` so Tailwind's defaults remain. Move a key out of `extend` to replace the defaults for that group. Font sizes with paired line height use the tuple form `['1rem', { lineHeight: '1.5' }]`. z-index values are strings.

## Design Tokens Community Group (`design.tokens.json`)

Tokens are objects with `$value` and `$type`; groups nest; aliases use `{group.token}`. A token without `$type` inherits it from the nearest parent group. The spec recommends the `.tokens` or `.tokens.json` extension and the media type `application/design-tokens+json`.

Default output follows the 2025.10 stable specification (Format and Color modules, Final Community Group Reports dated 28 October 2025; a W3C Community Group report, not a W3C Standard). Color values are objects with `colorSpace` and `components`, plus optional `alpha` (0 to 1, default 1) and an optional 6-digit `hex` fallback. Dimensions are `{ "value", "unit" }` with unit `px` or `rem`; durations use `ms` or `s`:

```json
{
	"color": { "ink": { "$type": "color", "$value": { "colorSpace": "srgb", "components": [0.11, 0.09, 0.14], "hex": "#1c1724" } } },
	"spacing": { "4": { "$type": "dimension", "$value": { "value": 1, "unit": "rem" } } },
	"duration": { "fast": { "$type": "duration", "$value": { "value": 150, "unit": "ms" } } }
}
```

`--dtcg legacy` writes the earlier draft style that many tools still read:

```json
{ "color": { "ink": { "$type": "color", "$value": "#1c1724" } } }
```

Caveats:

- Dimensions allow only `px` and `rem`. Values in `%`, `em`, or `vw` are skipped with a warning.
- Shadows are written as composite `shadow` tokens (`color`, `offsetX`, `offsetY`, `blur`, `spread`, optional `inset`); several layers become an array. Unparseable shadows are skipped with a warning.
- Easings are `cubicBezier` arrays. CSS keywords (`ease`, `ease-out`) are converted to their standard curves.
- Text sizes are written as a `fontSize` group of dimensions, and unitless line heights as a `lineHeight` group of numbers. Full `typography` composite tokens take `fontFamily`, `fontSize` (dimension), `fontWeight`, `letterSpacing` (dimension) and `lineHeight` (a number, read as a multiplier of the font size); build them by hand when the source has consistent text styles.
- Tool support for the stable spec is still rolling out. If a tool rejects the default output, try `--dtcg legacy`, and check the tool's docs for which version it supports.
