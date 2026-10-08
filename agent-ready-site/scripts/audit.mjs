#!/usr/bin/env node
// Agent-readiness audit for one site.
//
// Usage:
//   node audit.mjs https://example.com            audit the home page
//   node audit.mjs https://example.com/docs/      audit a specific page (site files still read from the origin)
//   node audit.mjs https://example.com --json     machine-readable output
//
// Node 18+ (global fetch). No dependencies.
// Exit code: 0 when every required check passes, 1 when any required check fails, 2 on bad input.

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const target = args.find((a) => !a.startsWith("--"));

if (!target || !/^https?:\/\//i.test(target)) {
	console.error("Usage: node audit.mjs <https://site/page> [--json]");
	process.exit(2);
}

const page = new URL(target);
const origin = page.origin;
const UA = "agent-ready-audit/1.0 (+https://tools.grwlab.net/skills/agent-ready-site/)";

// Named AI crawlers worth an explicit decision in robots.txt.
const AI_BOTS = [
	"GPTBot", "OAI-SearchBot", "ChatGPT-User",
	"ClaudeBot", "Claude-SearchBot", "Claude-User",
	"PerplexityBot", "Perplexity-User",
	"Google-Extended", "Applebot-Extended",
	"CCBot", "Bytespider", "meta-externalagent",
];

async function get(url, headers = {}) {
	const started = Date.now();
	try {
		const res = await fetch(url, {
			headers: { "User-Agent": UA, ...headers },
			redirect: "follow",
			signal: AbortSignal.timeout(15000),
		});
		const body = await res.text();
		return { ok: true, status: res.status, url: res.url, headers: res.headers, body, ms: Date.now() - started };
	} catch (err) {
		return { ok: false, status: 0, url, headers: new Headers(), body: "", ms: Date.now() - started, error: err.message };
	}
}

const results = [];
function check(group, label, pass, detail, { required = true } = {}) {
	results.push({ group, label, pass: Boolean(pass), required, detail });
}

