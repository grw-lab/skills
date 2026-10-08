# Framework recipes

Read the section for the stack you are working in. Each recipe covers: turning Arabic on, plurals, and direction. Check the project's installed version before copying; APIs below are for current major versions.

## i18next / react-i18next

```js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n.use(initReactI18next).init({
  lng: "ar",
  fallbackLng: "en",
  supportedLngs: ["en", "ar"],
  resources: { en: { common: en }, ar: { common: ar } },
  interpolation: { escapeValue: false }, // React already escapes
});

i18n.on("languageChanged", (lng) => {
  document.documentElement.lang = lng;
  document.documentElement.dir = i18n.dir(lng); // "rtl" for ar
});
```

- Plurals: v21+ suffixes `_zero _one _two _few _many _other`. See `plurals.md`. A `_zero` key is also used for `count: 0` in every language, not only Arabic.
- i18next v24+ accepts only the v4 JSON format and needs `Intl.PluralRules` with no fallback. Add a polyfill (for example `intl-pluralrules`) on runtimes that lack it.
- `i18n.dir("ar")` returns `"rtl"`. Use it instead of hard-coding a list of RTL languages.
- Formatting: i18next v21.3+ has built-in `{{val, number}}`, `{{val, currency(SAR)}}` and `{{val, datetime}}` formatters backed by `Intl`. They use the active language code, so set `lng` to a regional locale like `ar-SA` (or pass `lng` / format options) when the region changes digits or calendar.

## FormatJS / react-intl

```jsx
<IntlProvider locale="ar-SA-u-nu-latn" messages={arMessages} defaultLocale="en">
  <App />
</IntlProvider>

<FormattedMessage
  id="inbox.unread"
  defaultMessage="{count, plural, one {# unread message} other {# unread messages}}"
  values={{ count }}
/>
<FormattedNumber value={price} style="currency" currency="SAR" />
<FormattedDate value={date} dateStyle="long" calendar="islamic-umalqura" />
```

- Messages are ICU. Arabic translations need all six plural branches.
- The locale string can carry `-u-nu-` and `-u-ca-` extensions. That is the cleanest way to fix digits and calendar app-wide.
- Extract messages with `@formatjs/cli extract` and compile with `formatjs compile` for production.

## next-intl (Next.js App Router)

- Messages are ICU, one JSON file per locale (`messages/ar.json`). Plurals as in `plurals.md`.
- Add `ar` to the locales list in the routing config and serve it under `/ar`.
- In the root layout, set `<html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>`.
- Use `useFormatter()` (client) or `getFormatter()` (server) for numbers and dates so server and client output match. Pass `numberingSystem` and `calendar` in the format options, or set them once in the global `formats` config.

## vue-i18n (v9+, Vue 3)

vue-i18n uses pipe-separated plural forms and needs a rule function for Arabic. Map CLDR categories to indexes:

```js
import { createI18n } from "vue-i18n";

const ORDER = ["zero", "one", "two", "few", "many", "other"];
const arRules = new Intl.PluralRules("ar");

export const i18n = createI18n({
  legacy: false,
  locale: "ar",
  fallbackLocale: "en",
  messages: { en, ar },
  pluralRules: {
    ar: (choice) => ORDER.indexOf(arRules.select(choice)),
  },
});
```

```json
{ "unread": "لا توجد رسائل | رسالة واحدة | رسالتان | {count} رسائل | {count} رسالة | {count} رسالة" }
```

Call `t("unread", count)`. The Arabic string must have exactly six forms in that order.

## Laravel

Laravel's pluralizer already knows Arabic: with six plain forms separated by `|`, `trans_choice` picks the right one (0, 1, 2, n%100 in 3–10, n%100 in 11–99, else). Tested with `illuminate/translation` 13.35: 0, 1, 2, 3, 11, 100, 101 and 103 all get the correct form.

```php
// lang/ar/messages.php
return [
    'unread' => 'لا توجد رسائل|رسالة واحدة|رسالتان|:count رسائل|:count رسالة|:count رسالة',
];

trans_choice('messages.unread', $count, ['count' => $count]);
```

- Do not use explicit ranges like `{0}…|[3,10]…|[11,99]…|[100,*]…` for Arabic. Ranges are absolute, so 103 matches `[100,*]` and gets the `other` text instead of the `few` form (verified).
- Set `'locale' => 'ar'` in `config/app.php` or call `App::setLocale('ar')` per request. Put `dir="rtl"` on `<html>` in the layout when the locale is Arabic.
- Format numbers and dates with PHP's `intl` extension (`NumberFormatter`, `IntlDateFormatter`), which uses the same ICU data. `IntlDateFormatter` accepts locales like `ar_SA@calendar=islamic-umalqura`.

## Flutter (gen_l10n, ARB)

`l10n.yaml`:

```yaml
arb-dir: lib/l10n
template-arb-file: app_en.arb
output-localization-file: app_localizations.dart
```

`lib/l10n/app_ar.arb`:

```json
{
  "@@locale": "ar",
  "unread": "{count, plural, =0{لا توجد رسائل} =1{رسالة واحدة} =2{رسالتان} few{{count} رسائل} many{{count} رسالة} other{{count} رسالة}}",
  "@unread": { "placeholders": { "count": { "type": "num", "format": "compact" } } }
}
```

- Plural keywords: `=0`, `=1`, `=2`, `few`, `many`, `other` (only `other` is required). Declare the count placeholder as `num`.
- Add `ar` to `supportedLocales` and include `GlobalMaterialLocalizations.delegate` and `GlobalWidgetsLocalizations.delegate`. The widgets delegate supplies the text direction for the active locale, so `Directionality` becomes RTL for Arabic.
- Use `EdgeInsetsDirectional`, `AlignmentDirectional` and `start`/`end` instead of left/right.
- Numbers and dates: the `intl` package (`NumberFormat`, `DateFormat`) with the `ar` locale.

## Native platforms

- **iOS**: String Catalogs (`.xcstrings`) have per-language plural variations; Xcode shows all six for Arabic. Use leading/trailing constraints, not left/right.
- **Android**: `<plurals>` in `res/values-ar/strings.xml` with `quantity="zero|one|two|few|many|other"`. Set `android:supportsRtl="true"` and use `start`/`end` attributes.

## Direction

Turning on Arabic flips the document direction, and everything not written with logical properties breaks. Hand that work to the **rtl-ui** skill if it is available. Minimum here: set `lang="ar"` and `dir="rtl"` on the root element and check one full screen before going further.
