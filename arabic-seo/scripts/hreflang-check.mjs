#!/usr/bin/env node
// hreflang checker for Arabic and bilingual sites.
//
// Usage:
//   node hreflang-check.mjs https://site.com/ar/ https://site.com/en/      check these pages and their alternates
//   node hreflang-check.mjs --sitemap https://site.com/sitemap.xml [--limit 50]
//   node hreflang-check.mjs https://site.com/ar/ --json
//
// For every page it reads <link rel="alternate" hreflang> tags from the HTML and the HTTP Link header, then checks:
//   - codes are valid (ar, ar-SA, en-GB, x-default; not ar_SA, ar-AR, en-UK)
//   - the page lists itself (self-reference)
//   - every alternate returns 200, is self-canonical, and links back (reciprocity)
//   - the html lang matches the hreflang the others use for it
//   - Arabic pages declare dir="rtl"
//   - one x-default exists
// Alternates found on a page are fetched too, so one URL is enough to check a whole cluster.
//
// Node 18+. No dependencies. Exit 0 when no errors, 1 when errors, 2 on bad input.

const argv = process.argv.slice(2);
const asJson = argv.includes("--json");
const limitIdx = argv.indexOf("--limit");
const limit = limitIdx >= 0 ? Number(argv[limitIdx + 1]) : 50;
const sitemapIdx = argv.indexOf("--sitemap");
const UA = "hreflang-check/1.0 (+https://tools.grwlab.net/skills/arabic-seo/)";

let seeds = argv.filter((a, i) => /^https?:\/\//i.test(a) && (sitemapIdx < 0 || i !== sitemapIdx + 1));
const sitemapUrl = sitemapIdx >= 0 ? argv[sitemapIdx + 1] : null;

if (!seeds.length && !sitemapUrl) {
	console.error("Usage: node hreflang-check.mjs <url> [url...] | --sitemap <url> [--limit N] [--json]");
	process.exit(2);
}

// ISO 3166-1 alpha-2 codes that are often mistaken for something else.
const REGION_TRAPS = {
	UK: "UK is not a valid region code. Use GB.",
	EN: "EN is not a region.",
	SP: "SP is not a region. Spain is ES.",
	KSA: "Use SA for Saudi Arabia.",
	UAE: "Use AE for the UAE.",
};
const ARAB_REGIONS = new Set(["SA", "AE", "EG", "KW", "QA", "BH", "OM", "JO", "LB", "IQ", "SY", "PS", "YE", "SD", "LY", "TN", "DZ", "MA", "MR", "DJ", "SO", "KM", "TD", "ER", "IL"]);

function validateCode(code) {
	if (code === "x-default") return { ok: true };
	if (/_/.test(code)) return { ok: false, why: `"${code}" uses an underscore. Use a hyphen: ${code.replace("_", "-")}.` };
	const m = code.match(/^([a-zA-Z]{2,3})(?:-([a-zA-Z]{4}))?(?:-([a-zA-Z]{2}|\d{3}))?$/);
	if (!m) {
		const region = code.split("-")[1]?.toUpperCase();
		return { ok: false, why: REGION_TRAPS[region] ? `"${code}": ${REGION_TRAPS[region]}` : `"${code}" is not language[-REGION] (ISO 639-1 + ISO 3166-1).` };
	}
	const [, lang, , region] = m;
	if (lang.length === 3) return { ok: true, warn: `"${code}": Google expects ISO 639-1 two-letter language codes where one exists.` };
	if (lang.toLowerCase() === "ar" && region && region.toUpperCase() === "AR") return { ok: false, why: `"${code}": AR is Argentina. For Arabic with no region use plain "ar".` };
	if (region && REGION_TRAPS[region.toUpperCase()]) return { ok: false, why: `"${code}": ${REGION_TRAPS[region.toUpperCase()]}` };
	if (lang.toLowerCase() === "ar" && region && !ARAB_REGIONS.has(region.toUpperCase())) return { ok: true, warn: `"${code}": unusual region for Arabic. Check it is intended.` };
	return { ok: true };
}

const norm = (u) => {
	try {
		const x = new URL(u);
		x.hash = "";
		return x.href;
	} catch {
		return u;
	}
};

const attr = (tag, name) => {
	const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
	return m ? (m[2] ?? m[3] ?? m[4]) : null;
};

async function fetchPage(url) {
	try {
		const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html" }, redirect: "manual", signal: AbortSignal.timeout(15000) });
		const body = res.status === 200 ? await res.text() : "";
		return { status: res.status, location: res.headers.get("location"), link: res.headers.get("link") || "", body };
	} catch (err) {
		return { status: 0, error: err.message, link: "", body: "" };
	}
}

function parse(url, page) {
	const head = (page.body.match(/<head[\s\S]*?<\/head>/i) || [page.body])[0];
	const alternates = [];
	for (const tag of head.match(/<link\b[^>]*>/gi) || []) {
		const rel = (attr(tag, "rel") || "").toLowerCase().split(/\s+/);
		const hreflang = attr(tag, "hreflang");
		const href = attr(tag, "href");
		if (rel.includes("alternate") && hreflang && href) alternates.push({ code: hreflang, href: norm(new URL(href, url).href), via: "html" });
	}
	for (const part of page.link.split(/,(?=\s*<)/)) {
		const m = part.match(/<([^>]+)>/);
		const code = part.match(/hreflang\s*=\s*"?([^";,\s]+)/i);
		if (m && code && /rel\s*=\s*"?[^"]*alternate/i.test(part)) alternates.push({ code: code[1], href: norm(new URL(m[1], url).href), via: "header" });
	}
	const canonTag = (head.match(/<link\b[^>]*rel\s*=\s*["']?canonical["']?[^>]*>/i) || [])[0];
	const canonical = canonTag ? norm(new URL(attr(canonTag, "href"), url).href) : null;
	const htmlTag = (page.body.match(/<html\b[^>]*>/i) || [""])[0];
	return { alternates, canonical, lang: attr(htmlTag, "lang"), dir: attr(htmlTag, "dir") };
}

async function sitemapUrls(url) {
	const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(15000) });
	const xml = await res.text();
	const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, "&"));
	if (/<sitemapindex/i.test(xml)) {
		const out = [];
		for (const child of locs) {
			if (out.length >= limit) break;
			out.push(...(await sitemapUrls(child)));
		}
		return out;
	}
	return locs;
}

