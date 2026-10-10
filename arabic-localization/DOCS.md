## What it does

Arabic localization takes an app from English-only to correct Arabic. It finds hard-coded strings, turns them into keys, and writes Arabic messages with all six plural forms Arabic needs. It also sets up digits, currency and dates the way Arabic readers expect, then runs a QA pass.

Most localization setups assume English plurals: one and many. Arabic has six: zero, one, two, few, many and other. The `few` and `many` forms repeat every hundred, so 103 uses the same form as 3, and 111 the same as 11. Code that gets this wrong reads like a machine wrote it. This skill gets it right and checks it with a script.

## When to use it

- You are adding Arabic, or a regional variant like `ar-SA` or `ar-EG`, to a web or mobile app.
- Arabic counts read wrong ("1 رسالة", "3 رسالة", "103 رسالة").
- Prices show mixed digits, or dates show the Hijri calendar on some machines and Gregorian on others.
- You use i18next, react-intl (FormatJS), next-intl, vue-i18n, Laravel, Flutter, iOS or Android.

For layout direction (RTL), pair it with the **rtl-ui** skill. For writing Arabic copy from scratch, use **arabic-copy**.

## Install

This installs **arabic-localization** only. The other skills stay out.

1. Open Claude Code.
2. Paste line 1 and press Enter. This adds the catalog. Do it once, then skip it next time.
3. Paste line 2 and press Enter. This installs this skill.

```text
/plugin marketplace add grw-lab/skills
/plugin install arabic-localization@grw-lab
```

Claude confirms the install in the chat. The next message can use the skill.

Every skill instead: keep line 1, and use this as line 2:

```text
/plugin install grw-skills@grw-lab
```

On claude.ai, zip the `arabic-localization` folder and upload it in Settings → Capabilities → Skills.

In Cursor or another agent, point it at `arabic-localization/SKILL.md`.

## Usage

Ask in plain words:

- "Add Arabic (Saudi) to this Next.js app. Latin digits, Gregorian dates with Hijri on invoices."
- "Translate `locales/en/common.json` to Arabic with correct plurals."
- "Our Arabic cart says ٣ منتج. Fix the plurals across the app."
- "Check every Arabic locale file for missing plural forms."
- "Set up vue-i18n so Arabic plurals work."

The skill asks for the region, digit style, calendar and tone if your request doesn't say. It writes those choices into the locale config so they don't depend on the user's machine.

## Example

Before, an English-only plural and string-built prices:

```js
`${count} ${count === 1 ? "item" : "items"}`
price.toFixed(2) + " SAR"
date.toLocaleDateString()
```

After, one key with six Arabic forms and formatting through `Intl`:

```json
{
  "items_zero": "السلة فارغة",
  "items_one": "منتج واحد",
  "items_two": "منتجان",
  "items_few": "{{count}} منتجات",
  "items_many": "{{count}} منتجًا",
  "items_other": "{{count}} منتج"
}
```

```js
t("cart.items", { count })
new Intl.NumberFormat("ar-SA-u-nu-latn", { style: "currency", currency: "SAR" }).format(99.5)
// "99.50 ر.س."
new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", { dateStyle: "long" }).format(date)
// "٢٧ ربيع الآخر ١٤٤٨ هـ"
```

The plural checker catches what was missed:

```
$ node scripts/check-plurals.mjs --source en.json ar.json
✗ ar.json
  cart.items: missing _zero, _two, _few, _many
  daysLeft: ICU {count, plural} missing zero, two, few, many
  inbox.unread: plural in source, but a single string here ("inbox.unread")
```

## What's inside

| File | What it's for |
|---|---|
| `SKILL.md` | The workflow the agent follows, rules, and a done checklist. |
| `references/plurals.md` | The six categories, how the counted noun changes in each, i18next and ICU examples, gender with plurals. |
| `references/formatting.md` | Latin vs Arabic-Indic digits by locale, parsing Arabic digits in input, currency output, the new Saudi riyal sign, Gregorian and Umm al-Qura dates, regional month names. |
| `references/frameworks.md` | Setup recipes for i18next, FormatJS, next-intl, vue-i18n, Laravel, Flutter, iOS and Android. |
| `references/qa.md` | Arabic fonts, line height, text length, pseudo-localization, and a checklist for a native reviewer. |
| `scripts/plural-table.mjs` | Prints which plural form every number gets in your runtime. |
| `scripts/check-plurals.mjs` | Finds Arabic messages missing plural forms in i18next JSON and ICU strings. Exits 1 for CI. |
| `examples/` | Good and bad Arabic locale files to try the checker on. |

Both scripts run on Node 18 or later with no installs.

## FAQ

**Does Arabic really need six plural forms?**
Yes. CLDR, the data every major i18n library uses, defines zero, one, two, few, many and other for Arabic. If a form is missing, libraries fall back to `other`, so "3 days" shows the form meant for 100.

**Should I use Arabic-Indic digits (١٢٣) or Latin digits (123)?**
It depends on the market and the product. Gulf apps mostly use Latin digits; Egypt and the Levant read Arabic-Indic naturally. The skill makes it one explicit setting so it stays consistent.

**Why do my dates show the Hijri calendar on some machines?**
Older ICU versions and some browsers default `ar-SA` to the Islamic calendar; newer ones default to Gregorian. The skill always sets the calendar explicitly with `-u-ca-gregory` or `-u-ca-islamic-umalqura`.

**Can it translate everything with machine translation?**
It can draft, and it marks the result as a draft. Plurals and gender are where machine output usually fails, so the skill lists what a fluent reviewer should check.

**Does it change my layout to right-to-left?**
It sets `lang` and `dir` on the root and loads an Arabic font. The full layout fix (logical CSS, mirrored icons, mixed text) is the job of the **rtl-ui** skill.
