---
name: design-tokens-extractor
description: Extracts a design system from an existing website, CSS files, Tailwind config, Figma export, or screenshots into design tokens (colors with roles, type scale, spacing, radii, shadows, breakpoints, motion, z-index). Clusters near-duplicate colors in OKLCH, checks WCAG contrast, and emits CSS custom properties, a Tailwind v4 @theme block, a Tailwind v3 config, and Design Tokens Community Group JSON. Use when asked to pull tokens or a style guide from a site, audit inconsistent CSS, build a theme from an existing design, or migrate styles to Tailwind or a token file.
---

# Design tokens extractor

Turn what a design already uses into a small, named token set. Measure first, then name, then emit.

## When to use

- "Extract the design tokens from this site / these CSS files."
- "What colors and font sizes does this project actually use?"
- "Make a Tailwind theme that matches our current site."
- "Our CSS has 40 grays. Consolidate them."
- "Turn this screenshot into a starter palette and type scale."

## When not to use

- Designing a new system from scratch with no source. Extraction needs something to measure.
- Converting tokens between formats when they already exist as a clean token file. Use a token build tool for that, or run only `scripts/emit.mjs`.

## Workflow

### 1. Pick the source, best first

| Source | How | Confidence |
|---|---|---|
| Live page, browser automation available | Run `scripts/computed-styles.js` in the page (devtools console, or `page.evaluate` in Playwright/Puppeteer). Do it on 3 to 5 page types (home, article, form, pricing). | Measured. Shows what actually renders. |
| CSS files or compiled build output | `node scripts/extract.mjs path/*.css --out report.json --summary` | Measured, but includes dead CSS. |
| Tailwind config / existing token file | Read it directly. It is already the system; only audit usage. | Declared. |
| Figma export (variables JSON, styles) | Read the exported values. Prefer variables over raw layer styles. | Declared. |
| Screenshot only | Sample colors and estimate sizes visually. | **Estimate.** Label every value as estimated. |

Never mix measured and estimated values without saying which is which. See `references/sources.md` for each source in detail.

### 2. Extract

```bash
node scripts/extract.mjs styles.css components.css --out report.json --summary
```

The report counts every color, font family, size, weight, line height, letter spacing, spacing value, radius, shadow, breakpoint, duration, easing, and z-index, plus custom properties and how often each is referenced. Values used through `var()` count toward the color they hold.

### 3. Cluster colors and check contrast

```bash
node scripts/colors.mjs report.json --bg "#ffffff,#0b0b0f"
node scripts/colors.mjs --pairs "#6b7280:#ffffff,#9ca3af:#111827"
```

- Colors within ΔE_OK ≤ 2.5 (OKLab distance × 100) merge into the most used one. About 2 is barely visible. Raise to 4 or 5 for messy sites; lower to 1 to keep subtle tints apart.
- Translucent colors stay separate from solid ones.
- Contrast uses WCAG 2.x: 4.5:1 for normal text (AA), 3:1 for large text (24px, or 18.66px bold) and UI components, 7:1 for AAA. Translucent colors are composited over the background first.

### 4. Draft the token file

```bash
node scripts/draft.mjs report.json --out tokens.json
```

This writes a starter file with draft names. It keeps existing custom property names (`--ink` stays `ink`), names fonts `sans` / `serif` / `mono` (or by their custom property), builds a type scale around the body size, puts spacing on a 4px grid, and lists anything off-grid in `_offScale`. Keys starting with `_` are notes.

### 5. Review and name (this is the real work)

Edit `tokens.json`. Read `references/naming.md` first. In short:

1. **Primitives** (`color`): what the value is. `gray-200`, `indigo-600`, `lime-300`. Keep the set small.
2. **Semantic** (`semantic`): what it is for. Point at primitives with aliases: `"text": "{color.gray-900}"`. Cover at least `bg`, `surface`, `text`, `muted`, `border`, `accent`, and states (`accent-hover`, `danger`, `success`, `warning`, `focus`) that the source uses.
3. **Consolidate**: snap off-grid spacing to the nearest step, merge font sizes within about 5% of each other, drop one-off values unless they are deliberate.
4. **Pair type**: add `lineHeight` and `letterSpacing` to text sizes when the source pairs them consistently.
5. **Check contrast** for every semantic text/background pair with `colors.mjs --pairs`. Flag failures; do not silently change brand colors. Suggest the nearest passing color instead.

### 6. Emit

```bash
node scripts/emit.mjs tokens.json --out tokens/              # all formats
node scripts/emit.mjs tokens.json --format tw4                # one format to stdout
node scripts/emit.mjs tokens.json --format dtcg --dtcg legacy # older DTCG string values
```

| File | Format |
|---|---|
| `tokens.css` | CSS custom properties on `:root`. Semantic tokens reference primitives with `var()`. |
| `theme.css` | Tailwind v4 `@theme` block using its namespaces (`--color-*`, `--font-*`, `--text-*`, `--spacing-*`, `--radius-*`, `--shadow-*`, `--breakpoint-*`, `--ease-*`). Durations and z-index go in a plain `:root` block because they are not theme namespaces. |
| `tailwind.config.js` | Tailwind v3 `theme.extend`. |
| `design.tokens.json` | Design Tokens Community Group format. Default is the 2025.10 stable spec (object values for color, dimension, duration). `--dtcg legacy` writes the older string values. Check which one your tool reads. |

Details and caveats per format: `references/formats.md`.

### 7. Report

Give the user:

1. Source and confidence (measured / declared / estimated).
2. Before → after counts: "38 colors → 14 primitives + 9 semantic roles; 14 font sizes → 8."
3. The token file and emitted outputs.
4. Contrast failures and off-scale values that need a human decision.
5. Suggested next step: replace hard-coded values with tokens, starting with the most used.

## Rules

- Measure before naming. Do not invent tokens the source does not use.
- Label estimates from screenshots as estimates.
- Name semantic tokens by role, never by appearance (`accent`, not `blue`).
- Keep primitives and semantics separate. Components use semantics.
- Do not "fix" brand colors on your own. Report contrast problems and offer options.
- Use rem for sizes and spacing (base 16px unless the source sets a different root size; pass `--base` to `draft.mjs`).
- Keep the scripts' outputs. They are the evidence for every token.

## Verify before you hand it over

- [ ] Every token in the output appears in the source, or is marked as a deliberate addition.
- [ ] No duplicate primitives within ΔE_OK 2.5 unless intended.
- [ ] Semantic roles cover text, background, surface, border, accent, and the states the source uses.
- [ ] `emit.mjs` ran with no unresolved aliases and no unexpected warnings.
- [ ] Contrast for each text/background pair is listed with its WCAG grade.
- [ ] Estimated values are labeled.

## Files

- `scripts/extract.mjs`: collect values and counts from CSS.
- `scripts/computed-styles.js`: browser snippet that dumps computed styles as CSS for `extract.mjs`.
- `scripts/colors.mjs`: cluster colors in OKLCH, draft names, WCAG contrast.
- `scripts/draft.mjs`: report → starter `tokens.json`.
- `scripts/emit.mjs`: `tokens.json` → CSS, Tailwind v4, Tailwind v3, DTCG.
- `scripts/lib/color.mjs`: color parsing and math used by the scripts.
- `references/sources.md`: how to read each source.
- `references/naming.md`: primitive and semantic naming, scales.
- `references/formats.md`: output formats and their caveats.
- `examples/`: a fixture CSS file, its report, draft, reviewed tokens, and every output.
