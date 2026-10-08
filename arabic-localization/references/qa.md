# Fonts, layout and QA

Read this when preparing an Arabic release or reviewing one.

## Fonts

- Pick a font with real Arabic glyphs, designed alongside its Latin. Good free options on Google Fonts: **IBM Plex Sans Arabic**, **Noto Sans Arabic**, **Noto Naskh Arabic** (long reading), **Cairo**, **Tajawal**, **Readex Pro**, **Almarai**.
- Put the Arabic font first in the stack for Arabic pages, or use `unicode-range` so one family name serves both scripts:

```css
:root:lang(ar) { font-family: "IBM Plex Sans Arabic", "Noto Sans Arabic", system-ui, sans-serif; }
```

- Arabic needs more vertical room. Raise `line-height` to about 1.6–1.8 for body text and give buttons and inputs extra height, or descenders and dots clip.
- Arabic often needs one size step up to match Latin legibility at the same pixel size (for example 16px Latin, 17–18px Arabic).
- Never apply `letter-spacing` to Arabic. It breaks the joins between letters. Reset it on `:lang(ar)`.
- No synthetic italics. Most Arabic fonts have none, and the browser's slant looks broken. Use weight or colour for emphasis.
- `text-transform: uppercase` does nothing to Arabic. Labels that rely on caps for hierarchy need another cue.
- Subset fonts for the web: Arabic fonts are large. Load only the weights you use.

## Text length and layout

- Arabic is often shorter than English in characters but can render wider or taller. Do not assume a fixed ratio; test real strings.
- Avoid fixed widths on buttons, tabs, chips and table columns. Let them grow, and allow two lines where it makes sense.
- Truncation with an ellipsis must truncate at the end of the Arabic text (the left side). Check `text-overflow` inside RTL containers.
- Concatenated strings break grammar. Never build a sentence from pieces (`t("you_have") + count + t("messages")`). One message, with placeholders and plural branches.
- Placeholders move. Arabic word order differs, so translators must be free to place `{name}` anywhere in the sentence.

## Pseudo-localization before translation

Run the UI with fake Arabic before translators deliver, to find hard-coded strings and layout that can't flip:

1. Turn on `dir="rtl"` with the English strings still in place. Anything that doesn't flip is a layout bug.
2. Replace every string with a padded or wrapped version (for example `[!! Settings !!]` or a bidi pseudo-locale). Text that still shows plain English was never extracted.
3. The `pseudo-localization` npm package and most TMS tools can generate these locales automatically.

## The Arabic QA pass

Pseudo-locales find mechanical bugs. A fluent Arabic reader finds the rest. Ask them to check, screen by screen:

- [ ] Every count reads correctly at 0, 1, 2, 3, 11 and 100 (one value per plural category).
- [ ] Gender agreement: does the UI address the user correctly, or use neutral phrasing that works for anyone?
- [ ] Tone matches the brand: Modern Standard Arabic for most products; dialect only when the brand voice calls for it.
- [ ] No literal translations of idioms or English UI clichés.
- [ ] Arabic punctuation: ، (comma), ؛ (semicolon), ؟ (question mark).
- [ ] Digits are consistent on each screen (all Latin or all Arabic-Indic).
- [ ] Dates show the intended calendar, and Hijri dates match the official Umm al-Qura calendar.
- [ ] Prices show the right currency symbol and position.
- [ ] Mixed Arabic and English text (brand names, code, URLs, emails) reads in the right order.
- [ ] Icons that imply direction (back, next, send, progress) point the right way.
- [ ] Error messages, empty states, emails, push notifications, and PDF exports are translated too, not just the main screens.

## Machine translation

Machine translation is a fine first draft. Ship it only after the QA pass above. Pay special attention to plural forms (machines often produce the same form for all six) and gender (machines default to masculine).
