#!/usr/bin/env python3
"""Turn a product CSV into a price sheet with a clean slug and VAT split.

Usage:
  python product_sheet.py products.csv --out sheet.csv

Required columns: name, price
Optional: sku, vat_rate (default 0.15), price_includes_vat (yes or no, default no), description

Money is rounded half-up to 0.01. When the price already includes VAT, the net is
gross / (1 + rate), and VAT is gross minus that net, so the two still add up.
This is a merchant price sheet. It is not a ZATCA e-invoice.
"""

import csv
import sys
from decimal import Decimal, ROUND_HALF_UP, InvalidOperation


def money(value):
    return Decimal(value).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def slugify(name):
    out = []
    dash = False
    for ch in name.strip():
        if ("a" <= ch <= "z") or ("0" <= ch <= "9") or ("\u0600" <= ch <= "\u06FF"):
            out.append(ch)
            dash = False
        elif "A" <= ch <= "Z":
            out.append(ch.lower())
            dash = False
        elif ch in " _-" and out and not dash:
            out.append("-")
            dash = True
    return "".join(out).strip("-")


def truthy(value):
    return str(value or "").strip().lower() in {"1", "yes", "y", "true", "included"}


def row_prices(raw, rate):
    price = money(raw)
    if rate == 0:
        return price, money(0), price
    net = money(price / (Decimal(1) + rate))
    vat = money(price - net)
    return net, vat, price


def build(rows):
    out = []
    seen = {}
    for index, row in enumerate(rows, start=2):
        name = (row.get("name") or "").strip()
        if not name:
            raise SystemExit(f"Row {index}: name is empty")
        try:
            rate = Decimal((row.get("vat_rate") or "0.15").strip() or "0.15")
        except InvalidOperation:
            raise SystemExit(f"Row {index}: vat_rate is not a number")
        if rate < 0 or rate > 1:
            raise SystemExit(f"Row {index}: vat_rate must be between 0 and 1")
        try:
            price = (row.get("price") or "").strip()
            if price == "":
                raise InvalidOperation
            if truthy(row.get("price_includes_vat")):
                net, vat, gross = row_prices(price, rate)
            else:
                net = money(price)
                vat = money(net * rate)
                gross = money(net + vat)
        except InvalidOperation:
            raise SystemExit(f"Row {index}: price is not a number")
        slug = slugify(name)
        if not slug:
            raise SystemExit(f"Row {index}: name has no letters to make a slug")
        seen[slug] = seen.get(slug, 0) + 1
        if seen[slug] > 1:
            slug = f"{slug}-{seen[slug]}"
        out.append({
            "sku": (row.get("sku") or "").strip(),
            "name": name,
            "slug": slug,
            "price_ex_vat": f"{net:.2f}",
            "vat": f"{vat:.2f}",
            "price_inc_vat": f"{gross:.2f}",
            "description": (row.get("description") or "").strip(),
        })
    return out


def main(argv):
    if len(argv) != 4 or argv[2] != "--out":
        raise SystemExit("Usage: python product_sheet.py products.csv --out sheet.csv")
    try:
        handle = open(argv[1], newline="", encoding="utf-8-sig")
    except FileNotFoundError:
        raise SystemExit(f"File not found: {argv[1]}")
    with handle:
        rows = list(csv.DictReader(handle))
    if not rows:
        raise SystemExit("The CSV has no data rows")
    missing = {"name", "price"} - set(rows[0].keys())
    if missing:
        raise SystemExit("Missing columns: " + ", ".join(sorted(missing)))
    sheet = build(rows)
    with open(argv[3], "w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(sheet[0].keys()))
        writer.writeheader()
        writer.writerows(sheet)
    print(f"Wrote {len(sheet)} products to {argv[3]}")


if __name__ == "__main__":
    try:
        main(sys.argv)
    except BrokenPipeError:
        sys.exit(0)
