#!/usr/bin/env node
// Turn an extract.mjs report into a starter tokens.json you then edit by hand.
//
// Usage:
//   node draft.mjs report.json [--out tokens.json] [--threshold 2.5] [--min-uses 1] [--base 16]
//
// What it does:
//   - clusters colors and gives each a draft primitive name (neutral-100, lime-50); keeps existing
//     custom property names when a color already has one
//   - names font families sans / serif / mono
//   - snaps font sizes into a named scale around the body size (xs, sm, base, lg, xl, 2xl, ...)
//   - builds a spacing scale on a 4px grid and lists off-grid values under "_offScale"
//   - names radii, shadows, breakpoints, durations, easings, z-index layers
// Keys that start with "_" are notes; emit.mjs ignores them.
// --min-uses drops values used fewer times than this (default 1 keeps everything).
// --base is the root font size in px used to convert rem/em (default 16).
// Exits 1 on bad input.

import { readFileSync, writeFileSync } from "node:fs";
import { parseColor, toHex, cluster, suggestName, toOklch } from "./lib/color.mjs";

const argv = process.argv.slice(2);
const opt = (name, fallback = null) => {
	const i = argv.indexOf(name);
	return i >= 0 ? argv[i + 1] : fallback;
};
const file = argv.find((a, i) => !a.startsWith("--") && !argv[i - 1]?.startsWith("--"));
if (!file) {
	console.error("Usage: node draft.mjs report.json [--out tokens.json]");
	process.exit(1);
}
let report;
try {
	report = JSON.parse(readFileSync(file, "utf8"));
} catch (e) {
	console.error(`error: cannot read ${file}: ${e.message}`);
	process.exit(1);
}

const BASE = parseFloat(opt("--base", "16"));
const MIN = parseInt(opt("--min-uses", "1"), 10);
const keep = (list = []) => list.filter((e) => e.count >= MIN);
// em is relative to the parent, so it only counts as a fixed size where allowed.
const px = (v, allowEm = true) => {
	const m = String(v).trim().match(allowEm ? /^(-?\d*\.?\d+)(px|rem|em)$/ : /^(-?\d*\.?\d+)(px|rem)$/);
	if (!m) return null;
	return m[2] === "px" ? +m[1] : +m[1] * BASE;
};
const rem = (n) => `${+(n / BASE).toFixed(4)}rem`;
const uniqueName = (taken, name) => {
	let n = name;
	let i = 2;
	while (taken.has(n)) n = `${name}-${i++}`;
	taken.add(n);
	return n;
};

const tokens = {
	_about: "Draft from design-tokens-extractor. Rename freely, fill 'semantic', then run emit.mjs.",
	_source: report.files,
	color: {},
	semantic: {},
	font: {},
	fontWeight: {},
	text: {},
	spacing: {},
	radius: {},
	shadow: {},
	breakpoint: {},
	duration: {},
	ease: {},
	z: {},
};

// ---------- color ----------
const varNames = {};
for (const [name, value] of Object.entries(report.customProperties ?? {})) {
	const c = parseColor(value);
	if (c) varNames[toHex(c)] ??= name.replace(/^--/, "").replace(/^color-/, "");
}
const clusters = cluster(keep(report.colors), parseFloat(opt("--threshold", "2.5")));
const taken = new Set();
const sortedClusters = [...clusters].sort((a, b) => toOklch(b.color).L - toOklch(a.color).L);
for (const k of sortedClusters) {
	const existing = k.members.map((m) => varNames[m.value]).find(Boolean);
	const name = uniqueName(taken, existing ?? suggestName(k.color));
	tokens.color[name] = k.hex;
}
tokens._colorNote = "Primitive colors, lightest first. Fill 'semantic' with roles that point at them, e.g. \"text\": \"{color.ink}\".";
tokens.semantic = { bg: "", surface: "", text: "", muted: "", border: "", accent: "" };

