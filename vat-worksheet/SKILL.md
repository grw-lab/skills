---
name: vat-worksheet
description: Sums sales and purchase lines from a CSV into a VAT worksheet. Sales VAT minus purchase VAT is the amount due. Use when someone has a spreadsheet of invoices and wants the VAT totals at 15% or at the rate on each row. Rounds half-up to 0.01 per line. A worksheet for review, not a filed return and not tax advice.
---

# VAT worksheet

Add up the VAT already on a list of sales and purchases. Compute 15% only when a row has a net amount and no VAT figure.

## When to use

- A CSV of sales and purchases needs one VAT total.
- The user asks what VAT is due from a spreadsheet.

## When not to use

- Building or validating a ZATCA e-invoice. Use zatca-invoice. That skill rounds by VAT category, which is a different rule from summing lines.
- Deciding whether a supply is taxable. Ask a Saudi tax adviser. Do not guess.

## Workflow

1. Use columns `kind` (`sale` or `purchase`) and either `net` or `gross`. Optional: `vat`, `vat_rate` (default `0.15`), `note`.
2. If `vat` is filled, keep it. If it is empty and `net` is filled, VAT is net × rate, half-up to 0.01. If only `gross` is filled, net is gross / (1 + rate), and VAT is gross minus net.
3. Run:

```bash
python scripts/vat_worksheet.py lines.csv --out summary.csv
```

4. Report sales net, sales VAT, purchases net, purchases VAT, and VAT due. VAT due = sales VAT − purchase VAT. Say when the number is negative.
5. Say this is a worksheet. It does not file anything.

## Rules

- Do not drop a line because it looks small.
- Do not change a VAT amount that was already on the row.
- Rate `0` means no VAT on that row. Do not replace it with 15%.

## Done check

- The line count in the summary matches the CSV.
- VAT due equals sales VAT minus purchase VAT.
- The reply says this is not a filed return.
