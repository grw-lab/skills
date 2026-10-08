# Local signals: Saudi Arabia, the Gulf, Egypt

## Formats

| Country | Currency (ISO) | Common display | Phone (E.164) |
|---|---|---|---|
| Saudi Arabia | SAR | `ر.س` or `SAR`, plus the riyal sign U+20C1 where fonts support it | `+966 5X XXX XXXX` (mobile) |
| UAE | AED | `د.إ` or `AED` | `+971 5X XXX XXXX` |
| Kuwait | KWD | `د.ك` or `KWD` | `+965 XXXX XXXX` |
| Qatar | QAR | `ر.ق` or `QAR` | `+974 XXXX XXXX` |
| Bahrain | BHD | `د.ب` or `BHD` | `+973 XXXX XXXX` |
| Oman | OMR | `ر.ع.` or `OMR` | `+968 XXXX XXXX` |
| Egypt | EGP | `ج.م` or `EGP` | `+20 1X XXXX XXXX` (mobile) |

- The Saudi Central Bank (SAMA) introduced an official riyal symbol in February 2025. Unicode 17.0 (September 2025) encodes it as U+20C1 SAUDI RIYAL SIGN; it is not U+FDFC (﷼, the generic rial sign). Many fonts and devices cannot show it yet. Unless your web font includes U+20C1, show `ر.س` or `SAR` next to it, or instead of it. Search engines index the text, so keep `ر.س` or `SAR` in prices you want matched.
- In markup (schema, `tel:` links, price attributes) always use ISO codes, E.164 numbers and Western digits.
- `tel:` links: `<a href="tel:+966500000000">050 000 0000</a>`. Wrap visible phone numbers in `<bdi>` or `dir="ltr"` so they do not reverse inside Arabic text.

## Domain choice

- **ccTLD** (`.sa`, `.com.sa`, `.ae`, `.eg`) is a strong country signal and builds local trust. Registries have eligibility rules (for `.sa`, generally a Saudi entity or a local presence), so check the current rules with the registry or a registrar before promising one.
- **Subfolder on a gTLD** (`example.com/ar-sa/`) is easier to run for multi-country businesses. Combine it with hreflang. Search Console's country targeting setting no longer exists, so hreflang and on-page signals carry this.

## Google Business Profile

- One profile per real location. Business name exactly as on the signage. Do not add keywords to the name.
- Fill Arabic and English: the description, services, products and posts.
- Categories, hours (including Ramadan and Eid hours as special hours), phone with country code, and the website link to the right language version (`/ar/`).
- Ask for reviews in both languages. Reply in the reviewer's language.
- Keep the name, address and phone identical on the site, the profile, and directories.

## Schema examples

Local business, Arabic page:

```json
{
	"@context": "https://schema.org",
	"@type": "Dentist",
	"@id": "https://example.com/ar/#clinic",
	"name": "عيادة النور لطب الأسنان",
	"alternateName": "Al Noor Dental Clinic",
	"inLanguage": "ar",
	"url": "https://example.com/ar/",
	"telephone": "+966112345678",
	"priceRange": "$$",
	"address": {
		"@type": "PostalAddress",
		"streetAddress": "طريق الملك فهد",
		"addressLocality": "الرياض",
		"postalCode": "12345",
		"addressCountry": "SA"
	},
	"openingHoursSpecification": [{
		"@type": "OpeningHoursSpecification",
		"dayOfWeek": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
		"opens": "09:00",
		"closes": "21:00"
	}]
}
```

The Saudi work week runs Sunday to Thursday. Make sure the opening hours reflect the real local schedule.

Product price:

```json
"offers": { "@type": "Offer", "price": "149.00", "priceCurrency": "SAR", "availability": "https://schema.org/InStock" }
```

## Dates

Gregorian dates are standard for search and schema (ISO 8601). If the audience expects Hijri dates, show them next to the Gregorian date in visible text, but keep `datePublished` and `dateModified` in ISO Gregorian.
