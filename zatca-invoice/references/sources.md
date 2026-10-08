# Sources

Every rule in this skill was checked against these documents in October 2026. ZATCA updates them; when a rule here and a current ZATCA document disagree, the document wins.

| Document | Version | What this skill takes from it |
|---|---|---|
| [Security Features Implementation Standards](https://zatca.gov.sa/en/E-Invoicing/SystemsDevelopers/Pages/Security-Requirements.aspx) | v1.2, 2023-05-19 | QR TLV encoding and order of operations (4.1), tags 1–9 and their dates (Table 3), the 700-character limit, SHA-256 + ECDSA 256-bit (2.2.1 item 16), XAdES B-B, the hash transforms and C14N 1.1 (2.3.3), PIH method (3), certificate profile and 5-year validity (2.2.2), OAuth 2 Basic auth (5) |
| [Electronic Invoice XML Implementation Standard](https://zatca.gov.sa/en/E-Invoicing/SystemsDevelopers/Pages/E-Invoice-specifications.aspx) | v1.2, 2023-05-19 | Rounding (section 10), BR-CO-14/15/16/17, BR-S-09, BR-DEC, BR-KSA-DEC-03/04, BR-KSA-03/17/18/26/33/34/37/40/42/44/51/52/53/56/60/61/83, document type codes, the first-invoice PIH value |
| [E-Invoicing Detailed Guidelines](https://zatca.gov.sa/en/E-Invoicing/Introduction/Guidelines/Pages/default.aspx) | v2, May 2023 | Phase 1 and 2 scope, the SAR 1,000 B2B simplified-invoice limit (4.2.1), clearance (4.1.2), reporting within 24 hours in XML (4.2.2), credit/debit notes (4.3), Arabic and numerals, QR generation for cleared invoices (FAQ) |
| ZATCA Compliance and Enablement Toolbox (SDK), from the Developer Portal | sample `Data/Samples/Simplified/Invoice/Simplified_Invoice.xml` and `Readme/readme.pdf` | The real byte form of QR tags 6–9 (decoded in the scripts' self-test), secp256k1 in ZATCA-issued certificates, the `fatoora -csr / -sign / -qr / -validate / -invoiceRequest` commands |

## Known gaps between documents

- **Tag 6 length.** The Security Features standard says the hash value is 32 bytes. The SDK's own QR carries the 44-byte Base64 text of that hash. Implementations follow the SDK because its validator checks the QR.
- **Curve name.** The illustrative certificate profile in the Security Features standard writes "P-256". ZATCA-issued certificates and the SDK use secp256k1 (OID 1.3.132.0.10).

## Not covered by ZATCA documents here

- **Wave dates** for Phase 2 are announced to each taxpayer group by ZATCA. Ask the user.
- **API endpoints and error codes** are on the Developer Portal and change between versions.