// ---------- fonts ----------
const famTaken = new Set();
const GENERIC = /\b(sans-serif|serif|monospace|ui-monospace|ui-sans-serif|ui-serif|system-ui|cursive|fantasy)\b/i;
const kindOf = (v) => {
	const lower = v.toLowerCase();
	if (/mono|courier|consolas|menlo/.test(lower)) return "mono";
	if (/(^|[\s,"'])serif|georgia|times/.test(lower) && !/sans/.test(lower)) return "serif";
	return "sans";
};
// Stacks defined as custom properties are the real ones; prefer them and their names.
const stacks = Object.entries(report.customProperties ?? {}).filter(([, v]) => GENERIC.test(v) && !/var\(/.test(v));
const covered = new Set();
for (const [name, v] of stacks) {
	tokens.font[uniqueName(famTaken, name.replace(/^--/, "").replace(/^font-/, ""))] = v;
	for (const fam of v.split(",")) covered.add(fam.trim().replace(/^["']|["']$/g, "").toLowerCase());
}
for (const f of keep(report.fontFamilies)) {
	const first = f.value.split(",")[0].trim().replace(/^["']|["']$/g, "").toLowerCase();
	if (covered.has(first)) continue;
	const kind = kindOf(f.value);
	const stack = f.value.includes(",") ? f.value : `${f.value}, ${kind === "mono" ? "ui-monospace, monospace" : kind === "serif" ? "serif" : "sans-serif"}`;
	tokens.font[uniqueName(famTaken, kind)] = stack;
}
for (const w of keep(report.fontWeights)) {
	const n = { normal: 400, bold: 700 }[w.value] ?? parseInt(w.value, 10);
	if (!n || n % 100) continue;
	const names = { 100: "thin", 200: "extralight", 300: "light", 400: "regular", 500: "medium", 600: "semibold", 700: "bold", 800: "extrabold", 900: "black" };
	tokens.fontWeight[names[n]] = n;
}

// ---------- type scale ----------
const sizes = keep(report.fontSizes);
const fixed = [];
const fluid = [];
for (const s of sizes) {
	const p = px(s.value, false);
	if (p == null) fluid.push(s);
	else fixed.push({ ...s, px: p });
}
// Merge sizes within 0.5px, keep the most used spelling.
const merged = [];
for (const s of fixed.sort((a, b) => b.count - a.count)) {
	const near = merged.find((m) => Math.abs(m.px - s.px) <= 0.5);
	if (near) near.count += s.count;
	else merged.push({ ...s });
}
merged.sort((a, b) => a.px - b.px);
const bodyCandidates = merged.filter((m) => m.px >= 14 && m.px <= 18).sort((a, b) => b.count - a.count || Math.abs(a.px - 16) - Math.abs(b.px - 16));
const body = bodyCandidates[0] ?? merged[Math.floor(merged.length / 2)];
if (body) {
	const below = ["sm", "xs", "2xs", "3xs", "4xs", "5xs", "6xs", "7xs", "8xs"];
	const above = ["lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl", "7xl", "8xl", "9xl", "10xl", "11xl"];
	const bi = merged.indexOf(body);
	merged.forEach((m, i) => {
		const name = i === bi ? "base" : i < bi ? below[bi - i - 1] ?? `s${i}` : above[i - bi - 1] ?? `l${i}`;
		tokens.text[name] = { size: rem(m.px) };
	});
}
if (merged.length > 9) {
	tokens._typeNote = `${merged.length} distinct font sizes. Most systems need 6 to 9. Merge sizes within about 5% of each other into the most used one.`;
}
const lh = keep(report.lineHeights).map((l) => l.value);
if (lh.length) tokens._lineHeightsSeen = lh;
const ls = keep(report.letterSpacings).map((l) => l.value);
if (ls.length) tokens._letterSpacingsSeen = ls;
if (fluid.length) tokens._fluidOrRelativeSizes = fluid.map((f) => f.value);
tokens._textNote = "Add lineHeight / letterSpacing / weight to text sizes where a pairing is consistent, e.g. { \"size\": \"0.875rem\", \"lineHeight\": \"1.4\" }.";

// ---------- spacing ----------
const spacingPx = [...new Set(keep(report.spacing).map((s) => px(s.value)).filter((n) => n != null && n > 0))].sort((a, b) => a - b);
const onGrid = spacingPx.filter((n) => n % 4 === 0 || n === 2 || n === 1);
const offGrid = spacingPx.filter((n) => !onGrid.includes(n));
for (const n of onGrid) tokens.spacing[String(n / 4).replace(/\.0+$/, "")] = rem(n);
if (offGrid.length) {
	tokens._offScale = offGrid.map((n) => `${rem(n)} (${+n.toFixed(2)}px, nearest 4px step: ${Math.round(n / 4) * 4}px)`);
}
tokens._spacingNote = "Names are multiples of 4px (\"4\" = 16px). Snap _offScale values to the nearest step unless they are deliberate.";

// ---------- radius, shadow, breakpoints, motion, z ----------
const radii = [...new Map(keep(report.radii).map((r) => [px(r.value) ?? r.value, r.value])).entries()];
const radNames = ["sm", "md", "lg", "xl", "2xl", "3xl", "4xl"];
let ri = 0;
for (const [p, v] of radii.sort((a, b) => (typeof a[0] === "number" ? a[0] : 1e9) - (typeof b[0] === "number" ? b[0] : 1e9))) {
	if ((typeof p === "number" && p >= 999) || v === "50%") tokens.radius.full = v === "50%" ? "50%" : "9999px";
	else tokens.radius[radNames[ri++] ?? `r${ri}`] = typeof p === "number" ? rem(p) : v;
}
const shadowNames = ["sm", "md", "lg", "xl", "2xl"];
const shadows = keep(report.shadows).map((s) => s.value).sort((a, b) => {
	const blur = (v) => Math.max(...[...v.matchAll(/(\d*\.?\d+)px/g)].map((m) => +m[1]), 0);
	return blur(a) - blur(b);
});
shadows.forEach((s, i) => { tokens.shadow[shadowNames[i] ?? `s${i + 1}`] = s; });

const bps = [...new Set(keep(report.breakpoints).map((b) => px(b.value)).filter(Boolean))].sort((a, b) => a - b);
const bpNames = ["sm", "md", "lg", "xl", "2xl", "3xl"];
bps.forEach((b, i) => { tokens.breakpoint[bpNames[i] ?? `bp${i + 1}`] = rem(b); });
if (bps.length) tokens._breakpointNote = "Breakpoints sorted small to large. Check whether the CSS used min-width (mobile first) or max-width.";

const ms = (v) => (v.endsWith("ms") ? parseFloat(v) : parseFloat(v) * 1000);
const durs = [...new Set(keep(report.durations).map((d) => ms(d.value)))].sort((a, b) => a - b);
const durNames = ["fastest", "faster", "fast", "normal", "slow", "slower", "slowest"];
const offset = Math.max(0, Math.floor((durNames.length - durs.length) / 2));
durs.forEach((d, i) => { tokens.duration[durNames[offset + i] ?? `d${i + 1}`] = `${Math.round(d)}ms`; });

let ei = 1;
for (const e of keep(report.easings)) {
	if (!e.value.startsWith("cubic-bezier")) continue;
	tokens.ease[ei === 1 ? "out" : `custom-${ei}`] = e.value;
	ei++;
}
tokens._easeNote = "Only custom cubic-bezier curves are listed. Rename by feel: out, in-out, emphasized.";

const zs = [...new Set(keep(report.zIndex).map((z) => parseInt(z.value, 10)))].sort((a, b) => a - b);
const zNames = ["base", "raised", "dropdown", "sticky", "overlay", "modal", "toast", "tooltip"];
zs.forEach((z, i) => { tokens.z[zNames[i] ?? `layer-${i + 1}`] = z; });
if (zs.length) tokens._zNote = "Layer names are guesses by order. Rename by what each layer holds.";

const out = opt("--out");
const json = JSON.stringify(tokens, null, "\t") + "\n";
if (out) {
	writeFileSync(out, json);
	console.error(`Wrote ${out}: ${Object.keys(tokens.color).length} colors, ${Object.keys(tokens.text).length} text sizes, ${Object.keys(tokens.spacing).length} spacing steps (${offGrid.length} off-grid), ${Object.keys(tokens.radius).length} radii, ${Object.keys(tokens.shadow).length} shadows.`);
} else {
	process.stdout.write(json);
}
