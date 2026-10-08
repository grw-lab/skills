## What it does

Agent-ready site makes a website easy for AI agents to find, read and cite. It audits the site, then adds the layer agents look for:

- `llms.txt`, a Markdown map of the site, and `llms-full.txt`, the whole site in one file.
- A Markdown twin of every page, served when an agent sends `Accept: text/markdown`, and at `/page/index.md` and `/page.md`.
- `robots.txt` rules for each named AI crawler (training, search, and user-triggered), with a `Content-Signal` line that says how your content may be used.
- JSON-LD on every page, a `catalog.json` of what the site offers, and a sitemap with real `lastmod` dates.
- HTML fixes so the content is in the page without running JavaScript.

It ships with an audit script that scores any URL out of 100, and recipes for Apache, Nginx, Next.js, Vercel, Netlify and Cloudflare.

## When to use it

- You want your site to show up, and be quoted correctly, in ChatGPT, Claude, Perplexity or Gemini answers.
- You want to decide which AI companies may train on your content, and which may only search or read it for a user.
- You maintain docs, a product site or a catalog that agents should be able to read as clean text.
- You want a quick report on how agents see your site today.

## Install

**Claude Code**, as a plugin (installs all nine grw—lab skills, updates with one command):

```text
/plugin marketplace add grw-lab/skills
/plugin install grw-skills@grw-lab
```

**Claude Code**, this skill only:

```bash
git clone https://github.com/grw-lab/skills.git ~/grwlab-skills
mkdir -p ~/.claude/skills && cp -r ~/grwlab-skills/agent-ready-site ~/.claude/skills/
```

For one project only, copy the folder into `.claude/skills/` inside that project instead.

**Claude.ai**: zip the `agent-ready-site` folder and upload it in Settings → Capabilities → Skills.

**Other agents** (Cursor, Codex, Gemini CLI, Windsurf): point the agent at `agent-ready-site/SKILL.md`, or paste it into your rules file. The instructions are plain Markdown.

## Usage

- "Audit https://acme.com for AI agents and tell me what to fix first."
- "Make this Next.js site agent-ready. Add llms.txt and Markdown versions of every page."
- "Let AI search cite us, but don't let anyone train on our content. Update robots.txt."
- "Our docs are a React SPA. Make sure agents can read them without JavaScript."

You can also run the audit on its own:

```bash
node ~/.claude/skills/agent-ready-site/scripts/audit.mjs https://acme.com/
```

## Example

Before, a typical site:

```
Markdown
  FAIL  Accept: text/markdown returns Markdown       HTTP 200 · text/html
llms.txt
  FAIL  /llms.txt exists                             HTTP 404
robots.txt
  WARN  Names AI crawlers explicitly                 0/13 named
  Score: 29/100 · 8 required check(s) failing
```

After, the same checks on tools.grwlab.net, which uses this setup:

```
Markdown
  PASS  Accept: text/markdown returns Markdown       HTTP 200 · text/markdown; charset=utf-8
  PASS  Vary: Accept on negotiated responses         accept,accept-encoding
llms.txt
  PASS  Starts with a single # H1                    # grw—lab tools
  PASS  Sections list Markdown links (- [name](url)) 7 links
robots.txt
  PASS  Names AI crawlers explicitly                 13/13 named
  PASS  Content-Signal declared                      ai-train=yes, search=yes, ai-input=yes
  Score: 100/100 · 0 required check(s) failing
```

An agent asking for the home page as Markdown:

```bash
curl -H "Accept: text/markdown" https://tools.grwlab.net/
```

```markdown
---
title: "Tools | grw—lab"
url: https://tools.grwlab.net/
---

# The bench, rebuilt for the tools we ship
...
```

## What's inside

| File | What it's for |
|---|---|
| `SKILL.md` | The workflow the agent follows: audit, fix HTML, add the Markdown layer, robots, headers, structured data, verify. |
| `references/llms-txt.md` | The llms.txt and llms-full.txt format, with a full example. |
| `references/crawlers.md` | AI crawler names by type, Content-Signal, and three ready-made policies. |
| `references/servers.md` | Recipes for Apache, Nginx, Next.js 16 and Cloudflare Workers (all tested), plus Vercel and Netlify (checked against their docs). |
| `references/structured-data.md` | JSON-LD patterns, the catalog.json shape, and sitemap rules. |
| `scripts/audit.mjs` | The audit. Node 18+, no dependencies. Exits non-zero when a required check fails, so it works in CI. |

## FAQ

**Does llms.txt improve my Google ranking?**
No search engine has said it uses llms.txt for ranking. It helps agents and tools that read it find your clean content quickly. The bigger wins for search are server-rendered HTML, structured data and an accurate sitemap.

**If I block GPTBot, will I disappear from ChatGPT?**
Not by itself. GPTBot is OpenAI's training crawler. ChatGPT search uses OAI-SearchBot, and ChatGPT-User fetches pages a person asks about. The skill explains each one, so you block only what you mean to.

**Is robots.txt enough to stop AI training?**
robots.txt and Content-Signal state your preference. Well-behaved crawlers follow them. To enforce a block, add a WAF or bot-management rule at your host or CDN.

**Will Markdown twins create duplicate content?**
The HTML page stays canonical. Twins are served on request or at `.md` URLs, are left out of the sitemap, and are linked as `rel="alternate"`.

**My host isn't listed.**
The behavior is the same everywhere: negotiate on Accept, send Vary: Accept, serve `.md` as text/markdown. Pick the closest recipe, adapt it, then confirm with the audit script.
