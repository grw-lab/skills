---
name: arabic-localization
description: Localizes web and mobile apps into Arabic end to end. Extracts strings, writes all six Arabic plural forms (zero, one, two, few, many, other) in i18next or ICU MessageFormat, handles gender, Latin vs Arabic-Indic digits, SAR/EGP/AED currency, Gregorian and Hijri (Umm al-Qura) dates, fonts, and an Arabic QA pass. Use when adding Arabic or ar-SA/ar-EG/ar-AE to an app, translating locale files to Arabic, fixing broken Arabic plurals, numbers or dates, or setting up i18next, react-intl, next-intl, vue-i18n, Laravel or Flutter for Arabic.
---

# Arabic localization

Take an app from English-only to correct Arabic: strings, plurals, numbers, dates, currency, fonts, and a QA pass. Layout direction (RTL) is a separate job; hand it to the **rtl-ui** skill if it is available.

## When to use

- Adding Arabic (`ar`, `ar-SA`, `ar-EG`, `ar-AE`, …) to an existing app.
- Translating or reviewing Arabic locale files.
- Fixing Arabic plurals that read wrong, digits that look mixed, or dates that show the wrong calendar.

## When not to use

- Only flipping layout to RTL with no translation work → **rtl-ui**.
- Writing Arabic marketing or UI copy from scratch → **arabic-copy**.

## Workflow

1. **Find the stack.** Identify the i18n library and its version (`package.json`, `composer.json`, `pubspec.yaml`). Open the matching section of `references/frameworks.md`. If there is no i18n library, propose one that fits the stack before touching strings.
2. **Decide the locale and the defaults with the user.** Ask, or infer from the brief:
   - Region: `ar-SA`, `ar-EG`, `ar-AE`, or generic `ar`.
   - Digits: Latin (123) or Arabic-Indic (١٢٣). One app-wide setting.
   - Calendar: Gregorian only, or Gregorian with Hijri (Umm al-Qura) beside it.
   - Tone: Modern Standard Arabic (default) or a dialect.
   Write the decisions into the i18n config as explicit locale extensions, for example `ar-SA-u-nu-latn-ca-gregory`. Never rely on locale defaults; they differ between runtimes (see `references/formatting.md`).
3. **Extract every string.** Search for hard-coded user-facing text in components, templates, validation messages, emails, notifications, and server responses. Replace each with a key. Keys describe meaning, not position: `checkout.payButton`, not `button3`. One full sentence per key; never concatenate translated fragments.
4. **Mark counts as plurals in the source language first.** Any string with a number in it becomes a plural message in English (`_one`/`_other` or ICU `plural`). Then the Arabic file can add its six forms.
5. **Write the Arabic messages.** For every plural, write all six categories with the correct noun form for each (`references/plurals.md`). Use `select` for gendered sentences or rephrase neutrally. Keep placeholders, HTML tags and ICU syntax exactly as in the source.
6. **Format, don't concatenate.** Every number, price, percent, date, time, list and relative time goes through `Intl` (or the library's formatter, which uses `Intl`). Normalize Arabic-Indic digits in user input before parsing.
7. **Set language and direction on the root.** `lang="ar"` and `dir="rtl"` on `<html>` (or the platform equivalent). Load an Arabic font. Then hand layout to **rtl-ui**.
8. **Check plurals mechanically.**
   ```bash
   node scripts/check-plurals.mjs --source locales/en/common.json locales/ar/*.json
   ```
   Fix everything it reports. Run `node scripts/plural-table.mjs ar` if anyone doubts which form a number takes.
9. **Run the QA pass** in `references/qa.md` and report what still needs a native reviewer.

## Rules

- Arabic has six plural categories. `few` is n%100 in 3–10 and `many` is n%100 in 11–99, so 103 is `few` and 111 is `many`. All decimals are `other`. Never hand-code ranges.
- `one` and `two` do not show the digit: رسالة واحدة, رسالتان. Not "1 رسالة".
- Never build sentences from translated pieces. Arabic word order and agreement differ.
- Always pass a calendar and a numbering system explicitly. `ar-SA` defaults have changed between ICU versions.
- Use `islamic-umalqura` for Saudi Hijri dates, never `islamic` or `islamic-civil`.
- Phone numbers, IDs, codes, IBANs and card numbers stay in Latin digits in an LTR span.
- Don't strip the invisible direction marks Intl adds to currency and percent output.
- No `letter-spacing`, synthetic italics or uppercase-only hierarchy on Arabic text.
- Machine translation is a draft. Say so when you used it and list strings that need a native reviewer.

## Before / after

Before:

```js
`${count} ${count === 1 ? "item" : "items"}`              // English-only logic
price.toFixed(2) + " SAR"                                  // no locale, wrong order
date.toLocaleDateString()                                  // calendar depends on the machine
```

After:

```js
t("cart.items", { count })                                 // six Arabic forms in ar.json
new Intl.NumberFormat("ar-SA-u-nu-latn", { style: "currency", currency: "SAR" }).format(price)
new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", { dateStyle: "long" }).format(date)
```

## Verification checklist

Run before saying the work is done:

- [ ] `scripts/check-plurals.mjs` exits 0 for every Arabic file.
- [ ] No user-facing string is left hard-coded (search templates for Latin-letter text nodes).
- [ ] Locale config states the numbering system and calendar explicitly.
- [ ] One screen checked at counts 0, 1, 2, 3, 11, 100.
- [ ] `lang` and `dir` are set on the root, and an Arabic font loads.
- [ ] Prices and dates on one real screen match the outputs in `references/formatting.md` for the chosen locale.
- [ ] Remaining items for a native Arabic reviewer are listed for the user.

## Files

- `references/plurals.md` — the six categories, noun forms, i18next and ICU examples, gender with plurals.
- `references/formatting.md` — digits, input parsing, currency (including the new Saudi riyal sign), Gregorian and Hijri dates, time, lists.
- `references/frameworks.md` — i18next, FormatJS, next-intl, vue-i18n, Laravel, Flutter, iOS, Android.
- `references/qa.md` — fonts, text length, pseudo-localization, the Arabic QA checklist.
- `scripts/plural-table.mjs` — prints which plural category each number gets in your runtime.
- `scripts/check-plurals.mjs` — reports Arabic messages missing plural forms (i18next JSON and ICU). Exit 1 on problems, for CI.
- `examples/` — sample English and Arabic locale files, good and bad, for the checker.
