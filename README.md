# grw—lab skills

Free agent skills from [grw—lab](https://grwlab.net/). Each folder is one skill: a `SKILL.md` your agent loads when the task fits, plus references and tested scripts. Full docs for every skill live at [tools.grwlab.net/skills](https://tools.grwlab.net/skills/).

### General

| Skill | What it does |
|---|---|
| [video-reader](video-reader/) | Turns a video into a contact sheet, key frames, cut times and audio numbers. |
| [agent-ready-site](agent-ready-site/) | Makes a site readable by AI agents: llms.txt, Markdown twins, AI crawler rules, structured data. |
| [shared-server-deploy](shared-server-deploy/) | Changes one site on a shared server without breaking its neighbours. |
| [freelance-quote](freelance-quote/) | Turns a client brief into a priced quote and proposal, with ranges, assumptions and terms. |
| [client-brief](client-brief/) | Turns a messy client message into a one-page brief with scope and open questions. |

### Design

| Skill | What it does |
|---|---|
| [design-tokens-extractor](design-tokens-extractor/) | Pulls a design system out of a site or CSS into CSS variables, Tailwind and DTCG tokens. |
| [rtl-ui](rtl-ui/) | Audits and fixes web UIs for right-to-left languages: logical CSS, icon mirroring, bidi text, Tailwind. |
| [ui-inventory](ui-inventory/) | Lists the font sizes, colors, and corner radii already used in local HTML and CSS. |

### Arabic

| Skill | What it does |
|---|---|
| [arabic-copy](arabic-copy/) | Writes natural Arabic UI and marketing copy instead of literal translation. |
| [arabic-localization](arabic-localization/) | Takes an app to Arabic end to end: all six plural forms, numbers, Hijri dates, currency. |
| [arabic-seo](arabic-seo/) | SEO for Arabic and bilingual sites: keywords, hreflang, slugs, local signals. |

### Accounting

| Skill | What it does |
|---|---|
| [zatca-invoice](zatca-invoice/) | Saudi e-invoicing basics: the ZATCA QR code (TLV), VAT math, required fields. |
| [vat-worksheet](vat-worksheet/) | Sums sales and purchase VAT from a CSV. A worksheet, not a filed return. |

### Commerce

| Skill | What it does |
|---|---|
| [product-sheet](product-sheet/) | Turns a product CSV into slugs and a VAT split. You write the Arabic titles. |

## Install

Open Claude Code. Paste line 1 once. Paste line 2 for the skill you want. Line 2 installs that skill alone.

```text
/plugin marketplace add grw-lab/skills
/plugin install video-reader@grw-lab
```

Swap `video-reader` for any folder in this repo. The steps for each skill are also on its page at [tools.grwlab.net/skills](https://tools.grwlab.net/skills/).

Every skill instead, as line 2:

```text
/plugin install grw-skills@grw-lab
```

**Claude.ai**: zip one skill folder and upload it in Settings → Capabilities → Skills.

**Other agents** (Cursor, Codex, Gemini CLI, Windsurf): point the agent at that skill's `SKILL.md`.

Scripts need Node 18+ or Python 3.9+. video-reader also needs ffmpeg, numpy and Pillow.

## License

MIT. See [LICENSE](LICENSE).