const type = (res) => (res.headers.get("content-type") || "").toLowerCase();
const attr = (tag, name) => {
	const m = tag.match(new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i"));
	return m ? (m[2] ?? m[3]) : null;
};
const tags = (html, name) => html.match(new RegExp(`<${name}\\b[^>]*>`, "gi")) || [];

// ---------- the page ----------

const html = await get(page.href, { Accept: "text/html" });
check("Page", "Page returns 200", html.status === 200, html.ok ? `HTTP ${html.status} in ${html.ms} ms` : html.error);
check("Page", "Served as HTML", type(html).includes("text/html"), type(html) || "no content-type");

const links = tags(html.body, "link");
const metas = tags(html.body, "meta");
const canonical = links.find((t) => /rel\s*=\s*["']?canonical/i.test(t));
check("Page", "Canonical URL", canonical, canonical ? attr(canonical, "href") : "missing <link rel=\"canonical\">");

const desc = metas.find((t) => /name\s*=\s*["']description["']/i.test(t));
const descText = desc ? attr(desc, "content") || "" : "";
check("Page", "Meta description", descText.length >= 50, desc ? `${descText.length} chars` : "missing", { required: true });

const htmlTag = (html.body.match(/<html\b[^>]*>/i) || [""])[0];
check("Page", "<html lang> set", attr(htmlTag, "lang"), attr(htmlTag, "lang") || "missing", { required: false });

const titleMatch = html.body.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
check("Page", "Title", titleMatch && titleMatch[1].trim().length > 0, titleMatch ? `${titleMatch[1].trim().length} chars` : "missing");

const h1s = (html.body.match(/<h1\b/gi) || []).length;
check("Page", "Exactly one <h1>", h1s === 1, `${h1s} found`, { required: false });

const ldBlocks = [...html.body.matchAll(/<script[^>]+type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
let ldTypes = [];
let ldValid = ldBlocks.length > 0;
for (const block of ldBlocks) {
	try {
		const data = JSON.parse(block[1]);
		const nodes = Array.isArray(data) ? data : data["@graph"] || [data];
		for (const n of nodes) if (n && n["@type"]) ldTypes.push([].concat(n["@type"]).join("/"));
	} catch {
		ldValid = false;
	}
}
check("Page", "JSON-LD present and valid", ldValid, ldBlocks.length ? ldTypes.join(", ") || "no @type" : "none found");

const text = html.body.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
check("Page", "Content is in the HTML (not JS-only)", text.length > 400, `${text.length} chars of text without running JS`, { required: false });

const mdAlt = links.find((t) => /rel\s*=\s*["']?alternate/i.test(t) && /text\/markdown/i.test(t));
check("Page", "<link rel=alternate type=text/markdown>", mdAlt, mdAlt ? attr(mdAlt, "href") : "missing", { required: false });

// ---------- headers ----------

const link = html.headers.get("link") || "";
check("Headers", "Link header points agents somewhere", /llms\.txt|rel="?describedby|text\/markdown/i.test(link), link ? link.slice(0, 120) : "no Link header", { required: false });
const vary = (html.headers.get("vary") || "").toLowerCase();

// ---------- markdown twin ----------

const md = await get(page.href, { Accept: "text/markdown" });
const mdIsMd = md.status === 200 && type(md).includes("text/markdown");
check("Markdown", "Accept: text/markdown returns Markdown", mdIsMd, `HTTP ${md.status} · ${type(md) || "no content-type"}`);
// Both variants must say they vary by Accept, or a shared cache can hand HTML to agents or Markdown to browsers.
// Match whole tokens: "Accept-Encoding" does not count.
const variesOnAccept = (value) => (value || "").toLowerCase().split(",").map((t) => t.trim()).some((t) => t === "accept" || t === "*");
const mdVary = md.headers.get("vary") || "";
const varyMissing = [variesOnAccept(vary) ? "" : "HTML", variesOnAccept(mdVary) ? "" : "Markdown"].filter(Boolean);
check("Markdown", "Vary: Accept on negotiated responses", !mdIsMd || varyMissing.length === 0, varyMissing.length ? `missing on the ${varyMissing.join(" and ")} response` : "HTML and Markdown both vary on Accept", { required: false });

const twinUrl = page.pathname.endsWith("/") ? `${origin}${page.pathname}index.md` : `${origin}${page.pathname.replace(/\.html?$/, "")}.md`;
const twin = await get(twinUrl);
check("Markdown", "Direct .md URL works", twin.status === 200 && !type(twin).includes("text/html"), `${new URL(twinUrl).pathname} → HTTP ${twin.status} · ${type(twin) || "-"}`, { required: false });

// ---------- llms.txt ----------

const llms = await get(`${origin}/llms.txt`);
const llmsBody = llms.body || "";
const llmsOk = llms.status === 200 && !type(llms).includes("text/html");
check("llms.txt", "/llms.txt exists", llmsOk, `HTTP ${llms.status} · ${type(llms) || "-"}`);
if (llmsOk) {
	const lines = llmsBody.split(/\r?\n/);
	const firstLine = lines.find((l) => l.trim() !== "") || "";
	check("llms.txt", "Starts with a single # H1", /^# \S/.test(firstLine) && lines.filter((l) => /^# /.test(l)).length === 1, firstLine.slice(0, 80));
	check("llms.txt", "Has a > blockquote summary", lines.some((l) => /^> \S/.test(l)), "", { required: false });
	const h2 = lines.filter((l) => /^## /.test(l)).map((l) => l.slice(3).trim());
	check("llms.txt", "Has ## sections", h2.length > 0, h2.join(", ") || "none");
	const mdLinks = [...llmsBody.matchAll(/^\s*- \[[^\]]+\]\(([^)]+)\)/gm)].map((m) => m[1]);
	check("llms.txt", "Sections list Markdown links (- [name](url))", mdLinks.length > 0, `${mdLinks.length} links`);
}
const llmsFull = await get(`${origin}/llms-full.txt`);
check("llms.txt", "/llms-full.txt exists", llmsFull.status === 200 && !type(llmsFull).includes("text/html"), `HTTP ${llmsFull.status}`, { required: false });

// ---------- robots.txt ----------

const robots = await get(`${origin}/robots.txt`);
const robotsOk = robots.status === 200 && !type(robots).includes("text/html");
check("robots.txt", "/robots.txt exists", robotsOk, `HTTP ${robots.status}`);

function parseRobots(body) {
	const groups = [];
	let current = null;
	let lastWasAgent = false;
	for (const raw of body.split(/\r?\n/)) {
		const line = raw.replace(/#.*/, "").trim();
		if (!line) continue;
		const [key, ...rest] = line.split(":");
		const k = key.trim().toLowerCase();
		const v = rest.join(":").trim();
		if (k === "user-agent") {
			if (!lastWasAgent || !current) {
				current = { agents: [], rules: [], signals: [] };
				groups.push(current);
			}
			current.agents.push(v.toLowerCase());
			lastWasAgent = true;
			continue;
		}
		lastWasAgent = false;
		if (!current) continue;
		if (k === "allow" || k === "disallow") current.rules.push({ k, v });
		if (k === "content-signal") current.signals.push(v);
	}
	return groups;
}

if (robotsOk) {
	const groups = parseRobots(robots.body);
	const groupFor = (bot) => groups.find((g) => g.agents.includes(bot.toLowerCase())) || groups.find((g) => g.agents.includes("*"));
	const blocksRoot = (g) => g && g.rules.some((r) => r.k === "disallow" && r.v === "/") && !g.rules.some((r) => r.k === "allow" && r.v === "/");
	const named = AI_BOTS.filter((b) => groups.some((g) => g.agents.includes(b.toLowerCase())));
	check("robots.txt", "Names AI crawlers explicitly", named.length >= 3, `${named.length}/${AI_BOTS.length} named`, { required: false });
	const blocked = AI_BOTS.filter((b) => blocksRoot(groupFor(b)));
	check("robots.txt", "AI crawler policy", true, blocked.length ? `blocked: ${blocked.join(", ")}` : "no AI crawler is blocked from /", { required: false });
	const userFetchers = ["ChatGPT-User", "Claude-User", "Perplexity-User"].filter((b) => blocksRoot(groupFor(b)));
	check("robots.txt", "User-triggered fetchers not blocked", userFetchers.length === 0, userFetchers.length ? `blocked: ${userFetchers.join(", ")} (agents acting for a person cannot read you)` : "ok", { required: false });
	const signals = groups.flatMap((g) => g.signals);
	check("robots.txt", "Content-Signal declared", signals.length > 0, signals[0] || "none", { required: false });
	check("robots.txt", "Sitemap: line", /^\s*sitemap:\s*https?:\/\//im.test(robots.body), (robots.body.match(/^\s*sitemap:\s*(\S+)/im) || [])[1] || "missing");
}

// ---------- sitemap ----------

const sitemapUrl = (robots.body.match(/^\s*sitemap:\s*(\S+)/im) || [])[1] || `${origin}/sitemap.xml`;
const sitemap = await get(sitemapUrl);
const isXml = sitemap.status === 200 && /<(urlset|sitemapindex)\b/.test(sitemap.body);
check("Sitemap", "Sitemap is reachable XML", isXml, `${sitemapUrl.replace(origin, "")} → HTTP ${sitemap.status}`);
if (isXml) {
	const locs = (sitemap.body.match(/<loc>/g) || []).length;
	const lastmods = (sitemap.body.match(/<lastmod>/g) || []).length;
	check("Sitemap", "Entries carry <lastmod>", lastmods > 0, `${lastmods}/${locs}`, { required: false });
}

// ---------- 404 ----------

const missing = await get(`${origin}/agent-ready-audit-${Date.now().toString(36)}`);
check("Status", "Unknown URLs return 404", missing.status === 404, `HTTP ${missing.status}`);

// ---------- report ----------

const weight = (r) => (r.required ? 2 : 1);
const total = results.reduce((s, r) => s + weight(r), 0);
const earned = results.reduce((s, r) => s + (r.pass ? weight(r) : 0), 0);
const score = Math.round((earned / total) * 100);
const failedRequired = results.filter((r) => r.required && !r.pass);

if (asJson) {
	console.log(JSON.stringify({ url: page.href, score, results }, null, 2));
} else {
	console.log(`\nAgent-readiness audit · ${page.href}\n`);
	let group = "";
	for (const r of results) {
		if (r.group !== group) {
			group = r.group;
			console.log(`  ${group}`);
		}
		const mark = r.pass ? "PASS" : r.required ? "FAIL" : "WARN";
		console.log(`    ${mark}  ${r.label.padEnd(44)} ${r.detail ?? ""}`);
	}
	console.log(`\n  Score: ${score}/100 · ${failedRequired.length} required check(s) failing\n`);
}

process.exit(failedRequired.length ? 1 : 0);
