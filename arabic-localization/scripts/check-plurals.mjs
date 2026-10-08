#!/usr/bin/env node
// Find Arabic (or any locale's) plural messages that are missing plural forms.
//
// Checks two formats in JSON translation files (nested or flat):
//   1. i18next v21+ suffixes: key_zero, key_one, key_two, key_few, key_many, key_other
//   2. ICU MessageFormat:     "{count, plural, zero {…} one {…} … other {…}}"
//
// Usage:
//   node check-plurals.mjs locales/ar/common.json
//   node check-plurals.mjs --locale ar --source locales/en/common.json locales/ar/*.json
//
// --locale  Locale whose plural categories are required (default: ar).
// --source  Source-language file. Keys that are plural there must be plural here too.
//
// Exit code 0 = clean, 1 = problems found, 2 = bad input. No dependencies.

import { readFileSync } from "node:fs";

const argv = process.argv.slice(2);
let locale = "ar";
let source = null;
const files = [];
for (let i = 0; i < argv.length; i++) {
	if (argv[i] === "--locale") locale = argv[++i];
	else if (argv[i] === "--source") source = argv[++i];
	else if (argv[i] === "-h" || argv[i] === "--help") {
		console.log("Usage: node check-plurals.mjs [--locale ar] [--source en.json] <file.json>...");
		process.exit(0);
	} else files.push(argv[i]);
}
if (!files.length) {
	console.error("Give at least one JSON file. Example: node check-plurals.mjs locales/ar/common.json");
	process.exit(2);
}

const CATS = ["zero", "one", "two", "few", "many", "other"];
const cardinal = new Intl.PluralRules(locale);
const ordinal = new Intl.PluralRules(locale, { type: "ordinal" });
const inOrder = (cats) => CATS.filter((c) => cats.includes(c));
const required = {
	plural: inOrder(cardinal.resolvedOptions().pluralCategories),
	selectordinal: inOrder(ordinal.resolvedOptions().pluralCategories),
};

// A category that matches exactly one number (Arabic zero/one/two) can be written as =N in ICU.
function singletons(rules) {
	const seen = new Map();
	for (let n = 0; n <= 1000; n++) {
		const c = rules.select(n);
		seen.set(c, seen.has(c) ? null : n);
	}
	return seen;
}
const exact = { plural: singletons(cardinal), selectordinal: singletons(ordinal) };

function load(path) {
	try {
		return JSON.parse(readFileSync(path, "utf8"));
	} catch (err) {
		console.error(`Cannot read ${path}: ${err.message}`);
		process.exit(2);
	}
}

function flatten(obj, prefix = "", out = {}) {
	for (const [k, v] of Object.entries(obj)) {
		const key = prefix ? `${prefix}.${k}` : k;
		if (v && typeof v === "object" && !Array.isArray(v)) flatten(v, key, out);
		else if (typeof v === "string") out[key] = v;
	}
	return out;
}

const SUFFIX = new RegExp(`^(.*?)(_ordinal)?_(${CATS.join("|")})$`);

// Group i18next plural keys: { "cart.items": { type: "plural", forms: Set{one, other} } }
function groups(flat) {
	const out = new Map();
	for (const key of Object.keys(flat)) {
		const m = key.match(SUFFIX);
		if (!m) continue;
		const id = m[1] + (m[2] || "");
		if (!out.has(id)) out.set(id, { base: m[1], type: m[2] ? "selectordinal" : "plural", forms: new Set() });
		out.get(id).forms.add(m[3]);
	}
	return out;
}

// Pull every {arg, plural|selectordinal, …} block out of an ICU message, nested ones included.
function icuBlocks(message) {
	const found = [];
	const head = /\{\s*([\w.]+)\s*,\s*(plural|selectordinal)\s*,/g;
	let m;
	while ((m = head.exec(message))) {
		let i = m.index + m[0].length;
		const selectors = [];
		const skipSpace = () => { while (i < message.length && /\s/.test(message[i])) i++; };
		skipSpace();
		const offset = message.slice(i).match(/^offset:\s*\d+/);
		if (offset) i += offset[0].length;
		for (;;) {
			skipSpace();
			if (message[i] === "}" || i >= message.length) break;
			const sel = message.slice(i).match(/^(=\d+|[a-z]+)/);
			if (!sel) break;
			selectors.push(sel[1]);
			i += sel[1].length;
			skipSpace();
			if (message[i] !== "{") break;
			let depth = 0;
			for (; i < message.length; i++) {
				if (message[i] === "{") depth++;
				else if (message[i] === "}" && --depth === 0) { i++; break; }
			}
		}
		found.push({ arg: m[1], type: m[2], selectors });
	}
	return found;
}

function missingFromIcu(block) {
	const have = new Set(block.selectors.filter((s) => !s.startsWith("=")));
	for (const s of block.selectors.filter((s) => s.startsWith("="))) {
		const n = Number(s.slice(1));
		for (const [cat, only] of exact[block.type]) if (only === n) have.add(cat);
	}
	const missing = required[block.type].filter((c) => !have.has(c));
	if (!block.selectors.includes("other") && !missing.includes("other")) missing.push("other");
	return CATS.filter((c) => missing.includes(c));
}

const sourceFlat = source ? flatten(load(source)) : null;
const sourceGroups = sourceFlat ? groups(sourceFlat) : null;
let problems = 0;

for (const file of files) {
	const flat = flatten(load(file));
	const g = groups(flat);
	const report = [];

	for (const [id, grp] of g) {
		const missing = required[grp.type].filter((c) => !grp.forms.has(c));
		if (missing.length) report.push(`${id}: missing ${missing.map((c) => `_${c}`).join(", ")}`);
		const extra = [...grp.forms].filter((c) => !required[grp.type].includes(c));
		if (extra.length && grp.type === "plural") report.push(`${id}: has ${extra.map((c) => `_${c}`).join(", ")} which ${locale} never uses`);
	}

	for (const [key, value] of Object.entries(flat)) {
		for (const block of icuBlocks(value)) {
			const missing = missingFromIcu(block);
			if (missing.length) report.push(`${key}: ICU {${block.arg}, ${block.type}} missing ${missing.join(", ")}`);
		}
	}

	if (sourceGroups) {
		for (const [id, grp] of sourceGroups) {
			if (g.has(id)) continue;
			if (grp.base in flat) report.push(`${id}: plural in source, but a single string here ("${grp.base}"). Split it into ${required[grp.type].map((c) => `_${c}`).join(", ")}`);
			else report.push(`${id}: plural in source, missing here`);
		}
	}

	if (report.length) {
		problems += report.length;
		console.log(`✗ ${file}`);
		for (const line of report) console.log(`  ${line}`);
	} else {
		console.log(`✓ ${file}`);
	}
}

console.log(`\n${locale} needs: ${required.plural.join(", ")} (cardinal) · ${required.selectordinal.join(", ")} (ordinal)`);
if (problems) {
	console.log(`${problems} problem${problems === 1 ? "" : "s"} found.`);
	process.exit(1);
}
console.log("All plural messages are complete.");
