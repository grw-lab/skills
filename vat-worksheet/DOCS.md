# VAT worksheet

## What it does

Adds up sales VAT and purchase VAT from a CSV. VAT due is sales VAT minus purchase VAT. If a row already has a VAT figure, that figure is kept. 15% is used only when VAT is missing.

## When to use it

A spreadsheet of invoices that needs one set of VAT totals before an accountant reviews it.

## Install

This installs **vat-worksheet** only. The first line is once per machine.

```
/plugin marketplace add grw-lab/skills
/plugin install vat-worksheet@grw-lab
```

To install every grw—lab skill instead, use this as line 2:

```
/plugin install grw-skills@grw-lab
```

On claude.ai, zip this folder and add it under Settings, Capabilities, Skills. In Cursor, copy `SKILL.md` into the project skills folder.

Needs Python 3.9 or newer. No extra packages.

## Usage

```bash
python scripts/vat_worksheet.py lines.csv --out summary.csv
```

`kind` is `sale` or `purchase`. Each row needs `net` or `gross`. Optional: `vat`, `vat_rate` (default `0.15`), `note`.

## Example

A sale of net `1000` with VAT `150`, a purchase of net `200` with VAT left empty, and a sale whose gross is `115` become sales VAT `165.00`, purchase VAT `30.00`, and VAT due `135.00`.

## What's inside

`scripts/vat_worksheet.py` writes `summary.csv` with sales, purchases, VAT due, and the line count.

## FAQ

**Does this file the return?**
No. It is a worksheet. It is not a ZATCA submission and it is not tax advice.

**Why not use the e-invoice skill?**
zatca-invoice builds one invoice and rounds by VAT category. This skill sums lines you already have.
