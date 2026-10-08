#!/usr/bin/env node
// rtl-audit: find physical CSS properties and Tailwind classes that break in right-to-left layouts.
//
// Usage:
//   node rtl-audit.mjs <path> [more paths]           scan files and folders
//   node rtl-audit.mjs src --json                    JSON output
//   node rtl-audit.mjs src --only css|tailwind       one kind of finding
//
// Skips node_modules, .git, dist, build, .next, out, coverage, vendor.
// Ignores a line that contains "rtl-audit-ignore".
// Ignores rules already scoped to a direction ([dir=...], :dir(...)) and Tailwind classes with rtl:/ltr: variants.
// Exit code: 0 = clean, 1 = findings, 2 = usage error.
// Node 18+, no dependencies.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const args = process.argv.slice(2);
const json = args.includes('--json');
const onlyIdx = args.indexOf('--only');
const only = onlyIdx >= 0 ? args[onlyIdx + 1] : null;
const paths = args.filter((a, i) => !a.startsWith('--') && (onlyIdx < 0 || i !== onlyIdx + 1));

if (!paths.length || (only && !['css', 'tailwind'].includes(only))) {
	console.error('Usage: node rtl-audit.mjs <path...> [--json] [--only css|tailwind]');
	process.exit(2);
}

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'out', 'coverage', 'vendor', '.nuxt', '.svelte-kit']);
const STYLE_EXT = new Set(['.css', '.scss', '.sass', '.less']);
const MARKUP_EXT = new Set(['.html', '.htm', '.jsx', '.tsx', '.js', '.ts', '.mjs', '.vue', '.svelte', '.astro', '.php', '.twig', '.erb']);

// ---------- CSS properties ----------

