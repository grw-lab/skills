---
name: product-sheet
description: Turns a raw product CSV into a merchant sheet with a clean slug and a VAT split at the given rate, default 15%. Use when a shop has a spreadsheet of names and prices and needs price excluding VAT, VAT, price including VAT, and a URL slug. The agent writes Arabic titles and short descriptions; the script does the numbers. Not a ZATCA e-invoice.
---

# Product sheet

Build a sheet a merchant can review before uploading it to a store. The script does slugs and VAT. You write the Arabic title and the one-line description.

## When to use

- A CSV of product names and prices needs a clean sheet.
- The user asks for Arabic product titles, a short description, or a slug.

## When not to use

- They need a Saudi e-invoice, a QR code, or a ZATCA submission. Use zatca-invoice.
- They want you to publish into a store dashboard. Hand them the CSV. Do not invent an API.

## Workflow

1. Confirm the columns. Required: `name`, `price`. Optional: `sku`, `vat_rate` (default `0.15`), `price_includes_vat` (`yes` or `no`), `description`.
2. Run the script. It writes the numbers and the slug. It does not translate.

```bash
python scripts/product_sheet.py products.csv --out sheet.csv
```

3. Open `sheet.csv`. For each row, write `title_ar` and `summary_ar` in the merchant's dialect. One sentence for the summary. Keep the product facts that are in the source. Do not add materials, sizes, or claims that are not there.
4. Slugs stay as the script wrote them unless two products would be confused. Arabic letters and hyphens are fine.
5. Show the sheet and say which prices already included VAT.

## Rules

- Standard rate in the script is 15% only when `vat_rate` is empty. If they say a row is zero-rated or exempt, set `vat_rate` to `0`. Do not "correct" that to 15%.
- When `price_includes_vat` is `yes`, net is gross / (1 + rate), rounded half-up to 0.01, and VAT is gross minus net.
- Do not invent stock, shipping, or compare-at prices.

## Done check

- Every source row is in the sheet.
- `price_ex_vat + vat` equals `price_inc_vat` on each row.
- Arabic lines do not add a fact the CSV did not have.
