# llms.txt and llms-full.txt

The format comes from the proposal at https://llmstxt.org/. It is a Markdown file at the site root that tells a language model what the site is and where the useful Markdown lives.

## Structure (in this order)

1. `# Name`: exactly one H1. The only required part.
2. `> Summary`: one blockquote with the short answer to "what is this site?".
3. Optional plain paragraphs or lists with details (no headings).
4. Zero or more `## Section` headings. Each holds a list of links:
   `- [Link name](https://absolute/url.md): optional note`
5. A section named exactly `## Optional` holds links an agent can skip when its context is short.

## Example

```markdown
# Acme

> Acme makes invoicing software for freelancers in the Gulf. Plans start at $9 a month.

Every page has a Markdown twin: send `Accept: text/markdown`, or add `index.md` to a folder URL.

## Product

- [Features](https://acme.com/features/index.md): What Acme does, by workflow.
- [Pricing](https://acme.com/pricing/index.md): Plans, limits, and billing rules.

## Docs

- [Getting started](https://acme.com/docs/start/index.md): Create an account and send a first invoice.
- [API](https://acme.com/docs/api/index.md): REST endpoints, auth, and rate limits.

## Optional

- [Changelog](https://acme.com/changelog/index.md): Release notes.
- [Full site in one file](https://acme.com/llms-full.txt): Every page above, concatenated.
```

## Rules

- Link to Markdown URLs where they exist, not HTML.
- Use absolute URLs.
- Keep it a map. A few hundred lines at most. Large docs sites can link to sub-indexes.
- Every link must return 200. Check them.
- Serve as `text/plain; charset=utf-8` or `text/markdown; charset=utf-8`. Never let it fall through to an HTML 404 page that returns 200.
- Regenerate it on every content change.

## llms-full.txt

One file with the full Markdown of every public page, separated by `---` lines, each part starting with its own front matter or H1. Useful for agents that want everything in one fetch. Consider `X-Robots-Tag: noindex` on it so search engines do not index a duplicate of the whole site.

## What llms.txt is not

- Not an access control file. That is robots.txt.
- Not a ranking signal that any search engine has confirmed. Treat it as a convenience for agents and tools that read it.
