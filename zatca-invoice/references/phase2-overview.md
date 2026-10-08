# Phase 2 (integration) overview

Read this when the user's system must connect to ZATCA's FATOORA platform. It is a map of the work with the rules that are easy to get wrong. The binding documents are ZATCA's; build against them and validate with the SDK. Every rule here cites its source (full list in `sources.md`).

Official pages:

- E-invoicing home: https://zatca.gov.sa/en/E-Invoicing/Pages/default.aspx
- E-invoice specifications (data dictionary, XML implementation standard): https://zatca.gov.sa/en/E-Invoicing/SystemsDevelopers/Pages/E-Invoice-specifications.aspx
- Security features implementation standards: https://zatca.gov.sa/en/E-Invoicing/SystemsDevelopers/Pages/Security-Requirements.aspx
- The Developer Portal (linked from those pages) provides the Compliance and Enablement Toolbox (SDK), which validates XML invoices and QR codes offline, and a sandbox for onboarding and submission tests.

## Timeline

- **Phase 1, generation**: from 4 December 2021. Invoices are generated and stored electronically by a compliant solution. Simplified invoices carry the QR (tags 1–5). There is no prescribed file format and no connection to ZATCA. A scanned paper invoice is not a compliant e-invoice. (Detailed Guidelines v2, 4.1.1, 4.2.1)
- **Phase 2, integration**: from 1 January 2023, in waves by taxpayer group. ZATCA notifies each taxpayer of their wave. Ask the user for their notified go-live date; don't guess it.

## What changes in Phase 2

### 1. XML documents

Every invoice, credit note and debit note is a UBL 2.1 XML document with ZATCA's extensions. Invoices can be shared with buyers as XML or PDF/A-3 with the XML embedded, but **submission to FATOORA is always XML, never PDF/A-3** (Detailed Guidelines v2, 4.1.2 b, 4.2.2 c).

Document codes (XML Implementation Standard v1.2):

- Invoice type code (BT-3): `388` invoice, `381` credit note, `383` debit note.
- Invoice subtype (KSA-2, the `name` attribute, 7 characters): positions 1–2 are `01` for a standard tax invoice and its notes, `02` for a simplified tax invoice and its notes. Example from the SDK sample: `<cbc:InvoiceTypeCode name="0200000">388</cbc:InvoiceTypeCode>`.
- Profile: `reporting:1.0`.

### 2. Chaining fields on every document

- **UUID** (KSA-1, BR-KSA-03): unique per document.
- **ICV, invoice counter value** (KSA-16, BR-KSA-33 and BR-KSA-34: present, digits only): increases by one for every document the device issues. No gaps, no resets.
- **PIH, previous invoice hash** (KSA-13, BR-KSA-61): the hash of the previous document from the same device. Mandatory on every invoice. For the very first document it is fixed (BR-KSA-26):

  ```
  NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYzIzOWRkNGU5MWI0NjcyOWQ3M2EyN2ZiNTdlOQ==
  ```

  That is Base64 of the hex text of SHA-256("0"): `5feceb66…57e9`.

### 3. The invoice hash

Defined in BR-KSA-26 and the Security Features standard, section 3 and 2.3.3:

1. Remove `ext:UBLExtensions`.
2. Remove the `cac:AdditionalDocumentReference` whose `cbc:ID` is `QR`.
3. Remove `cac:Signature`.
4. Canonicalize with **C14N 1.1** (`http://www.w3.org/2006/12/xml-c14n11`).
5. **SHA-256** the result.
6. Base64 the 32 hash bytes.

That value is the document's first `ds:DigestValue`, goes into QR tag 6 as Base64 text, and becomes the next document's PIH.

### 4. Cryptographic stamp

Security Features standard v1.2, 2.2.1 and 2.3.3:

