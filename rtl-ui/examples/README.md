# Examples

`before/` has a card component, a stylesheet and a page written for left-to-right only. `after/` is the same code fixed for both directions.

Run the audit from the skill folder:

```bash
node scripts/rtl-audit.mjs examples/before   # 24 findings, exit code 1
node scripts/rtl-audit.mjs examples/after    # clean, exit code 0
```

What changed, and why:

| Before | After | Why |
|---|---|---|
| `padding-left`, `border-left`, `margin-right` | `padding-inline-start`, `border-inline-start`, `margin-inline-end` | Follow the reading direction |
| `right: 12px` on the badge | `inset-inline-end: 12px` | Badge stays in the corner at the end of the line |
| `float: left` | `float: inline-start` | Icon sits at the start in both directions |
| `translateX(-100%)` | `translate(calc(-100% * var(--dir)))` | Drawer slides out toward the start side in both directions |
| `space-x-4` | `gap-4` | `gap` has no direction |
| `rounded-l-lg border-l-4 pl-6 pr-2 text-left` | `rounded-s-lg border-s-4 ps-6 pe-2 text-start` | Logical Tailwind utilities |
| `right-3 ml-2`, `md:text-right`, `hover:pl-8` | `end-3 ms-2`, `md:text-end`, `hover:ps-8` | Variants are kept |
| `marginLeft`, `textAlign: 'left'` | `marginInlineStart`, `textAlign: 'start'` | Inline styles follow the same rules |
| `{price}` | `<bdi>{price}</bdi>` | Price with currency stays in order inside Arabic text |
| `<html lang="ar">` | `<html lang="ar" dir="rtl">` | `lang` doesn't set direction |
| `rtl:mr-1` on an icon, `margin-left` inside `[dir="rtl"]` | removed | Not flagged by the audit (already direction-scoped), but a manual offset that logical spacing makes unnecessary |
