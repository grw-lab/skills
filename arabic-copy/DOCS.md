## What it does

Arabic Copy teaches your agent to write Arabic that reads as if it was written in Arabic first, not translated word for word. It covers interface text (buttons, labels, errors, empty states, onboarding) and marketing copy (landing pages, emails, notifications, ads).

It makes the decisions a good Arabic copywriter makes:

- **Register.** Simplified Modern Standard Arabic for product UI. Saudi, Gulf, Egyptian or Levantine dialect for marketing, only when you ask for it.
- **Addressing the user.** Gender-neutral by default, using verbal nouns, impersonal phrasing and pronoun forms that look the same for both genders in writing.
- **Details.** Arabic punctuation (، ؛ ؟), one digit system per screen, currency after the amount (`150 ر.س`), the right month names for your audience, and correct hamza, `ة` and `ى` spelling.
- **Consistency.** A glossary so "Sign in", "Checkout" or "Coupon code" get the same Arabic word on every screen.

## When to use it

- Translating app strings, a website or emails into Arabic.
- Reviewing Arabic copy that "sounds translated" or came from machine translation.
- Writing new Arabic microcopy or a campaign for a Saudi or Gulf audience.

It does not fix layout problems like reversed text or icons on the wrong side. For that, use [RTL UI](/skills/rtl-ui/).

## Install

**Claude Code**, as a plugin (installs all grw—lab skills, updates with one command):

```text
/plugin marketplace add grw-lab/skills
/plugin install grw-skills@grw-lab
```

**Claude Code**, this skill only:

```bash
git clone https://github.com/grw-lab/skills.git ~/grwlab-skills
mkdir -p ~/.claude/skills && cp -r ~/grwlab-skills/arabic-copy ~/.claude/skills/
```

For one project only, copy the folder into `.claude/skills/` inside that project instead.

**Claude.ai**: zip the `arabic-copy` folder and upload it in Settings → Capabilities → Skills.

**Other agents** (Cursor, Codex, Gemini CLI, Windsurf): point the agent at `arabic-copy/SKILL.md`, or paste it into your rules file. The instructions are plain Markdown.

## Usage

Ask in plain words. For example:

- "Translate `locales/en.json` into Arabic for a Saudi audience. Keep it gender-neutral."
- "Review the Arabic on our checkout page. It sounds machine-translated."
- "Write the Arabic error messages for the sign-up form."
- "Give me three Saudi-dialect versions of this ad headline, and one in MSA."
- "Our app uses masculine Arabic everywhere. Rewrite the onboarding to be neutral."

You get a table with the source, the Arabic, and a note wherever the agent made a choice: a register, a gender form, or a term kept in English.

## Example

Machine translation of a sign-up error and confirmation:

```
قم بإدخال عنوان بريد إلكتروني صالح الخاص بك من فضلك.
لقد تم إنشاء حسابك الخاص بك بنجاح!
```

After the skill:

```
يُرجى إدخال بريد إلكتروني صحيح، مثل name@example.com
تم إنشاء حسابك
```

What changed: `قم بـ` and `الخاص بك` are calques of English and were removed. The instruction uses `يُرجى` with a verbal noun, so it works for any reader. The error now shows an example of a valid value. `لقد` and `بنجاح` were padding.

## What's inside

| File | What it's for |
|---|---|
| `SKILL.md` | The brief, the workflow, register defaults, gender-neutral strategies, microcopy patterns, punctuation, numbers, dates, currency, and the review checklist |
| `references/glossary.md` | About 110 common UI terms, English → Arabic, grouped by area (account, navigation, shopping, billing, legal) |
| `references/patterns.md` | Ready examples for errors, empty states, confirmations, destructive dialogs, onboarding, CTAs, notifications and forms |
| `references/registers.md` | When to use dialect, when it backfires, and the same lines in MSA, Saudi, Egyptian and Levantine |
| `references/mistakes.md` | The errors translation tools and agencies make most, with fixes: bloat, calques, agreement, hamza, `ة`/`ه`, `ى`/`ي` |

## FAQ

**Is this a replacement for a human translator?**
For product UI and marketing drafts, it gets you much closer to native copy than plain machine translation. For legal, medical or financial terms that carry liability, have a qualified translator review the result. The skill tells the agent to say so.

**Which dialect does it use?**
None by default. Product UI is written in simplified Modern Standard Arabic, which every Arabic reader understands. Ask for Saudi, Gulf, Egyptian or Levantine when you want a local voice for marketing.

**How does it handle masculine and feminine forms?**
Gender-neutral by default. If your product knows the user's gender, tell the agent and it will use the right forms consistently.

**Western or Arabic-Indic digits?**
Western digits (0-9) by default, which is what most Saudi and Gulf apps use. Ask for Arabic-Indic (٠-٩) and it switches everywhere.

**Does it handle Arabic plurals?**
It writes all six plural forms Arabic needs (zero, one, two, few, many, other) for any string with a count. Wiring those into your i18n library is a separate job, covered by the Arabic Localization skill.
