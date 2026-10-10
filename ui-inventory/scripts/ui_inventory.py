#!/usr/bin/env python3
"""List repeated UI values in local HTML and CSS files.

Usage:
  python ui_inventory.py FILE_OR_FOLDER --out report.md

Reads .html, .css and .scss. Skips node_modules, vendor, and hidden folders.
Counts headings, buttons, links, font-size, color, background-color and border-radius.
Does not open the network and does not change the files.
"""

import sys
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path


SKIP = {"node_modules", "vendor", ".git", "dist", "build"}
SUFFIXES = {".html", ".css", ".scss"}


class Collector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags = Counter()
        self.styles = []

    def handle_starttag(self, tag, attrs):
        self.tags[tag.lower()] += 1
        style = dict(attrs).get("style")
        if style:
            self.styles.append(style)


def declarations(text):
    found = []
    i = 0
    while True:
        start = text.find("{", i)
        if start < 0:
            break
        end = text.find("}", start)
        if end < 0:
            break
        found.append(text[start + 1:end])
        i = end + 1
    return found


def prop_values(block, name):
    values = []
    for part in block.split(";"):
        if ":" not in part:
            continue
        key, value = part.split(":", 1)
        key = key.strip().lower()
        if key == name:
            values.append(" ".join(value.strip().lower().split()))
    return values


def files_in(target):
    path = Path(target)
    if path.is_file():
        return [path] if path.suffix.lower() in SUFFIXES else []
    picked = []
    for item in path.rglob("*"):
        if not item.is_file() or item.suffix.lower() not in SUFFIXES:
            continue
        if any(part in SKIP or part.startswith(".") for part in item.parts):
            continue
        picked.append(item)
    return sorted(picked)


def inventory(paths):
    tags = Counter()
    props = {name: Counter() for name in ("font-size", "color", "background-color", "border-radius")}
    for path in paths:
        text = path.read_text(encoding="utf-8", errors="replace")
        if path.suffix.lower() == ".html":
            parser = Collector()
            parser.feed(text)
            tags.update(parser.tags)
            blocks = parser.styles
        else:
            blocks = declarations(text)
        for block in blocks:
            for name in props:
                for value in prop_values(block, name):
                    if value and not value.startswith(("var(", "inherit", "initial", "unset")):
                        props[name][value] += 1
    return tags, props


def report(tags, props, count):
    lines = [f"# UI inventory", "", f"Files read: {count}", ""]
    lines.append("## Elements")
    lines.append("")
    for tag in ("h1", "h2", "h3", "h4", "button", "a", "input", "img"):
        if tags[tag]:
            lines.append(f"- {tag}: {tags[tag]}")
    lines.append("")
    for name, counter in props.items():
        lines.append(f"## {name}")
        lines.append("")
        if not counter:
            lines.append("- none found")
        else:
            lines.append(f"- distinct values: {len(counter)}")
            for value, times in counter.most_common(12):
                lines.append(f"- `{value}` × {times}")
        lines.append("")
    return "\n".join(lines).rstrip() + "\n"


def main(argv):
    if len(argv) != 4 or argv[2] != "--out":
        raise SystemExit("Usage: python ui_inventory.py FILE_OR_FOLDER --out report.md")
    if not Path(argv[1]).exists():
        raise SystemExit(f"File not found: {argv[1]}")
    paths = files_in(argv[1])
    if not paths:
        raise SystemExit("No .html, .css or .scss files found")
    tags, props = inventory(paths)
    Path(argv[3]).write_text(report(tags, props, len(paths)), encoding="utf-8")
    print(f"Read {len(paths)} files. Wrote {argv[3]}")


if __name__ == "__main__":
    main(sys.argv)
