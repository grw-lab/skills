#!/usr/bin/env python3
"""Sum sales and purchase VAT from a CSV into a worksheet.

Usage:
  python vat_worksheet.py lines.csv --out summary.csv

Required column: kind (sale or purchase)
Also required on each row: net, or gross when net is empty.
Optional: vat (if empty, computed from net and vat_rate), vat_rate (default 0.15), note

Money is rounded half-up to 0.01 per line, then summed.
VAT due = sales VAT − purchase VAT. A negative number means purchase VAT is larger.
This is a worksheet for a person to review. It does not file a return and it is not tax advice.
"""

import csv
import sys
from decimal import Decimal, ROUND_HALF_UP, InvalidOperation


def money(value):
    return Decimal(value).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def build(rows):
    lines = []
    totals = {"sale": [Decimal(0), Decimal(0)], "purchase": [Decimal(0), Decimal(0)]}
    for index, row in enumerate(rows, start=2):
        kind = (row.get("kind") or "").strip().lower()
        if kind not in {"sale", "purchase"}:
            raise SystemExit(f"Row {index}: kind must be sale or purchase")
        try:
            rate = Decimal((row.get("vat_rate") or "0.15").strip() or "0.15")
        except InvalidOperation:
            raise SystemExit(f"Row {index}: vat_rate is not a number")
        if rate < 0 or rate > 1:
            raise SystemExit(f"Row {index}: vat_rate must be between 0 and 1")
        net_raw = (row.get("net") or "").strip()
        gross_raw = (row.get("gross") or "").strip()
        vat_raw = (row.get("vat") or "").strip()
        try:
            if net_raw:
                net = money(net_raw)
                vat = money(vat_raw) if vat_raw else money(net * rate)
                gross = money(net + vat)
            elif gross_raw:
                gross = money(gross_raw)
                if vat_raw:
                    vat = money(vat_raw)
                    net = money(gross - vat)
                else:
                    net = money(gross / (Decimal(1) + rate)) if rate else gross
                    vat = money(gross - net)
            else:
                raise SystemExit(f"Row {index}: give net or gross")
        except InvalidOperation:
            raise SystemExit(f"Row {index}: an amount is not a number")
        totals[kind][0] += net
        totals[kind][1] += vat
        lines.append({
            "kind": kind,
            "net": f"{net:.2f}",
            "vat": f"{vat:.2f}",
            "gross": f"{gross:.2f}",
            "note": (row.get("note") or "").strip(),
        })
    due = totals["sale"][1] - totals["purchase"][1]
    summary = {
        "sales_net": f"{totals['sale'][0]:.2f}",
        "sales_vat": f"{totals['sale'][1]:.2f}",
        "purchases_net": f"{totals['purchase'][0]:.2f}",
        "purchases_vat": f"{totals['purchase'][1]:.2f}",
        "vat_due": f"{due:.2f}",
        "lines": str(len(lines)),
    }
    return lines, summary


def main(argv):
    if len(argv) != 4 or argv[2] != "--out":
        raise SystemExit("Usage: python vat_worksheet.py lines.csv --out summary.csv")
    try:
        handle = open(argv[1], newline="", encoding="utf-8-sig")
    except FileNotFoundError:
        raise SystemExit(f"File not found: {argv[1]}")
    with handle:
        rows = list(csv.DictReader(handle))
    if not rows:
        raise SystemExit("The CSV has no data rows")
    if "kind" not in rows[0]:
        raise SystemExit("Missing column: kind")
    lines, summary = build(rows)
    with open(argv[3], "w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=["field", "amount"])
        writer.writeheader()
        for key, value in summary.items():
            writer.writerow({"field": key, "amount": value})
    print(
        f"Sales VAT {summary['sales_vat']} · Purchase VAT {summary['purchases_vat']} · "
        f"VAT due {summary['vat_due']} · {summary['lines']} lines · wrote {argv[3]}"
    )


if __name__ == "__main__":
    main(sys.argv)