- Signature format **XAdES**, level **B-B**, enveloped in `ext:UBLExtensions`. (PAdES is defined for PDF/A-3.)
- Hash **SHA-256**, algorithm **ECDSA**, key length **256** bits. Signature algorithm in the certificate: `ecdsa-with-SHA256`.
- Curve: **secp256k1**. The standard's illustrative certificate profile writes "P-256", but the certificates ZATCA issues and its SDK use secp256k1 (OID `1.3.132.0.10`); the SDK sample certificate shows it, and keys made with `openssl ecparam -name secp256k1` are what the onboarding API accepts. Use secp256k1.
- `ds:KeyInfo` carries the signing certificate.
- Certificates are valid for up to 5 years (profile `NotAfter`). Renew before expiry.
- QR tags 7–9 come from this step (see `phase1-qr.md`).
- The stamp is mandatory on simplified invoices and their notes (BR-KSA-60). Standard tax invoices are stamped by FATOORA during clearance.

### 5. Device onboarding (CSID)

Each invoice-generating unit (EGS) gets its own certificate:

1. Generate a secp256k1 key pair and a CSR with the subject and extension fields ZATCA specifies (Security Features standard, Table 1). The SDK can generate both: `fatoora -csr -csrConfig <file> -privateKey <file> -generatedCsr <file> -pem`.
2. Get an OTP from the FATOORA portal (simulation or production, matching your CSR's certificate template) and request a **compliance CSID**.
3. Pass the compliance checks: submit sample documents of each type the device will issue (invoices, credit notes, debit notes; standard and/or simplified).
4. Request the **production CSID** and use it for live documents.
5. API calls authenticate with HTTP Basic: the certificate is the client ID, the issued secret is the password (Security Features standard, section 5). Store the secret securely.

### 6. Submission

Detailed Guidelines v2, sections 4.1.2 and 4.2.2:

| | Standard tax invoice | Simplified tax invoice |
|---|---|---|
| Used for | Most B2B and B2G supplies | B2C supplies of any value; B2B only when the taxable supply is under SAR 1,000 |
| Model | **Clearance** | **Reporting** |
| When | Submit the XML **before** sharing with the buyer | Share with the buyer **immediately**, submit the XML **within 24 hours** of generation |
| Who stamps and builds the QR | FATOORA validates, adds the cryptographic stamp and QR, returns the cleared XML | Your EGS stamps with its CSID and builds the 9-tag QR before sharing |
| Buyer receives | Cleared XML, or PDF/A-3 with it embedded | Printed copy, or electronic if both parties agree |

Credit and debit notes follow the type of the invoice they adjust, so they go through the same model (Detailed Guidelines v2, 4.3).

## What to build, in order

1. Data model: every field in ZATCA's data dictionary for the document types you issue.
2. XML generation from that model, validated with the SDK (`fatoora -validate -invoice <file>`) until it passes with no errors. The SDK also signs (`fatoora -sign`), builds the QR (`fatoora -qr`) and the API request body (`fatoora -invoiceRequest`), which makes it a reference to diff your own output against.
3. Hashing, ICV and PIH, persisted per device, safe under concurrency (one counter per device, incremented in a transaction).
4. Key generation, CSR and onboarding against the sandbox.
5. Signing and the Phase 2 QR (tags 1–9).
6. Clearance and reporting API calls with retries, idempotency, and a queue that guarantees the 24-hour reporting window.
7. Storage: keep every XML, response and stamp. Never edit an issued invoice; correct it with a credit or debit note.

## Build or buy

Phase 2 is a real integration project: canonicalization, ECDSA signing, certificate lifecycle, retries and audit storage. For a small business, an accounting system or e-invoicing provider that is already compliant is usually cheaper and safer. ZATCA publishes a list of solution providers on its e-invoicing pages. Say this to the user before starting a custom build.

## What this skill will not claim

- That generated XML or QR is compliant. Only ZATCA's validation (SDK and sandbox compliance checks) can say that.
- API endpoints, error codes or wave dates. Read them from ZATCA's current documents and the Developer Portal; they change.
