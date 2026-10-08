# Invoice content, VAT and rounding

Read this when designing the invoice model, printing invoices, or computing totals. Rule IDs (BR-…) are from ZATCA's Electronic Invoice XML Implementation Standard v1.2 (2023-05-19); the full field list for each type is Annex 2 of the E-Invoicing Resolution and ZATCA's data dictionary. Sources are listed in `sources.md`.

## Two invoice types

| | Tax invoice (فاتورة ضريبية) | Simplified tax invoice (فاتورة ضريبية مبسطة) |
|---|---|---|
| Used for | Most B2B and B2G supplies (VAT Implementing Regulations, Art. 53(5)) | B2C supplies of any value; B2B only when the taxable supply is under SAR 1,000 (Art. 53(8); Detailed Guidelines v2, 4.2.1) |
| XML subtype (KSA-2, positions 1–2) | `01` | `02` |
| Buyer details | Buyer name required (BR-KSA-42); buyer VAT number when registered | Not required |
| QR code | Phase 1: not mandated. Phase 2: FATOORA adds it at clearance | Phase 1: tags 1–5. Phase 2: tags 1–9 from your device |
| Phase 2 model | Clearance before sharing | Reporting within 24 hours |

## Fields

Required on a **tax invoice** (summary of VAT Implementing Regulations Art. 53(5) and Annex 2 of the E-Invoicing Resolution; Annex 2 has the full list):

- The title "فاتورة ضريبية" (Tax Invoice)
- Invoice issue date (and time in Phase 2)
- Sequential, unique invoice number
- Seller name, address and VAT number (the address building number is 4 digits, BR-KSA-37)
- Buyer name, address and VAT number (if registered)
- Supply date, when different from the issue date
- Description and quantity of goods or services
- Unit price excluding VAT
- Discounts, if any
- Taxable amount, VAT rate and VAT amount per rate; in Phase 2 XML also the line VAT amount and line amount with VAT (KSA-11, KSA-12; mandatory for tax invoices and their notes, BR-KSA-52, BR-KSA-53)
- Total excluding VAT, total VAT, total including VAT, in SAR
- For zero-rated, exempt or out-of-scope lines: the exemption reason code and text (BR-KSA-83; VAT categories are S, Z, E, O, BR-KSA-18)

Required on a **simplified tax invoice** (summary of Art. 53(8) and Annex 2):

- The title "فاتورة ضريبية مبسطة" (Simplified Tax Invoice)
- Issue date and time
- Seller name, address and VAT number
- Description of goods or services
- Total including VAT, and the VAT amount (or a clear statement that the total includes VAT)
- The QR code

Phase 2 adds the machine fields: UUID, ICV, PIH, hash, signature (see `phase2-overview.md`).

## Language

Invoices must be in Arabic (VAT Implementing Regulations, Art. 53). Another language may appear alongside it, which is how most bilingual invoices are laid out. On the human-readable invoice, numbers may use Western (0–9) or Arabic-Indic (٠–٩) digits; both count as Arabic (Detailed Guidelines v2). Inside the XML and QR, amounts always use 0–9 (XML Implementation Standard, data types). Arabic labels for the common fields:

| English | Arabic |
|---|---|
| Tax Invoice | فاتورة ضريبية |
| Simplified Tax Invoice | فاتورة ضريبية مبسطة |
| Credit Note | إشعار دائن |
| Debit Note | إشعار مدين |
| Invoice number | رقم الفاتورة |
| Issue date | تاريخ الإصدار |
| Supply date | تاريخ التوريد |
| Seller | البائع |
| Buyer | المشتري |
| VAT number | الرقم الضريبي |
| Quantity | الكمية |
| Unit price | سعر الوحدة |
| Taxable amount | المبلغ الخاضع للضريبة |
| VAT rate | نسبة ضريبة القيمة المضافة |
| VAT amount | مبلغ ضريبة القيمة المضافة |
| Total excluding VAT | الإجمالي غير شامل الضريبة |
| Total including VAT | الإجمالي شامل الضريبة |
| Discount | الخصم |

For layout, mixed Arabic and English, and number direction on the printed invoice, use the **rtl-ui** and **arabic-localization** skills.

## Credit and debit notes

