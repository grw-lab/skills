#!/usr/bin/env node
// Emit tokens.json as CSS custom properties, Tailwind v4 @theme, Tailwind v3 config, and DTCG JSON.
//
// Usage:
//   node emit.mjs tokens.json [--format css|tw4|tw3|dtcg|all] [--out dir] [--prefix ""] [--dtcg 2025|legacy]
//
// tokens.json sections (all optional): color, semantic, font, fontWeight, text, spacing, radius,
// shadow, breakpoint, duration, ease, z. Keys starting with "_" are ignored. Values may alias another
// token with "{group.name}", e.g. "semantic": { "text": "{color.ink}" }.
//
// Outputs (with --out, written as files; otherwise printed):
//   tokens.css          :root { --color-ink: ...; }   (aliases become var(--color-...))
//   theme.css           Tailwind v4 @theme block (aliases resolved to values)
//   tailwind.config.js  Tailwind v3 theme.extend (aliases resolved)
//   design.tokens.json  Design Tokens Community Group format (spec extension: .tokens or .tokens.json).
//                       --dtcg 2025 (default): 2025.10 stable spec, object values for color/dimension/duration.
//                       --dtcg legacy: older draft string values ("#fff", "16px") that many tools still read.
// Exits 1 on bad input or unresolved aliases.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { parseColor, toHex } from "./lib/color.mjs";

const argv = process.argv.slice(2);
const opt = (name, fallback = null) => {
	const i = argv.indexOf(name);
	return i >= 0 ? argv[i + 1] : fallback;
};
const fail = (msg) => {
	console.error(`error: ${msg}`);
	process.exit(1);
};
const file = argv.find((a, i) => !a.startsWith("--") && !argv[i - 1]?.startsWith("--"));
if (!file) fail("Usage: node emit.mjs tokens.json [--format all] [--out dir]");

let raw;
try {
	raw = JSON.parse(readFileSync(file, "utf8"));
} catch (e) {
	fail(`cannot read ${file}: ${e.message}`);
}
const format = opt("--format", "all");
const outDir = opt("--out");
const dtcgMode = opt("--dtcg", "2025");
const prefix = opt("--prefix", "");

const GROUPS = ["color", "semantic", "font", "fontWeight", "text", "spacing", "radius", "shadow", "breakpoint", "duration", "ease", "z"];
const clean = (obj) => Object.fromEntries(Object.entries(obj ?? {}).filter(([k, v]) => !k.startsWith("_") && !k.startsWith("$") && v !== "" && v != null));
const T = Object.fromEntries(GROUPS.map((g) => [g, clean(raw[g])]));

const CSS_NS = { color: "color", semantic: "color", font: "font", fontWeight: "font-weight", text: "text", spacing: "spacing", radius: "radius", shadow: "shadow", breakpoint: "breakpoint", duration: "duration", ease: "ease", z: "z" };
const varName = (group, name) => `--${prefix}${CSS_NS[group]}-${name}`;

function lookup(ref, seen = new Set()) {
	const m = /^\{([a-zA-Z]+)\.([^}]+)\}$/.exec(ref);
	if (!m) return ref;
	if (seen.has(ref)) fail(`alias loop at ${ref}`);
	seen.add(ref);
	const v = T[m[1]]?.[m[2]];
	if (v == null) fail(`unresolved alias ${ref}`);
	return typeof v === "string" ? lookup(v, seen) : v;
}
// Check every alias up front so no format silently emits a broken reference.
for (const g of GROUPS) for (const v of Object.values(T[g])) if (typeof v === "string" && /^\{/.test(v)) lookup(v);

const isAlias = (v) => typeof v === "string" && /^\{[a-zA-Z]+\.[^}]+\}$/.test(v);
const aliasVar = (v) => {
	const [, g, n] = /^\{([a-zA-Z]+)\.([^}]+)\}$/.exec(v);
	return `var(${varName(g, n)})`;
};
const textParts = (v) => (typeof v === "string" ? { size: v } : v);

