# grw—lab skills

Free agent skills from [grw—lab](https://grwlab.net/). Each folder is one skill: a `SKILL.md` your agent loads when the task fits, plus references and tested scripts. Full docs for every skill live at [tools.grwlab.net/skills](https://tools.grwlab.net/skills/).

| Skill | What it does |
|---|---|
| [rtl-ui](rtl-ui/) | Audits and fixes web UIs for right-to-left languages: logical CSS, icon mirroring, bidi text, Tailwind. |
| [arabic-copy](arabic-copy/) | Writes natural Arabic UI and marketing copy instead of literal translation. |
| [arabic-localization](arabic-localization/) | Takes an app to Arabic end to end: all six plural forms, numbers, Hijri dates, currency. |
| [arabic-seo](arabic-seo/) | SEO for Arabic and bilingual sites: keywords, hreflang, slugs, local signals. |
| [agent-ready-site](agent-ready-site/) | Makes a site readable by AI agents: llms.txt, Markdown twins, AI crawler rules, structured data. |
| [zatca-invoice](zatca-invoice/) | Saudi e-invoicing basics: the ZATCA QR code (TLV), VAT math, required fields. |
| [freelance-quote](freelance-quote/) | Turns a client brief into a priced quote and proposal, with ranges, assumptions and terms. |
| [design-tokens-extractor](design-tokens-extractor/) | Pulls a design system out of a site or CSS into CSS variables, Tailwind and DTCG tokens. |
| [shared-server-deploy](shared-server-deploy/) | Changes one site on a shared server without breaking its neighbours. |

## Install

**Claude Code**, as a plugin (all nine skills):

```text
/plugin marketplace add grw-lab/skills
/plugin install grw-skills@grw-lab
```

**Claude Code**, one skill at a time:

```bash
git clone https://github.com/grw-lab/skills.git ~/grwlab-skills
mkdir -p ~/.claude/skills && cp -r ~/grwlab-skills/rtl-ui ~/.claude/skills/
```

Swap `rtl-ui` for any skill, or copy them all. For one project only, copy into `.claude/skills/` inside the project.

**Claude.ai**: zip a skill folder and upload it in Settings → Capabilities → Skills.

**Other agents** (Cursor, Codex, Gemini CLI, Windsurf): point the agent at the skill's `SKILL.md`, or paste it into your rules file.

Scripts need Node 18+ or Python 3.9+ and nothing else.

## License

MIT. See [LICENSE](LICENSE).
