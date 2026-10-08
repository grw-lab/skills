# Physical → logical CSS

Read this when converting a stylesheet. Logical properties follow the element's writing mode and direction: in a horizontal LTR context, `inline-start` is left; in RTL, it is right. `block-start` is top in both.

All properties below are supported in current Chrome, Edge, Firefox and Safari unless noted. Version numbers come from MDN browser-compat-data 8.1.4; Edge follows Chrome.

## Margin, padding

| Physical | Logical |
|---|---|
| `margin-left` | `margin-inline-start` |
| `margin-right` | `margin-inline-end` |
| `margin-top` | `margin-block-start` |
| `margin-bottom` | `margin-block-end` |
| `margin-left` + `margin-right` | `margin-inline: <start> <end>` |
| `margin-top` + `margin-bottom` | `margin-block: <start> <end>` |
| `padding-left` | `padding-inline-start` |
| `padding-right` | `padding-inline-end` |
| `padding-left` + `padding-right` | `padding-inline: <start> <end>` |

Shorthand conversion: `margin: T R B L` → `margin-block: T B; margin-inline: L R;`
Only convert when `R` and `L` differ. `margin: 0 auto` and `padding: 1rem 2rem` are already symmetric.

## Position

| Physical | Logical |
|---|---|
| `left` | `inset-inline-start` |
| `right` | `inset-inline-end` |
| `top` | `inset-block-start` (keeping `top` is fine) |
| `bottom` | `inset-block-end` (keeping `bottom` is fine) |
| `left: 0; right: 0;` | `inset-inline: 0` |
| `top: 0; right: 0; bottom: 0; left: 0;` | `inset: 0` (already symmetric) |

## Borders

| Physical | Logical |
|---|---|
| `border-left` | `border-inline-start` |
| `border-right` | `border-inline-end` |
| `border-left-width` / `-color` / `-style` | `border-inline-start-width` / `-color` / `-style` |
| `border-right-width` / `-color` / `-style` | `border-inline-end-width` / `-color` / `-style` |

## Border radius

| Physical | Logical |
|---|---|
| `border-top-left-radius` | `border-start-start-radius` |
| `border-top-right-radius` | `border-start-end-radius` |
| `border-bottom-left-radius` | `border-end-start-radius` |
| `border-bottom-right-radius` | `border-end-end-radius` |

The first word is the block side, the second the inline side. `border-radius: 8px 0 0 8px` (rounded on the left in LTR) becomes:

```css
border-start-start-radius: 8px;
border-end-start-radius: 8px;
border-start-end-radius: 0;
border-end-end-radius: 0;
```

## Size

| Physical | Logical |
|---|---|
| `width` | `inline-size` |
| `height` | `block-size` |
| `min-width` / `max-width` | `min-inline-size` / `max-inline-size` |

You don't need these for RTL (width is the same in both directions). They only matter for vertical writing modes. Leave `width` and `height` alone.

## Text and floats

| Physical | Logical | Notes |
|---|---|---|
| `text-align: left` | `text-align: start` | |
| `text-align: right` | `text-align: end` | |
| `float: left` | `float: inline-start` | Chrome 118+, Firefox 55+, Safari 15+ (same for `clear`) |
| `float: right` | `float: inline-end` | same |
| `clear: left` | `clear: inline-start` | same |
| `resize: horizontal` | `resize: inline` | Chrome 118+, Firefox 63+, Safari 16+ |

## Scroll

| Physical | Logical |
|---|---|
| `scroll-margin-left` | `scroll-margin-inline-start` |
| `scroll-padding-right` | `scroll-padding-inline-end` |
| `overscroll-behavior-x` | `overscroll-behavior-inline` |

## No logical equivalent (override under `[dir="rtl"]`)

| Property | What to do |
|---|---|
| `transform: translateX()` / `rotate()` with direction meaning | Multiply by a `--dir` variable (`1` / `-1`) |
| `background-position: left/right` | Override under `[dir="rtl"]`, or use percentages flipped (`calc(100% - x)`) |
| `box-shadow` / `text-shadow` with x-offset | Flip the sign under `[dir="rtl"]` if the shadow implies direction |
| `linear-gradient(to right, ...)` | Override under `[dir="rtl"]` |
| `clip-path` / `mask-position` with x values | Override under `[dir="rtl"]` |
| `cursor: e-resize` / `w-resize` | Swap under `[dir="rtl"]` |
| SVG `x` coordinates | Mirror the SVG or swap the asset |

## Direction selector

Use the attribute selector or `:dir()`:

```css
[dir="rtl"] .x { ... }   /* matches only where an ancestor has the attribute */
.x:dir(rtl) { ... }      /* matches the computed direction, including dir="auto" */
```

`:dir()` is supported in Chrome 120+, Safari 16.4+, Firefox 49+. Prefer it for components that may sit inside `dir="auto"` content.