// ---------- CSS custom properties ----------
function css() {
	const lines = [":root {"];
	for (const g of GROUPS) {
		const entries = Object.entries(T[g]);
		if (!entries.length) continue;
		lines.push(`\t/* ${g} */`);
		for (const [name, v] of entries) {
			if (g === "text") {
				const t = textParts(v);
				lines.push(`\t${varName(g, name)}: ${t.size};`);
				if (t.lineHeight) lines.push(`\t${varName(g, name)}--line-height: ${t.lineHeight};`);
				if (t.letterSpacing) lines.push(`\t${varName(g, name)}--letter-spacing: ${t.letterSpacing};`);
				if (t.weight) lines.push(`\t${varName(g, name)}--font-weight: ${t.weight};`);
			} else {
				lines.push(`\t${varName(g, name)}: ${isAlias(v) ? aliasVar(v) : v};`);
			}
		}
	}
	lines.push("}");
	if (Object.keys(T.breakpoint).length) lines.push("", "/* Custom properties do not work inside @media conditions. Use the breakpoint values directly. */");
	return lines.join("\n") + "\n";
}

// ---------- Tailwind v4 ----------
function tw4() {
	const ns = { color: "color", semantic: "color", font: "font", fontWeight: "font-weight", text: "text", spacing: "spacing", radius: "radius", shadow: "shadow", breakpoint: "breakpoint", ease: "ease" };
	const lines = ['@import "tailwindcss";', "", "@theme {"];
	for (const g of Object.keys(ns)) {
		const entries = Object.entries(T[g]);
		if (!entries.length) continue;
		lines.push(`\t/* ${g} */`);
		for (const [name, v] of entries) {
			if (g === "text") {
				const t = textParts(v);
				lines.push(`\t--text-${name}: ${t.size};`);
				if (t.lineHeight) lines.push(`\t--text-${name}--line-height: ${t.lineHeight};`);
				if (t.letterSpacing) lines.push(`\t--text-${name}--letter-spacing: ${t.letterSpacing};`);
				if (t.weight) lines.push(`\t--text-${name}--font-weight: ${t.weight};`);
			} else {
				lines.push(`\t--${ns[g]}-${name}: ${lookup(v)};`);
			}
		}
	}
	lines.push("}");
	const extra = [...Object.entries(T.duration).map(([n, v]) => `\t--duration-${n}: ${v};`), ...Object.entries(T.z).map(([n, v]) => `\t--z-${n}: ${v};`)];
	if (extra.length) {
		lines.push("", "/* Not Tailwind theme namespaces. Use as duration-(--duration-fast) or z-(--z-modal). */", ":root {", ...extra, "}");
	}
	return lines.join("\n") + "\n";
}

// ---------- Tailwind v3 ----------
function tw3() {
	const stack = (s) => s.split(",").map((x) => x.trim()).filter(Boolean);
	const ext = {};
	const put = (key, obj) => { if (Object.keys(obj).length) ext[key] = obj; };
	put("colors", Object.fromEntries([...Object.entries(T.color), ...Object.entries(T.semantic)].map(([n, v]) => [n, lookup(v)])));
	put("fontFamily", Object.fromEntries(Object.entries(T.font).map(([n, v]) => [n, stack(lookup(v))])));
	put("fontWeight", Object.fromEntries(Object.entries(T.fontWeight).map(([n, v]) => [n, String(v)])));
	put("fontSize", Object.fromEntries(Object.entries(T.text).map(([n, v]) => {
		const t = textParts(v);
		const opts = {};
		if (t.lineHeight) opts.lineHeight = String(t.lineHeight);
		if (t.letterSpacing) opts.letterSpacing = t.letterSpacing;
		if (t.weight) opts.fontWeight = String(t.weight);
		return [n, Object.keys(opts).length ? [t.size, opts] : t.size];
	})));
	put("spacing", Object.fromEntries(Object.entries(T.spacing).map(([n, v]) => [n, lookup(v)])));
	put("borderRadius", Object.fromEntries(Object.entries(T.radius).map(([n, v]) => [n, lookup(v)])));
	put("boxShadow", Object.fromEntries(Object.entries(T.shadow).map(([n, v]) => [n, lookup(v)])));
	put("screens", Object.fromEntries(Object.entries(T.breakpoint).map(([n, v]) => [n, lookup(v)])));
	put("transitionDuration", Object.fromEntries(Object.entries(T.duration).map(([n, v]) => [n, lookup(v)])));
	put("transitionTimingFunction", Object.fromEntries(Object.entries(T.ease).map(([n, v]) => [n, lookup(v)])));
	put("zIndex", Object.fromEntries(Object.entries(T.z).map(([n, v]) => [n, String(lookup(v))])));
	return `/** @type {import('tailwindcss').Config} */\nmodule.exports = {\n\ttheme: {\n\t\textend: ${JSON.stringify(ext, null, "\t").replace(/\n/g, "\n\t\t")},\n\t},\n};\n`;
}

