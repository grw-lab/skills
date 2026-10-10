## What it does

Shared Server Deploy teaches your agent to change one site on a server that hosts many, without breaking the others. It discovers the setup read-only, backs up what it will touch, keeps every edit inside the site you named, tests the config before a graceful reload, and then checks that every neighbouring site still answers the way it did before.

It comes from a real deploy on a CWP server running a dozen client sites, Node apps, mail, and a control panel. Every trap in it is one we hit or nearly hit.

## When to use it

- You ask an agent to deploy, add PHP, edit a vhost or `.htaccess`, or fix permissions on a server that also runs other sites.
- The server uses cPanel, CWP, Plesk, DirectAdmin, or plain Apache or Nginx.
- You want a record of what changed and a one-line rollback.

It is not for containers or platforms like Vercel, where each app is already isolated.

## Install

This installs **shared-server-deploy** only. The other skills stay out.

1. Open Claude Code.
2. Paste line 1 and press Enter. This adds the catalog. Do it once, then skip it next time.
3. Paste line 2 and press Enter. This installs this skill.

```text
/plugin marketplace add grw-lab/skills
/plugin install shared-server-deploy@grw-lab
```

Claude confirms the install in the chat. The next message can use the skill.

Every skill instead: keep line 1, and use this as line 2:

```text
/plugin install grw-skills@grw-lab
```

On claude.ai, zip the `shared-server-deploy` folder and upload it in Settings → Capabilities → Skills.

In Cursor or another agent, point it at `shared-server-deploy/SKILL.md`.

## Usage

- "Deploy this folder to tools.example.com. The server has other sites, only touch that one."
- "PHP returns 500 on my subdomain. Find out why without changing anything yet."
- "Add a security header to example.com's vhost and make sure nothing else breaks."
- "Before you reload Apache, show me which sites live on this box."

## Example

You ask: *"Enable PHP for tools.example.com. Be careful, this server has other client sites."*

The agent runs discovery and finds the docroot is nested inside the main site's WordPress folder, PHP runs through suPHP, and the subdomain's vhost has no user mapping. It then:

1. Records the status of all sites on the box (all 200).
2. Backs up the two vhost files to `/root/deploy-backups/tools.example.com/20261008T101320Z/`.
3. Adds only the user mapping block, copied from the main site's vhost.
4. Runs `apachectl -t` (Syntax OK) and a graceful reload.
5. Re-checks every site: all still 200. PHP on the subdomain now runs as the site user.
6. Reports the change, the backup path, and the rollback command.

## What's inside

| File | Purpose |
|---|---|
| `SKILL.md` | The five rules, the step-by-step workflow, rollback, and a table of traps that cause outages. |
| `scripts/discover.sh` | Read-only report: OS, panel, web server, ports, PHP handler, vhost files, docroot owner, `.htaccess` chain, other domains. |
| `scripts/neighbours.sh` | Saves every site's HTTP status before a change and compares after. Exits 1 if anything changed. |
| `references/panels.md` | Where CWP, cPanel, Plesk, DirectAdmin, and plain Apache or Nginx keep vhosts, logs, and safe custom config. |
| `references/htaccess-inheritance.md` | How a parent `.htaccess` leaks into a nested docroot, and how to stop it. |

## FAQ

**Does it need root?**
Discovery mostly works without root. Editing vhosts and reloading Apache needs root or sudo. The skill runs site builds as the site user, not root.

**Will the control panel overwrite the change?**
Sometimes. The skill checks which panel you run and prefers its include folder or custom-config hook. `references/panels.md` lists them.

**Does it restart the web server?**
No. It only uses a graceful reload, after the config test passes. A restart drops live connections on every site.

**What if a neighbour breaks anyway?**
`neighbours.sh after` exits with an error and the agent stops, shows the table, and offers the rollback command from the backup it made first.
