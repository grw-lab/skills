# Serving the agent layer, per stack

Every recipe needs the same behavior:

1. `Accept: text/markdown` on a page URL returns that page's Markdown twin. `q=0` means no.
2. `/path/index.md` and `/path.md` return the twin directly.
3. `.md` files are served as `text/markdown; charset=utf-8`.
4. Responses that vary by Accept send `Vary: Accept`.
5. HTML responses send a `Link` header to `/llms.txt` and the sitemap.

Status marks:

- **Tested**: run end to end and checked with `curl` and `scripts/audit.mjs`. The version tested is named.
- **Checked against docs**: written from the platform's official docs, not deployed. Run the audit on a preview deploy before you ship it.

---

## Apache 2.4 (.htaccess): Tested

In production on tools.grwlab.net (Apache 2.4.62). Needs `mod_rewrite`, `mod_headers` and `mod_mime`, plus `AllowOverride All` (or put the rules in the vhost).

```apache
Options -MultiViews
DirectoryIndex index.html
ErrorDocument 404 /404.html

<IfModule mod_mime.c>
	AddType "text/markdown; charset=utf-8" .md
	AddType "text/plain; charset=utf-8" .txt
</IfModule>

<IfModule mod_rewrite.c>
	RewriteEngine On

	# Accept: text/markdown on a folder URL -> its index.md, unless q=0.
	RewriteCond %{HTTP:Accept} text/markdown [NC]
	RewriteCond %{HTTP:Accept} !text/markdown;\s*q=0(\.0+)?(\s*,|\s*;|\s*$) [NC]
	RewriteCond %{REQUEST_URI} /$
	RewriteCond %{DOCUMENT_ROOT}%{REQUEST_URI}index.md -f
	RewriteRule ^ %{REQUEST_URI}index.md [END]

	# /docs/start.md -> /docs/start/index.md
	RewriteCond %{DOCUMENT_ROOT}/$1/index.md -f
	RewriteRule ^(.+)\.md$ /$1/index.md [END]
</IfModule>

<IfModule mod_headers.c>
	Header always append Vary "Accept"
	Header always set Link "</llms.txt>; rel=\"describedby\"; type=\"text/plain\", </sitemap.xml>; rel=\"sitemap\"; type=\"application/xml\""
	<Files "llms-full.txt">
		Header set X-Robots-Tag "noindex, follow"
	</Files>
</IfModule>
```

Gotchas:

- If this site lives in a subfolder of another site's document root (for example inside a WordPress install), turning on `RewriteEngine` in the child `.htaccess` stops the parent's rewrite rules from applying. Header rules from the parent still apply, and parent `<FilesMatch>` blocks can re-add headers after yours.
- `MultiViews` does its own negotiation and can serve `index.md` unexpectedly. Turn it off.

---

## Nginx: Tested

Tested on nginx 1.30.5 (official `nginx:stable` image) with the config in `conf.d/`. Negotiation, `q=0`, `/path.md`, `/path/index.md`, `Vary` and `Link` all pass the audit. The extra `types` block adds `.md` without losing the default MIME types.

```nginx
# http {} block
types {
	text/markdown md;
}

map $http_accept $wants_md {
	default 0;
	"~*text/markdown;\s*q=0(\.0+)?(\s*[,;]|$)" 0;
	"~*text/markdown" 1;
}

# server {} block
charset utf-8;
charset_types text/markdown text/plain application/json;

location / {
	add_header Vary "Accept" always;
	add_header Link '</llms.txt>; rel="describedby"; type="text/plain", </sitemap.xml>; rel="sitemap"; type="application/xml"' always;

	if ($wants_md) {
		rewrite ^(.*/)$ $1index.md last;
	}
	try_files $uri $uri/ =404;
}

# /docs/start.md -> /docs/start/index.md when no file named start.md exists
location ~ ^(?<base>/.+)\.md$ {
	add_header Vary "Accept" always;
	try_files $uri $base/index.md =404;
}
```

Notes:

- `map` regexes are checked in order, and the first match wins. The `q=0` line must come before the general one.
- `rewrite ... last` inside `if` is one of the safe uses of `if` in a location.
- `add_header` in a nested location replaces the parent's headers. Repeat them where needed.
- `Link` is sent only from `location /`. Markdown responses do not need it.

---

## Next.js App Router: Tested

Tested on Next.js 16.4.0 with `next build && next start`. From Next.js 16 the file is `proxy.ts` and the function is `proxy`; `middleware.ts` still works but is deprecated (the official codemod is `npx @next/codemod@canary middleware-to-proxy .`). On Next.js 15 and older use `middleware.ts` with `export function middleware`.

