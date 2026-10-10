## What it does

Arabic SEO gets Arabic and bilingual pages indexed in the right language, shown in the right country, and found for the words people actually type. It covers:

- hreflang for `ar`, `ar-SA`, `ar-EG` and friends, with x-default and reciprocity. An included script checks a whole language cluster from one URL.
- Bilingual site structure: subfolders, country versions, and why you should never auto-redirect by IP.
- Keyword research across dialects and spelling variants (`أسعار` / `اسعار`, `بكم` / `بكام`), Arabizi, and mixed Arabic and English queries.
- Arabic titles, descriptions and slugs, and the tradeoff between Arabic and English URLs.
- Local signals for Saudi Arabia, the Gulf and Egypt: currency, phone formats, Google Business Profile, ccTLDs, and schema with `inLanguage`.
- Arabic font performance and the RTL bugs that make visitors leave.

## When to use it

- You are launching an Arabic version of a site, or a Saudi, Gulf or Egyptian version.
- Search Console reports hreflang errors, or Arabic users land on the English page.
- Your Arabic pages are indexed but don't rank for the phrasing your market uses.
- You need titles, meta descriptions and slugs for Arabic pages.

## Install

This installs **arabic-seo** only. The other skills stay out.

1. Open Claude Code.
2. Paste line 1 and press Enter. This adds the catalog. Do it once, then skip it next time.
3. Paste line 2 and press Enter. This installs this skill.

```text
/plugin marketplace add grw-lab/skills
/plugin install arabic-seo@grw-lab
```

Claude confirms the install in the chat. The next message can use the skill.

Every skill instead: keep line 1, and use this as line 2:

```text
/plugin install grw-skills@grw-lab
```

On claude.ai, zip the `arabic-seo` folder and upload it in Settings → Capabilities → Skills.

In Cursor or another agent, point it at `arabic-seo/SKILL.md`.

## Usage

- "We're adding an Arabic version for Saudi Arabia. Plan the URL structure and hreflang."
- "Check hreflang on https://example.com/ar/ and fix what's wrong."
- "Write Arabic titles and meta descriptions for these 10 product pages, for Saudi searchers."
- "Our Arabic pages aren't ranking. Audit them."

Run the checker on its own:

```bash
node ~/.claude/skills/arabic-seo/scripts/hreflang-check.mjs https://example.com/ar/
node ~/.claude/skills/arabic-seo/scripts/hreflang-check.mjs --sitemap https://example.com/sitemap.xml --limit 100
```

## Example

A three-page cluster with typical mistakes:

```
hreflang check · 3 page(s)

  200  ar-SA      lang=ar     dir=rtl  https://example.com/ar/
  200  en         lang=en     dir=-    https://example.com/en/
  200  ar-AR      lang=ar     dir=-    https://example.com/eg/

  ERROR https://example.com/ar/
        "ar_EG" uses an underscore. Use a hyphen: ar-EG.
  ERROR https://example.com/ar/
        not reciprocal: https://example.com/eg/ (ar_EG) does not link back.
  ERROR https://example.com/eg/
        canonical points elsewhere (https://example.com/ar/). A page in a hreflang set must be self-canonical, or Google drops it.
  ERROR https://example.com/eg/
        "ar-AR": AR is Argentina. For Arabic with no region use plain "ar".
  WARN  https://example.com/eg/
        no x-default. Add one for users whose language or region you don't target.
  WARN  https://example.com/eg/
        Arabic page without <html dir="rtl">.

  4 error(s), 2 warning(s)
```

The fix the skill applies on every page in the set:

```html
<link rel="alternate" hreflang="ar" href="https://example.com/ar/">
<link rel="alternate" hreflang="ar-EG" href="https://example.com/eg/">
<link rel="alternate" hreflang="en" href="https://example.com/en/">
<link rel="alternate" hreflang="x-default" href="https://example.com/en/">
```

A title before and after, for a Riyadh clinic:

```
Before: Al Noor Clinic - Home
After:  احجز موعد أسنان في الرياض | عيادة النور
```

## What's inside

| File | What it's for |
|---|---|
| `SKILL.md` | The workflow: map versions, fix hreflang, heads, keywords, titles and slugs, schema, performance, local signals, verify. |
| `references/hreflang.md` | Valid and invalid codes, reciprocity, x-default, HTML, header and sitemap methods. |
| `references/keywords.md` | Dialect and spelling variants, Arabizi, digits, and research steps per country. |
| `references/local.md` | Saudi, Gulf and Egypt formats, the ccTLD decision, Google Business Profile, schema examples. |
| `references/performance.md` | Subsetting Arabic fonts, avoiding layout shift, RTL bugs that hurt engagement. |
| `scripts/hreflang-check.mjs` | Node 18+, no dependencies. Follows alternates from any URL or sitemap and reports errors. Exits non-zero on errors. |

## FAQ

**Arabic slugs or English slugs?**
Both work for Google. Arabic slugs match the query but turn into long `%D8%…` strings when shared. English slugs are clean and stable. The skill defaults to English for product and SaaS sites and Arabic for article sites, and says to pick one rule and keep it.

**Should I make separate pages for Saudi and Egyptian Arabic?**
Only when the content really differs: prices, currency, delivery, legal terms or dialect. Otherwise one `/ar/` page targeting `ar` is stronger than two thin copies.

**Does Google treat أ and ا as the same letter?**
Often, but not always, and not equally for every query. The skill tells you to compare live results for each variant in the target country instead of assuming.

**Can I redirect Arabic-speaking visitors automatically?**
Don't. Googlebot mostly crawls without a language preference from the US, so it would never see your Arabic pages. Show a suggestion banner and let people choose.

**Does this fix my RTL layout?**
It flags the RTL problems that hurt engagement. For a full layout fix, use the `rtl-ui` skill.
