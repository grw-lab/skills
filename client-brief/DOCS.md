# Client brief

## What it does

Reads a messy client message and writes a one-page brief: what they asked, what is in scope, what is out, and the questions still open. It does not price the work.

## When to use it

A WhatsApp thread, an email, or a transcript that needs to become a job description before anyone quotes.

## Install

This installs **client-brief** only. The first line is once per machine.

```
/plugin marketplace add grw-lab/skills
/plugin install client-brief@grw-lab
```

To install every grw—lab skill instead, use this as line 2:

```
/plugin install grw-skills@grw-lab
```

On claude.ai, zip this folder and add it under Settings, Capabilities, Skills. In Cursor, copy `SKILL.md` into the project skills folder.

## Usage

Paste the client message and ask for the brief. The reply follows `references/brief-template.md`. Missing budget, deadline, or audience stays under Open questions.

## Example

Source: "نحتاج لاندينج بسيطة للحملة، ثلاث سكاشن، والأسبوع الجاي لو أمكن. الميزانية نتكلم فيها بعدين."

The brief says the landing page and three sections are in scope. Budget and the exact deadline are open questions. The next step is one question: which week, and is a date fixed. No price is written.

## What's inside

`SKILL.md` and `references/brief-template.md`. No script. Pricing stays in the freelance-quote skill.

## FAQ

**Can it send the brief to the client?**
Only if you ask it to. The default is to show you the brief first.

**Why is there no price?**
A brief and a quote are different jobs. Use freelance-quote once the scope is agreed.
