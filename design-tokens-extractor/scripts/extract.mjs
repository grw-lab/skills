#!/usr/bin/env node
// Collect design values from CSS files, with how often each is used.
//
// Usage:
//   node extract.mjs styles.css [more.css ...] [--out report.json] [--summary]
//
// Reads plain CSS (also works on compiled Tailwind/Sass output). Prints a JSON report:
// custom properties, colors, font families/sizes/weights, line heights, letter spacing,
// spacing (margin/padding/gap), radii, shadows, breakpoints, durations, easings, z-index.
// --summary prints a short human-readable table to stderr as well.
// Exits 1 if no file could be read.

import { readFileSync, writeFileSync } from "node:fs";
import { parseColor, toHex, NAMED_COLORS } from "./lib/color.mjs";

const argv = process.argv.slice(2);
const files = argv.filter((a) => !a.startsWith("--") && argv[argv.indexOf(a) - 1] !== "--out");
const outIdx = argv.indexOf("--out");
const outFile = outIdx >= 0 ? argv[outIdx + 1] : null;
const summary = argv.includes("--summary");

if (!files.length) {
	console.error("Usage: node extract.mjs <file.css> [...] [--out report.json] [--summary]");
	process.exit(1);
}

const tally = () => new Map();
const bump = (map, key, prop) => {
	const k = String(key).trim();
	if (!k) return;
	const entry = map.get(k) ?? { value: k, count: 0, props: new Set() };
	entry.count++;
	if (prop) entry.props.add(prop);
	map.set(k, entry);
};

const report = {
	files: [],
	customProperties: {},
	customPropertyUses: {},
	colors: tally(),
	fontFamilies: tally(),
	fontSizes: tally(),
	fontWeights: tally(),
	lineHeights: tally(),
	letterSpacings: tally(),
	spacing: tally(),
	radii: tally(),
	shadows: tally(),
	breakpoints: tally(),
	durations: tally(),
	easings: tally(),
	zIndex: tally(),
	unparsedColors: tally(),
};

const COLOR_FN = /(?:rgba?|hsla?|oklch|oklab|lab|lch|color|hwb)\([^()]*(?:\([^()]*\)[^()]*)*\)/gi;
const HEX = /#[0-9a-fA-F]{3,8}\b/g;
const NAMED_RE = new RegExp(`(^|[\\s,(])(${NAMED_COLORS.join("|")})(?=$|[\\s,);])`, "gi");
const LENGTH = /^-?(?:\d*\.)?\d+(?:px|rem|em|%|vw|vh|ch|ex)$/;
const COLOR_PROPS = /(color|background|border|outline|fill|stroke|shadow|caret|accent|decoration|^--)/;

