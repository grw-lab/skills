---
name: zatca-invoice
description: Guides developers building Saudi e-invoices for ZATCA (FATOORA). Generates and decodes the invoice QR code (TLV + Base64, with correct UTF-8 byte lengths for Arabic seller names), lays out required fields for tax vs simplified tax invoices and credit/debit notes, computes VAT with ZATCA's half-up, document-level rounding rules, validates VAT numbers, and maps Phase 2 integration (UBL 2.1 XML, C14N 1.1 + SHA-256 hash, ICV, PIH, secp256k1 stamp, CSID onboarding, clearance vs reporting within 24 hours). Use when building invoices, receipts or POS output for Saudi Arabia, fixing an invalid ZATCA QR, or planning Phase 2 integration. Engineering guidance, not tax or legal advice.
---

# ZATCA e-invoicing

Help developers produce Saudi e-invoices that match ZATCA's rules: the QR code, the invoice content, VAT math, and a map of Phase 2 integration. This is engineering guidance, not tax or legal advice. Compliance is decided by ZATCA's own validation, never by this skill.

## When to use

- Generating the QR code for a Saudi invoice or receipt, or debugging one that scanners reject.
- Designing the invoice data model, the printed layout, or VAT totals.
- Planning or reviewing Phase 2 (integration) work with ZATCA's FATOORA platform.

## When not to use

- Tax questions (what is taxable, rates for a specific supply, registration). Refer the user to a Saudi tax adviser or ZATCA.
- Other countries' e-invoicing (Egypt ETA, UAE, Peppol). Similar ideas, different rules.

## Workflow

1. **Establish the situation.** Ask:
   - Which document types are issued: tax invoices (B2B), simplified tax invoices (B2C), credit and debit notes?
   - Is the taxpayer already in Phase 2, and has ZATCA notified them of a wave date?
   - Which stack generates invoices (POS, web app, ERP)?
   - Building in-house, or using an already-compliant provider?
2. **Get the content right first.** Check the data model and printed invoice against `references/invoice-content.md`: titles, fields per type, Arabic labels, VAT categories, credit/debit note references.
3. **Compute totals in integer halalas**, never floats. Apply ZATCA's rules from `references/invoice-content.md`: half-up; line net rounded to 2 decimals; VAT computed per VAT category on the category total (BR-CO-17), not summed from rounded line VAT; total VAT = Σ category VAT (BR-CO-14). Then run sample invoices through the SDK validator.
4. **Build the QR.** Tags 1–5 as TLV with UTF-8 byte lengths, then Base64 (`references/phase1-qr.md`). In Phase 2, add tags 6–7 as Base64 text and tags 8–9 as raw DER bytes; tag 9 only on simplified invoices and their notes. Use the bundled scripts as a reference implementation and to check output:
   ```bash
   node scripts/qr-tlv.mjs encode --seller "اسم البائع" --vat 3XXXXXXXXXXXXX3 \
     --time 2026-10-08T09:30:00Z --total 1150.00 --tax 150.00
   node scripts/qr-tlv.mjs decode "<base64 from the app>"
   ```
   The QR values must equal the totals printed on the invoice.
5. **Phase 2, if in scope.** Walk the user through `references/phase2-overview.md`: XML, UUID/ICV/PIH, hashing, keys and CSR, compliance CSID, compliance checks, production CSID, clearance or reporting. Recommend validating every XML with ZATCA's SDK and testing against the sandbox before production. Raise the build-or-buy question early.
6. **Report** what was built, what was validated and with what, and what still needs ZATCA validation.

## Rules

- TLV length is the UTF-8 **byte** length. Arabic letters are usually 2 bytes each.
- Standard Base64 (`+` `/` `=`), not URL-safe.
- Amounts in the QR and XML: dot decimal, two places, digits 0–9, no separators or symbols (`1150.00`). QR tag 5 equals BT-110.
- Rounding is half-up. VAT is rounded per category at document level, so line VAT can differ from document VAT by a halala; document VAT wins (XML Implementation Standard, section 10).
- Phase 2 crypto: SHA-256, ECDSA on secp256k1, C14N 1.1, XAdES B-B. Standard invoices are cleared before sharing; simplified invoices are reported within 24 hours, always as XML.
- VAT number format: `^3\d{13}3$` (BR-KSA-40). Format-valid is not the same as registered.
- Standard VAT rate is 15%, but carry the VAT category per line. Zero-rated and exempt lines exist.
- Never edit or delete an issued invoice. Corrections are credit or debit notes referencing the original.
- Invoices must be in Arabic; a second language alongside is fine.
- Never say an invoice, QR or XML "is ZATCA compliant". Say it passed specific checks (for example, the SDK validator) and name them.
- Don't invent field codes, API endpoints, error codes or deadlines. Cite the rule IDs in the references, and point to ZATCA's current documents for anything not there.

## Before / after

Before (breaks on Arabic names):

```js
const tlv = (tag, v) => String.fromCharCode(tag, v.length) + v;
btoa(tlv(1, seller) + tlv(2, vat) + ...);
```

After:

```js
function tlv(tag, value) {
  const bytes = Buffer.from(String(value), "utf8");
  return Buffer.concat([Buffer.from([tag, bytes.length]), bytes]);
}
const qr = Buffer.concat([
  tlv(1, sellerName), tlv(2, vatNumber), tlv(3, issuedAtIso),
  tlv(4, totalWithVat.toFixed(2)), tlv(5, vatTotal.toFixed(2)),
]).toString("base64");
```

## Verification checklist

- [ ] `node scripts/qr-tlv.mjs test` (or `python3 scripts/qr_tlv.py test`) passes. It covers the published Phase 1 sample and ZATCA's SDK Phase 2 sample.
- [ ] A QR generated by the user's code decodes with `scripts/qr-tlv.mjs decode` to the exact seller, VAT number, timestamp and totals on the printed invoice.
- [ ] One invoice with an Arabic seller name decodes correctly.
- [ ] Totals for a multi-line invoice with a discount and a zero-rated line add up exactly.
- [ ] The invoice shows the correct Arabic title and required fields for its type.
- [ ] Phase 2 work: sample XML documents pass the ZATCA SDK validator, and the user knows the remaining steps (sandbox onboarding, compliance checks, production CSID).
- [ ] The reply says this is engineering guidance, not tax or legal advice.

## Files

- `references/phase1-qr.md` — TLV structure, tags 1–9 with their real byte formats, a byte-by-byte example, the Arabic length trap, common validation failures.
- `references/invoice-content.md` — tax vs simplified invoices, required fields, Arabic labels, credit and debit notes, VAT number, 15% VAT and rounding.
- `references/phase2-overview.md` — XML type codes, UUID/ICV/PIH, the exact hash steps, the stamp (secp256k1, XAdES), CSID onboarding, clearance vs reporting.
- `references/sources.md` — the ZATCA documents and versions every rule was checked against, and the known gaps between them.
- `scripts/qr-tlv.mjs` — Node 18+ encoder, decoder and self-test.
- `scripts/qr_tlv.py` — the same in Python 3.9+, standard library only.
- `examples/sample-payloads.md` — the published sample and an Arabic-name sample, with decoded output.
