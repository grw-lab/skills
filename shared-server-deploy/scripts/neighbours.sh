#!/usr/bin/env bash
# Record and compare the HTTP status of every site on the box, before and after a change.
# Usage:
#   bash neighbours.sh before site1.com site2.com ...
#   bash neighbours.sh after  site1.com site2.com ...
# "after" compares with the last "before" run and exits 1 if any status changed.
set -u
MODE="${1:-}"
shift || true
if [ "$MODE" != "before" ] && [ "$MODE" != "after" ] || [ $# -eq 0 ]; then
	echo "Usage: bash neighbours.sh before|after <domain> [domain...]" >&2
	exit 2
fi

DIR="${NEIGHBOURS_DIR:-/tmp}"
OUT="$DIR/neighbours-$MODE.txt"
: > "$OUT"

for host in "$@"; do
	code=$(curl -s -o /dev/null -m 15 -w '%{http_code}' "https://$host/" || echo 000)
	printf '%s %s\n' "$host" "$code" >> "$OUT"
done

if [ "$MODE" = "before" ]; then
	echo "Baseline saved to $OUT"
	column -t "$OUT" 2>/dev/null || cat "$OUT"
	exit 0
fi

BEFORE="$DIR/neighbours-before.txt"
if [ ! -f "$BEFORE" ]; then
	echo "No baseline at $BEFORE. Run 'before' first." >&2
	exit 2
fi

changed=0
printf '%-40s %-7s %-7s %s\n' SITE BEFORE AFTER RESULT
while read -r host code; do
	old=$(awk -v h="$host" '$1 == h {print $2}' "$BEFORE")
	old="${old:----}"
	if [ "$old" = "$code" ]; then
		result="same"
	else
		result="CHANGED"
		changed=1
	fi
	printf '%-40s %-7s %-7s %s\n' "$host" "$old" "$code" "$result"
done < "$OUT"

if [ $changed -eq 1 ]; then
	echo
	echo "At least one site changed status. Investigate or roll back."
	exit 1
fi
echo
echo "All sites answer as before."