if (sitemapUrl) seeds = seeds.concat(await sitemapUrls(sitemapUrl));
seeds = [...new Set(seeds.map(norm))].slice(0, limit);

const pages = new Map();
const queue = [...seeds];
while (queue.length && pages.size < limit * 4) {
	const url = queue.shift();
	if (pages.has(url)) continue;
	const raw = await fetchPage(url);
	const info = raw.status === 200 ? parse(url, raw) : { alternates: [], canonical: null, lang: null, dir: null };
	pages.set(url, { url, status: raw.status, location: raw.location, error: raw.error, ...info });
	for (const a of info.alternates) if (!pages.has(a.href)) queue.push(a.href);
}

const issues = [];
const add = (level, url, msg) => issues.push({ level, url, msg });

for (const p of pages.values()) {
	if (p.status !== 200) {
		add("error", p.url, p.status === 0 ? `fetch failed: ${p.error}` : `HTTP ${p.status}${p.location ? ` → ${p.location}` : ""}. Alternates must point to final 200 URLs.`);
		continue;
	}
	if (p.canonical && p.canonical !== p.url) add("error", p.url, `canonical points elsewhere (${p.canonical}). A page in a hreflang set must be self-canonical, or Google drops it.`);
	if (!p.alternates.length) {
		add("warn", p.url, "no hreflang annotations.");
		continue;
	}
	const codes = p.alternates.map((a) => a.code.toLowerCase());
	for (const a of p.alternates) {
		const v = validateCode(a.code);
		if (!v.ok) add("error", p.url, v.why);
		else if (v.warn) add("warn", p.url, v.warn);
	}
	const dupes = codes.filter((c, i) => codes.indexOf(c) !== i);
	if (dupes.length) add("error", p.url, `same hreflang used for different URLs: ${[...new Set(dupes)].join(", ")}.`);
	if (!p.alternates.some((a) => a.href === p.url)) add("error", p.url, "does not list itself. Each page must include a hreflang for its own URL.");
	if (!codes.includes("x-default")) add("warn", p.url, "no x-default. Add one for users whose language or region you don't target.");

	const selfCode = p.alternates.find((a) => a.href === p.url)?.code;
	if (selfCode && p.lang && selfCode !== "x-default" && selfCode.split("-")[0].toLowerCase() !== p.lang.split("-")[0].toLowerCase()) {
		add("warn", p.url, `<html lang="${p.lang}"> but hreflang calls it "${selfCode}".`);
	}
	const isArabic = (p.lang || selfCode || "").toLowerCase().startsWith("ar");
	if (isArabic && (p.dir || "").toLowerCase() !== "rtl") add("warn", p.url, "Arabic page without <html dir=\"rtl\">.");

	for (const a of p.alternates) {
		if (a.href === p.url) continue;
		const target = pages.get(a.href);
		if (!target || target.status !== 200) continue;
		if (!target.alternates.some((b) => b.href === p.url)) {
			add("error", p.url, `not reciprocal: ${a.href} (${a.code}) does not link back.`);
		}
	}
}

const errors = issues.filter((i) => i.level === "error");
if (asJson) {
	console.log(JSON.stringify({ checked: [...pages.values()].map(({ url, status, lang, dir, alternates }) => ({ url, status, lang, dir, alternates })), issues }, null, 2));
} else {
	console.log(`\nhreflang check · ${pages.size} page(s)\n`);
	for (const p of pages.values()) {
		const own = p.alternates.find((a) => a.href === p.url)?.code || "-";
		console.log(`  ${String(p.status).padEnd(4)} ${own.padEnd(10)} lang=${(p.lang || "-").padEnd(6)} dir=${(p.dir || "-").padEnd(4)} ${p.url}`);
	}
	console.log("");
	if (!issues.length) console.log("  No issues found.");
	for (const i of issues) console.log(`  ${i.level === "error" ? "ERROR" : "WARN "} ${i.url}\n        ${i.msg}`);
	console.log(`\n  ${errors.length} error(s), ${issues.length - errors.length} warning(s)\n`);
}
process.exit(errors.length ? 1 : 0);
