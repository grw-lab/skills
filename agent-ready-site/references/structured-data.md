# Structured data and catalog.json

## JSON-LD essentials

Put one `<script type="application/ld+json">` in the head with an `@graph`. Use `@id`s so nodes can reference each other.

Every site:

```json
{
	"@context": "https://schema.org",
	"@graph": [
		{
			"@type": "WebSite",
			"@id": "https://acme.com/#website",
			"url": "https://acme.com/",
			"name": "Acme",
			"description": "Invoicing for freelancers in the Gulf.",
			"inLanguage": "en",
			"publisher": { "@id": "https://acme.com/#organization" }
		},
		{
			"@type": "Organization",
			"@id": "https://acme.com/#organization",
			"name": "Acme",
			"url": "https://acme.com/",
			"logo": "https://acme.com/logo-512.png",
			"sameAs": ["https://github.com/acme", "https://x.com/acme"]
		}
	]
}
```

Add per page type:

| Page | Type | Key fields |
|---|---|---|
| Product or app | `SoftwareApplication` | name, description, applicationCategory, operatingSystem, offers (price, priceCurrency) |
| Open-source tool, skill, library | `SoftwareSourceCode` | name, description, codeRepository, license, programmingLanguage, version, dateModified |
| Article, guide, changelog entry | `Article` / `TechArticle` | headline, datePublished, dateModified, author |
| List or index page | `CollectionPage` + `ItemList` | itemListElement with position and url |
| Any inner page | `BreadcrumbList` | itemListElement with name and item |
| Q&A section | `FAQPage` | mainEntity of Question/acceptedAnswer. Use only if the questions are visible on the page. |

Rules:

- Mark up only what is visible on the page.
- Escape `</` as `<\/` inside the script tag.
- Prices must be strings or numbers without currency symbols, with `priceCurrency` set separately (`"SAR"`, `"USD"`).
- Validate with the Schema.org validator (validator.schema.org) and Google's Rich Results Test.

## catalog.json

A plain JSON index of what the site offers, for agents that want data, not prose. Serve it at `/catalog.json` and link it from llms.txt and the `Link` header. Example (the shape tools.grwlab.net uses):

```json
{
	"name": "Acme tools",
	"description": "Free and paid tools from Acme.",
	"url": "https://acme.com/",
	"publisher": { "name": "Acme", "url": "https://acme.com/" },
	"updated": "2026-10-08T10:26:00+00:00",
	"products": [
		{
			"name": "Invoicer",
			"url": "https://invoicer.acme.com/",
			"status": "Live",
			"description": "Send ZATCA-ready invoices in two minutes."
		}
	],
	"skills": [
		{
			"slug": "rtl-ui",
			"name": "RTL UI",
			"summary": "Fixes right-to-left layouts.",
			"url": "https://acme.com/skills/rtl-ui/",
			"markdown": "https://acme.com/skills/rtl-ui/index.md",
			"repository": "https://github.com/acme/skills",
			"license": "MIT",
			"updated": "2026-10-01T09:00:00+00:00"
		}
	]
}
```

Keep keys stable once published. Add fields, do not rename them. Agents and scripts will depend on the shape.

## Sitemap

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
	<url>
		<loc>https://acme.com/pricing/</loc>
		<lastmod>2026-10-01</lastmod>
	</url>
</urlset>
```

- `lastmod` must be the date the content really changed, not the build date. Search engines ignore it if it is always "today".
- List canonical HTML URLs only. Leave out the `.md` twins, because they are alternates.
- Reference it from robots.txt with `Sitemap: https://…/sitemap.xml`.
