# UI inventory

## What it does

Reads local HTML and CSS and lists headings, buttons, font sizes, colors, and corner radii, with how many times each value appears.

## When to use it

A folder of interface files, before anyone names tokens or merges one-off styles.

## Install

This installs **ui-inventory** only. The first line is once per machine.

```
/plugin marketplace add grw-lab/skills
/plugin install ui-inventory@grw-lab
```

To install every grw—lab skill instead, use this as line 2:

```
/plugin install grw-skills@grw-lab
```

On claude.ai, zip this folder and add it under Settings, Capabilities, Skills. In Cursor, copy `SKILL.md` into the project skills folder.

Needs Python 3.9 or newer. No extra packages.

## Usage

```bash
python scripts/ui_inventory.py ./src --out report.md
```

It reads `.html`, `.css`, and `.scss`. It skips `node_modules`, `vendor`, `dist`, `build`, and hidden folders. It does not open the network.

## Example

Two files, one button at `16px` and one paragraph at `14px`, plus a stylesheet with `16px`, `13px`, `#111`, `#333`, `8px`, and `4px`, produce three font sizes and two radii. `16px` and `#111` and `8px` are the values that repeat.

## What's inside

`scripts/ui_inventory.py` writes `report.md`. Token export is a later step, in design-tokens-extractor.

## FAQ

**Can it scan a live URL?**
No. Save the HTML and CSS first, then point the script at the folder.

**Does it change my CSS?**
No. It only writes the report.
