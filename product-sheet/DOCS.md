# Product sheet

## What it does

Turns a product CSV into a sheet with a slug, price excluding VAT, VAT, and price including VAT. You write the Arabic title and the short description. The script does the numbers.

## When to use it

A shop spreadsheet of names and prices that needs a clean sheet before anyone uploads it.

## Install

This installs **product-sheet** only. The first line is once per machine.

```
/plugin marketplace add grw-lab/skills
/plugin install product-sheet@grw-lab
```

To install every grw—lab skill instead, use this as line 2:

```
/plugin install grw-skills@grw-lab
```

On claude.ai, zip this folder and add it under Settings, Capabilities, Skills. In Cursor, copy `SKILL.md` into the project skills folder.

Needs Python 3.9 or newer. No extra packages.

## Usage

```bash
python scripts/product_sheet.py products.csv --out sheet.csv
```

Required columns: `name`, `price`. Optional: `sku`, `vat_rate` (default `0.15`), `price_includes_vat` (`yes` or `no`), `description`.

## Example

A row `قهوة مختصة` at `115` with `price_includes_vat` set to `yes` becomes slug `قهوة-مختصة`, net `100.00`, VAT `15.00`, gross `115.00`. A row `Desk lamp` at `100` excluding VAT becomes net `100.00`, VAT `15.00`, gross `115.00`.

## What's inside

`scripts/product_sheet.py` writes the sheet. The agent adds `title_ar` and `summary_ar` without inventing facts.

## FAQ

**Is this a ZATCA invoice?**
No. It is a price sheet. E-invoices are the zatca-invoice skill.

**Can it upload to the store?**
No. You review the CSV and upload it yourself.
