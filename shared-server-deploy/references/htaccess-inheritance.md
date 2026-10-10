# .htaccess inheritance on nested docroots

Read this when a site's document root is a subfolder of another site's document root, for example:

```
/home/user/public_html/              ← example.com (WordPress)
/home/user/public_html/tools.example.com/   ← tools.example.com
```

Apache reads every `.htaccess` from the filesystem root down to the requested file's folder, even across vhosts. So `tools.example.com` gets `example.com`'s `.htaccess` first.

## What merges and what doesn't

| Directive family | Behaviour in a child `.htaccess` |
|---|---|
| `mod_rewrite` rules | If the child has **any** `RewriteEngine`/`RewriteRule`, the parent's rules are **not** run for requests in the child (unless the child sets `RewriteOptions Inherit`). If the child has none, the parent's rules run, with paths relative to the parent folder. |
| `Header` (directory level) | Parent first, then child. A child `Header unset X` removes a header the parent set at directory level. |
| `<Files>` / `<FilesMatch>` | Applied after all directory-level directives, parent sections first, then child sections. A parent `<FilesMatch>` that sets a header wins over a child's plain `Header unset`. Unset it inside a child `<FilesMatch>` instead. |
| `ExpiresByType`, `AddType`, `SetOutputFilter` | Inherited unless the child overrides the same key. |
| `Options`, `DirectoryIndex`, `ErrorDocument` | Child overrides. |

## The WordPress catch-all

A parent WordPress block:

```apache
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.php [L]
```

Without its own rewrite rules, the child site sends every missing URL to the parent's `index.php`, so the child's 404s show the parent's WordPress. Fix by adding to the child:

```apache
RewriteEngine On
ErrorDocument 404 /404.html
```

## Check it

```bash
curl -sI https://child.example.com/does-not-exist
curl -sI https://child.example.com/
```

Read the status line and the `X-Powered-By`, `Link`, and `Cache-Control` headers in that output.

If you see parent headers (for example `X-Powered-By: WP Rocket`) or a parent page, the parent is still leaking in.
