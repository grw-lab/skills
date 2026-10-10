---
name: ui-inventory
description: Reads local HTML and CSS and lists the headings, buttons, font sizes, colors, and corner radii in use, with counts. Use when a designer inherits a site or a folder of files and wants to see which values repeat and which appear once before extracting tokens. Does not open the network and does not edit the files.
---

# UI inventory

Count what the interface already uses. Hand the designer the list. Do not redesign it in the same step.

## When to use

- A folder of HTML and CSS needs a picture of repeated sizes, colors, and radii.
- The user asks which styles are inconsistent before a token pass.

## When not to use

- They want tokens, Tailwind, or DTCG JSON. Use design-tokens-extractor after this list exists.
- The only source is a live URL. This script reads files on disk. Save the page first.

## Workflow

1. Point the script at a file or a folder. It reads `.html`, `.css`, and `.scss`, and skips `node_modules`, `vendor`, `dist`, `build`, and hidden folders.

```bash
python scripts/ui_inventory.py ./src --out report.md
```

2. Read `report.md`. Call out values that appear once next to a value that appears many times. Those are the candidates to merge.
3. Do not treat a long list as a failure. A marketing page can have more sizes than an app.
4. If they want the system named and exported, switch to design-tokens-extractor and pass this report as the evidence.

## Rules

- Do not fetch URLs.
- Do not edit the CSS while inventorying.
- Ignore `var()`, `inherit`, `initial`, and `unset`. Those are not raw values.
- Quote the file counts. Do not say "the site uses blue" unless a blue value is in the report.

## Done check

- The report's file count matches what you passed in.
- Every recommendation points at a value and a count from the report.
- No token names were invented in this step.
