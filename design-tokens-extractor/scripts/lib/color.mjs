// Color parsing and math. No dependencies.
// sRGB <-> OKLab/OKLCH uses Björn Ottosson's published matrices.
// WCAG 2.x relative luminance and contrast ratio.

const NAMED = {
	black: "#000000", white: "#ffffff", red: "#ff0000", green: "#008000", blue: "#0000ff",
	yellow: "#ffff00", cyan: "#00ffff", aqua: "#00ffff", magenta: "#ff00ff", fuchsia: "#ff00ff",
	gray: "#808080", grey: "#808080", silver: "#c0c0c0", maroon: "#800000", olive: "#808000",
	lime: "#00ff00", navy: "#000080", purple: "#800080", teal: "#008080", orange: "#ffa500",
	transparent: "#00000000",
};

export const NAMED_COLORS = Object.keys(NAMED);

const clamp = (x, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x));

function num(token, scale = 1) {
	token = token.trim();
	if (token.endsWith("%")) return (parseFloat(token) / 100) * scale;
	return parseFloat(token);
}

function hue(token) {
	token = token.trim();
	const v = parseFloat(token);
	if (token.endsWith("turn")) return v * 360;
	if (token.endsWith("rad")) return (v * 180) / Math.PI;
	if (token.endsWith("grad")) return v * 0.9;
	return v;
}

// Split "a, b, c" or "a b c / d" into [parts, alpha].
function args(inner) {
	let alpha = null;
	let main = inner;
	if (inner.includes("/")) {
		const [m, a] = inner.split("/");
		main = m;
		alpha = a;
	}
	const parts = main.includes(",") ? main.split(",") : main.trim().split(/\s+/);
	if (!inner.includes("/") && parts.length === 4) alpha = parts.pop();
	return [parts.map((p) => p.trim()).filter(Boolean), alpha];
}

function hslToRgb(h, s, l) {
	h = ((h % 360) + 360) % 360;
	const f = (n) => {
		const k = (n + h / 30) % 12;
		const a = s * Math.min(l, 1 - l);
		return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
	};
	return [f(0), f(8), f(4)];
}

// Returns { r, g, b, a } with channels 0..1, or null if not a color we understand.
export function parseColor(input) {
	if (!input) return null;
	let s = String(input).trim().toLowerCase();
	if (NAMED[s]) s = NAMED[s];
	let m = s.match(/^#([0-9a-f]{3,8})$/);
	if (m) {
		let h = m[1];
		if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join("");
		if (h.length !== 6 && h.length !== 8) return null;
		const n = (i) => parseInt(h.slice(i, i + 2), 16) / 255;
		return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) : 1 };
	}
	m = s.match(/^(rgba?|hsla?|oklch|oklab)\((.*)\)$/);
	if (!m) return null;
	const [parts, alphaRaw] = args(m[2]);
	if (parts.length !== 3 || parts.some((p) => p === "none" || p.startsWith("var("))) return null;
	const a = alphaRaw == null ? 1 : clamp(num(alphaRaw, 1));
	let rgb;
	if (m[1].startsWith("rgb")) {
		rgb = parts.map((p) => clamp(p.endsWith("%") ? num(p, 1) : parseFloat(p) / 255));
	} else if (m[1].startsWith("hsl")) {
		rgb = hslToRgb(hue(parts[0]), clamp(num(parts[1], 1) > 1 ? num(parts[1]) / 100 : num(parts[1], 1)), clamp(num(parts[2], 1) > 1 ? num(parts[2]) / 100 : num(parts[2], 1)));
	} else if (m[1] === "oklch") {
		const L = num(parts[0], 1);
		const C = parts[1].endsWith("%") ? num(parts[1], 0.4) : parseFloat(parts[1]);
		const H = hue(parts[2]);
		rgb = oklabToSrgb(L, C * Math.cos((H * Math.PI) / 180), C * Math.sin((H * Math.PI) / 180));
	} else {
		const L = num(parts[0], 1);
		const A = parts[1].endsWith("%") ? num(parts[1], 0.4) : parseFloat(parts[1]);
		const B = parts[2].endsWith("%") ? num(parts[2], 0.4) : parseFloat(parts[2]);
		rgb = oklabToSrgb(L, A, B);
	}
	if (rgb.some((v) => Number.isNaN(v))) return null;
	return { r: clamp(rgb[0]), g: clamp(rgb[1]), b: clamp(rgb[2]), a };
}