```ts
// proxy.ts  (middleware.ts before Next.js 16)
import { NextResponse, type NextRequest } from "next/server";

function wantsMarkdown(accept: string) {
	return /text\/markdown/i.test(accept) && !/text\/markdown\s*;\s*q=0(\.0+)?(\s*[,;]|$)/i.test(accept);
}

export function proxy(req: NextRequest) {
	const { pathname } = req.nextUrl;
	const url = req.nextUrl.clone();

	if (pathname.endsWith(".md")) {
		url.pathname = "/md" + pathname.replace(/(\/index)?\.md$/, "");
		return NextResponse.rewrite(url);
	}
	if (wantsMarkdown(req.headers.get("accept") ?? "")) {
		url.pathname = "/md" + (pathname === "/" ? "" : pathname.replace(/\/$/, ""));
		const res = NextResponse.rewrite(url);
		res.headers.set("Vary", "Accept");
		return res;
	}
	const res = NextResponse.next();
	res.headers.set("Link", '</llms.txt>; rel="describedby"; type="text/plain"');
	return res;
}

export const config = {
	matcher: ["/((?!_next/|api/|favicon.ico|llms.txt|llms-full.txt|robots.txt|sitemap.xml).*)"],
};
```

```ts
// app/md/[[...slug]]/route.ts
import { getPageMarkdown } from "@/lib/content"; // your content source

export async function GET(_req: Request, { params }: { params: Promise<{ slug?: string[] }> }) {
	const { slug = [] } = await params;
	const md = await getPageMarkdown("/" + slug.join("/"));
	if (!md) return new Response("Not found", { status: 404 });
	return new Response(md, {
		headers: { "Content-Type": "text/markdown; charset=utf-8", "Vary": "Accept" },
	});
}
```

- Serve `llms.txt` from `app/llms.txt/route.ts` (a folder named `llms.txt` works) returning `text/plain; charset=utf-8`.
- `app/robots.ts` (`MetadataRoute.Robots`) cannot emit `Content-Signal` lines. Use `app/robots.txt/route.ts` that returns the text instead. Do not keep both.
- `params` is a Promise in Next.js 15+. In Next.js 14 it is a plain object.
- **Known limit:** Next.js writes its own `Vary` header on page responses and drops `Accept` from it, whether you add it in the proxy or in `next.config` `headers()` (tested on static and dynamic pages). Markdown responses from the route handler do keep `Vary: Accept`. The proxy runs before Next's own cache, so `next start` and Vercel serve the right variant. If you put another CDN in front (Cloudflare, Fastly, nginx cache), make it vary on `Accept` there or bypass its cache when `Accept` contains `text/markdown`. The audit reports this as a warning.
- With the default `trailingSlash: false`, `/docs/` redirects (308) to `/docs`. Agents should request the slash-less URL; the proxy handles both.

---

## Vercel (static sites and non-Next frameworks): Checked against docs

