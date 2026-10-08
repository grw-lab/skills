#!/usr/bin/env bash
# Read-only discovery for one domain on a shared server. Writes nothing.
# Usage: bash discover.sh example.com
set -u
DOMAIN="${1:-}"
if [ -z "$DOMAIN" ]; then
	echo "Usage: bash discover.sh <domain>" >&2
	exit 2
fi

section() { printf '\n== %s\n' "$1"; }

section "System"
grep -E '^(NAME|VERSION)=' /etc/os-release 2>/dev/null
uname -r
df -h / | tail -1
free -h 2>/dev/null | sed -n 2p

section "Control panel"
found=0
[ -d /usr/local/cwpsrv ] && echo "CWP (Control Web Panel)" && found=1
[ -d /usr/local/cpanel ] && echo "cPanel/WHM" && found=1
[ -d /usr/local/psa ] && echo "Plesk" && found=1
[ -d /usr/local/directadmin ] && echo "DirectAdmin" && found=1
[ $found -eq 0 ] && echo "none detected"

section "Web servers"
for bin in /usr/local/apache/bin/httpd httpd apache2 nginx; do
	if command -v "$bin" >/dev/null 2>&1 || [ -x "$bin" ]; then
		"$bin" -v 2>&1 | head -1
	fi
done

section "Listening TCP ports"
ss -ltnp 2>/dev/null | awk 'NR>1 {print $4, $6}' | sed 's/users:((//; s/,pid=.*//' | sort -u

section "Process managers"
command -v pm2 >/dev/null 2>&1 && pm2 jlist 2>/dev/null | grep -o '"name":"[^"]*"' | sort -u | sed 's/"name"://; s/"//g' | sed 's/^/pm2: /'
command -v docker >/dev/null 2>&1 && docker ps --format 'docker: {{.Names}} ({{.Image}})' 2>/dev/null

section "PHP"
command -v php >/dev/null 2>&1 && php -v | head -1
for bin in /usr/local/apache/bin/httpd httpd apache2; do
	if command -v "$bin" >/dev/null 2>&1 || [ -x "$bin" ]; then
		"$bin" -M 2>/dev/null | grep -iE 'php|fcgi|suphp|suexec|ruid|lsapi' | sed 's/^ */module: /'
		break
	fi
done
ps -eo user,cmd 2>/dev/null | grep -E 'php-fpm: pool' | grep -v grep | awk '{print "fpm pool:", $NF, "as", $1}' | sort | uniq -c

section "Vhost files mentioning $DOMAIN"
VHOSTS=$(grep -rlE "(ServerName|ServerAlias|server_name)[^#]*\\b${DOMAIN//./\\.}\\b" \
	/etc/httpd /etc/apache2 /etc/nginx /usr/local/apache/conf /usr/local/apache/conf.d \
	/var/www/vhosts/system/"$DOMAIN"/conf 2>/dev/null | grep -vE '\.(bak|broken|old)' )
if [ -z "$VHOSTS" ]; then
	echo "none found"
else
	echo "$VHOSTS"
fi

section "Document root"
DOCROOT=$(echo "$VHOSTS" | head -1 | xargs -r grep -hE '^\s*(DocumentRoot|root)\s' 2>/dev/null | head -1 | awk '{print $2}' | tr -d '";')
if [ -n "${DOCROOT:-}" ] && [ -d "$DOCROOT" ]; then
	echo "$DOCROOT"
	stat -c 'owner %U:%G  mode %a' "$DOCROOT"
	echo "PHP user mapping in vhost:"
	echo "$VHOSTS" | xargs -r grep -hE 'suPHP_UserGroup|SuexecUserGroup|RUidGid|AssignUserID|proxy:unix' 2>/dev/null | sed 's/^\s*/  /' | sort -u
	[ -z "$(echo "$VHOSTS" | xargs -r grep -lE 'suPHP_UserGroup|SuexecUserGroup|RUidGid|AssignUserID|proxy:unix' 2>/dev/null)" ] && echo "  none (PHP may run as the default user or fail)"

	section ".htaccess chain (parents apply to this site)"
	dir="$DOCROOT"
	chain=()
	while [ "$dir" != "/" ]; do
		[ -f "$dir/.htaccess" ] && chain=("$dir/.htaccess" "${chain[@]}")
		dir=$(dirname "$dir")
	done
	if [ ${#chain[@]} -eq 0 ]; then
		echo "none"
	else
		for f in "${chain[@]}"; do
			rewrites=$(grep -cE '^\s*Rewrite(Rule|Engine)' "$f")
			echo "$f  ($rewrites rewrite lines)"
		done
		[ ${#chain[@]} -gt 1 ] && echo "NOTE: nested docroot. Parent .htaccess rules apply here. See references/htaccess-inheritance.md"
	fi
else
	echo "could not resolve from vhost"
fi

section "Other domains on this server"
grep -rhoE '^\s*(ServerName|server_name)\s+[^ ;]+' /etc/httpd /etc/apache2 /etc/nginx /usr/local/apache/conf.d 2>/dev/null \
	| awk '{print $2}' | tr -d ';' | grep -vE '^(localhost|_|\*)$' | sort -u | head -100

echo
echo "Discovery done. Nothing was changed."