function colorsIn(value, prop) {
	if (/url\(/i.test(value) && !COLOR_PROPS.test(prop)) return;
	const found = [];
	for (const m of value.matchAll(COLOR_FN)) found.push(m[0]);
	for (const m of value.replace(COLOR_FN, " ").matchAll(HEX)) found.push(m[0]);
	if (COLOR_PROPS.test(prop) && !prop.startsWith("--font") && !/font-family|grid|animation|transition/.test(prop)) {
		for (const m of value.replace(COLOR_FN, " ").replace(HEX, " ").matchAll(NAMED_RE)) found.push(m[2]);
	}
	for (const raw of found) {
		const c = parseColor(raw);
		if (!c) {
			if (!/var\(/.test(raw)) bump(report.unparsedColors, raw, prop);
			continue;
		}
		if (raw.toLowerCase() === "transparent") continue;
		bump(report.colors, toHex(c), prop);
	}
}

function lengths(value) {
	return value.split(/\s+/).filter((v) => LENGTH.test(v) && !/^-?0+(\.0+)?[a-z%]*$/.test(v));
}

function handle(prop, value) {
	prop = prop.toLowerCase();
	const v = value.replace(/\s*!important\s*$/, "").trim();
	if (!v || /^(inherit|initial|unset|revert|revert-layer|auto|none|normal)$/i.test(v)) return;
	if (prop.startsWith("--")) report.customProperties[prop] = v;
	for (const ref of v.matchAll(/var\(\s*(--[-a-zA-Z0-9_]+)/g)) report.customPropertyUses[ref[1]] = (report.customPropertyUses[ref[1]] ?? 0) + 1;
	colorsIn(v, prop);
	if (/var\(/.test(v) && !prop.startsWith("--")) return; // token already captured via the custom property
	switch (true) {
		case prop === "font-family":
			bump(report.fontFamilies, v.replace(/\s*,\s*/g, ", "), prop);
			break;
		case prop === "font": {
			// Shorthand: [style] [weight] size[/line-height] family
			const m = v.match(/(?:^|\s)(\d*\.?\d+(?:px|rem|em|%))(?:\s*\/\s*(\d*\.?\d+(?:px|rem|em|%)?))?\s+(.+)$/);
			if (m) {
				bump(report.fontSizes, m[1], "font");
				if (m[2]) bump(report.lineHeights, m[2], "font");
				const w = v.slice(0, m.index).match(/\b([1-9]00|bold|lighter|bolder)\b/);
				if (w) bump(report.fontWeights, w[1], "font");
			}
			break;
		}
		case prop === "font-size":
			bump(report.fontSizes, v, prop);
			break;
		case prop === "font-weight":
			bump(report.fontWeights, v, prop);
			break;
		case prop === "line-height":
			bump(report.lineHeights, v, prop);
			break;
		case prop === "letter-spacing":
			bump(report.letterSpacings, v, prop);
			break;
		case /^(margin|padding)(-|$)|^(row-|column-)?gap$|^inset|^scroll-(margin|padding)/.test(prop):
			for (const l of lengths(v)) bump(report.spacing, l.replace(/^-/, ""), prop);
			break;
		case /radius/.test(prop):
			for (const l of v.split("/")[0].split(/\s+/)) if (LENGTH.test(l) && !/^0/.test(l)) bump(report.radii, l, prop);
			break;
		case prop === "box-shadow" && v !== "none":
			bump(report.shadows, v, prop);
			break;
		case /^(transition|animation)/.test(prop):
			for (const m of v.matchAll(/(?:^|[\s,])(\d*\.?\d+m?s)\b/g)) if (!/^0m?s$/.test(m[1])) bump(report.durations, m[1], prop);
			for (const m of v.matchAll(/cubic-bezier\([^)]*\)|steps\([^)]*\)|\b(?:ease-in-out|ease-in|ease-out|ease|linear)\b/g)) bump(report.easings, m[0].replace(/\s+/g, " "), prop);
			break;
		case prop === "z-index" && /^-?\d+$/.test(v):
			bump(report.zIndex, v, prop);
			break;
	}
}

for (const file of files) {
	let css;
	try {
		css = readFileSync(file, "utf8");
	} catch (e) {
		console.error(`skip ${file}: ${e.message}`);
		continue;
	}
	report.files.push(file);
	css = css.replace(/\/\*[\s\S]*?\*\//g, "");
	// @font-face declares the families that load; its weight ranges are not design tokens.
	css = css.replace(/@font-face\s*\{[^}]*\}/g, (block) => {
		const fam = block.match(/font-family\s*:\s*([^;}]+)/);
		if (fam) bump(report.fontFamilies, fam[1].trim(), "@font-face");
		return "";
	});
	for (const m of css.matchAll(/@media[^{]*/g)) {
		for (const b of m[0].matchAll(/\((?:min|max)-width\s*:\s*([\d.]+(?:px|em|rem))\)|\(width\s*[<>]=?\s*([\d.]+(?:px|em|rem))\)/g)) bump(report.breakpoints, b[1] || b[2], "@media");
	}
	for (const m of css.matchAll(/([-a-zA-Z0-9_]+)\s*:\s*([^;{}]+?)\s*(?=;|\})/g)) handle(m[1], m[2]);
}

if (!report.files.length) {
	console.error("No readable CSS files.");
	process.exit(1);
}

const toList = (map) => [...map.values()].map((e) => ({ value: e.value, count: e.count, props: [...e.props] })).sort((a, b) => b.count - a.count);
const out = {
	generated: new Date().toISOString(),
	files: report.files,
	customProperties: report.customProperties,
	customPropertyUses: Object.fromEntries(Object.entries(report.customPropertyUses).sort((a, b) => b[1] - a[1])),
};
// A color defined once as a custom property and used 40 times through var() is used 41 times.
for (const [name, value] of Object.entries(report.customProperties)) {
	const c = parseColor(value);
	const uses = report.customPropertyUses[name] ?? 0;
	if (!c || !uses) continue;
	const entry = report.colors.get(toHex(c));
	if (entry) {
		entry.count += uses;
		entry.props.add(`var(${name})`);
	}
}
for (const key of Object.keys(report)) if (report[key] instanceof Map) out[key] = toList(report[key]);

const json = JSON.stringify(out, null, 2);
if (outFile) writeFileSync(outFile, json + "\n");
else process.stdout.write(json + "\n");

if (summary || outFile) {
	const line = (label, list) => `${label.padEnd(16)} ${String(list.length).padStart(4)}  ${list.slice(0, 6).map((e) => `${e.value} ×${e.count}`).join(", ")}`;
	console.error(
		[
			`Read ${out.files.length} file(s). ${Object.keys(out.customProperties).length} custom properties.`,
			line("colors", out.colors),
			line("font families", out.fontFamilies),
			line("font sizes", out.fontSizes),
			line("font weights", out.fontWeights),
			line("line heights", out.lineHeights),
			line("letter spacing", out.letterSpacings),
			line("spacing", out.spacing),
			line("radii", out.radii),
			line("shadows", out.shadows),
			line("breakpoints", out.breakpoints),
			line("durations", out.durations),
			line("easings", out.easings),
			line("z-index", out.zIndex),
			out.unparsedColors.length ? line("unparsed colors", out.unparsedColors) : "",
		].filter(Boolean).join("\n"),
	);
}
