# How every grw—lab skill is built

Internal guide. Every skill in this folder follows it so the set reads as one product.

## Folder layout

```
skills/<skill-name>/
  SKILL.md            the skill itself (what the agent loads)
  references/         deeper material SKILL.md links to, one level deep, loaded only when needed
  scripts/            optional, runnable helpers (Node 18+ or Python 3.9+, standard library only)
  examples/           optional, before/after samples
  DOCS.md             the public docs page body for tools.grwlab.net/skills/<skill-name>/
  meta.json           listing data for the panel
```

## SKILL.md

Frontmatter, exactly two fields:

```yaml
---
name: skill-name            # lowercase letters, digits, hyphens; max 64; same as the folder
description: ...            # max 1024 chars, third person. Say WHAT it does and WHEN to use it,
                            # with the trigger words a user would actually type.
---
```

Body rules:

- Written for an agent, in the imperative. Short sentences. No marketing.
- Under ~400 lines. Push long tables, catalogs and edge cases into `references/*.md` and link them with a one-line note on when to read each.
- Start with a short "When to use" / "When not to use", then the workflow as numbered steps, then rules, then a verification checklist the agent runs before saying it's done.
- Give concrete before/after code, not principles alone.
- State facts you are sure of. If a fact is version- or region-specific, say so and say how to check it.
- Scripts must run with no installs (standard library only), print clear output, exit non-zero on failure, and be tested before they ship. Document usage at the top of each script.
- No made-up URLs, packages, or APIs. Link only to real, stable docs.

## DOCS.md (public page)

Markdown body only (no front matter, no H1, the page already shows the name and summary). Sections in this order, `##` headings:

1. What it does
2. When to use it
3. Install
4. Usage (example prompts a user would type)
5. Example (a real before/after)
6. What's inside (files in the skill and what each is for)
7. FAQ (3 to 5 real questions)

Install section, the same for every skill (replace NAME):

    ## Install

    **Claude Code** (all projects):

    ```bash
    git clone https://github.com/grw-lab/skills.git ~/grwlab-skills
    mkdir -p ~/.claude/skills && cp -r ~/grwlab-skills/NAME ~/.claude/skills/
    ```

    For one project only, copy the folder into `.claude/skills/` inside that project instead.

    **Claude.ai**: zip the `NAME` folder and upload it in Settings → Capabilities → Skills.

    **Other agents** (Cursor, Codex, Gemini CLI, Windsurf): point the agent at `NAME/SKILL.md`, or paste it into your rules file. The instructions are plain Markdown.

## meta.json

```json
{
  "name": "Human Name",
  "slug": "skill-name",
  "summary": "One sentence, under 160 characters, what it does and for whom.",
  "category": "Arabic & RTL | Agent-ready web | Freelance | Saudi commerce | Design systems | Ops",
  "agents": ["Claude Code", "Claude.ai", "Cursor"],
  "tags": ["..."],
  "version": "0.1.0",
  "license": "MIT",
  "seo_title": "Under 60 chars",
  "seo_description": "120 to 160 chars"
}
```

## Voice

Plain, direct, specific. Short sentences. No hype words (powerful, seamless, revolutionary, unlock, leverage, effortless). No em-dash chains. Show, don't claim.
