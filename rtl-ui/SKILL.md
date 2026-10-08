---
name: rtl-ui
description: Audits and fixes web interfaces for right-to-left languages (Arabic, Hebrew, Persian, Urdu). Converts physical CSS and Tailwind classes to logical ones, sets dir and lang correctly, decides which icons to mirror, isolates mixed Arabic and English text, and checks forms, numerals, fonts, carousels and keyboard behaviour. Use when a user asks to add RTL or Arabic support, says a layout "looks broken in Arabic", mentions dir="rtl", logical properties, mirroring, bidi, or wants a bilingual (Arabic/English) UI reviewed.
---

# RTL UI

Make a web UI correct in right-to-left languages without breaking left-to-right.

## When to use

- Adding Arabic, Hebrew, Persian or Urdu to an existing site or app.
- A page "looks broken" or "is reversed wrong" in RTL.
- Reviewing a component library, design system or Tailwind config for RTL.
- Mixed Arabic and English text renders in the wrong order (phone numbers, emails, prices, code).

## When not to use

- Translating or writing Arabic copy. Use the `arabic-copy` skill.
- Full i18n setup (string extraction, plurals, dates). Use `arabic-localization`.

## Workflow

1. **Audit.** Run the scanner from the skill folder against the source:

   ```bash
   node scripts/rtl-audit.mjs src            # or any folders/files
   node scripts/rtl-audit.mjs src --json     # machine-readable
   ```

   It lists every physical property and physical Tailwind class with `file:line` and the logical replacement. Exit code 1 means findings. It does not catch everything: also read the components that own layout (header, nav, sidebar, drawers, modals, tables, forms, carousels).

2. **Set direction at the root.** See "Direction and language" below. Do this before fixing CSS, so you can see the result.

3. **Fix CSS.** Replace physical properties with logical ones. Full table: [references/logical-properties.md](references/logical-properties.md). For Tailwind: [references/tailwind.md](references/tailwind.md).

4. **Fix icons and imagery.** Mirror only icons that point in the reading direction. List: [references/mirroring.md](references/mirroring.md).

5. **Fix mixed-direction text.** Isolate user content, numbers, emails, URLs and code. See [references/bidi.md](references/bidi.md).

6. **Fix interaction.** Carousels, sliders, swipe, keyboard arrows, progress, charts.

7. **Verify in both directions.** Run the checklist at the end with `dir="rtl"` and again with `dir="ltr"`. A fix that breaks LTR is not a fix.

## Direction and language

Set both on `<html>`. `lang` drives fonts, hyphenation, screen reader voice and quote marks. `dir` drives layout.

```html
<html lang="ar" dir="rtl">
```

- Never use CSS `direction: rtl` on the root as a substitute. Use the attribute. CSS `direction` does not reach the document's base direction for things like form controls and scrollbars, and screen readers ignore it.
- For a section in another language, set both on that element: `<blockquote lang="en" dir="ltr">`.
- For text whose direction you don't know (user names, comments, search input, chat messages, titles from an API), use `dir="auto"`. The browser picks the direction from the first strong character.

  ```html
  <p dir="auto">{comment.body}</p>
  <input type="search" dir="auto">
  ```

- Read direction in JS from the document, not from the locale string: `getComputedStyle(el).direction` or `document.dir`. Do not hard-code `locale === 'ar'`; Persian, Urdu and Hebrew are RTL too. If you must derive it from a locale, `new Intl.Locale(code).getTextInfo()` (older engines: the `textInfo` getter) returns the direction in Chromium and Safari but not yet in Firefox, so keep a fallback list of RTL language codes: `ar, ckb, dv, fa, he, ks, ps, sd, ug, ur, yi`.

## CSS rules

Replace physical with logical. The common ones:

| Physical | Logical |
|---|---|
| `margin-left` / `margin-right` | `margin-inline-start` / `margin-inline-end` |
| `padding-left` / `padding-right` | `padding-inline-start` / `padding-inline-end` |
| `left` / `right` (positioned) | `inset-inline-start` / `inset-inline-end` |
| `border-left` / `border-right` | `border-inline-start` / `border-inline-end` |
| `border-top-left-radius` | `border-start-start-radius` |
| `border-top-right-radius` | `border-start-end-radius` |
| `text-align: left` / `right` | `text-align: start` / `end` |
| `float: left` / `right` | `float: inline-start` / `inline-end` |
| `margin: 0 1rem 0 2rem` (asymmetric) | `margin-block: 0; margin-inline: 2rem 1rem;` |

Notes:

