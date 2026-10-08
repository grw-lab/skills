# Tailwind CSS for RTL

Read this when the project uses Tailwind. Logical utilities exist since Tailwind 3.3. In v3.3+ and v4 they work with no plugin.

## Physical → logical utilities

| Physical | Logical | CSS |
|---|---|---|
| `ml-*` | `ms-*` | `margin-inline-start` |
| `mr-*` | `me-*` | `margin-inline-end` |
| `pl-*` | `ps-*` | `padding-inline-start` |
| `pr-*` | `pe-*` | `padding-inline-end` |
| `left-*` | `start-*` | `inset-inline-start` |
| `right-*` | `end-*` | `inset-inline-end` |
| `rounded-l-*` | `rounded-s-*` | start-start + end-start radius |
| `rounded-r-*` | `rounded-e-*` | start-end + end-end radius |
| `rounded-tl-*` | `rounded-ss-*` | `border-start-start-radius` |
| `rounded-tr-*` | `rounded-se-*` | `border-start-end-radius` |
| `rounded-bl-*` | `rounded-es-*` | `border-end-start-radius` |
| `rounded-br-*` | `rounded-ee-*` | `border-end-end-radius` |
| `border-l-*` | `border-s-*` | `border-inline-start-width` |
| `border-r-*` | `border-e-*` | `border-inline-end-width` |
| `text-left` | `text-start` | `text-align: start` |
| `text-right` | `text-end` | `text-align: end` |
| `float-left` | `float-start` | `float: inline-start` (v3.4+) |
| `float-right` | `float-end` | `float: inline-end` (v3.4+) |
| `scroll-ml-*` / `scroll-pl-*` | `scroll-ms-*` / `scroll-ps-*` | scroll margin/padding |
| `space-x-*` | keep, add `rtl:space-x-reverse` | see below |
| `divide-x` | keep, add `rtl:divide-x-reverse` | see below |

Unchanged: `mx-*`, `px-*`, `inset-x-*`, `rounded-t-*`, `rounded-b-*`, `rounded-*`, everything vertical.

Negative values work the same: `-ml-2` → `-ms-2`.

## `space-x` and `divide-x`

`space-x-*` adds `margin-left` to every child except the first (v3) or uses `margin-inline-start/end` (v4). In v3 it is physical, so add the reverse modifier in RTL:

```html
<div class="flex space-x-4 rtl:space-x-reverse">
```

Better in both versions: use `gap-*` on flex and grid. It has no direction.

```html
<div class="flex gap-4">
```

## `rtl:` and `ltr:` variants

For things with no logical utility (transforms, gradients, shadows, icons):

```html
<svg class="size-4 rtl:-scale-x-100">…</svg>
<div class="bg-gradient-to-r rtl:bg-gradient-to-l">…</div>
<div class="translate-x-full rtl:-translate-x-full">…</div>
```

The variants match `[dir="rtl"]` on an ancestor (Tailwind v3.3+: `&:where([dir="rtl"], [dir="rtl"] *)`). They need `dir` on `<html>` or a wrapper; `lang="ar"` alone does not trigger them.

## Plugins you can remove

`tailwindcss-rtl` and `tailwindcss-flip` were needed before v3.3. On v3.3+ remove them and migrate class names; they add a second, conflicting set of utilities.

## Find and replace

Run the skill's audit script; it reports every physical Tailwind class with its logical replacement. To bulk-replace safely, use word boundaries and keep variants (`md:`, `hover:`) intact:

```bash
# preview only; review the diff before writing
node scripts/rtl-audit.mjs src --only tailwind
```

Do not blindly replace `left-` inside strings that aren't class names (for example `text-left-aligned` in copy, or `left-0` inside a URL).
