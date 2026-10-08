#!/usr/bin/env node
// Encode and decode ZATCA (FATOORA) e-invoice QR payloads: TLV bytes, then Base64.
//
// Encode the five Phase 1 fields:
//   node qr-tlv.mjs encode --seller "Bobs Records" --vat 310122393500003 \
//     --time 2022-04-25T15:30:00Z --total 1000.00 --tax 150.00
//
// Decode any QR payload (Phase 1 tags 1-5, Phase 2 tags 6-9 shown as bytes):
//   node qr-tlv.mjs decode "AQxCb2JzIFJlY29yZHMC..."
//
// Self-test:
//   node qr-tlv.mjs test
//
// Each field is: 1 byte tag, 1 byte length (UTF-8 BYTE length, not characters), value bytes.
// Engineering helper only. Validate real invoices with ZATCA's SDK / compliance checks.

const NAMES = {
	1: "Seller name",
	2: "VAT registration number",
	3: "Timestamp",
	4: "Invoice total (incl. VAT)",
	5: "VAT total",
	6: "Invoice hash",
	7: "ECDSA signature",
	8: "ECDSA public key",
	9: "Certificate signature (simplified invoices)",
};

export function encodeTlv(fields) {
	const parts = [];
	for (const [tag, value] of fields) {
		const bytes = Buffer.isBuffer(value) ? value : Buffer.from(String(value), "utf8");
		if (!Number.isInteger(tag) || tag < 1 || tag > 255) throw new Error(`Bad tag ${tag}`);
		if (bytes.length > 255) throw new Error(`Tag ${tag} is ${bytes.length} bytes; one-byte TLV length allows 255 at most`);
		parts.push(Buffer.from([tag, bytes.length]), bytes);
	}
	return Buffer.concat(parts).toString("base64");
}

export function decodeTlv(base64) {
	const buf = Buffer.from(String(base64).trim(), "base64");
	if (!buf.length) throw new Error("Empty or invalid Base64");
	const out = [];
	let i = 0;
	while (i < buf.length) {
		if (i + 2 > buf.length) throw new Error(`Truncated TLV header at byte ${i}`);
		const tag = buf[i];
		const len = buf[i + 1];
		const end = i + 2 + len;
		if (end > buf.length) throw new Error(`Tag ${tag} says ${len} bytes but only ${buf.length - i - 2} remain`);
		out.push({ tag, length: len, bytes: buf.subarray(i + 2, end) });
		i = end;
	}
	return out;
}

export function phase1(fields) {
	const problems = [];
	const { seller, vat, time, total, tax } = fields;
	if (!seller) problems.push("Seller name is required");
	if (!/^3\d{13}3$/.test(vat || "")) problems.push("VAT number must be 15 digits, starting and ending with 3");
	if (!time || Number.isNaN(Date.parse(time))) problems.push("Timestamp must be ISO 8601, for example 2022-04-25T15:30:00Z");
	for (const [label, v] of [["Total", total], ["VAT total", tax]]) {
		if (!/^\d+\.\d{2}$/.test(v || "")) problems.push(`${label} should be a plain number with two decimals, for example 1000.00`);
	}
	if (problems.length) throw new Error(problems.join("\n"));
	return encodeTlv([[1, seller], [2, vat], [3, time], [4, total], [5, tax]]);
}

function show(entries) {
	for (const { tag, length, bytes } of entries) {
		const name = NAMES[tag] || "Unknown tag";
		const text = bytes.toString("utf8");
		const printable = tag <= 5 || /^[\x20-\x7E]+$/.test(text);
		const value = printable ? text : `${bytes.toString("base64")} (base64 of ${length} raw bytes)`;
		console.log(`${String(tag).padStart(2)}  ${name.padEnd(44)} ${String(length).padStart(3)} B  ${value}`);
	}
}