- Symmetric values (`margin: 0 auto`, `padding: 1rem`) need no change.
- `margin-inline: a b` is start then end. Watch the order when converting a 4-value shorthand: `margin: T R B L` becomes `margin-block: T B; margin-inline: L R;`.
- `float: inline-start` is supported in current Chrome, Edge, Firefox and Safari (since 2023). If you support older browsers, keep `float` behind `[dir="rtl"]` overrides or use flex instead.
- `background-position: left` has no logical keyword with wide support. Use `[dir="rtl"]` overrides or flip with a CSS variable.
- `transform: translateX(...)` is physical. Multiply by a direction variable:

  ```css
  :root { --dir: 1; }
  [dir="rtl"] { --dir: -1; }
  .drawer--closed { transform: translateX(calc(-100% * var(--dir))); }
  ```

- Gradients: `linear-gradient(to right, ...)` is physical, and there are no logical keywords (`to inline-end` is invalid CSS). Override the direction under `[dir="rtl"]` / `:dir(rtl)`, or drive it with a custom property such as `--dir-end: right` that you flip for RTL.
- Shadows with an x-offset (`box-shadow: 4px 0 ...`) are physical. Flip them under `[dir="rtl"]` if the shadow implies direction.

## Flex and grid

- `flex-direction: row` and grid columns already follow the writing direction. In RTL the first item sits on the right with no extra CSS.
- Do not add `flex-direction: row-reverse` for RTL. That double-flips and puts things back in LTR order. If you find `row-reverse` used to "fix RTL", remove it.
- `justify-content: flex-start` / `flex-end` follow direction too. `start` / `end` are the clearer modern form.
- `order` values and `grid-template-areas` follow direction. Don't swap them per language.
- Absolute positioning inside a flex row (badges, close buttons) must use `inset-inline-*`, not `left`/`right`.

## Icons and images

Mirror an icon only if it shows motion or direction along the reading line. Full list in [references/mirroring.md](references/mirroring.md). Short version:

- **Mirror:** back/forward arrows, chevrons in breadcrumbs and "next", reply, undo/redo (they swap), send (paper plane), bulleted list, indent/outdent, text alignment icons, progress that fills along the line, sidebar toggle, logout door.
- **Your call:** external-link arrows (up-and-out). Follow your icon set and be consistent across the product.
- **Do not mirror:** logos, brand marks, media play/pause/fast-forward (they follow tape direction, not text), checkmarks, clocks and timers (clockwise is universal), circular refresh/reload, search magnifier (most systems keep it), slashes, numbers and anything with Latin text, charts' numeric axes, real-world objects (cameras, phones, keyboards), the right hand in hand icons.

Scope the flip to icons that need it, never to a whole container:

```css
[dir="rtl"] .icon--directional { transform: scaleX(-1); }
```

Prefer swapping the icon (`chevron-left` ↔ `chevron-right`) over transforming it when the icon has a shadow or text inside, because `scaleX(-1)` mirrors those too.

Photos and illustrations: do not mirror photos of people or places. Mirror illustrations only if they carry directional meaning (a person walking "forward" in onboarding).

## Mixed Arabic and English (bidi)

The Unicode bidi algorithm reorders runs of text. Neutral characters (spaces, punctuation, `+`, `-`, `@`, `/`) take the direction of their neighbours, which is how `+966 50 123 4567` turns into `4567 123 50 966+`. Fix it by isolating the run.

- Wrap embedded values whose direction differs from the paragraph in `<bdi>` or an element with `dir`:

  ```html
  <p>رقم الطلب: <bdi>#A-1042</bdi></p>
  <p>تواصل معنا على <span dir="ltr">+966 50 123 4567</span></p>
  ```

- In CSS: `unicode-bidi: isolate;` on the inline element (this is what `<bdi>` does).
- For plain strings where you can't add markup (notifications, `<title>`, `<option>`, SMS), use Unicode isolates: FSI `U+2068` + text + PDI `U+2069`. LRM `U+200E` / RLM `U+200F` fix a single neutral at the edge. Details and code: [references/bidi.md](references/bidi.md).
- Inputs that are always Latin get `dir="ltr"` even in an RTL page: email, URL, password, phone, card number, IBAN, code, username. Align their text to the inline end only if the design wants it; never change the input's direction to RTL.

  ```html
  <input type="email" dir="ltr" autocomplete="email">
  ```

- Code blocks and terminals stay `dir="ltr"` always.

## Numerals

- Arabic UIs use either Western digits (0-9) or Arabic-Indic digits (٠-٩). Saudi, Gulf and most product UIs use Western digits; formal Egyptian and some government content uses Arabic-Indic. Make it a deliberate choice, not an accident.
- Format with `Intl`, and pin the numbering system so output is predictable across browsers:

  ```js
  new Intl.NumberFormat('ar-SA', { numberingSystem: 'latn' }).format(1234.5) // "1,234.5"
  new Intl.NumberFormat('ar-EG').format(1234.5)                              // "١٬٢٣٤٫٥"
  ```

  Verify output in the browsers you support; CLDR defaults for `ar-*` locales have changed between versions.
