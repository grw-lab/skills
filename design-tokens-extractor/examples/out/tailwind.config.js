/** @type {import('tailwindcss').Config} */
module.exports = {
	theme: {
		extend: {
			"colors": {
				"white": "#ffffff",
				"gray-50": "#f9fafb",
				"gray-200": "#e5e7eb",
				"gray-500": "#6b7280",
				"gray-900": "#111827",
				"indigo-50": "#eef2ff",
				"indigo-600": "#4f46e5",
				"indigo-700": "#4338ca",
				"red-50": "#fef2f2",
				"red-600": "#dc2626",
				"red-800": "#991b1b",
				"green-700": "#157f3c",
				"bg": "#ffffff",
				"surface": "#f9fafb",
				"text": "#111827",
				"muted": "#6b7280",
				"border": "#e5e7eb",
				"accent": "#4f46e5",
				"accent-hover": "#4338ca",
				"danger": "#dc2626",
				"success": "#157f3c"
			},
			"fontFamily": {
				"sans": [
					"\"Inter\"",
					"system-ui",
					"sans-serif"
				],
				"mono": [
					"\"JetBrains Mono\"",
					"ui-monospace",
					"monospace"
				]
			},
			"fontWeight": {
				"regular": "400",
				"semibold": "600",
				"bold": "700"
			},
			"fontSize": {
				"xs": [
					"0.75rem",
					{
						"letterSpacing": "0.08em"
					}
				],
				"sm": "0.875rem",
				"base": [
					"1rem",
					{
						"lineHeight": "1.5"
					}
				],
				"lg": "1.25rem",
				"xl": [
					"1.5rem",
					{
						"lineHeight": "1.25"
					}
				],
				"2xl": [
					"2.25rem",
					{
						"lineHeight": "1.15",
						"letterSpacing": "-0.02em"
					}
				],
				"3xl": [
					"3rem",
					{
						"lineHeight": "1.15",
						"letterSpacing": "-0.02em"
					}
				]
			},
			"spacing": {
				"1": "0.25rem",
				"2": "0.5rem",
				"3": "0.75rem",
				"4": "1rem",
				"6": "1.5rem",
				"8": "2rem",
				"16": "4rem",
				"20": "5rem"
			},
			"borderRadius": {
				"sm": "0.5rem",
				"md": "0.75rem",
				"lg": "1rem",
				"full": "9999px"
			},
			"boxShadow": {
				"sm": "0 1px 2px rgba(17, 24, 39, 0.06), 0 1px 3px rgba(17, 24, 39, 0.1)",
				"lg": "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)"
			},
			"screens": {
				"sm": "40rem",
				"md": "48rem",
				"lg": "64rem"
			},
			"transitionDuration": {
				"fast": "150ms",
				"normal": "300ms"
			},
			"transitionTimingFunction": {
				"standard": "cubic-bezier(0.4, 0, 0.2, 1)",
				"out": "ease-out"
			},
			"zIndex": {
				"sticky": "10",
				"modal": "50",
				"tooltip": "60"
			}
		},
	},
};
