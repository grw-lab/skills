# Numbers, currency, dates and calendars

Read this before formatting any number, price, date or time for Arabic. Every output below was produced by Node 22.17 (ICU 77.1, CLDR 47). Browsers and older Node versions can differ, which is the main lesson: **set the numbering system and calendar explicitly** instead of trusting locale defaults.

## Digits: Latin (123) or Arabic-Indic (١٢٣)

`new Intl.NumberFormat(locale).format(1234567.89)`:

| Locale | Output | Numbering system |
|---|---|---|
| `ar` | 1,234,567.89 | latn |
| `ar-SA` | ١٬٢٣٤٬٥٦٧٫٨٩ | arab |
| `ar-EG` | ١٬٢٣٤٬٥٦٧٫٨٩ | arab |
| `ar-AE` | 1,234,567.89 | latn |
| `ar-JO`, `ar-LB`, `ar-SY`, `ar-IQ` | Arabic-Indic | arab |
| `ar-MA`, `ar-DZ`, `ar-TN` | 1.234.567,89 | latn (comma decimal) |

Plain `ar` uses Latin digits in current CLDR. Older CLDR versions used Arabic-Indic for `ar`. Do not rely on it.

Force a system with the `-u-nu-` extension:

```js
new Intl.NumberFormat("ar-SA-u-nu-latn").format(1234.5); // "1,234.5"
new Intl.NumberFormat("ar-u-nu-arab").format(1234.5);    // "١٬٢٣٤٫٥"
// or as an option
new Intl.NumberFormat("ar-SA", { numberingSystem: "latn" });
```

Choosing:

- Gulf products (Saudi, UAE, Kuwait, Qatar) mostly ship Latin digits in apps and on the web. Banks and government forms often use Arabic-Indic. Ask the client; make it one setting.
- Egypt and the Levant read Arabic-Indic digits naturally; Latin is also common online.
- Maghreb (Morocco, Algeria, Tunisia) uses Latin digits.
- Keep the choice consistent across a screen. Mixed digits look like a bug.
- Phone numbers, IBANs, order IDs, OTP codes, card numbers: always Latin digits, inside an LTR span. Users copy them into other systems.

## Parsing user input

`Number("١٢٣")` and `parseInt("١٢٣")` both return `NaN`. Users on Arabic keyboards type Arabic-Indic or Persian digits. Normalize before validating:

```js
export function toLatinDigits(value) {
  return String(value)
    .replace(/[٠-٩]/g, (d) => d.charCodeAt(0) - 0x0660) // Arabic-Indic ٠-٩
    .replace(/[۰-۹]/g, (d) => d.charCodeAt(0) - 0x06f0) // Persian ۰-۹
    .replace(/٫/g, ".")   // Arabic decimal separator ٫
    .replace(/[٬,]/g, ""); // Arabic thousands separator ٬ and comma
}
```

This assumes a dot decimal. For Maghreb locales (`ar-MA`, `ar-DZ`, `ar-TN`) the comma is the decimal separator; parse those with the locale's separators from `formatToParts()` instead.

Apply it on the server too. Never trust the client to have normalized.

## Currency

`new Intl.NumberFormat(locale, { style: "currency", currency }).format(1234.5)`:

> `[RLM]`, `[LRM]` and `[ALM]` stand for the invisible direction marks U+200F, U+200E and U+061C that ICU inserts. They are shown here so you can see them; real output contains the invisible characters. Do not strip them from formatted output, and compare strings with them in mind in tests.

| Locale + currency | Output |
|---|---|
| `ar-SA` + SAR | [RLM]١٬٢٣٤٫٥٠ ر.س.[RLM] |
| `ar-SA-u-nu-latn` + SAR | [RLM]1,234.50 ر.س.[RLM] |
| `ar-EG` + EGP | [RLM]١٬٢٣٤٫٥٠ ج.م.[RLM] |
| `ar-AE` + AED | [RLM]1,234.50 د.إ.[RLM] |
| `en-SA` + SAR | SAR 1,234.50 |

