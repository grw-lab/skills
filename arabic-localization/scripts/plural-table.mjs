#!/usr/bin/env node
// Print the CLDR plural category your runtime picks for each number in a locale.
//
// Usage:
//   node plural-table.mjs                 # Arabic, 0..120
//   node plural-table.mjs ar 1200         # Arabic, 0..1200
//   node plural-table.mjs ar-SA 120 --ordinal
//
// Uses Intl.PluralRules, so the output is exactly what i18next, FormatJS and
// next-intl will see in the same runtime. No dependencies.

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const ordinal = process.argv.includes("--ordinal");
const locale = args[0] || "ar";
const max = Number(args[1] ?? 120);

if (!Number.isInteger(max) || max < 0) {
	console.error("Max must be a whole number, for example: node plural-table.mjs ar 120");
	process.exit(1);
}

let rules;
try {
	rules = new Intl.PluralRules(locale, { type: ordinal ? "ordinal" : "cardinal" });
} catch (err) {
	console.error(`Unknown locale "${locale}": ${err.message}`);
	process.exit(1);
}

const opts = rules.resolvedOptions();
const groups = new Map(opts.pluralCategories.map((c) => [c, []]));
for (let n = 0; n <= max; n++) groups.get(rules.select(n)).push(n);

// Collapse 3,4,5,6 into 3–6 so long tables stay readable.
function ranges(list) {
	const out = [];
	for (let i = 0; i < list.length; i++) {
		let j = i;
		while (j + 1 < list.length && list[j + 1] === list[j] + 1) j++;
		out.push(i === j ? `${list[i]}` : `${list[i]}–${list[j]}`);
		i = j;
	}
	return out.join(", ");
}

const order = ["zero", "one", "two", "few", "many", "other"];
console.log(`Locale: ${opts.locale} · type: ${opts.type} · ICU ${process.versions.icu ?? "?"} · CLDR ${process.versions.cldr ?? "?"}`);
console.log(`Categories: ${order.filter((c) => groups.has(c)).join(", ")}\n`);
for (const cat of order) {
	if (!groups.has(cat)) continue;
	const list = groups.get(cat);
	console.log(`${cat.padEnd(6)} ${list.length ? ranges(list) : "(none in range)"}`);
}

const decimals = [0.5, 1.5, 2.5, 3.5, 10.5, 11.5, 100.5];
console.log(`\nDecimals: ${decimals.map((d) => `${d} → ${rules.select(d)}`).join(" · ")}`);
console.log(`Large:    ${[1000, 1001, 1002, 1003, 1011, 1100, 1000000].map((d) => `${d} → ${rules.select(d)}`).join(" · ")}`);
