#!/usr/bin/env python3
"""Three-point (PERT) estimate for a freelance quote.

Usage:
  python3 estimate.py tasks.csv --rate 75 --currency USD [--buffer 15] [--vat 15] [--round 10] [--format md|json]
  python3 estimate.py tasks.json --rate 400 --currency SAR

Input (CSV header or JSON list of objects):
  deliverable, task, low, likely, high [, rate]
  low/likely/high are hours. An optional per-row "rate" overrides --rate.

Output: a Markdown table grouped by deliverable, with PERT expected hours,
a 95% high-confidence total, buffer, optional rounding (applied before
tax so VAT stays exact), VAT, and the grand total.
Exits 1 on bad input.
"""
import argparse
import csv
import json
import math
import sys
from collections import OrderedDict


def fail(msg):
    print(f"error: {msg}", file=sys.stderr)
    sys.exit(1)


def load(path):
    try:
        if path.lower().endswith(".json"):
            with open(path, encoding="utf-8") as f:
                rows = json.load(f)
            if not isinstance(rows, list):
                fail("JSON input must be a list of task objects")
        else:
            with open(path, encoding="utf-8-sig", newline="") as f:
                rows = list(csv.DictReader(f))
    except FileNotFoundError:
        fail(f"file not found: {path}")
    except (json.JSONDecodeError, csv.Error) as e:
        fail(f"cannot parse {path}: {e}")
    if not rows:
        fail("no tasks found")
    return rows


def num(row, key, line):
    value = row.get(key)
    if value is None or str(value).strip() == "":
        fail(f"row {line}: missing '{key}'")
    try:
        n = float(value)
    except ValueError:
        fail(f"row {line}: '{key}' is not a number: {value!r}")
    if n < 0:
        fail(f"row {line}: '{key}' cannot be negative")
    return n


def money(x, currency):
    return f"{x:,.2f} {currency}"


def round_to(x, step):
    if step <= 0:
        return x
    return math.ceil(x / step) * step


def main():
    p = argparse.ArgumentParser(description="PERT estimate for a freelance quote")
    p.add_argument("file", help="tasks .csv or .json")
    p.add_argument("--rate", type=float, help="hourly rate (required unless every row has a rate)")
    p.add_argument("--currency", help="currency code, e.g. USD, SAR, EUR (required)")
    p.add_argument("--buffer", type=float, default=0.0, help="buffer percent added on top of expected cost")
    p.add_argument("--vat", type=float, default=0.0, help="VAT or sales tax percent; 0 to omit")
    p.add_argument("--round", dest="round_step", type=float, default=0.0, help="round the pre-tax amount up to this step, e.g. 10 or 50")
    p.add_argument("--format", choices=["md", "json"], default="md")
    a = p.parse_args()

    if not a.currency:
        fail("--currency is required. Ask the user; do not guess.")

    rows = load(a.file)
    groups = OrderedDict()
    tasks = []
    for i, row in enumerate(rows, start=2 if not a.file.lower().endswith(".json") else 1):
        row = {str(k).strip().lower(): v for k, v in row.items()}
        lo, ml, hi = num(row, "low", i), num(row, "likely", i), num(row, "high", i)
        if not (lo <= ml <= hi):
            fail(f"row {i}: expected low <= likely <= high, got {lo}, {ml}, {hi}")
        rate = row.get("rate")
        if rate is not None and str(rate).strip() != "":
            rate = num(row, "rate", i)
        elif a.rate is not None:
            rate = a.rate
        else:
            fail(f"row {i}: no rate. Pass --rate or add a rate column. Ask the user; do not guess.")
        expected = (lo + 4 * ml + hi) / 6
        sd = (hi - lo) / 6
        t = {
            "deliverable": str(row.get("deliverable") or "General").strip(),
            "task": str(row.get("task") or "").strip() or "(unnamed task)",
            "low": lo, "likely": ml, "high": hi,
            "expected": expected, "sd": sd, "rate": rate,
            "cost": expected * rate,
        }
        tasks.append(t)
        groups.setdefault(t["deliverable"], []).append(t)

    exp_hours = sum(t["expected"] for t in tasks)
    low_hours = sum(t["low"] for t in tasks)
    high_hours = sum(t["high"] for t in tasks)
    project_sd = math.sqrt(sum(t["sd"] ** 2 for t in tasks))
    p95_hours = exp_hours + 1.65 * project_sd
    subtotal = sum(t["cost"] for t in tasks)
    avg_rate = subtotal / exp_hours if exp_hours else 0
    p95_cost = p95_hours * avg_rate
    buffer_amt = subtotal * a.buffer / 100
    pre_tax_exact = subtotal + buffer_amt
    # Round before tax so the VAT line stays exactly rate x taxable amount.
    pre_tax = round_to(pre_tax_exact, a.round_step)
    vat_amt = pre_tax * a.vat / 100
    total = pre_tax + vat_amt

    result = {
        "currency": a.currency,
        "tasks": tasks,
        "hours": {"low": low_hours, "expected": exp_hours, "high": high_hours, "p95": p95_hours, "sd": project_sd},
        "subtotal": subtotal,
        "p95_cost": p95_cost,
        "buffer_percent": a.buffer, "buffer": buffer_amt,
        "vat_percent": a.vat, "vat": vat_amt,
        "pre_tax": pre_tax, "rounding": pre_tax - pre_tax_exact,
        "total": total,
    }

    if a.format == "json":
        print(json.dumps(result, indent=2, ensure_ascii=False))
        return

    c = a.currency
    out = ["| Deliverable | Task | Low h | Likely h | High h | Expected h | Amount |",
           "|---|---|--:|--:|--:|--:|--:|"]
    for name, items in groups.items():
        for t in items:
            out.append(f"| {name} | {t['task']} | {t['low']:g} | {t['likely']:g} | {t['high']:g} | {t['expected']:.1f} | {money(t['cost'], c)} |")
        g_hours = sum(t["expected"] for t in items)
        g_cost = sum(t["cost"] for t in items)
        out.append(f"| **{name} total** | | | | | **{g_hours:.1f}** | **{money(g_cost, c)}** |")
    out.append("")
    out.append("| | Amount |")
    out.append("|---|--:|")
    out.append(f"| Subtotal (expected, {exp_hours:.1f} h) | {money(subtotal, c)} |")
    if a.buffer:
        out.append(f"| Buffer ({a.buffer:g}%) | {money(buffer_amt, c)} |")
    if a.round_step and pre_tax != pre_tax_exact:
        out.append(f"| Rounding (up to the nearest {a.round_step:g}) | {money(pre_tax - pre_tax_exact, c)} |")
    if a.vat:
        out.append(f"| Subtotal before tax | {money(pre_tax, c)} |")
        out.append(f"| VAT ({a.vat:g}%) | {money(vat_amt, c)} |")
    out.append(f"| **Total** | **{money(total, c)}** |")
    out.append("")
    out.append(f"Range: {low_hours:g} to {high_hours:g} h. Expected {exp_hours:.1f} h. "
               f"95% confidence: {p95_hours:.1f} h (about {money(p95_cost, c)} before buffer and tax).")
    if a.buffer and buffer_amt + subtotal < p95_cost:
        out.append("Note: the buffer does not cover the 95% estimate. Consider a larger buffer, a discovery phase, or a capped day-rate model.")
    print("\n".join(out))


if __name__ == "__main__":
    main()
