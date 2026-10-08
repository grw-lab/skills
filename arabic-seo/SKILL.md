---
name: arabic-seo
description: SEO for Arabic and bilingual Arabic/English websites. Covers Arabic keyword research (dialect versus MSA, spelling variants, Arabizi), hreflang for ar, ar-SA, ar-EG with x-default and reciprocity, html lang and dir, Arabic versus transliterated slugs, title and meta length in Arabic, schema with inLanguage, Arabic numerals, local signals for Saudi Arabia, the Gulf and Egypt, bilingual site architecture, canonical pitfalls between language versions, and Arabic font performance for Core Web Vitals. Includes an hreflang checker script. Use when the user builds, audits or ranks an Arabic or bilingual site, adds an Arabic version, targets Saudi, Gulf or Egyptian search, or mentions hreflang, Arabic keywords, Arabic slugs or RTL SEO.
---

# Arabic SEO

Get Arabic and bilingual pages indexed under the right language, shown to the right country, and found for the words people actually type.

## When to use

- An Arabic or Arabic/English site is being built, migrated, or audited.
- A site is adding an Arabic version, or a Saudi, Gulf or Egyptian version.
- Arabic pages are not ranking, show the English version to Arabic users, or have hreflang errors in Search Console.
- The user asks for Arabic keywords, titles, slugs or meta descriptions.

## When not to use

- Translating interface text. Use a localization skill (for example `arabic-localization`) and come back for the SEO layer.
- Fixing RTL layout bugs. Use `rtl-ui`. This skill only covers RTL issues that affect search and user experience signals.

## Workflow

1. **Map the site.** List each language and country version and its URL pattern. If there is no structure yet, recommend one (see Architecture).
2. **Check hreflang.** Run `node scripts/hreflang-check.mjs https://site/ar/` (or `--sitemap https://site/sitemap.xml`). Fix every ERROR. Rules: `references/hreflang.md`.
3. **Check each Arabic page's head:** `<html lang="ar" dir="rtl">` (or `ar-SA` and so on), self-canonical, Arabic `<title>` and description, Open Graph `og:locale` `ar_AR` or `ar_SA` style (Open Graph uses an underscore, unlike hreflang).
4. **Research keywords per market, not per language.** Saudi and Egyptian users phrase the same need differently. See `references/keywords.md`.
5. **Write titles, descriptions and slugs** with the rules below.
6. **Structured data:** set `inLanguage` on WebSite, WebPage, Article and Product. Write `name` and `description` in the page's language. Use local currency and phone formats. See `references/local.md`.
7. **Performance:** subset and preload Arabic fonts, and prevent layout shift. See `references/performance.md`.
8. **Local signals:** Google Business Profile in Arabic and English, local phone, address and currency, ccTLD or subfolder decision. See `references/local.md`.
9. **Verify** with the checklist and re-run the hreflang script.

## Architecture (recommended default)

```
https://example.com/ar/      Arabic, all countries (or /ar-sa/ when content is Saudi-specific)
https://example.com/en/      English
https://example.com/         x-default: language picker, or the main market's version
```

- Subfolders keep one domain's authority and are simple to run. Use a ccTLD (`example.sa`, `example.com.sa`) only when the business is local to one country and can meet the registry's rules.
- Split by country (`/ar-sa/`, `/ar-eg/`) only when content really differs: prices, currency, delivery, legal terms, dialect. Otherwise one `/ar/` targeting `ar` is stronger than thin copies.
- Never auto-redirect by IP or `Accept-Language`. Googlebot mostly crawls from the US without a language preference, so it would only ever see one version. Show a dismissible "View in Arabic" banner instead.
- Keep the language switcher as real `<a href>` links to the equivalent page, not to the other language's home page.

## Titles, descriptions, slugs

- Google truncates titles by pixel width, not characters. Arabic letters join and widths vary, so count nothing. Put the main keyword first and the brand last (`احجز موعدك أونلاين | عيادة النور`), then check the result in a SERP preview or live in Search Console.
- Descriptions: one or two natural sentences in the target dialect register. Google often rewrites them, so make the first 120 or so characters count.
- Mixed Arabic and English in a title (brand names, product codes) can reorder visually. Use separators with spaces on both sides (`|`, `-`), and check how the title renders in the result.
- Slugs, three options:
  - Arabic (`/ar/حجز-موعد/`) matches the query and Google reads it fine. When copied, it becomes a long percent-encoded string (`%D8%AD%D8%AC%D8%B2-...`) in many apps and analytics tools.
  - English (`/ar/book-appointment/`) is clean to share and stable across languages. It gives a small relevance signal to the English word, not the Arabic one.
  - Transliterated (`/ar/hajz-maweed/`) gets the worst of both. Avoid it.
  - Default: English slugs for product, app and SaaS sites, and Arabic slugs for content and article sites where the slug is the query. Pick one rule and keep it. Never mix both styles on one site.
- Use hyphens, never spaces or underscores. Strip diacritics (tashkeel) and tatweel (ـ) from slugs.

## Content rules that affect ranking

- Write for one register per market: Modern Standard Arabic (فصحى) for formal content, with the market's common words in headings and FAQs where people search that way.
- Cover spelling variants naturally in the text (for example `اسعار` and `أسعار`). Do not stuff lists of variants into the page.
- Numbers: Saudi and Gulf sites commonly use Western digits (0-9) in prices, phone numbers and dates, and many people type them in searches. Pick one system per site and use it consistently. Keep machine-readable values (schema, `tel:` links, prices in markup) in Western digits.
- Keep Arabic text as real text. Never put it inside images, because it cannot be indexed or read aloud.

## Verify before you say it's done

- [ ] `node scripts/hreflang-check.mjs <arabic url>` shows 0 errors. Warnings are explained or fixed.
- [ ] Every language version is self-canonical, and no Arabic page canonicals to the English one.
- [ ] Arabic pages have `lang="ar…"` and `dir="rtl"` on `<html>`.
- [ ] The sitemap lists every language version. Optionally add `xhtml:link` alternates in the sitemap instead of the HTML head, but use only one method.
- [ ] No IP or language auto-redirects. The switcher links to equivalent pages.
- [ ] Titles lead with the keyword in the target market's phrasing.
- [ ] Arabic web font is subset, uses `font-display: swap`, and the page has no visible layout shift when it loads.
- [ ] Structured data has `inLanguage`, local currency and phone in E.164 format (`+966…`).

## References

- `references/hreflang.md`: codes, reciprocity, x-default, the three placement methods, common errors. Read in step 2.
- `references/keywords.md`: dialects, spelling variants, Arabizi, tools and research steps. Read in step 4.
- `references/local.md`: Saudi, Gulf and Egypt local signals, currency, phone, schema examples. Read in steps 6 and 8.
- `references/performance.md`: Arabic font subsetting, loading, CLS, RTL issues that hurt UX signals. Read in step 7.
- `scripts/hreflang-check.mjs`: `node scripts/hreflang-check.mjs <url...> | --sitemap <url> [--limit N] [--json]`.