function test() {
	let failed = 0;
	const check = (label, ok, detail = "") => {
		console.log(`${ok ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
		if (!ok) failed++;
	};

	// Widely published Phase 1 sample (seller "Bobs Records").
	const sample = "AQxCb2JzIFJlY29yZHMCDzMxMDEyMjM5MzUwMDAwMwMUMjAyMi0wNC0yNVQxNTozMDowMFoEBzEwMDAuMDAFBjE1MC4wMA==";
	const encoded = phase1({ seller: "Bobs Records", vat: "310122393500003", time: "2022-04-25T15:30:00Z", total: "1000.00", tax: "150.00" });
	check("Encodes the published sample byte for byte", encoded === sample);
	const decoded = decodeTlv(sample).map((e) => e.bytes.toString("utf8"));
	check("Decodes the published sample", decoded.join("|") === "Bobs Records|310122393500003|2022-04-25T15:30:00Z|1000.00|150.00");

	// Arabic seller name: length must be bytes, not characters.
	const arabic = "شركة السجلات المحدودة";
	const qr = phase1({ seller: arabic, vat: "300000000000003", time: "2026-10-08T09:30:00Z", total: "115.00", tax: "15.00" });
	const first = decodeTlv(qr)[0];
	check("Arabic name length is UTF-8 bytes", first.length === Buffer.byteLength(arabic, "utf8") && first.length !== arabic.length, `${arabic.length} chars → ${first.length} bytes`);
	check("Arabic name round-trips", first.bytes.toString("utf8") === arabic);

	// Phase 2 QR from ZATCA's SDK sample (Data/Samples/Simplified/Invoice/Simplified_Invoice.xml).
	// Tags 6-7 are Base64 text (44 and ~96 bytes); tags 8-9 are raw DER bytes.
	const sdk = "ARNBY21lIFdpZGdldOKAmXMgTFREAg8zMTExMTExMTExMDExMTMDFDIwMjItMDgtMTdUMTc6NDE6MDhaBAYyMzEuMTUFBTMwLjE1BixSdkNTcE1ZejgwMDlLYkoza3U3Mm9hQ0ZXcHpFZlFOY3BjKzVidWxoM0prPQdgTUVZQ0lRRFlzRG52aUpZUGdZanlDSVlBeXpFVGVZdGhJb0phUWhDaGJsUDRlQUFQUEFJaEFKbDZ6ZkhnaUttV1R0c2ZVejhZQlo4UWtROXJCTDRVeTdtSzBjeHZXb29ICFgwVjAQBgcqhkjOPQIBBgUrgQQACgNCAARhgwyg5oVgCEw7+y16i19nJq+vqnXVJKXCwr1rOawtjtvVv4UuGowCuEHZ2ocpujGoo1++QoN4+GmqO6LmFyfRCUYwRAIgOgjNPJW017lsIijmVQVkP7GzFO2KQKd9GHaukLgIWFsCIFJF9uwKhTMxDjWbN+1awsnFI7RLBRxA/6hZ+F1wtaqU";
	const tags = Object.fromEntries(decodeTlv(sdk).map((e) => [e.tag, e]));
	check("Decodes the SDK Phase 2 sample (tags 1-9)", Object.keys(tags).join(",") === "1,2,3,4,5,6,7,8,9");
	check("Tag 1 counts bytes: 17 chars with ’ → 19 bytes", tags[1].length === 19 && tags[1].bytes.toString("utf8") === "Acme Widget’s LTD");
	check("Tag 6 is the Base64 text of a SHA-256 hash (44 bytes)", tags[6].length === 44 && Buffer.from(tags[6].bytes.toString(), "base64").length === 32);
	check("Tag 8 is a DER secp256k1 public key (88 bytes)", tags[8].length === 88 && tags[8].bytes.includes(Buffer.from("2b8104000a", "hex")));
	check("Tag 9 is a raw DER ECDSA signature", tags[9].bytes[0] === 0x30 && tags[9].bytes[1] === tags[9].length - 2);

	let threw = false;
	try { encodeTlv([[1, "x".repeat(256)]]); } catch { threw = true; }
	check("Rejects values over 255 bytes", threw);
	threw = false;
	try { phase1({ seller: "A", vat: "123", time: "2026-10-08T09:30:00Z", total: "1.00", tax: "0.15" }); } catch { threw = true; }
	check("Rejects a malformed VAT number", threw);
	threw = false;
	try { decodeTlv(Buffer.from([1, 9, 65]).toString("base64")); } catch { threw = true; }
	check("Rejects a truncated payload", threw);

	console.log(failed ? `\n${failed} test(s) failed.` : "\nAll tests passed.");
	process.exit(failed ? 1 : 0);
}

function arg(name) {
	const i = process.argv.indexOf(`--${name}`);
	return i > -1 ? process.argv[i + 1] : undefined;
}

const isMain = import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("qr-tlv.mjs");
if (isMain) {
	const cmd = process.argv[2];
	try {
		if (cmd === "encode") {
			const b64 = phase1({ seller: arg("seller"), vat: arg("vat"), time: arg("time"), total: arg("total"), tax: arg("tax") });
			console.log(b64);
		} else if (cmd === "decode") {
			if (!process.argv[3]) throw new Error("Pass the Base64 payload to decode");
			show(decodeTlv(process.argv[3]));
		} else if (cmd === "test") {
			test();
		} else {
			console.log("Usage:\n  node qr-tlv.mjs encode --seller NAME --vat 3XXXXXXXXXXXXX3 --time ISO8601 --total 115.00 --tax 15.00\n  node qr-tlv.mjs decode BASE64\n  node qr-tlv.mjs test");
			process.exit(cmd ? 2 : 0);
		}
	} catch (err) {
		console.error(err.message);
		process.exit(1);
	}
}
