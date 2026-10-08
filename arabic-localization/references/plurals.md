# Arabic plurals

Read this when writing or reviewing any message that contains a count.

## The six categories

Arabic uses all six CLDR plural categories. The rules (CLDR, unchanged for many releases):

| Category | Rule | Numbers |
|---|---|---|
| `zero` | n = 0 | 0 |
| `one` | n = 1 | 1 |
| `two` | n = 2 | 2 |
| `few` | n % 100 = 3..10 | 3–10, 103–110, 1003–1010, … |
| `many` | n % 100 = 11..99 | 11–99, 111–199, 1011–1099, … |
| `other` | everything else | 100–102, 200–202, 1000–1002, all decimals |

Checked with `Intl.PluralRules('ar')` in Node 22 (ICU 77.1, CLDR 47). Run `scripts/plural-table.mjs` to see your own runtime.

Traps:

- `few` and `many` repeat every hundred. 103 is `few`, 111 is `many`, 100 and 101 and 102 are `other`. A Laravel range like `[3,10]` or a hand-written `if (n <= 10)` gets 103 wrong.
- Every decimal is `other`: 1.5, 2.5, 10.5. Prices and ratings with decimals always land in `other`.
- `zero` is a real category in Arabic, not a special case. Write it.
- Arabic ordinals have only `other`. Ordinal words (الأول، الثاني، الثالث…) change with gender and have no plural forms, so use `select` on gender or avoid ordinals in UI.

## What each form looks like

The counted noun changes form. Using "message" (رسالة) and "day" (يوم):

| Category | Pattern | Message | Day |
|---|---|---|---|
| `zero` | no number, a phrase | لا توجد رسائل | انتهت المدة |
| `one` | noun + واحد/واحدة, or noun alone | رسالة واحدة | يوم واحد |
| `two` | dual noun, no number | رسالتان | يومان |
| `few` (3–10) | number + plural noun (genitive) | ٣ رسائل | ٣ أيام |
| `many` (11–99) | number + singular noun (accusative, tanwin) | ١١ رسالةً | ١١ يومًا |
| `other` (100+) | number + singular noun (genitive) | ١٠٠ رسالة | ١٠٠ يوم |

Notes:

- In `one` and `two`, Arabic does not show the digit. "1 رسالة" and "2 رسالتان" read as machine output.
- After a preposition the dual changes case: إلى فريقين، من رسالتين. Write the dual in the case the sentence needs.
- Number words (ثلاثة/ثلاث) flip gender against the noun. Show digits, not number words, unless a writer reviews every string.
- Tanwin on `many` (يومًا) is correct and expected. Keep it.

## i18next (v21+ JSON format)

```json
{
  "unread_zero": "لا توجد رسائل غير مقروءة",
  "unread_one": "لديك رسالة واحدة غير مقروءة",
  "unread_two": "لديك رسالتان غير مقروءتين",
  "unread_few": "لديك {{count}} رسائل غير مقروءة",
  "unread_many": "لديك {{count}} رسالة غير مقروءة",
  "unread_other": "لديك {{count}} رسالة غير مقروءة"
}
```

Call `t('unread', { count })`. i18next picks the suffix with `Intl.PluralRules`. Ordinals: `t('place', { count, ordinal: true })` reads `place_ordinal_other` for Arabic.

Older projects on `compatibilityJSON: 'v3'` use `_0` … `_5` suffixes instead. i18next v24 and later accept only the v4 format, so migrate the keys (the i18next-v4-format-converter tool does it) before upgrading or adding Arabic.

## ICU MessageFormat (FormatJS, next-intl, Flutter, many TMS tools)

```
{count, plural,
  =0 {لا توجد رسائل غير مقروءة}
  one {لديك رسالة واحدة غير مقروءة}
  two {لديك رسالتان غير مقروءتين}
  few {لديك # رسائل غير مقروءة}
  many {لديك # رسالة غير مقروءة}
  other {لديك # رسالة غير مقروءة}
}
```

- `#` prints the number, formatted for the locale (Arabic-Indic digits under `ar-SA`, Latin under `ar`).
- `=0` matches exactly 0. For Arabic it covers the same numbers as `zero`. Either works; `scripts/check-plurals.mjs` accepts both.
- `other` is required by ICU. A message without it is invalid.

## Gender and plurals together

Nest `select` outside `plural`:

```
{gender, select,
  female {دعتك {name} إلى {count, plural, one {فريق واحد} two {فريقين} few {# فرق} many {# فريقًا} other {# فريق}}}
  other {دعاك {name} إلى {count, plural, one {فريق واحد} two {فريقين} few {# فرق} many {# فريقًا} other {# فريق}}}
}
```

Every branch needs all six plural forms. The checker reports each nested block separately.

## Checking

```bash
node scripts/check-plurals.mjs --source locales/en/common.json locales/ar/*.json
```

It reports missing suffixes, ICU blocks missing categories, and strings that are plural in English but a single string in Arabic. Exit code 1 when anything is missing, so it can run in CI.