const CSS_RULES = [
	[/(?<![\w-])margin-left\s*:/, 'margin-left', 'margin-inline-start'],
	[/(?<![\w-])margin-right\s*:/, 'margin-right', 'margin-inline-end'],
	[/(?<![\w-])padding-left\s*:/, 'padding-left', 'padding-inline-start'],
	[/(?<![\w-])padding-right\s*:/, 'padding-right', 'padding-inline-end'],
	[/(?<![\w-])border-top-left-radius\s*:/, 'border-top-left-radius', 'border-start-start-radius'],
	[/(?<![\w-])border-top-right-radius\s*:/, 'border-top-right-radius', 'border-start-end-radius'],
	[/(?<![\w-])border-bottom-left-radius\s*:/, 'border-bottom-left-radius', 'border-end-start-radius'],
	[/(?<![\w-])border-bottom-right-radius\s*:/, 'border-bottom-right-radius', 'border-end-end-radius'],
	[/(?<![\w-])border-left(-width|-color|-style)?\s*:/, 'border-left', 'border-inline-start'],
	[/(?<![\w-])border-right(-width|-color|-style)?\s*:/, 'border-right', 'border-inline-end'],
	[/(?<![\w.$-])left\s*:\s*(?!['"`]?\s*[,}])/, 'left', 'inset-inline-start'],
	[/(?<![\w.$-])right\s*:\s*(?!['"`]?\s*[,}])/, 'right', 'inset-inline-end'],
	[/(?<![\w-])text-align\s*:\s*left\b/, 'text-align: left', 'text-align: start'],
	[/(?<![\w-])text-align\s*:\s*right\b/, 'text-align: right', 'text-align: end'],
	[/(?<![\w-])float\s*:\s*left\b/, 'float: left', 'float: inline-start'],
	[/(?<![\w-])float\s*:\s*right\b/, 'float: right', 'float: inline-end'],
	[/(?<![\w-])clear\s*:\s*left\b/, 'clear: left', 'clear: inline-start'],
	[/(?<![\w-])clear\s*:\s*right\b/, 'clear: right', 'clear: inline-end'],
	[/translateX\(/, 'translateX()', 'multiply by a --dir variable, or override under [dir="rtl"]'],
	[/linear-gradient\(\s*to (left|right)\b/, 'gradient to left/right', 'override under [dir="rtl"]'],
];

// camelCase style objects (React inline styles, CSS-in-JS)
const JS_STYLE_RULES = [
	[/\bmarginLeft\s*:/, 'marginLeft', 'marginInlineStart'],
	[/\bmarginRight\s*:/, 'marginRight', 'marginInlineEnd'],
	[/\bpaddingLeft\s*:/, 'paddingLeft', 'paddingInlineStart'],
	[/\bpaddingRight\s*:/, 'paddingRight', 'paddingInlineEnd'],
	[/\bborderLeft(Width|Color|Style)?\s*:/, 'borderLeft', 'borderInlineStart'],
	[/\bborderRight(Width|Color|Style)?\s*:/, 'borderRight', 'borderInlineEnd'],
	[/\bborderTopLeftRadius\s*:/, 'borderTopLeftRadius', 'borderStartStartRadius'],
	[/\bborderTopRightRadius\s*:/, 'borderTopRightRadius', 'borderStartEndRadius'],
	[/\bborderBottomLeftRadius\s*:/, 'borderBottomLeftRadius', 'borderEndStartRadius'],
	[/\bborderBottomRightRadius\s*:/, 'borderBottomRightRadius', 'borderEndEndRadius'],
	[/\btextAlign\s*:\s*['"]left['"]/, "textAlign: 'left'", "textAlign: 'start'"],
	[/\btextAlign\s*:\s*['"]right['"]/, "textAlign: 'right'", "textAlign: 'end'"],
	[/\bfloat\s*:\s*['"](left|right)['"]/, 'float left/right', "float: 'inline-start' / 'inline-end'"],
];

// ---------- Tailwind classes ----------

const TW_MAP = [
	['scroll-ml', 'scroll-ms'], ['scroll-mr', 'scroll-me'], ['scroll-pl', 'scroll-ps'], ['scroll-pr', 'scroll-pe'],
	['rounded-tl', 'rounded-ss'], ['rounded-tr', 'rounded-se'], ['rounded-bl', 'rounded-es'], ['rounded-br', 'rounded-ee'],
	['rounded-l', 'rounded-s'], ['rounded-r', 'rounded-e'],
	['border-l', 'border-s'], ['border-r', 'border-e'],
	['text-left', 'text-start'], ['text-right', 'text-end'],
	['float-left', 'float-start'], ['float-right', 'float-end'],
	['ml', 'ms'], ['mr', 'me'], ['pl', 'ps'], ['pr', 'pe'],
	['left', 'start'], ['right', 'end'],
];
// Utilities that must have a value suffix to count (avoid matching plain words like "left").
const NEEDS_SUFFIX = new Set(['ml', 'mr', 'pl', 'pr', 'left', 'right', 'scroll-ml', 'scroll-mr', 'scroll-pl', 'scroll-pr']);
const NO_SUFFIX = new Set(['text-left', 'text-right', 'float-left', 'float-right']);

const twBases = TW_MAP.map(([from]) => from.replace(/-/g, '\\-')).join('|');
const TW_TOKEN = new RegExp(`(?<![\\w\\-/:.])((?:[\\w\\-\\[\\]&@]+:)*)(-?)(${twBases})(-(?:\\[[^\\]\\s]+\\]|[\\w./%]+))?(?![\\w\\-])`, 'g');

function tailwindFindings(line) {
	const found = [];
	// Only look inside likely class contexts: class=, className=, @apply, clsx/cn/cva/tw calls, template strings.
	if (!/class(Name)?\s*=|@apply|\b(clsx|cn|cva|twMerge|classNames|tw)\s*\(|`/.test(line)) return found;
	for (const m of line.matchAll(TW_TOKEN)) {
		const [token, variants, neg, base, suffix] = m;
		if (/(^|:)(rtl|ltr):/.test(variants)) continue;
		if (NEEDS_SUFFIX.has(base) && !suffix) continue;
		if (NO_SUFFIX.has(base) && suffix) continue;
		if (base === 'space-x') continue;
		const to = TW_MAP.find(([from]) => from === base)[1];
		found.push({ col: m.index + 1, found: token, suggest: `${variants}${neg}${to}${suffix ?? ''}` });
	}
	for (const m of line.matchAll(/(?<![\w-])((?:[\w-]+:)*)(space-x-\d+|divide-x(?:-\d+)?)(?![\w-])/g)) {
		if (/(^|:)(rtl|ltr):/.test(m[1])) continue;
		if (/rtl:(space|divide)-x-reverse/.test(line)) continue;
		found.push({ col: m.index + 1, found: m[0], suggest: m[0].startsWith('space') ? 'gap-* on the flex/grid parent, or add rtl:space-x-reverse (Tailwind v3)' : 'add rtl:divide-x-reverse' });
	}
	return found;
}

// ---------- scanning ----------

function* walk(p) {
	let st;
	try { st = statSync(p); } catch { console.error(`Not found: ${p}`); process.exitCode = 2; return; }
	if (st.isFile()) { yield p; return; }
	for (const name of readdirSync(p)) {
		if (SKIP_DIRS.has(name) || name.startsWith('.')) continue;
		yield* walk(join(p, name));
	}
}

function scanFile(file) {
	const ext = extname(file).toLowerCase();
	const isStyle = STYLE_EXT.has(ext);
	const isMarkup = MARKUP_EXT.has(ext);
	if (!isStyle && !isMarkup) return [];
	const text = readFileSync(file, 'utf8');
	if (text.length > 2_000_000) return [];
	const lines = text.split(/\r?\n/);
	const out = [];
	const scoped = []; // stack: is this CSS block direction-scoped?
	let inStyleTag = false;

	lines.forEach((line, i) => {
		if (line.includes('rtl-audit-ignore')) return;
		if (isMarkup && /<style[\s>]/i.test(line)) inStyleTag = true;
		const cssContext = isStyle || inStyleTag || /style\s*=\s*["']/.test(line);
		const dirScoped = scoped.some(Boolean) || /\[dir\s*=|:dir\(/.test(line);

		if (only !== 'tailwind' && !dirScoped) {
			if (cssContext) {
				const target = isStyle || inStyleTag ? line : (line.match(/style\s*=\s*["']([^"']*)/)?.[1] ?? '');
				for (const [re, found, suggest] of CSS_RULES) {
					const m = target.match(re);
					if (m) out.push({ line: i + 1, col: (isStyle || inStyleTag ? m.index : line.indexOf(target) + m.index) + 1, kind: 'css', found, suggest });
				}
			}
			if (isMarkup && !inStyleTag) {
				for (const [re, found, suggest] of JS_STYLE_RULES) {
					const m = line.match(re);
					if (m) out.push({ line: i + 1, col: m.index + 1, kind: 'css', found, suggest });
				}
			}
		}
		if (!only && isMarkup && /<html\b/i.test(line) && !/\sdir\s*=/i.test(line)) {
			out.push({ line: i + 1, col: line.search(/<html\b/i) + 1, kind: 'html', found: '<html> without dir', suggest: 'add dir="rtl" for RTL locales (set it server-side or at runtime)' });
		}
		if (only !== 'css' && (isMarkup || /@apply/.test(line))) {
			for (const f of tailwindFindings(line)) out.push({ line: i + 1, kind: 'tailwind', ...f });
		}

		// track CSS block scoping by braces (good enough for hand-written stylesheets)
		if (isStyle || inStyleTag) {
			for (const ch of line) {
				if (ch === '{') scoped.push(/\[dir\s*=|:dir\(/.test(line));
				else if (ch === '}') scoped.pop();
			}
		}
		if (isMarkup && /<\/style>/i.test(line)) { inStyleTag = false; scoped.length = 0; }
	});
	return out.sort((a, b) => a.line - b.line || a.col - b.col);
}

const results = [];
for (const p of paths) {
	for (const file of walk(p)) {
		for (const f of scanFile(file)) results.push({ file: relative(process.cwd(), file) || file, ...f });
	}
}

if (json) {
	console.log(JSON.stringify(results, null, 2));
} else if (!results.length) {
	console.log('rtl-audit: no physical properties or classes found.');
} else {
	let last = '';
	for (const r of results) {
		if (r.file !== last) { console.log(`\n${r.file}`); last = r.file; }
		console.log(`  ${String(r.line).padStart(4)}:${String(r.col).padEnd(3)} ${r.kind.padEnd(8)} ${r.found}  →  ${r.suggest}`);
	}
	const files = new Set(results.map((r) => r.file)).size;
	console.log(`\nrtl-audit: ${results.length} finding${results.length === 1 ? '' : 's'} in ${files} file${files === 1 ? '' : 's'}.`);
}
if (results.length && process.exitCode !== 2) process.exitCode = 1;