// ---------- DTCG ----------
const KEYWORD_EASE = { linear: [0, 0, 1, 1], ease: [0.25, 0.1, 0.25, 1], "ease-in": [0.42, 0, 1, 1], "ease-out": [0, 0, 0.58, 1], "ease-in-out": [0.42, 0, 0.58, 1] };
const warnings = [];

function dimension(v, where) {
	const m = String(v).trim().match(/^(-?\d*\.?\d+)(px|rem)$/);
	if (!m) {
		warnings.push(`${where}: "${v}" is not px or rem, skipped in DTCG output`);
		return undefined;
	}
	return dtcgMode === "legacy" ? `${+m[1]}${m[2]}` : { value: +m[1], unit: m[2] };
}
function durationVal(v, where) {
	const m = String(v).trim().match(/^(\d*\.?\d+)(ms|s)$/);
	if (!m) {
		warnings.push(`${where}: "${v}" is not a duration`);
		return undefined;
	}
	return dtcgMode === "legacy" ? `${+m[1]}${m[2]}` : { value: +m[1], unit: m[2] };
}
function colorVal(v, where) {
	const c = parseColor(v);
	if (!c) {
		warnings.push(`${where}: cannot parse color "${v}"`);
		return undefined;
	}
	if (dtcgMode === "legacy") return toHex(c);
	const round = (x) => +x.toFixed(4);
	const out = { colorSpace: "srgb", components: [round(c.r), round(c.g), round(c.b)], hex: toHex({ ...c, a: 1 }) };
	if (c.a < 1) out.alpha = round(c.a);
	return out;
}
function shadowVal(v, where) {
	const layers = String(v).split(/,(?![^(]*\))/).map((s) => s.trim());
	const parsed = [];
	for (const layer of layers) {
		const inset = /\binset\b/.test(layer);
		const rest = layer.replace(/\binset\b/, "").trim();
		const colorMatch = rest.match(/(rgba?\([^)]*\)|hsla?\([^)]*\)|oklch\([^)]*\)|#[0-9a-fA-F]{3,8}|\b[a-z]+\b)\s*$/) ?? rest.match(/^(rgba?\([^)]*\)|hsla?\([^)]*\)|oklch\([^)]*\)|#[0-9a-fA-F]{3,8})/);
		const lengths = rest.replace(colorMatch?.[1] ?? "", "").trim().split(/\s+/).filter(Boolean);
		if (!colorMatch || lengths.length < 2 || lengths.length > 4) {
			warnings.push(`${where}: shadow "${layer}" not parsed, skipped`);
			return undefined;
		}
		const len = (x) => (x === "0" ? (dtcgMode === "legacy" ? "0px" : { value: 0, unit: "px" }) : dimension(x, where));
		const s = {
			color: colorVal(colorMatch[1], where),
			offsetX: len(lengths[0]),
			offsetY: len(lengths[1]),
			blur: len(lengths[2] ?? "0"),
			spread: len(lengths[3] ?? "0"),
		};
		if (inset) s.inset = true;
		if (Object.values(s).some((x) => x === undefined)) return undefined;
		parsed.push(s);
	}
	return parsed.length === 1 ? parsed[0] : parsed;
}

