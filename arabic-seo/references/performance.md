# Arabic fonts, Core Web Vitals and RTL issues that hurt UX signals

## Fonts

Arabic web fonts are larger than Latin ones because of joining forms, ligatures and marks. A full font with every weight can add hundreds of KB.

1. **Use fewer files.** One variable font, or at most two static weights (regular and bold).
2. **Subset to the scripts you use.** Arabic-script Unicode ranges:

```css
@font-face {
	font-family: "Brand Arabic";
	src: url("/fonts/brand-arabic.woff2") format("woff2");
	font-weight: 400 700;
	font-display: swap;
	unicode-range: U+0600-06FF, U+0750-077F, U+0870-089F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF, U+200C-200F, U+25CC;
}

@font-face {
	font-family: "Brand Latin";
	src: url("/fonts/brand-latin.woff2") format("woff2");
	font-weight: 400 700;
	font-display: swap;
	unicode-range: U+0000-00FF, U+2000-206F, U+20AC;
}

body { font-family: "Brand Arabic", "Brand Latin", "Segoe UI", Tahoma, "Geeza Pro", "Noto Naskh Arabic", sans-serif; }
```

   - `U+0600-06FF` is the main Arabic block. The others are supplements and presentation forms. `U+200C-200F` covers ZWNJ, ZWJ, LRM and RLM. Do not cut presentation forms if the font depends on them for shaping.
   - Subset with `pyftsubset` (fonttools) and keep OpenType layout features: `pyftsubset font.ttf --unicodes="U+0600-06FF,..." --layout-features='*' --flavor=woff2`. If you drop the shaping features, Arabic letters stop joining.
3. **Preload only the file used above the fold:** `<link rel="preload" href="/fonts/brand-arabic.woff2" as="font" type="font/woff2" crossorigin>`.
4. **Self-host** when possible. It avoids a third-party connection.
5. **Do not apply letter-spacing** to Arabic text. It breaks the joins between letters.

## Layout shift (CLS)

- Arabic glyphs are taller (ascenders, descenders and marks). Give Arabic text more line height, around 1.6 to 1.8 for body text, so lines do not jump when the web font replaces the fallback.
- Match the fallback to the web font with `size-adjust`, `ascent-override` and `descent-override` on a fallback `@font-face` that points at a local system font. This reduces the shift on swap.
- Reserve space for images, ads and embeds with `width`/`height` or `aspect-ratio`.

## RTL issues that hurt engagement

These are not ranking factors in themselves, but they drive bounces and poor Core Web Vitals interactions:

- Icons that should mirror and don't (back and forward arrows, chevrons in breadcrumbs, progress), and icons that mirror and shouldn't (logos, play buttons, checkmarks).
- Mixed-direction strings that reorder: phone numbers, prices with currency, product codes, emails. Wrap them in `<bdi>` or `<span dir="ltr">`.
- Physical CSS (`margin-left`, `text-align: left`) that leaves Arabic pages misaligned. Use logical properties (`margin-inline-start`, `text-align: start`).
- Carousels and sliders that swipe the wrong way, or open on the last slide in RTL.
- Form fields for email, URL and phone that should stay `dir="ltr"` inside an RTL form.
- An English fallback font picked for Arabic text because the font stack forgot an Arabic face. The text then renders in a mismatched system font.

For a full RTL layout fix, use the `rtl-ui` skill.

## Quick checks

- Lighthouse or PageSpeed Insights on the Arabic URL, not only the English one.
- The DevTools Network panel, filtered to fonts: total font bytes on the Arabic home page. Aim for under about 150 KB.
- Record a page load in the Performance panel with network throttling, and watch for shifts when the font swaps.