export function toHex({ r, g, b, a = 1 }) {
	const h = (v) => Math.round(clamp(v) * 255).toString(16).padStart(2, "0");
	return "#" + h(r) + h(g) + h(b) + (a < 1 ? h(a) : "");
}

const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const gam = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

export function srgbToOklab({ r, g, b }) {
	const R = lin(r), G = lin(g), B = lin(b);
	const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
	const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
	const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
	return {
		L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
		a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
		b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
	};
}

export function oklabToSrgb(L, a, b) {
	const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
	const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
	const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
	return [
		gam(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
		gam(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
		gam(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
	];
}

export function toOklch(color) {
	const { L, a, b } = srgbToOklab(color);
	const C = Math.sqrt(a * a + b * b);
	let H = (Math.atan2(b, a) * 180) / Math.PI;
	if (H < 0) H += 360;
	return { L, C, H: C < 0.0001 ? 0 : H, alpha: color.a ?? 1 };
}

export function formatOklch(color) {
	const { L, C, H, alpha } = toOklch(color);
	const base = `oklch(${(L * 100).toFixed(1)}% ${C.toFixed(3)} ${H.toFixed(1)}`;
	return alpha < 1 ? `${base} / ${+alpha.toFixed(2)})` : `${base})`;
}

// Euclidean distance in OKLab, scaled by 100. About 2 is a just-noticeable difference.
// Alpha difference counts too, so a 50% black does not merge with solid black.
export function deltaEOK(c1, c2) {
	const x = srgbToOklab(c1);
	const y = srgbToOklab(c2);
	const da = (c1.a ?? 1) - (c2.a ?? 1);
	return 100 * Math.sqrt((x.L - y.L) ** 2 + (x.a - y.a) ** 2 + (x.b - y.b) ** 2 + da * da);
}

// Composite a translucent color over an opaque background.
export function over(fg, bg) {
	const a = fg.a ?? 1;
	return { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a), a: 1 };
}

export function luminance({ r, g, b }) {
	return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrast(fg, bg) {
	const f = (fg.a ?? 1) < 1 ? over(fg, bg) : fg;
	const L1 = luminance(f);
	const L2 = luminance(bg);
	return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
}

export function wcagGrade(ratio) {
	if (ratio >= 7) return "AAA";
	if (ratio >= 4.5) return "AA";
	if (ratio >= 3) return "AA large";
	return "fail";
}

const HUES = [
	[35, "red"], [62, "orange"], [82, "amber"], [105, "yellow"], [135, "lime"], [165, "green"],
	[195, "teal"], [225, "cyan"], [245, "sky"], [270, "blue"], [285, "indigo"], [298, "violet"],
	[315, "purple"], [340, "fuchsia"], [360, "pink"],
];

// Lightness of Tailwind's default gray-ish scale, used only to pick a familiar step number.
const STEPS = [[0.985, 50], [0.967, 100], [0.928, 200], [0.872, 300], [0.707, 400], [0.551, 500], [0.446, 600], [0.373, 700], [0.278, 800], [0.21, 900], [0.13, 950]];

// Draft primitive name like "neutral-200", "indigo-600", or "neutral-900-a10" for 10% alpha.
// A suggestion only; rename by role later.
export function suggestName(color) {
	const { L, C, H } = toOklch(color);
	const alpha = color.a ?? 1;
	const suffix = alpha < 1 ? `-a${Math.round(alpha * 100)}` : "";
	if (C < 0.005 && L > 0.995) return `white${suffix}`;
	if (C < 0.005 && L < 0.01) return `black${suffix}`;
	let family = "neutral";
	if (C >= 0.035) family = HUES.find(([max]) => H < max)?.[1] ?? "red";
	const step = STEPS.reduce((best, s) => (Math.abs(s[0] - L) < Math.abs(best[0] - L) ? s : best))[1];
	return `${family}-${step}${suffix}`;
}

// Greedy clustering: most frequent color first; each color joins the first cluster within threshold.
export function cluster(colors, threshold = 2.5) {
	const sorted = [...colors].sort((x, y) => y.count - x.count);
	const clusters = [];
	for (const item of sorted) {
		const c = parseColor(item.value);
		if (!c) continue;
		const home = clusters.find((k) => deltaEOK(k.color, c) <= threshold);
		if (home) {
			home.members.push(item);
			home.count += item.count;
		} else {
			clusters.push({ color: c, hex: toHex(c), members: [item], count: item.count });
		}
	}
	return clusters;
}
