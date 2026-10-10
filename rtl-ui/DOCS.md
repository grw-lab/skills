## What it does

RTL UI teaches your agent to make a web interface work in right-to-left languages: Arabic, Hebrew, Persian and Urdu. It finds the CSS and Tailwind classes that only work left to right, replaces them with logical ones, sets `dir` and `lang` correctly, and decides which icons should flip and which must not.

It also covers the problems that show up after the layout is fixed. Phone numbers and emails come out scrambled inside Arabic sentences. Inputs that should stay left to right get flipped. Arabic fonts render with broken letter spacing. Carousels and keyboard arrows move the wrong way.

The skill ships with a small scanner (`rtl-audit.mjs`) that lists every physical property and class in your code, with the logical replacement next to each one. It needs Node 18 or later and nothing else.

## When to use it

- You are adding Arabic, Hebrew, Persian or Urdu to an existing site or app.
- A page looks broken or half-reversed in RTL.
- You want a component library or Tailwind setup reviewed before you add a second language.
- Mixed Arabic and English text shows up in the wrong order.

It does not translate or write Arabic copy. For that, use [Arabic Copy](/skills/arabic-copy/).

## Install

This installs **rtl-ui** only. The other skills stay out.

1. Open Claude Code.
2. Paste line 1 and press Enter. This adds the catalog. Do it once, then skip it next time.
3. Paste line 2 and press Enter. This installs this skill.

```text
/plugin marketplace add grw-lab/skills
/plugin install rtl-ui@grw-lab
```

Claude confirms the install in the chat. The next message can use the skill.

Every skill instead: keep line 1, and use this as line 2:

```text
/plugin install grw-skills@grw-lab
```

On claude.ai, zip the `rtl-ui` folder and upload it in Settings → Capabilities → Skills.

In Cursor or another agent, point it at `rtl-ui/SKILL.md`.

## Usage

Ask in plain words. For example:

- "Add RTL support to this Next.js app. We're launching in Arabic."
- "Audit `src/components` for RTL problems and fix them."
- "The phone number shows up backwards in the Arabic checkout. Fix it."
- "Convert this Tailwind component to logical classes."
- "Which icons in our icon set should flip in Arabic?"

To run only the scanner:

```bash
node ~/.claude/skills/rtl-ui/scripts/rtl-audit.mjs src
node ~/.claude/skills/rtl-ui/scripts/rtl-audit.mjs src --only tailwind --json
```

It exits with code 1 when it finds something, so you can use it in CI.

## Example

Before:

```tsx
<div className="relative flex space-x-4 rounded-l-lg border-l-4 pl-6 text-left">
  <span className="absolute right-3 top-3">New</span>
  <p style={{ marginLeft: 8 }}>{price}</p>
</div>
```

Scanner output:

```
Card.tsx
     1:31  tailwind space-x-4  →  gap-* on the flex/grid parent, or add rtl:space-x-reverse (Tailwind v3)
     1:41  tailwind rounded-l-lg  →  rounded-s-lg
     1:54  tailwind border-l-4  →  border-s-4
     1:65  tailwind pl-6  →  ps-6
     1:70  tailwind text-left  →  text-start
     2:29  tailwind right-3  →  end-3
     3:15  css      marginLeft  →  marginInlineStart

rtl-audit: 7 findings in 1 file.
```

After:

```tsx
<div className="relative flex gap-4 rounded-s-lg border-s-4 ps-6 text-start">
  <span className="absolute end-3 top-3">New</span>
  <p style={{ marginInlineStart: 8 }}><bdi>{price}</bdi></p>
</div>
```

The same code now works in both directions. The badge stays at the end of the line, the accent border stays at the start, and the price keeps its order inside Arabic text.

## What's inside

| File | What it's for |
|---|---|
| `SKILL.md` | The workflow and rules: direction, CSS, flex and grid, icons, bidi, numerals, Arabic typography, interaction, and a checklist for both directions |
| `references/logical-properties.md` | Every physical → logical CSS property, and what to do where no logical version exists |
| `references/tailwind.md` | Tailwind's logical utilities, `rtl:` and `ltr:` variants, `space-x` and plugin migration |
| `references/mirroring.md` | Which icons and images to mirror, which never to mirror, and how |
| `references/bidi.md` | Why mixed Arabic and English text breaks, and how to fix it with markup, CSS or Unicode isolates |
| `scripts/rtl-audit.mjs` | The scanner: CSS, SCSS, Less, HTML, JSX, TSX, Vue, Svelte, Astro |
| `examples/` | A component before and after, with the reason for each change |

## FAQ

**Do I need a Tailwind plugin for RTL?**
No. Tailwind 3.3 and later include logical utilities (`ms-`, `pe-`, `start-`, `rounded-s-`) and the `rtl:` / `ltr:` variants. If you still use `tailwindcss-rtl`, the skill explains how to move off it.

**Can't I just add `direction: rtl` to the body?**
Set `dir="rtl"` on `<html>` instead. The attribute sets the document's base direction for form controls, scrollbars and screen readers. CSS `direction` does not do all of that.

**Will the fixes break my English layout?**
They shouldn't. Logical properties behave exactly like the old ones in left-to-right pages. The skill's checklist has the agent check both directions before it reports done.

**Does the scanner change my files?**
No. It only reports. Your agent makes the edits, so you can review the diff.

**Does it handle React Native or Flutter?**
Only briefly: it covers the start/end style keys and directional widgets. The scanner is for web code.
