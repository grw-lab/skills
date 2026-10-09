## What it does

Design Tokens Extractor reads what a design already uses and turns it into a small, named token set. It measures colors, type, spacing, radii, shadows, breakpoints, motion, and z-index from a live page, CSS files, a Tailwind config, a Figma export, or screenshots. Then it merges near-duplicates, checks contrast, and writes the result as CSS variables, a Tailwind v4 theme, a Tailwind v3 config, and a Design Tokens (DTCG) JSON file.

The scripts measure; the agent names. You get primitives (`gray-200`, `indigo-600`) and semantic roles (`text`, `muted`, `border`, `accent`) that point at them.

## When to use it

- An older site has grown 30 shades of gray and nobody knows which is right.
- You are moving a project to Tailwind and want a theme that matches what is already live.
- You need a style guide for a site that never had one.
- You are rebuilding a design from screenshots and want a starting palette and type scale.
- You want a contrast report for every text and background pair in use.

## Install

**Claude Code**, as a plugin (installs all grw—lab skills, updates with one command):

```text
/plugin marketplace add grw-lab/skills
/plugin install grw-skills@grw-lab
```

**Claude Code**, this skill only:

```bash
git clone https://github.com/grw-lab/skills.git ~/grwlab-skills
mkdir -p ~/.claude/skills && cp -r ~/grwlab-skills/design-tokens-extractor ~/.claude/skills/
```

For one project only, copy the folder into `.claude/skills/` inside that project instead.

**Claude.ai**: zip the `design-tokens-extractor` folder and upload it in Settings → Capabilities → Skills.

**Other agents** (Cursor, Codex, Gemini CLI, Windsurf): point the agent at `design-tokens-extractor/SKILL.md`, or paste it into your rules file. The instructions are plain Markdown.

The scripts need Node 18 or newer and nothing else.

## Usage

- "Extract design tokens from `src/styles/*.css` and give me a Tailwind v4 theme."
- "Open our homepage, pricing, and blog post pages and pull the real colors and type scale."
- "Our CSS has too many grays. Consolidate them and tell me which ones fail contrast."
- "Here are three screenshots of the app. Draft a palette and type scale, and mark what's estimated."
- "Convert our tokens.json to DTCG format."

## Example

A hand-written marketing stylesheet with near-duplicate colors goes in:

```css
.card { background: #fff; border: 1px solid #e5e7eb; }
.card--muted { background: #f9fafb; border-color: #e6e8eb; }
.btn--ghost { color: #4f46e5; border: 1px solid #4F46E5; }
```

The color script merges `#e6e8eb` into `#e5e7eb` and `#f9fafb` into `#ffffff`, and grades contrast:

```text
17 colors → 15 clusters (threshold ΔEok ≤ 2.5).
| Hex     | OKLCH                    | Draft name  | vs #ffffff   |
| #4f46e5 | oklch(51.1% 0.230 277.0) | indigo-500  | 6.29:1 AA    |
| #6b7280 | oklch(55.1% 0.023 264.4) | neutral-500 | 4.83:1 AA    |
| #e5e7eb | oklch(92.8% 0.006 264.5) | neutral-200 | 1.24:1 fail  |
```

After review, the semantic layer reads like this:

```json
"semantic": {
	"text": "{color.gray-900}",
	"muted": "{color.gray-500}",
	"border": "{color.gray-200}",
	"accent": "{color.indigo-600}"
}
```

And the Tailwind v4 output starts:

```css
@theme {
	--color-gray-900: #111827;
	--color-text: #111827;
	--text-base: 1rem;
	--text-base--line-height: 1.5;
	--spacing-4: 1rem;
	--radius-md: 0.75rem;
}
```

## What's inside

| File | What it's for |
|---|---|
| `SKILL.md` | The workflow: pick a source, extract, cluster, draft, name, emit, report. |
| `scripts/extract.mjs` | Collects every design value from CSS files, with usage counts. |
| `scripts/computed-styles.js` | Browser snippet that captures what the page actually renders. |
| `scripts/colors.mjs` | Merges near-duplicate colors in OKLCH and checks WCAG contrast. |
| `scripts/draft.mjs` | Builds a starter token file with draft names and a 4px spacing grid. |
| `scripts/emit.mjs` | Writes CSS variables, Tailwind v4, Tailwind v3, and DTCG JSON. |
| `references/sources.md` | How to read each kind of source, and their limits. |
| `references/naming.md` | Primitive and semantic naming, scales, dark mode. |
| `references/formats.md` | Every output format and its caveats. |
| `examples/` | A fixture stylesheet run through every step, with all outputs. |

Want ready-made prompt recipes to build UI on top of your new tokens? Browse [Stylr](https://stylr.dev/).

## FAQ

**Does it need any packages?**
No. The scripts use only Node's standard library. Node 18 or newer is enough.

**Will it change my brand colors to pass contrast?**
No. It reports failures and suggests the nearest passing shade. Changing a brand color is your decision.

**Why OKLCH for merging colors?**
Distances in OKLab match how different two colors look far better than hex or RGB distances. Two grays that look identical get merged; a gray and a faint blue tint stay apart.

**Which DTCG version does it write?**
The 2025.10 stable spec by default, with object values for colors and dimensions. Pass `--dtcg legacy` for the older string format if your tool expects it.

**Can it read Sass or Less variables?**
Compile to CSS first and run the extractor on the output. Variables in source files are not parsed.