Do not use `vercel.json` `rewrites` for this. Vercel checks the filesystem before rewrites, so `/` is answered by `index.html` and a rewrite on `/` never runs ([vercel.json docs](https://vercel.com/docs/project-configuration/vercel-json#rewrites): "precedence is given to the filesystem prior to rewrites being applied"). `has` conditions also do not run under `vercel dev`. Use Routing Middleware, which runs before the filesystem and the cache ([Routing Middleware](https://vercel.com/docs/routing-middleware), [API](https://vercel.com/docs/routing-middleware/api)).

`npm i @vercel/functions`, then at the project root:

```ts
// middleware.ts
import { next, rewrite } from "@vercel/functions";

const wantsMarkdown = (a: string) => /text\/markdown/i.test(a) && !/text\/markdown\s*;\s*q=0(\.0+)?(\s*[,;]|$)/i.test(a);

export default function middleware(request: Request) {
	const url = new URL(request.url);

	// /docs/start.md -> /docs/start/index.md (skip real .md files such as /index.md)
	if (url.pathname.endsWith(".md") && !url.pathname.endsWith("/index.md")) {
		return rewrite(new URL(url.pathname.replace(/\.md$/, "/index.md"), request.url));
	}
	if (wantsMarkdown(request.headers.get("accept") ?? "")) {
		const base = url.pathname.endsWith("/") ? url.pathname : url.pathname + "/";
		return rewrite(new URL(base + "index.md", request.url));
	}
	return next({ headers: { Link: '</llms.txt>; rel="describedby"; type="text/plain"' } });
}

export const config = {
	matcher: ["/((?!_vercel|.*\\.(?:css|js|png|jpg|jpeg|gif|svg|webp|ico|woff2?|txt|xml|json)$).*)"],
};
```

```json
{
	"headers": [
		{ "source": "/(.*)", "headers": [{ "key": "Vary", "value": "Accept" }] },
		{ "source": "/(.*)\\.md", "headers": [{ "key": "Content-Type", "value": "text/markdown; charset=utf-8" }] }
	]
}
```

- The `/docs/start.md` rewrite assumes every page has `index.md`. If a page has none, the request 404s, which is correct.
- Without a framework, add `"type": "module"` to `package.json` or name the file `middleware.mjs` (Vercel docs note).
- With Next.js on Vercel, use the Next.js recipe instead; `proxy.ts` is the middleware there.

---

## Netlify: Checked against docs

`_redirects` conditions cannot match the Accept header, so use an Edge Function ([Edge Functions API](https://docs.netlify.com/build/edge-functions/api/), [declarations](https://docs.netlify.com/build/edge-functions/declarations/)). `netlify dev --offline` could not start the local edge runtime in our test, so this was not run.

```js
// netlify/edge-functions/markdown.js
const wantsMarkdown = (a) => /text\/markdown/i.test(a) && !/text\/markdown\s*;\s*q=0(\.0+)?(\s*[,;]|$)/i.test(a);
const LINK = '</llms.txt>; rel="describedby"; type="text/plain"';

async function markdown(url) {
	const res = await fetch(url);
	if (!res.ok) return null;
	return new Response(res.body, {
		headers: { "Content-Type": "text/markdown; charset=utf-8", "Vary": "Accept" },
	});
}

export default async (request, context) => {
	const url = new URL(request.url);

	if (url.pathname.endsWith(".md")) {
		const twin = url.pathname.endsWith("/index.md") ? url : new URL(url.pathname.replace(/\.md$/, "/index.md"), url);
		return (await markdown(twin)) ?? context.next();
	}
	if (url.pathname.endsWith("/") && wantsMarkdown(request.headers.get("accept") || "")) {
		const res = await markdown(new URL(url.pathname + "index.md", url));
		if (res) return res;
	}
	const res = await context.next();
	const out = new Response(res.body, res);
	out.headers.append("Vary", "Accept");
	if ((out.headers.get("content-type") || "").startsWith("text/html")) out.headers.set("Link", LINK);
	return out;
};

export const config = {
	path: "/*",
	excludedPath: ["/*.css", "/*.js", "/*.png", "/*.jpg", "/*.svg", "/*.webp", "/*.woff2", "/*.txt", "/*.xml", "/*.json"],
};
```

- Netlify documents `fetch()` of a same-site URL for "the content of a path other than the requested one", which is what the function does for the twin.
- Content type for `.md` is set in the function, so no `_headers` rule is needed.

---

## Cloudflare Workers with static assets: Tested

Tested locally with `wrangler dev` (Wrangler 4.148.0, the local workerd runtime). Not deployed. **`run_worker_first = true` is required**: without it, Cloudflare serves a matching asset (like `/` → `index.html`) before the Worker runs, and negotiation never happens.

```toml
# wrangler.toml
name = "my-site"
main = "worker.js"
compatibility_date = "2026-09-01"

[assets]
directory = "./public"
binding = "ASSETS"
run_worker_first = true
```

```js
// worker.js
const wantsMarkdown = (a) => /text\/markdown/i.test(a) && !/text\/markdown\s*;\s*q=0(\.0+)?(\s*[,;]|$)/i.test(a);
const LINK = '</llms.txt>; rel="describedby"; type="text/plain", </sitemap.xml>; rel="sitemap"; type="application/xml"';

function markdown(asset) {
	const res = new Response(asset.body, asset);
	res.headers.set("Content-Type", "text/markdown; charset=utf-8");
	res.headers.set("Vary", "Accept");
	return res;
}

export default {
	async fetch(request, env) {
		const url = new URL(request.url);

		// /docs/start.md -> /docs/start/index.md when no file named start.md exists.
		if (url.pathname.endsWith(".md")) {
			const direct = await env.ASSETS.fetch(request);
			if (direct.ok) return markdown(direct);
			const twin = await env.ASSETS.fetch(new Request(new URL(url.pathname.replace(/\.md$/, "/index.md"), url), request));
			return twin.ok ? markdown(twin) : direct;
		}

		// Accept: text/markdown on a folder URL -> its index.md, unless q=0.
		if (url.pathname.endsWith("/") && wantsMarkdown(request.headers.get("accept") || "")) {
			const twin = await env.ASSETS.fetch(new Request(new URL(url.pathname + "index.md", url), request));
			if (twin.ok) return markdown(twin);
		}

		const asset = await env.ASSETS.fetch(request);
		const res = new Response(asset.body, asset);
		res.headers.append("Vary", "Accept");
		if ((res.headers.get("Content-Type") || "").startsWith("text/html")) res.headers.set("Link", LINK);
		return res;
	},
};
```

If the site is behind Cloudflare, check the dashboard for managed robots.txt and AI crawler controls. They can add or override rules you wrote yourself.
