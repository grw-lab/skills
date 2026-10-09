## What it does

ZATCA e-invoice helps developers build invoices that follow Saudi Arabia's e-invoicing rules (FATOORA). It does four jobs:

- Generates and decodes the invoice QR code.
- Checks invoice content for tax invoices, simplified tax invoices, and credit and debit notes.
- Computes VAT with ZATCA's rounding rules (half-up, VAT per category at document level), with the rule IDs cited.
- Maps the Phase 2 integration work: XML, hashing, device certificates, clearance and reporting.

The QR code is where most homemade implementations break. It is not a link or JSON. It is TLV bytes encoded in Base64, and each length must be counted in UTF-8 bytes. An Arabic seller name of 21 characters is 40 bytes. Count characters instead and every scanner rejects the code. The skill ships an encoder and decoder in Node and Python, tested against the widely published Phase 1 sample and the Phase 2 QR from ZATCA's own SDK.

> Engineering guidance, not tax or legal advice. Whether an invoice is compliant is decided by ZATCA's own validation tools.

## When to use it

- You are building invoices, receipts or POS output for a business in Saudi Arabia.
- A Saudi customer says your QR code is invalid.
- You need the required fields and Arabic titles for each invoice type.
- You are planning Phase 2 integration and want a map of the work before reading the full specification.

## Install

**Claude Code**, as a plugin (installs all grw—lab skills, updates with one command):

```text
/plugin marketplace add grw-lab/skills
/plugin install grw-skills@grw-lab
```

**Claude Code**, this skill only:

```bash
git clone https://github.com/grw-lab/skills.git ~/grwlab-skills
mkdir -p ~/.claude/skills && cp -r ~/grwlab-skills/zatca-invoice ~/.claude/skills/
```

For one project only, copy the folder into `.claude/skills/` inside that project instead.

**Claude.ai**: zip the `zatca-invoice` folder and upload it in Settings → Capabilities → Skills.

**Other agents** (Cursor, Codex, Gemini CLI, Windsurf): point the agent at `zatca-invoice/SKILL.md`, or paste it into your rules file. The instructions are plain Markdown.

## Usage

- "Add a ZATCA QR code to our receipt PDF."
- "This QR fails in the ZATCA scanner app. Decode it and tell me why: AQxC…"
- "Review our invoice model for a B2B tax invoice in Saudi Arabia."
- "Our VAT totals are off by a halala on some invoices. Fix the rounding."
- "We were notified for Phase 2. What do we need to build?"

## Example

A typical bug: the length byte counts characters.

```js
// Before: breaks as soon as the seller name is Arabic
const tlv = (tag, v) => String.fromCharCode(tag, v.length) + v;
```

```js
// After: the length is the UTF-8 byte length
function tlv(tag, value) {
  const bytes = Buffer.from(String(value), "utf8");
  return Buffer.concat([Buffer.from([tag, bytes.length]), bytes]);
}
```

Decoding a payload to check it:

```
$ node scripts/qr-tlv.mjs decode "ASjYtNix2YPYqSDY…"
 1  Seller name                                   40 B  شركة السجلات المحدودة
 2  VAT registration number                       15 B  300000000000003
 3  Timestamp                                     20 B  2026-10-08T09:30:00Z
 4  Invoice total (incl. VAT)                      7 B  1150.00
 5  VAT total                                      6 B  150.00
```

## What's inside

| File | What it's for |
|---|---|
| `SKILL.md` | The workflow, rules, and a checklist the agent runs before calling the work done. |
| `references/phase1-qr.md` | TLV structure, Phase 1 and Phase 2 tags, a byte-by-byte example, why QR codes fail. |
| `references/invoice-content.md` | Tax vs simplified invoices, fields, Arabic labels, credit and debit notes, VAT number format, 15% VAT and rounding. |
| `references/phase2-overview.md` | UBL 2.1 XML, UUID, ICV, PIH, the exact hash steps, the secp256k1 ECDSA stamp, device onboarding (CSID), clearance vs reporting. |
| `references/sources.md` | The ZATCA documents and versions every rule was checked against, and where they disagree with each other. |
| `scripts/qr-tlv.mjs` | Encode, decode and self-test in Node 18+. |
| `scripts/qr_tlv.py` | The same in Python 3.9+, standard library only. |
| `examples/sample-payloads.md` | Sample payloads with their decoded output. |

## FAQ

**Does this make my invoices ZATCA compliant?**
No tool can promise that except ZATCA's own validation. The skill gets the QR, content and math right, and tells you to validate XML with ZATCA's SDK and test in the sandbox before going live.

**Does it generate the Phase 2 QR tags 6 to 9?**
It decodes and checks them. Tags 6–9 come from your signing step: the XML hash and your device's signature (as Base64 text), your public key and, for simplified invoices, the CA's signature on your certificate (as raw DER bytes). They can't be typed in, so the scripts don't fake them.

**Which invoices need a QR code?**
Simplified tax invoices (B2C) need one from Phase 1. In Phase 2, ZATCA adds the QR to standard tax invoices when it clears them, and simplified invoices carry the full 9-tag QR built by your device.

**Why is my VAT total a halala off?**
ZATCA's standard computes VAT per VAT category on the category total (rule BR-CO-17), not by summing rounded line VAT. Summing line VAT is the usual cause of a one-halala gap. The skill gives the exact rules with their IDs and a halala-safe calculation.

**Should we build Phase 2 ourselves?**
Sometimes. It covers XML canonicalization, ECDSA signing, certificate renewal, retries and audit storage. For many businesses an already-compliant provider costs less. The skill raises that question before you start.
