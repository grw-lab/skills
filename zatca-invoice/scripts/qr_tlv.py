#!/usr/bin/env python3
"""Encode and decode ZATCA (FATOORA) e-invoice QR payloads: TLV bytes, then Base64.

Encode the five Phase 1 fields:
    python3 qr_tlv.py encode --seller "Bobs Records" --vat 310122393500003 \\
        --time 2022-04-25T15:30:00Z --total 1000.00 --tax 150.00

Decode any QR payload (Phase 1 tags 1-5, Phase 2 tags 6-9 shown as bytes):
    python3 qr_tlv.py decode "AQxCb2JzIFJlY29yZHMC..."

Self-test:
    python3 qr_tlv.py test

Each field is: 1 byte tag, 1 byte length (UTF-8 BYTE length, not characters), value bytes.
Standard library only. Engineering helper; validate real invoices with ZATCA's SDK.
"""
import argparse
import base64
import binascii
import re
import sys
from datetime import datetime

NAMES = {
    1: "Seller name",
    2: "VAT registration number",
    3: "Timestamp",
    4: "Invoice total (incl. VAT)",
    5: "VAT total",
    6: "Invoice hash",
    7: "ECDSA signature",
    8: "ECDSA public key",
    9: "Certificate signature (simplified invoices)",
}


def encode_tlv(fields):
    out = bytearray()
    for tag, value in fields:
        data = value if isinstance(value, (bytes, bytearray)) else str(value).encode("utf-8")
        if not 1 <= tag <= 255:
            raise ValueError(f"Bad tag {tag}")
        if len(data) > 255:
            raise ValueError(f"Tag {tag} is {len(data)} bytes; one-byte TLV length allows 255 at most")
        out += bytes([tag, len(data)]) + data
    return base64.b64encode(bytes(out)).decode("ascii")


def decode_tlv(payload):
    try:
        buf = base64.b64decode(payload.strip(), validate=True)
    except (binascii.Error, ValueError) as err:
        raise ValueError(f"Invalid Base64: {err}") from err
    if not buf:
        raise ValueError("Empty payload")
    entries, i = [], 0
    while i < len(buf):
        if i + 2 > len(buf):
            raise ValueError(f"Truncated TLV header at byte {i}")
        tag, length = buf[i], buf[i + 1]
        end = i + 2 + length
        if end > len(buf):
            raise ValueError(f"Tag {tag} says {length} bytes but only {len(buf) - i - 2} remain")
        entries.append((tag, length, buf[i + 2:end]))
        i = end
    return entries


def phase1(seller, vat, time, total, tax):
    problems = []
    if not seller:
        problems.append("Seller name is required")
    if not re.fullmatch(r"3\d{13}3", vat or ""):
        problems.append("VAT number must be 15 digits, starting and ending with 3")
    try:
        datetime.fromisoformat((time or "").replace("Z", "+00:00"))
    except ValueError:
        problems.append("Timestamp must be ISO 8601, for example 2022-04-25T15:30:00Z")
    for label, value in (("Total", total), ("VAT total", tax)):
        if not re.fullmatch(r"\d+\.\d{2}", value or ""):
            problems.append(f"{label} should be a plain number with two decimals, for example 1000.00")
    if problems:
        raise ValueError("\n".join(problems))
    return encode_tlv([(1, seller), (2, vat), (3, time), (4, total), (5, tax)])


def show(entries):
    for tag, length, data in entries:
        name = NAMES.get(tag, "Unknown tag")
        try:
            text = data.decode("utf-8")
            printable = tag <= 5 or all(0x20 <= ord(c) <= 0x7E for c in text)
        except UnicodeDecodeError:
            printable = False
        value = text if printable else f"{base64.b64encode(data).decode()} (base64 of {length} raw bytes)"
        print(f"{tag:>2}  {name:<44} {length:>3} B  {value}")


