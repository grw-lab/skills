## What it does

Freelance Quote turns a client brief into a quote you can send. It reads the email, call notes, or RFP, asks only the questions that change the price, breaks the work into tasks, and estimates each one as a range. It then adds a visible buffer, picks a pricing model, and writes the terms that protect you: assumptions, exclusions, revision rounds, a change-request process, payment schedule, and a validity date.

It works in English and Arabic. The Arabic templates are written in natural Arabic, not translated line by line.

It never invents your rate, currency, or tax rate. If it doesn't know them, it asks.

## When to use it

- A new brief arrives and you need a price today.
- You keep underquoting because hidden tasks (calls, QA, revisions, deployment) never make it into the estimate.
- A client asks for "one small thing" mid-project and you need a polite, priced change request.
- You need a proposal for a competitive bid, with two or three options.
- The client writes in Arabic and expects the quote in Arabic.

## Install

**Claude Code**, as a plugin (installs all nine grw—lab skills, updates with one command):

```text
/plugin marketplace add grw-lab/skills
/plugin install grw-skills@grw-lab
```

**Claude Code**, this skill only:

```bash
git clone https://github.com/grw-lab/skills.git ~/grwlab-skills
mkdir -p ~/.claude/skills && cp -r ~/grwlab-skills/freelance-quote ~/.claude/skills/
```

For one project only, copy the folder into `.claude/skills/` inside that project instead.

**Claude.ai**: zip the `freelance-quote` folder and upload it in Settings → Capabilities → Skills.

**Other agents** (Cursor, Codex, Gemini CLI, Windsurf): point the agent at `freelance-quote/SKILL.md`, or paste it into your rules file. The instructions are plain Markdown.

## Usage

- "Here's the brief from a new client. Quote it at 75 USD an hour, 15% VAT."
- "Turn these call notes into a quote and a short proposal with three options."
- "The client wants a booking calendar added. Write a change request."
- "اكتب عرض سعر بالعربية لهذا المشروع، بالريال السعودي، وسعري ٣٥٠ ريال للساعة."
- "Is fixed price or a day rate better for this project?"

## Example

**Brief (excerpt):** "We need a bilingual company site, about 6 pages, Arabic and English, contact form, we have a logo. Launch in two months."

The skill asks four questions (who writes the copy, how many revision rounds, hosting, hard launch date), then estimates the work. Its estimate script prints:

```text
| Deliverable | Task | Low h | Likely h | High h | Expected h | Amount |
|---|---|--:|--:|--:|--:|--:|
| Build | Arabic RTL version | 8 | 12 | 20 | 12.7 | 950.00 USD |
| ...  |
| Subtotal (expected, 101.3 h)        |  7,600.00 USD |
| Buffer (15%)                        |  1,140.00 USD |
| Rounding (up to the nearest 50)     |     10.00 USD |
| VAT (15%)                           |  1,312.50 USD |
| Total                               | 10,062.50 USD |

Range: 68 to 152 h. Expected 101.3 h. 95% confidence: 108.6 h.
```

The quote it writes groups that into four deliverables, with a 40/30/30 payment schedule, two revision rounds, a 30-day validity date, and an exclusions list (copywriting, photography, hosting fees, maintenance after launch).

## What's inside

| File | What it's for |
|---|---|
| `SKILL.md` | The workflow: extract, ask, break down, estimate, buffer, price, terms, output. |
| `scripts/estimate.py` | Three-point (PERT) estimates from a CSV or JSON task list. Prints totals with buffer, rounding, and VAT. No installs needed. |
| `references/pricing-models.md` | Fixed, milestones, day rate, retainer, value-based. Formulas and when to use each. |
| `references/quote-template.md` / `.ar.md` | Quote templates in English and Arabic. |
| `references/proposal-template.md` | A short proposal with options. |
| `references/scope-of-work-template.md` | A scope of work to lock down deliverables after acceptance. |
| `references/change-request-template.md` / `.ar.md` | Change requests in English and Arabic. |
| `references/questions.md` | Discovery questions by project type. |
| `examples/` | Sample task lists and the script's output. |

Once the quote is ready, you can send it, get it signed, and track it in [Qufy](https://qufy.app/).

## FAQ

**Will it decide my rate for me?**
No. It asks for your rate and currency and leaves placeholders until you answer. It can explain pricing models, but the number is yours.

**Why ranges instead of one number?**
A single number hides risk. Ranges show the client, and you, where the uncertainty is. The script turns ranges into an expected total and a 95% confidence figure so you can see whether your buffer is big enough.

**Can it write my contract?**
It drafts terms and a scope of work, but it is not legal advice. For large or high-risk projects, have a lawyer review the agreement.

**Does it handle VAT?**
It adds a separate tax line at the rate you give it, and rounds before tax so the VAT line stays exact. It does not assume whether you are VAT registered.

**Does it work for retainers and hourly work?**
Yes. Ask for a retainer or a day-rate quote and it adds a cap, included hours, rollover rules, and a reporting rhythm.
