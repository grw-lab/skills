# Sample QR payloads

Decode any of these with `node scripts/qr-tlv.mjs decode <payload>` or `python3 scripts/qr_tlv.py decode <payload>`.

## Published Phase 1 sample (English seller name)

```
AQxCb2JzIFJlY29yZHMCDzMxMDEyMjM5MzUwMDAwMwMUMjAyMi0wNC0yNVQxNTozMDowMFoEBzEwMDAuMDAFBjE1MC4wMA==
```

```
 1  Seller name                                   12 B  Bobs Records
 2  VAT registration number                       15 B  310122393500003
 3  Timestamp                                     20 B  2022-04-25T15:30:00Z
 4  Invoice total (incl. VAT)                      7 B  1000.00
 5  VAT total                                      6 B  150.00
```

## Arabic seller name (lengths are UTF-8 bytes)

VAT number 300000000000003 is a format-valid placeholder, not a real registration.

```
ASjYtNix2YPYqSDYp9mE2LPYrNmE2KfYqiDYp9mE2YXYrdiv2YjYr9ipAg8zMDAwMDAwMDAwMDAwMDMDFDIwMjYtMTAtMDhUMDk6MzA6MDBaBAcxMTUwLjAwBQYxNTAuMDA=
```

```
 1  Seller name                                   40 B  شركة السجلات المحدودة
 2  VAT registration number                       15 B  300000000000003
 3  Timestamp                                     20 B  2026-10-08T09:30:00Z
 4  Invoice total (incl. VAT)                      7 B  1150.00
 5  VAT total                                      6 B  150.00
```

## Phase 2 sample from ZATCA's SDK (tags 1–9)

The QR inside `Data/Samples/Simplified/Invoice/Simplified_Invoice.xml` of ZATCA's Compliance and Enablement Toolbox. Tags 6 and 7 are Base64 text; tags 8 and 9 are raw DER bytes, shown here as Base64. Tag 1 is 17 characters but 19 bytes because of the curly apostrophe.

```
ARNBY21lIFdpZGdldOKAmXMgTFREAg8zMTExMTExMTExMDExMTMDFDIwMjItMDgtMTdUMTc6NDE6MDhaBAYyMzEuMTUFBTMwLjE1BixSdkNTcE1ZejgwMDlLYkoza3U3Mm9hQ0ZXcHpFZlFOY3BjKzVidWxoM0prPQdgTUVZQ0lRRFlzRG52aUpZUGdZanlDSVlBeXpFVGVZdGhJb0phUWhDaGJsUDRlQUFQUEFJaEFKbDZ6ZkhnaUttV1R0c2ZVejhZQlo4UWtROXJCTDRVeTdtSzBjeHZXb29ICFgwVjAQBgcqhkjOPQIBBgUrgQQACgNCAARhgwyg5oVgCEw7+y16i19nJq+vqnXVJKXCwr1rOawtjtvVv4UuGowCuEHZ2ocpujGoo1++QoN4+GmqO6LmFyfRCUYwRAIgOgjNPJW017lsIijmVQVkP7GzFO2KQKd9GHaukLgIWFsCIFJF9uwKhTMxDjWbN+1awsnFI7RLBRxA/6hZ+F1wtaqU
```

```
 1  Seller name                                   19 B  Acme Widget’s LTD
 2  VAT registration number                       15 B  311111111101113
 3  Timestamp                                     20 B  2022-08-17T17:41:08Z
 4  Invoice total (incl. VAT)                      6 B  231.15
 5  VAT total                                      5 B  30.15
 6  Invoice hash                                  44 B  RvCSpMYz8009KbJ3ku72oaCFWpzEfQNcpc+5bulh3Jk=
 7  ECDSA signature                               96 B  MEYCIQDYsDnviJYPgYjyCIYAyzETeYthIoJaQhChblP4eAAPPAIhAJl6zfHgiKmWTtsfUz8YBZ8QkQ9rBL4Uy7mK0cxvWooH
 8  ECDSA public key                              88 B  MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEYYMMoOaFYAhMO/steotfZyavr6p11SSlwsK9azmsLY7b1b+FLhqMArhB2dqHKboxqKNfvkKDePhpqjui5hcn0Q== (base64 of 88 raw bytes)
 9  Certificate signature (simplified invoices)   70 B  MEQCIDoIzTyVtNe5bCIo5lUFZD+xsxTtikCnfRh2rpC4CFhbAiBSRfbsCoUzMQ41mzftWsLJxSO0SwUcQP+oWfhdcLWqlA== (base64 of 70 raw bytes)
```