function dtcg() {
	const out = {};
	const add = (group, name, type, value, original) => {
		if (value === undefined) return;
		out[group] ??= {};
		out[group][name] = { $type: type, $value: value };
		if (original !== undefined && typeof original === "string" && /^\{/.test(original)) out[group][name].$value = original;
	};
	for (const [n, v] of Object.entries(T.color)) add("color", n, "color", isAlias(v) ? v : colorVal(v, `color.${n}`), v);
	for (const [n, v] of Object.entries(T.semantic)) add("semantic", n, "color", isAlias(v) ? v : colorVal(v, `semantic.${n}`), v);
	for (const [n, v] of Object.entries(T.font)) {
		const list = String(lookup(v)).split(",").map((x) => x.trim().replace(/^["']|["']$/g, ""));
		add("font", n, "fontFamily", isAlias(v) ? v : list, v);
	}
	for (const [n, v] of Object.entries(T.fontWeight)) add("fontWeight", n, "fontWeight", Number(lookup(v)));
	for (const [n, v] of Object.entries(T.text)) {
		const t = textParts(v);
		add("fontSize", n, "dimension", dimension(t.size, `text.${n}`));
		if (t.lineHeight && /^\d*\.?\d+$/.test(String(t.lineHeight))) add("lineHeight", n, "number", Number(t.lineHeight));
	}
	for (const [n, v] of Object.entries(T.spacing)) add("spacing", n, "dimension", dimension(lookup(v), `spacing.${n}`));
	for (const [n, v] of Object.entries(T.radius)) add("radius", n, "dimension", dimension(lookup(v), `radius.${n}`));
	for (const [n, v] of Object.entries(T.breakpoint)) add("breakpoint", n, "dimension", dimension(lookup(v), `breakpoint.${n}`));
	for (const [n, v] of Object.entries(T.shadow)) add("shadow", n, "shadow", shadowVal(lookup(v), `shadow.${n}`));
	for (const [n, v] of Object.entries(T.duration)) add("duration", n, "duration", durationVal(lookup(v), `duration.${n}`));
	for (const [n, v] of Object.entries(T.ease)) {
		const val = String(lookup(v)).trim();
		const m = val.match(/^cubic-bezier\(([^)]*)\)$/);
		const curve = m ? m[1].split(",").map(Number) : KEYWORD_EASE[val];
		if (!curve || curve.length !== 4 || curve.some(Number.isNaN)) warnings.push(`ease.${n}: "${val}" skipped`);
		else add("ease", n, "cubicBezier", curve);
	}
	for (const [n, v] of Object.entries(T.z)) add("z", n, "number", Number(lookup(v)));
	return JSON.stringify(out, null, "\t") + "\n";
}

const outputs = {
	css: ["tokens.css", css],
	tw4: ["theme.css", tw4],
	tw3: ["tailwind.config.js", tw3],
	dtcg: ["design.tokens.json", dtcg],
};
const chosen = format === "all" ? Object.keys(outputs) : format.split(",");
for (const f of chosen) if (!outputs[f]) fail(`unknown format "${f}". Use css, tw4, tw3, dtcg, or all.`);

if (outDir) mkdirSync(outDir, { recursive: true });
for (const f of chosen) {
	const [name, fn] = outputs[f];
	const text = fn();
	if (outDir) {
		writeFileSync(join(outDir, name), text);
		console.error(`wrote ${join(outDir, name)}`);
	} else {
		console.log(`/* ===== ${name} ===== */\n${text}`);
	}
}
for (const w of warnings) console.error(`warning: ${w}`);