- An issued invoice is never edited or deleted. Corrections, returns and price changes go through a **credit note** (type code `381`, reduces the amount) or a **debit note** (`383`, increases it). (VAT Implementing Regulations Art. 40(1), 54(3); Detailed Guidelines v2, 4.3)
- Each note must reference the original invoice (billing reference BT-25, mandatory: BR-KSA-56). One note may cover several invoices; the reference can be a range.
- Each note must state the reason it was issued (KSA-10, in `cac:PaymentMeans/cbc:InstructionNote`: BR-KSA-17).
- A note follows the type of the invoice it adjusts: a note against a simplified invoice is a simplified note (subtype `02`), with the same stamping and reporting rules.

## VAT number

- 15 digits, first digit 3, last digit 3 (BR-KSA-40 for the seller, BR-KSA-44 for a buyer on a non-export invoice). Regex: `^3\d{13}3$`.
- That check only catches typos. It does not prove the number is registered.

## VAT rate and amounts

- The standard rate is **15%** (since 1 July 2020). Some supplies are zero-rated or exempt; carry the category per line, don't assume 15% everywhere.
- Keep money in integer halalas (1 SAR = 100 halalas) or a decimal type. Never in binary floating point.

## Rounding

What the XML Implementation Standard v1.2 says (section 10 and the BR rules):

- **Half-up** rounding: 123.4949 → 123.49, 123.4951 → 123.50.
- Document totals are rounded to 2 decimals. Amounts have at most 2 decimals (BR-DEC rules); unit prices and quantities may have more.
- Round **final results, not intermediate ones**.
- **Line net amount** (BT-131) = item net price ÷ base quantity × quantity, rounded to 2 decimals, minus line allowance plus line charge, each rounded separately.
- **VAT per category** (BT-117) = category taxable amount × rate ÷ 100, rounded to 2 decimals (BR-CO-17, BR-S-09). It is computed on the category total at document level, **not** as a sum of rounded line VAT amounts.
- **Total VAT** (BT-110) = Σ category VAT (BR-CO-14). This is the value in QR tag 5.
- **Total with VAT** (BT-112) = total without VAT (BT-109) + BT-110 (BR-CO-15).
- **Line VAT** (KSA-11) and **line amount with VAT** (KSA-12) have at most 2 decimals (BR-KSA-DEC-03, -04), and KSA-12 = BT-131 + KSA-11 (BR-KSA-51). In UBL, KSA-12 sits in the line's `cac:TaxTotal/cbc:RoundingAmount`.
- **Rounding amount** (BT-114) is for rounding the amount due (cash rounding), and enters BR-CO-16: amount due = BT-112 − prepaid + BT-114. It is not a place to hide VAT differences.

So the sum of rounded line VAT amounts can differ from the document VAT by a halala or two. The standard expects that. Document VAT wins. The standard sets no numeric tolerance; how the SDK and FATOORA treat a small line-versus-document difference (warning or error) is decided by their current rule set, so run real invoices through the SDK validator and the sandbox.

```js
// Amounts in integer halalas. Rates in percent. Half-up for non-negative values.
const halfUpDiv = (n, d) => Math.floor((n * 2 + d) / (2 * d));          // round(n / d), half up
const lineNet = (l) => halfUpDiv(l.unitPriceHalalas * l.qtyThousandths, 1000) // price × qty, 2 dp
	- (l.allowanceHalalas || 0) + (l.chargeHalalas || 0);
const byRate = new Map();
for (const l of lines) byRate.set(l.rate, (byRate.get(l.rate) || 0) + lineNet(l));
let net = 0, vat = 0;
for (const [rate, taxable] of byRate) { net += taxable; vat += halfUpDiv(taxable * rate, 100); } // BT-117 per category
const total = net + vat;                                                // BT-112
const fmt = (h) => (h / 100).toFixed(2);                                // "1150.00" for the XML and QR
```

Keep integers end to end: quantities in thousandths (or whatever precision you sell in), prices in halalas. Unit prices may legally have more than 2 decimals; if you price at, say, SAR 1.739, store prices in a finer unit (1/1000 SAR) and divide by the matching factor, so only the line net is rounded to 2 decimals. `halfUpDiv` avoids floating-point errors such as `1.005 * 100 = 100.49999…`.

## Prices shown to consumers

B2C prices are usually shown including VAT. If a price list stores VAT-inclusive prices, derive the net with `net = gross / 1.15` and round, then recompute VAT from the net so `net + VAT = gross` exactly; adjust the VAT by a halala if rounding leaves a gap.
