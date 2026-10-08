# hreflang for Arabic and bilingual sites

## Codes

`language` or `language-REGION`. Language is ISO 639-1 (`ar`, `en`, `fr`). Region is ISO 3166-1 alpha-2 (`SA`, `AE`, `EG`). Plus the special value `x-default`.

| Want | Code | Wrong |
|---|---|---|
| Arabic, any country | `ar` | `ar-AR` (AR is Argentina), `ara`, `arabic` |
| Arabic for Saudi Arabia | `ar-SA` | `ar_SA`, `ar-KSA`, `sa` |
| Arabic for the UAE | `ar-AE` | `ar-UAE` |
| Arabic for Egypt | `ar-EG` | `eg` (region alone is invalid) |
| English for Saudi Arabia | `en-SA` | `sa-en` (order is language-REGION) |
| English for the UK | `en-GB` | `en-UK` |
| Fallback | `x-default` | `default`, `x_default` |

Common Arab regions: SA Saudi Arabia, AE UAE, KW Kuwait, QA Qatar, BH Bahrain, OM Oman, EG Egypt, JO Jordan, LB Lebanon, IQ Iraq, MA Morocco, DZ Algeria, TN Tunisia, LY Libya, SD Sudan, YE Yemen, PS Palestine, SY Syria.

Codes are case-insensitive, but the convention is lowercase language and uppercase region.

## The rules

1. **Self-reference.** Every page lists itself as well as its alternates.
2. **Reciprocity.** If A lists B, then B must list A. One-way links are ignored.
3. **Canonical URLs only.** Every URL in a set returns 200 and is self-canonical. Do not point hreflang at redirects, noindex pages, or pages that canonical elsewhere.
4. **One URL per code.** Two URLs with `ar-SA` in one set is an error.
5. **x-default** points at the page for everyone else: a language picker, or the default market's version.
6. **Equivalent pages.** The Arabic pricing page points to the English pricing page, not the English home page.

## Example: Arabic for all, Saudi-specific Arabic, English

On every one of the three pages, the same block:

```html
<link rel="alternate" hreflang="ar" href="https://example.com/ar/pricing/">
<link rel="alternate" hreflang="ar-SA" href="https://example.com/ar-sa/pricing/">
<link rel="alternate" hreflang="en" href="https://example.com/en/pricing/">
<link rel="alternate" hreflang="x-default" href="https://example.com/en/pricing/">
```

A Saudi Arabic searcher gets `/ar-sa/`. An Egyptian Arabic searcher falls back to `ar`, so `/ar/`. Everyone else gets x-default.

## Three ways to declare it (use one)

**HTML head:** shown above. Simplest for most sites.

**HTTP header:** for PDFs and other non-HTML files.

```
Link: <https://example.com/ar/guide.pdf>; rel="alternate"; hreflang="ar", <https://example.com/en/guide.pdf>; rel="alternate"; hreflang="en"
```

**XML sitemap:** best for large sites. Each `<url>` lists all alternates, including itself.

```xml
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
	<url>
		<loc>https://example.com/ar/pricing/</loc>
		<xhtml:link rel="alternate" hreflang="ar" href="https://example.com/ar/pricing/"/>
		<xhtml:link rel="alternate" hreflang="en" href="https://example.com/en/pricing/"/>
		<xhtml:link rel="alternate" hreflang="x-default" href="https://example.com/en/pricing/"/>
	</url>
	<url>
		<loc>https://example.com/en/pricing/</loc>
		<xhtml:link rel="alternate" hreflang="ar" href="https://example.com/ar/pricing/"/>
		<xhtml:link rel="alternate" hreflang="en" href="https://example.com/en/pricing/"/>
		<xhtml:link rel="alternate" hreflang="x-default" href="https://example.com/en/pricing/"/>
	</url>
</urlset>
```

## lang, dir and hreflang are different jobs

- `hreflang` tells search engines which URL to show to which audience.
- `<html lang="ar">` tells browsers, screen readers and translation tools what language the page is in. Google has said it identifies language from the visible content and does not rely on `lang`. Other engines and tools may use it. Set it correctly anyway.
- `dir="rtl"` controls layout. It has no SEO meaning by itself, but a broken RTL layout hurts engagement.
- Open Graph uses an underscore form: `<meta property="og:locale" content="ar_AR">` plus `og:locale:alternate` for the other languages.

## Common errors this skill's script reports

- Underscore codes (`ar_SA`).
- `ar-AR`, `en-UK` and other wrong regions.
- Missing self-reference.
- Not reciprocal (one side forgot the other).
- An alternate that redirects or returns 404.
- An Arabic page whose canonical points to the English page. This is the most damaging one, because the Arabic page drops out of the index.
- An Arabic page without `dir="rtl"` (warning).
- No x-default (warning).
