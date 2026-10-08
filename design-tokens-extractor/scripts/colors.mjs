#!/usr/bin/env node
// Cluster near-duplicate colors, convert to OKLCH, and check WCAG 2.x contrast.
//
// Usage:
//   node colors.mjs report.json [--threshold 2.5] [--bg "#ffffff,#f5f5f3"] [--json]
//   node colors.mjs --colors "#1c1724,#1d1825,#6f6a74" --bg "#fff"
//   node colors.mjs --pairs "#6f6a74:#ffffff,#8a847c:#f5f5f3"
//
// report.json is the output of extract.mjs.
// --threshold  merge colors whose OKLab distance (x100) is at or below this. ~2 is barely visible. Default 2.5.
// --bg         backgrounds to test every cluster against (default: the lightest and darkest cluster).
// --pairs      only check these foreground:background pairs and exit.
// --json       machine-readable output.
// Exits 1 on bad input.

import { readFileSync } from "node:fs";
import { parseColor, toHex, formatOklch, cluster, contrast, wcagGrade, suggestName, toOklch } from "./lib/color.mjs";

const argv = process.argv.slice(2);
const opt = (name, fallback = null) => {
	const i = argv.indexOf(name);
	return i >= 0 ? argv[i + 1] : fallback;
};
const asJson = argv.includes("--json");
const list = (s) => (s ? s.split(",").map((x) => x.trim()).filter(Boolean) : []);
const fail = (msg) => {
	console.error(`error: ${msg}`);
	process.exit(1);
};

// Pairs mode
if (opt("--pairs")) {
	const rows = list(opt("--pairs")).map((pair) => {
		const [f, b] = pair.split(":");
		const fc = parseColor(f);
		const bc = parseColor(b);
		if (!fc || !bc) fail(`cannot parse pair ${pair}`);
		const ratio = contrast(fc, bc);
		return { fg: toHex(fc), bg: toHex(bc), ratio: +ratio.toFixed(2), grade: wcagGrade(ratio) };
	});
	if (asJson) console.log(JSON.stringify(rows, null, 2));
	else {
		console.log("| Foreground | Background | Ratio | WCAG 2.x |\n|---|---|--:|---|");
		for (const r of rows) console.log(`| ${r.fg} | ${r.bg} | ${r.ratio}:1 | ${r.grade} |`);
		console.log("\nAA needs 4.5:1 for normal text, 3:1 for large text (24px, or 18.66px bold) and UI parts. AAA needs 7:1.");
	}
	process.exit(0);
}

let input = [];
const file = argv.find((a, i) => !a.startsWith("--") && !argv[i - 1]?.startsWith("--"));
if (file) {
	let report;
	try {
		report = JSON.parse(readFileSync(file, "utf8"));
	} catch (e) {
		fail(`cannot read ${file}: ${e.message}`);
	}
	input = (report.colors ?? []).map((c) => ({ value: c.value, count: c.count, props: c.props ?? [] }));
} else if (opt("--colors")) {
	input = list(opt("--colors")).map((value) => ({ value, count: 1, props: [] }));
} else {
	fail("pass report.json, --colors, or --pairs");
}
if (!input.length) fail("no colors found");

const threshold = parseFloat(opt("--threshold", "2.5"));
const clusters = cluster(input, threshold);

let bgs = list(opt("--bg")).map((b) => {
	const c = parseColor(b);
	if (!c) fail(`cannot parse background ${b}`);
	return c;
});
if (!bgs.length) {
	const opaque = clusters.filter((k) => k.color.a === 1);
	const byL = [...opaque].sort((a, b) => toOklch(b.color).L - toOklch(a.color).L);
	bgs = [byL[0]?.color, byL[byL.length - 1]?.color].filter(Boolean);
}

const rows = clusters.map((k) => ({
	hex: k.hex,
	oklch: formatOklch(k.color),
	name: suggestName(k.color),
	count: k.count,
	merged: k.members.slice(1).map((m) => m.value),
	usedIn: [...new Set(k.members.flatMap((m) => m.props))].slice(0, 6),
	contrast: Object.fromEntries(bgs.map((b) => {
		const r = contrast(k.color, b);
		return [toHex(b), { ratio: +r.toFixed(2), grade: wcagGrade(r) }];
	})),
}));

if (asJson) {
	console.log(JSON.stringify({ threshold, backgrounds: bgs.map(toHex), clusters: rows }, null, 2));
	process.exit(0);
}

const bgHeads = bgs.map((b) => `vs ${toHex(b)}`);
console.log(`${input.length} colors → ${rows.length} clusters (threshold ΔEok ≤ ${threshold}).\n`);
console.log(`| Hex | OKLCH | Draft name | Uses | Merged | ${bgHeads.join(" | ")} |`);
console.log(`|---|---|---|--:|---|${bgHeads.map(() => "---").join("|")}|`);
for (const r of rows) {
	const cells = Object.values(r.contrast).map((c) => `${c.ratio}:1 ${c.grade}`);
	console.log(`| ${r.hex} | ${r.oklch} | ${r.name} | ${r.count} | ${r.merged.join(", ") || "—"} | ${cells.join(" | ")} |`);
}
console.log("\nDraft names come from hue and lightness. Rename by role (bg, surface, text, muted, border, accent) before emitting tokens.");
