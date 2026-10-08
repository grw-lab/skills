---
name: shared-server-deploy
description: Safely changes one site on a shared Linux web server (cPanel, CWP, Plesk, DirectAdmin, or plain Apache/Nginx) that also hosts other sites. Use when asked to deploy, edit a vhost, change .htaccess, fix permissions, add PHP, or reload the web server on a box with neighbours, or when the user says "be careful, this server has other sites". Covers read-only discovery, backups, scoped edits, config tests, graceful reloads, and checking every neighbour still answers.
---

# Shared server deploy

A shared server is someone's production for many sites at once. One bad reload, one wrong `chown -R`, or one parent `.htaccess` rule can take all of them down. This skill makes every change small, reversible, and verified.

## When to use

- Deploying files or config for one site on a server that hosts others.
- Editing a virtual host, `.htaccess`, PHP handler, or permissions.
- Any task where the user names a scope ("only touch example.com").

## When not to use

- Containers or platforms where each app is isolated (Vercel, Fly, Kubernetes). Use their deploy flow.
- Servers you own alone and can rebuild from scratch. The rules still help, but the neighbour checks do not apply.

## The five rules

1. **Look before you touch.** Discover read-only first. Never write during discovery.
2. **Back up what you will change**, to a timestamped folder outside the web root, before the first write.
3. **Stay inside the scope.** Only files of the named site. Never edit global config, other vhosts, or shared panels unless the user says so for that file.
4. **Test, then reload gracefully.** `apachectl -t` / `nginx -t` must pass. Use graceful reload, never a hard restart.
5. **Prove nothing else broke.** Record each neighbour's HTTP status before the change and compare after.

## Workflow

### 1. Discover (read-only)

Run the discovery script, or the same commands by hand:

```bash
bash scripts/discover.sh example.com
```

It reports the OS, the control panel, the web server and version, listening ports, PHP handlers, process managers (pm2, systemd units), the vhost files that mention the domain, the document root, its owner, and the `.htaccess` chain from `/` down to the docroot. Read `references/panels.md` for where each panel keeps vhosts and what it regenerates.

Answer these before any write:

- Which user owns the docroot? PHP and file writes must run as that user.
- Is the docroot **nested inside another site's docroot**? Then the parent's `.htaccess` applies to this site too. See `references/htaccess-inheritance.md`.
- How does PHP run (mod_php, PHP-FPM pool, suPHP, LSAPI)? Which user does it run as?
- Will the control panel regenerate the vhost and wipe a manual edit? Prefer the panel's include or "custom config" hook if it has one.
- Which other sites live here? List them for the neighbour check.

### 2. Baseline the neighbours

```bash
bash scripts/neighbours.sh before example.com other1.com other2.com
```

Saves each site's status code and a body hash to `/tmp/neighbours-before.txt`.

### 3. Back up

```bash
TS=$(date -u +%Y%m%dT%H%M%SZ)
mkdir -p /root/deploy-backups/example.com/$TS
cp -a /path/to/vhosts/example.com*.conf /root/deploy-backups/example.com/$TS/
cp -a /home/user/public_html/example.com /root/deploy-backups/example.com/$TS/docroot
```

Tell the user the backup path.

### 4. Change, scoped

- Edit only the named site's files. Use exact, minimal edits. Show the diff.
- Uploading with rsync as root: add `--no-owner --no-group`, or the remote files take your local UID. Then `chown` to the site user, including the docroot directory itself.
- Never `chown -R` or `chmod -R` above the docroot. Never on `/home/user` as a whole.
- Leave `.well-known/acme-challenge/` alone; certificate renewal depends on it.
- Run builds and CLI tools as the site user: `runuser -u siteuser -- php build.php` (or `sudo -u`).

### 5. Test and reload

```bash
apachectl -t        # or: nginx -t ; httpd -t ; /usr/local/apache/bin/apachectl -t
apachectl -k graceful   # or: systemctl reload nginx
```

If the test fails, do not reload. Restore from the backup and stop.

`.htaccess` changes need no reload but are not checked by `-t`. Test them with real requests right away (step 6), and keep the previous file to restore.

### 6. Verify

```bash
bash scripts/neighbours.sh after example.com other1.com other2.com
```

It diffs against the baseline and exits non-zero if any site changed status. Then check the target itself: the pages, assets, redirects, and headers you meant to change. Read the site's error log for new entries.

### 7. Report

Say what changed, where the backup is, how to roll back (one command), and the before/after neighbour table.

## Rollback

```bash
cp -a /root/deploy-backups/example.com/$TS/*.conf /path/to/vhosts/
apachectl -t && apachectl -k graceful
```

For a docroot: `rsync -a --delete /root/deploy-backups/example.com/$TS/docroot/ /home/user/public_html/example.com/`, then `chown` back to the site user.

## Traps that cause outages

| Trap | What happens | Avoid it |
|---|---|---|
| Nested docroot | Parent WordPress rewrite sends every URL to `/index.php` of the parent | Turn on `RewriteEngine On` in the child `.htaccess`; child rules then replace the parent's. Parent `Header` and `<FilesMatch>` still apply. |
| rsync as root | Docroot owned by UID 501, PHP can no longer write | `--no-owner --no-group`, then `chown user:user .` |
| suPHP / suEXEC | 500 error if a PHP file is group- or world-writable, or owned by another user | Files 644, dirs 755, owned by the site user |
| No PHP user in vhost | PHP runs as `nobody` or fails with 500 | Copy the user mapping block from a working vhost of the same user |
| Panel regenerates vhosts | Manual edit lost on next panel action | Use the panel's include folder; keep a copy of your edit in the repo |
| `systemctl restart` | Drops every live connection on every site | `graceful` / `reload` |
| `Header set` in child vs parent `<FilesMatch>` | Parent header still sent | Unset inside a child `<FilesMatch>`; Files sections merge after directory sections |
| Deleting "unused" files | Another site or a cron job used them | Only delete what you created; log it |

## Done checklist

- [ ] Discovery done and scope confirmed with the user.
- [ ] Backup path reported.
- [ ] Config test passed before reload.
- [ ] Graceful reload only.
- [ ] Neighbour check: no status changes.
- [ ] Target verified with real requests and the error log.
- [ ] Rollback command given.