def test():
    failed = 0

    def check(label, ok, detail=""):
        nonlocal failed
        print(f"{'✓' if ok else '✗'} {label}{' — ' + detail if detail else ''}")
        if not ok:
            failed += 1

    sample = "AQxCb2JzIFJlY29yZHMCDzMxMDEyMjM5MzUwMDAwMwMUMjAyMi0wNC0yNVQxNTozMDowMFoEBzEwMDAuMDAFBjE1MC4wMA=="
    check("Encodes the published sample byte for byte",
          phase1("Bobs Records", "310122393500003", "2022-04-25T15:30:00Z", "1000.00", "150.00") == sample)
    values = [d.decode() for _, _, d in decode_tlv(sample)]
    check("Decodes the published sample",
          values == ["Bobs Records", "310122393500003", "2022-04-25T15:30:00Z", "1000.00", "150.00"])

    arabic = "شركة السجلات المحدودة"
    first = decode_tlv(phase1(arabic, "300000000000003", "2026-10-08T09:30:00Z", "115.00", "15.00"))[0]
    byte_len = len(arabic.encode("utf-8"))
    check("Arabic name length is UTF-8 bytes", first[1] == byte_len != len(arabic), f"{len(arabic)} chars → {first[1]} bytes")
    check("Arabic name round-trips", first[2].decode("utf-8") == arabic)

    # Phase 2 QR from ZATCA's SDK sample (Data/Samples/Simplified/Invoice/Simplified_Invoice.xml).
    # Tags 6-7 are Base64 text (44 and ~96 bytes); tags 8-9 are raw DER bytes.
    sdk = "ARNBY21lIFdpZGdldOKAmXMgTFREAg8zMTExMTExMTExMDExMTMDFDIwMjItMDgtMTdUMTc6NDE6MDhaBAYyMzEuMTUFBTMwLjE1BixSdkNTcE1ZejgwMDlLYkoza3U3Mm9hQ0ZXcHpFZlFOY3BjKzVidWxoM0prPQdgTUVZQ0lRRFlzRG52aUpZUGdZanlDSVlBeXpFVGVZdGhJb0phUWhDaGJsUDRlQUFQUEFJaEFKbDZ6ZkhnaUttV1R0c2ZVejhZQlo4UWtROXJCTDRVeTdtSzBjeHZXb29ICFgwVjAQBgcqhkjOPQIBBgUrgQQACgNCAARhgwyg5oVgCEw7+y16i19nJq+vqnXVJKXCwr1rOawtjtvVv4UuGowCuEHZ2ocpujGoo1++QoN4+GmqO6LmFyfRCUYwRAIgOgjNPJW017lsIijmVQVkP7GzFO2KQKd9GHaukLgIWFsCIFJF9uwKhTMxDjWbN+1awsnFI7RLBRxA/6hZ+F1wtaqU"
    tags = {t: (n, d) for t, n, d in decode_tlv(sdk)}
    check("Decodes the SDK Phase 2 sample (tags 1-9)", sorted(tags) == list(range(1, 10)))
    check("Tag 1 counts bytes: 17 chars with ’ → 19 bytes", tags[1][0] == 19 and tags[1][1].decode() == "Acme Widget’s LTD")
    check("Tag 6 is the Base64 text of a SHA-256 hash (44 bytes)", tags[6][0] == 44 and len(base64.b64decode(tags[6][1])) == 32)
    check("Tag 8 is a DER secp256k1 public key (88 bytes)", tags[8][0] == 88 and bytes.fromhex("2b8104000a") in tags[8][1])
    check("Tag 9 is a raw DER ECDSA signature", tags[9][1][0] == 0x30 and tags[9][1][1] == tags[9][0] - 2)

    for label, fn in (
        ("Rejects values over 255 bytes", lambda: encode_tlv([(1, "x" * 256)])),
        ("Rejects a malformed VAT number", lambda: phase1("A", "123", "2026-10-08T09:30:00Z", "1.00", "0.15")),
        ("Rejects a truncated payload", lambda: decode_tlv(base64.b64encode(bytes([1, 9, 65])).decode())),
    ):
        try:
            fn()
            check(label, False)
        except ValueError:
            check(label, True)

    print(f"\n{failed} test(s) failed." if failed else "\nAll tests passed.")
    return 1 if failed else 0


def main():
    parser = argparse.ArgumentParser(description="ZATCA QR TLV encoder/decoder")
    sub = parser.add_subparsers(dest="cmd")
    enc = sub.add_parser("encode")
    for name in ("seller", "vat", "time", "total", "tax"):
        enc.add_argument(f"--{name}", required=True)
    dec = sub.add_parser("decode")
    dec.add_argument("payload")
    sub.add_parser("test")
    args = parser.parse_args()
    try:
        if args.cmd == "encode":
            print(phase1(args.seller, args.vat, args.time, args.total, args.tax))
        elif args.cmd == "decode":
            show(decode_tlv(args.payload))
        elif args.cmd == "test":
            return test()
        else:
            parser.print_help()
        return 0
    except ValueError as err:
        print(err, file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
