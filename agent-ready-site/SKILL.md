---
name: agent-ready-site
description: Makes a website readable and usable by AI agents and AI search. Adds llms.txt and llms-full.txt, Markdown twins of every page served by Accept text/markdown content negotiation, Link headers, robots.txt rules for named AI crawlers with Content-Signal, JSON-LD, a machine-readable catalog, sitemap lastmod, and agent-friendly semantic HTML. Ships an audit script and recipes for Apache, Nginx, Next.js, Vercel, Netlify and Cloudflare. Use when the user asks to make a site AI-ready, agent-friendly, LLM-friendly, add llms.txt, serve Markdown to agents, control GPTBot or ClaudeBot, prepare for AI search or generative engine optimization (GEO), or audit how agents see a site.
---

# Agent-ready site

Make a site that an AI agent can find, fetch, read and cite without running JavaScript or guessing.

## When to use

- The user wants a site "AI-ready", "agent-friendly", "LLM-friendly", or visible in ChatGPT, Claude, Perplexity or Gemini answers.
- The user asks for `llms.txt`, Markdown versions of pages, or rules for AI crawlers.
- The user wants to know how agents currently see their site (run the audit).

## When not to use

- The site is an app behind a login. Agents cannot read it anyway. Make only the public marketing and docs pages agent-ready.
- The user wants to block all AI use. Do only step 5 (robots.txt and Content-Signal) with blocking values, and say clearly that robots.txt is a request, not enforcement.

## Workflow

1. **Audit first.** Run `node scripts/audit.mjs https://their-site/` (Node 18+). Save the output. It lists what passes, what fails, and a score. Re-run it at the end.
2. **Find the stack.** Look for `.htaccess` (Apache), `nginx.conf`, `next.config.*` + `app/` (Next.js App Router), `vercel.json`, `netlify.toml`/`_redirects`, `wrangler.toml` (Cloudflare), or a static site generator. Pick the matching recipe in `references/`.
3. **Fix the HTML** so a fetch without JavaScript returns the real content. See "HTML rules" below.
4. **Add the Markdown layer:** one Markdown twin per public page, `llms.txt`, and optionally `llms-full.txt`. Generate them from the same source as the HTML so they never drift. Formats: `references/llms-txt.md`.
5. **Write robots.txt** with an explicit decision for each AI crawler and a `Content-Signal` line. Ask the user which policy they want if they have not said. Details: `references/crawlers.md`.
6. **Serve it correctly:** content negotiation on `Accept: text/markdown`, `Vary: Accept`, a `Link` header, correct content types. Recipe per stack in `references/servers.md`.
7. **Add structured data:** JSON-LD on every page, plus `catalog.json` if the site lists products, tools, docs or skills. See `references/structured-data.md`.
8. **Sitemap** with real `<lastmod>` dates, referenced from robots.txt.
9. **Verify** with the checklist at the end and re-run the audit. Report before and after scores.

## HTML rules

Agents fetch raw HTML. Many never run JavaScript. Rules:

- The main content must be in the server response. If the page is a client-only SPA, render it on the server or prerender it. Test with `curl -s URL | sed 's/<[^>]*>//g' | grep "a sentence from the page"`.
- One `<h1>`, then `<h2>`/`<h3>` in order. Headings are how agents chunk a page.
- Links are `<a href>`, actions are `<button>`. Never a clickable `<div>`.
- Every form control has a `<label>`. Every image that carries meaning has `alt`.
- Give important sections stable `id`s (`<section id="pricing">`) so agents can cite `#pricing`.
- Prices, specs, dates and steps live in text, tables or lists, not only in images or canvas.
- `<html lang="…">`, `<title>`, `<meta name="description">`, and `<link rel="canonical">` on every page.
- Point to the Markdown twin from the head:

```html
<link rel="alternate" type="text/markdown" href="/pricing/index.md" title="Markdown">
<link rel="alternate" type="text/plain" href="/llms.txt" title="llms.txt">
```

## Markdown twins

For each public page `/path/`, publish `/path/index.md` with the same content as clean Markdown:

```markdown
---
title: "Pricing | Acme"
description: "Plans and prices for Acme."
url: https://acme.com/pricing/
updated: 2026-10-08
---

# Pricing

Two plans. Both include unlimited projects.

## Starter

$9 a month. ...
```

Serve it three ways: `Accept: text/markdown` on the HTML URL, `/path/index.md`, and `/path.md`. Rules:

- Strip navigation, footers, cookie banners and scripts. Keep headings, lists, tables, code and links.
- Use absolute URLs in links so the file makes sense on its own.
- Content type `text/markdown; charset=utf-8`.
- Any response that varies by `Accept` must send `Vary: Accept`, or a cache can serve Markdown to a browser.
- Respect `q=0`: `Accept: text/markdown;q=0, text/html` means "not Markdown".

## Headers

Send on HTML responses:

```
Link: </llms.txt>; rel="describedby"; type="text/plain", </sitemap.xml>; rel="sitemap"; type="application/xml"
Vary: Accept
```

Optional per page: `Link: </path/index.md>; rel="alternate"; type="text/markdown"`.

## robots.txt shape

```
User-agent: GPTBot
Content-Signal: ai-train=no, search=yes, ai-input=yes
Allow: /
Disallow: /admin/

User-agent: *
Content-Signal: ai-train=no, search=yes, ai-input=yes
Allow: /
Disallow: /admin/

Sitemap: https://acme.com/sitemap.xml
```

A crawler that matches a named group ignores the `*` group. Repeat shared rules (like `Disallow: /admin/`) in every named group.

## Rules

- Generate llms.txt, twins, catalog and sitemap from one content source. Hand-written copies drift.
- Never put private, draft, or logged-in URLs in llms.txt, the catalog or the sitemap.
- Do not invent crawler names. Use `references/crawlers.md`, and tell the user to check vendor docs for new ones.
- Do not promise rankings or citations. These changes make a site readable. They do not guarantee it gets used.
- Keep llms.txt short (a map, not the content). Put full content in llms-full.txt.

## Verify before you say it's done

- [ ] `curl -s -H "Accept: text/markdown" https://site/ -D - -o /dev/null` shows `content-type: text/markdown` and `vary` containing `Accept`.
- [ ] `curl -s https://site/ -D - -o /dev/null` still returns `text/html`.
- [ ] `https://site/llms.txt` starts with `# `, has a `> ` summary and `## ` sections of `- [name](url)` links, and every link returns 200.
- [ ] robots.txt has a `Sitemap:` line, every named group repeats the shared disallows, and the AI policy matches what the user asked for.
- [ ] JSON-LD parses (`node -e` with `JSON.parse`) and validates in a schema validator.
- [ ] Unknown URLs return 404, not 200.
- [ ] `node scripts/audit.mjs https://site/` exits 0. Report the before and after scores.

## References

- `references/llms-txt.md`: llms.txt and llms-full.txt format, with a full example. Read in step 4.
- `references/crawlers.md`: AI crawler names by type, Content-Signal, policy presets. Read in step 5.
- `references/servers.md`: Apache, Nginx, Next.js, Vercel, Netlify and Cloudflare recipes. Read in step 6.
- `references/structured-data.md`: JSON-LD patterns and the catalog.json shape. Read in step 7.
- `scripts/audit.mjs`: the audit. `node scripts/audit.mjs <url> [--json]`.
