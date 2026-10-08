// Paste into the browser devtools console on the page you want to extract from
// (or run it with page.evaluate in Playwright/Puppeteer). It walks every visible element,
// reads computed styles, and copies a CSS-like text to the clipboard that extract.mjs can read:
//   pbpaste > computed.css && node extract.mjs computed.css --out report.json
// Computed styles show what the browser actually renders (resolved var(), px units),
// so counts reflect real usage on this page, not dead CSS. Run it on several page types.
(() => {
	const props = [
		"color", "background-color", "border-top-color", "border-bottom-color", "outline-color",
		"font-family", "font-size", "font-weight", "line-height", "letter-spacing",
		"margin-top", "margin-bottom", "margin-left", "margin-right",
		"padding-top", "padding-bottom", "padding-left", "padding-right", "row-gap", "column-gap",
		"border-top-left-radius", "box-shadow", "transition-duration", "transition-timing-function", "z-index",
	];
	const skip = new Set(["rgba(0, 0, 0, 0)", "none", "normal", "auto", "0px", "0s"]);
	const lines = [];
	let n = 0;
	for (const el of document.querySelectorAll("body *")) {
		const rect = el.getBoundingClientRect();
		if (!rect.width || !rect.height) continue;
		const cs = getComputedStyle(el);
		if (cs.display === "none" || cs.visibility === "hidden") continue;
		const decls = [];
		for (const p of props) {
			const v = cs.getPropertyValue(p).trim();
			if (!v || skip.has(v)) continue;
			// A border color only matters when that border is drawn.
			const side = p.match(/^border-(top|bottom)-color$/);
			if (side && cs.getPropertyValue(`border-${side[1]}-width`) === "0px") continue;
			// Skip inherited text color/font on elements without their own text to reduce noise.
			if (/^(color|font-|line-height|letter-spacing)/.test(p) && ![...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim())) continue;
			decls.push(`${p}: ${v};`);
		}
		if (decls.length) lines.push(`.e${n++} { ${decls.join(" ")} }`);
	}
	for (const sheet of document.styleSheets) {
		try {
			for (const rule of sheet.cssRules) if (rule.media) lines.push(`@media ${rule.media.mediaText} {}`);
		} catch { /* cross-origin sheet */ }
	}
	const root = getComputedStyle(document.documentElement);
	const vars = [];
	for (const sheet of document.styleSheets) {
		try {
			for (const rule of sheet.cssRules) {
				if (rule.selectorText !== ":root") continue;
				for (const name of rule.style) if (name.startsWith("--")) vars.push(`${name}: ${root.getPropertyValue(name).trim()};`);
			}
		} catch { /* cross-origin sheet */ }
	}
	const text = `:root { ${vars.join(" ")} }\n${lines.join("\n")}\n`;
	if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
	console.log(`${n} elements, ${vars.length} custom properties. Copied to clipboard (or copy the returned string).`);
	return text;
})();
