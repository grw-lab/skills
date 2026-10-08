# AI crawlers, robots.txt and Content-Signal

Names change. Before you ship, check each vendor's crawler page for the current list.

## Three kinds of bots

| Kind | What it does | Blocking it means |
|---|---|---|
| Training crawler | Collects pages to train models. | Your content is not used for future training by that vendor. |
| Search crawler | Builds the index an AI search product answers from. | You will not appear or be cited in that product's answers. |
| User-triggered fetcher | Fetches a page because a person asked the assistant to, right now. | The assistant cannot read your page for that person. Vendors say these may not follow robots.txt, because a person initiated the request. |

## Common tokens

| Vendor | Training | Search | User-triggered |
|---|---|---|---|
| OpenAI | `GPTBot` | `OAI-SearchBot` | `ChatGPT-User` |
| Anthropic | `ClaudeBot` | `Claude-SearchBot` | `Claude-User` |
| Perplexity | — | `PerplexityBot` | `Perplexity-User` |
| Google | `Google-Extended` (token only) | `Googlebot` | — |
| Apple | `Applebot-Extended` (token only) | `Applebot` | — |
| Common Crawl | `CCBot` (dataset many models train on) | — | — |
| ByteDance | `Bytespider` | — | — |
| Meta | `meta-externalagent` | — | `meta-externalfetcher` |

Notes:

- `Google-Extended` and `Applebot-Extended` are not separate crawlers. They are robots.txt tokens. The normal Googlebot or Applebot fetches the page, and the token says whether it may be used for AI training and grounding. Blocking `Google-Extended` does not remove you from Google Search.
- Google and Apple user-triggered fetchers are left out of this table. Check their crawler docs for current tokens before writing rules for them.
- Some crawlers have been reported to ignore robots.txt. robots.txt is a request. Enforcement needs a WAF or bot management rule.

## Content-Signal

Cloudflare's Content Signals Policy adds a `Content-Signal` line to a robots.txt group. It states what the site owner allows the content to be used for once it is fetched:

- `search`: building a search index and showing links and short excerpts.
- `ai-input`: feeding the content into a model at answer time (retrieval, grounding, RAG).
- `ai-train`: training or fine-tuning models.

```
User-agent: *
Content-Signal: search=yes, ai-input=yes, ai-train=no
Allow: /
```

Leaving a signal out means no preference is stated for that use. It is a statement of preference with no technical enforcement. Put it in every group, because a bot that matches a named group never reads the `*` group.

## Policy presets

Ask the user which one they want.

**Open (maximum reach):** allow everything, `search=yes, ai-input=yes, ai-train=yes`.

**Cite me, don't train on me** (a common choice for businesses):

```
User-agent: GPTBot
User-agent: ClaudeBot
User-agent: CCBot
User-agent: Google-Extended
User-agent: Applebot-Extended
User-agent: Bytespider
User-agent: meta-externalagent
Disallow: /

User-agent: *
Content-Signal: search=yes, ai-input=yes, ai-train=no
Allow: /
Disallow: /admin/

Sitemap: https://example.com/sitemap.xml
```

Several `User-agent` lines in a row form one group that shares the rules below them.

**Closed (no AI use):** disallow every token above, including search and user-triggered ones, and set `search=yes, ai-input=no, ai-train=no` for `*` if normal search should continue. Warn the user that they will not appear in AI answers.

## Mistakes to avoid

- Blocking `ChatGPT-User`, `Claude-User` or `Perplexity-User` by accident with a blanket rule, then wondering why assistants "can't open the link".
- A named group with `Allow: /` that forgets the `Disallow: /admin/` from the `*` group.
- A robots.txt that returns an HTML page with status 200 (some frameworks do this). It must be `text/plain`.
- `Disallow:` with an empty value means allow everything.
