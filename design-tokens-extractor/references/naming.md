# Naming tokens

Read this before renaming the draft. Good names are the difference between a token file and a list of values.

## Two layers

| Layer | Answers | Examples | Used by |
|---|---|---|---|
| Primitive | What is it? | `gray-200`, `indigo-600`, `space-4`, `radius-md` | Semantic tokens only |
| Semantic | What is it for? | `text`, `muted`, `border`, `accent`, `danger`, `surface-raised` | Components |

Semantic tokens alias primitives: `"border": "{color.gray-200}"`. Rebranding or adding dark mode then means changing the semantic layer, not every component.

A third layer, component tokens (`button-bg`), is only worth it in large systems. Skip it unless the source clearly has it.

## Colors

Primitives: `<hue>-<step>`. Steps follow the 50 to 950 convention so they read naturally to anyone who knows Tailwind. Brand colors may keep their brand name (`lime`, `ink`, `paper`) if the team already uses it.

Semantic roles to look for:

| Role | Typical source |
|---|---|
| `bg` | `body` background |
| `surface`, `surface-raised` | cards, panels, modals |
| `text` | `body` color, headings |
| `muted` | captions, secondary text, placeholders |
| `border`, `border-strong` | dividers, inputs |
| `accent`, `accent-hover`, `accent-text` | primary buttons, links |
| `focus` | focus rings |
| `danger`, `warning`, `success`, `info` (+ `-bg` variants) | alerts, validation |
| `overlay` | modal backdrops (often translucent) |

Rules:

- Name by role, never by appearance: `accent`, not `purple`.
- Do not create a semantic token nothing uses.
- Translucent colors get their own primitive with an alpha suffix (`black-a10`) or are written as a semantic token (`overlay`).

## Type

- Sizes: `xs, sm, base, lg, xl, 2xl, 3xl ...` with `base` = body text. Extra small steps: `2xs`, `3xs`.
- Pair line height and letter spacing with the size when the source pairs them. Large display sizes usually have tighter line height (1.05 to 1.2) and negative tracking.
- Families: by role (`sans`, `serif`, `mono`, or `display`, `body`) rather than by font name, so swapping fonts does not rename tokens.
- Weights: `regular 400, medium 500, semibold 600, bold 700`.
- Most systems need 6 to 9 sizes. More than 10 usually means near-duplicates.

## Spacing

- Base on a 4px grid. Name by multiple of 4px: `1 = 4px, 2 = 8px, 3 = 12px, 4 = 16px, 6 = 24px, 8 = 32px`. This matches Tailwind's numbers.
- Snap off-grid values (10px → 12px, 18px → 20px) unless they are deliberate, such as optical adjustments.
- Fluid spacing (`clamp()`) stays as its own named token (`section-y`).

## Radius, shadow, motion, z-index

- Radius: `sm, md, lg, xl, full`. `full` for pills and circles.
- Shadow: by elevation, `sm, md, lg` or `raised, overlay, modal`.
- Duration: `fast (100 to 150ms), normal (200 to 300ms), slow (400ms+)`.
- Easing: by feel, `standard`, `out` (entering), `in` (leaving), `emphasized`.
- Z-index: by layer, in order: `base, raised, sticky, dropdown, overlay, modal, toast, tooltip`. Leave gaps (10, 20, 30) so new layers fit.

## Dark mode

Keep primitives the same. Add a second semantic mapping for dark mode and output it under a selector or media query:

```css
:root { --color-bg: var(--color-white); --color-text: var(--color-gray-900); }
@media (prefers-color-scheme: dark) {
	:root { --color-bg: var(--color-gray-950); --color-text: var(--color-gray-50); }
}
```

`emit.mjs` writes one mapping. Write the dark block by hand from the same names.