- Digits are always laid out left to right, even inside RTL text. Don't reverse them.
- Phone numbers, card numbers and OTP inputs stay Western digits and `dir="ltr"`.

## Arabic typography

- Use a font with real Arabic glyphs. Pair it explicitly; the fallback system font looks unrelated. Good free options: IBM Plex Sans Arabic, Noto Sans Arabic, Noto Kufi Arabic, Tajawal, Cairo, Readex Pro, Almarai. Load the Arabic subset, and put the Arabic face first under `:lang(ar)`.
- Increase line-height. Arabic has tall ascenders and dots below; `1.6` to `1.8` for body text is a common range where Latin uses `1.4` to `1.5`. Test with your font.
- Never use `letter-spacing` on Arabic. It breaks the joins between letters. Reset it: `:lang(ar) { letter-spacing: 0; }`.
- No `text-transform: uppercase` (Arabic has no case; it just wastes the rule) and no italics (Arabic italic is a fake slant). Use weight or color for emphasis.
- Arabic often needs a slightly larger size than Latin at the same nominal size. Adjust per font with `font-size-adjust` or a `:lang(ar)` override.
- Avoid `text-overflow: ellipsis` on very short Arabic labels; truncating a word mid-join reads badly. Allow wrapping.

```css
:lang(ar) {
  font-family: "IBM Plex Sans Arabic", "Noto Sans Arabic", system-ui, sans-serif;
  line-height: 1.7;
  letter-spacing: 0;
  text-transform: none;
}
```

## Interaction

- **Carousels and sliders:** slides advance toward the inline end. In RTL the next slide sits to the left, so the user swipes right to advance and the "next" button sits on the left. Most libraries need an explicit flag: Swiper (`dir="rtl"` on the container), Embla (`direction: 'rtl'`), Splide (`direction: 'rtl'`), Slick (`rtl: true`). Range inputs (`<input type="range">`) follow `dir` natively.
- **Keyboard:** in RTL, ArrowRight means "previous" and ArrowLeft means "next" for horizontal widgets (tabs, menubars, sliders). Read direction at runtime:

  ```js
  const rtl = getComputedStyle(el).direction === 'rtl';
  const next = rtl ? 'ArrowLeft' : 'ArrowRight';
  ```

- **Progress and steppers:** fill from the inline start.
- **Charts:** time-series x-axes are usually kept left-to-right (time flows left to right in most Arabic financial and analytics UIs), while legends, titles and tooltips are RTL. Decide per product and be consistent. Bar charts with category labels can mirror.
- **Scroll containers:** horizontal `scrollLeft` is 0 at the start and negative toward the end in RTL in current Chrome, Firefox and Safari. Code that assumes `scrollLeft >= 0` breaks. Use `Math.abs` or `scrollBy` with a direction factor.
- **Tooltips, popovers, dropdowns:** placement libraries (Floating UI, Popper) accept `start`/`end` placements that follow direction. Use those, not `left`/`right`.

## Frameworks

- **Tailwind:** use logical utilities and `rtl:`/`ltr:` variants. See [references/tailwind.md](references/tailwind.md).
- **React Native:** `I18nManager.forceRTL(true)` plus an app reload flips layout; use `start`/`end` style keys (`marginStart`, `paddingEnd`) instead of left/right.
- **Flutter:** use `EdgeInsetsDirectional`, `AlignmentDirectional` and `PositionedDirectional`; set `Directionality` or rely on `MaterialApp` locale.

## Verification checklist

Run with `dir="rtl"` on `<html>`, then again with `dir="ltr"`:

- [ ] `node scripts/rtl-audit.mjs` reports nothing, or every remaining finding is intentional and commented.
- [ ] `<html>` has correct `lang` and `dir`; no root `direction:` CSS.
- [ ] Header, nav, sidebar, drawer and modal close buttons sit on the correct side.
- [ ] No `row-reverse` used as an RTL fix.
- [ ] Directional icons mirror; logos, media controls, checkmarks and clocks do not.
- [ ] Phone numbers, emails, prices with currency, order IDs and code render in the right order.
- [ ] Email, URL, phone, password and code inputs are `dir="ltr"`.
- [ ] Arabic font loads; no letter-spacing, uppercase or italics on Arabic.
- [ ] Carousel, slider, tabs and keyboard arrows move in the reading direction.
- [ ] Animations and transforms (drawers, toasts) enter from the correct side.
- [ ] Nothing changed visually in LTR except intended fixes.

Take a screenshot in each direction if you can run a browser, and compare.