- The symbol comes after the number in Arabic locales.
- The output contains invisible RIGHT-TO-LEFT MARKs (U+200F) at both ends. They keep the string intact inside mixed text. Do not strip them, and do not compare formatted strings in tests by literal text; compare `formatToParts()` or the numeric value.
- Negative values get an ARABIC LETTER MARK (U+061C) before the minus sign.
- **Saudi riyal sign.** Saudi Arabia introduced a new riyal symbol in 2025. Unicode 17.0 (September 2025) encodes it as U+20C1 SAUDI RIYAL SIGN. It is not U+FDFC (﷼, the generic rial ligature). ICU still outputs ر.س. and most fonts do not have the glyph yet. If the client wants the new sign, render it with a font that includes U+20C1 or an SVG icon, and keep ر.س. or SAR as the accessible text. Check font coverage before shipping.

## Dates and calendars

`new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "Asia/Riyadh" })` for 8 October 2026:

| Locale | Output | Calendar |
|---|---|---|
| `ar` | 8 أكتوبر 2026 | gregory |
| `ar-SA` | ٨ أكتوبر ٢٠٢٦ | gregory |
| `ar-SA-u-ca-islamic-umalqura` | ٢٧ ربيع الآخر ١٤٤٨ هـ | islamic-umalqura |
| `ar-u-ca-islamic-umalqura` | 27 ربيع الآخر 1448 هـ | islamic-umalqura |
| `en-u-ca-islamic-umalqura` | Rabiʻ II 27, 1448 AH | islamic-umalqura |

- **Set the calendar explicitly.** In this Node build `ar-SA` defaults to Gregorian. Older ICU versions and some browsers defaulted `ar-SA` to the Islamic calendar, so the same code showed Hijri dates on some machines. Use `-u-ca-gregory` or `-u-ca-islamic-umalqura` every time.
- Umm al-Qura (`islamic-umalqura`) is the official Saudi calendar. Use it, not plain `islamic` (an arithmetic approximation) or `islamic-civil`, when showing Hijri dates to Saudi users.
- Common Saudi pattern: Gregorian as the main date, Hijri beside it for official or religious contexts. Format both from the same `Date`.
- Never convert Hijri dates by hand or with day offsets. Store dates as ISO 8601 UTC and format at display time.

Month names differ by region:

| Locale | January |
|---|---|
| `ar`, `ar-SA`, `ar-EG`, `ar-AE`, `ar-MA` | يناير |
| `ar-JO`, `ar-LB`, `ar-SY`, `ar-IQ` | كانون الثاني |
| `ar-DZ`, `ar-TN` | جانفي |

Pick the locale for the audience. A Levant audience reading يناير understands it, but the regional locale reads native.

## Time

`timeStyle: "short"` for 09:05: `ar-SA` → ٩:٠٥ ص, `ar` → 9:05 ص, `ar-MA` → 09:05. ص = AM, م = PM. Most Arab markets use the 12-hour clock in UI; the Maghreb uses 24-hour. Use `hourCycle: "h23"` to force 24-hour.

## Lists and relative time

```js
new Intl.ListFormat("ar", { type: "conjunction" }).format(["أ", "ب", "ج"]); // "أ وب وج"
new Intl.RelativeTimeFormat("ar", { numeric: "auto" }).format(-1, "day"); // "أمس"
new Intl.RelativeTimeFormat("ar").format(11, "day");                       // "خلال 11 يومًا"
```

`RelativeTimeFormat` already handles Arabic plural forms. Use it instead of building "منذ X أيام" by hand.

## Percent

`ar-SA` → ١٥٪[ALM] (Arabic percent sign U+066A plus a letter mark). `ar` → 15[LRM]%[LRM]. Format with `style: "percent"`; never concatenate "%".
