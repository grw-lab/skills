# Where panels keep things

Read this during discovery to find vhosts, logs, and PHP settings. Paths are the common defaults; confirm on the server with `ls` before trusting them.

| Panel | Vhost files | Logs | Safe place for custom config | Regenerates vhosts? |
|---|---|---|---|---|
| CWP (Control Web Panel) | `/usr/local/apache/conf.d/vhosts/<domain>.conf` and `.ssl.conf` | `/usr/local/apache/domlogs/<domain>.log`, `.error.log` | Panel's "Apache vhost templates"; manual edits survive until the domain is rebuilt in the panel | Yes, on domain rebuild or template change |
| cPanel / WHM | Generated into `/etc/apache2/conf/httpd.conf` (EA4) | `/var/log/apache2/domlogs/` (EA4) | `/etc/apache2/conf.d/userdata/{ssl,std}/2_4/<user>/<domain>/*.conf`, then `/scripts/rebuildhttpdconf` | Yes, never edit `httpd.conf` directly |
| Plesk | `/var/www/vhosts/system/<domain>/conf/` | `/var/www/vhosts/system/<domain>/logs/` | Domain → Apache & nginx Settings (additional directives), or `vhost.conf` / `vhost_ssl.conf` in that conf folder | Yes |
| DirectAdmin | `/usr/local/directadmin/data/users/<user>/httpd.conf` | `/var/log/httpd/domains/` | Domain → Custom HTTPD configuration | Yes |
| Plain Apache (RHEL/Alma) | `/etc/httpd/conf.d/*.conf` | `/var/log/httpd/` | Same files | No |
| Plain Apache (Debian/Ubuntu) | `/etc/apache2/sites-available/` + `a2ensite` | `/var/log/apache2/` | Same files | No |
| Plain Nginx | `/etc/nginx/conf.d/`, `/etc/nginx/sites-available/` | `/var/log/nginx/` | Same files | No |

## Finding the vhost for a domain

```bash
grep -rl "ServerName example.com\|ServerAlias.*example.com" /etc/httpd /etc/apache2 /usr/local/apache/conf* 2>/dev/null
grep -rl "server_name.*example.com" /etc/nginx 2>/dev/null
```

## How PHP runs

```bash
apachectl -M 2>/dev/null | grep -iE 'php|fcgi|suphp|suexec|ruid|lsapi'
ps -eo user,cmd | grep -E 'php-fpm: pool' | sort | uniq -c
```

- **suPHP / suEXEC / ruid2:** the vhost needs a user mapping (`suPHP_UserGroup`, `SuexecUserGroup`, `RUidGid`). Copy it from another vhost of the same user.
- **PHP-FPM:** the vhost proxies to a socket (`SetHandler "proxy:unix:/path.sock|fcgi://localhost"`); the pool file sets the user.
- **mod_php:** PHP runs as the Apache user; file writes need group permissions.

Test which user PHP runs as with a throwaway file, then delete it:

```bash
echo '<?php echo get_current_user(), " ", posix_geteuid();' > /docroot/__probe.php
curl -s https://example.com/__probe.php; rm -f /docroot/__probe.php
```
