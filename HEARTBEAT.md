# HEARTBEAT.md — Korben's periodic checks

## Quick checks (rotate through these)
- [ ] Is api.pura.xyz responding? `curl -s https://api.pura.xyz/api/health`
- [ ] Any new GitHub issues on puraxyz/puraxyz? `gh issue list -R puraxyz/puraxyz --limit 5`
- [ ] Check git status of workspace and puraxyz repo

## Don't do these here (handled by cron)
- Full healthcheck (every 4h autonomous loop)
- Morning briefing (8am daily)
