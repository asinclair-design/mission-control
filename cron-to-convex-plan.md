# Mission Control — Wire OpenClaw Cron Outputs → Convex (Plan)

## Goal
Stream cron run results (summary text, timestamps, status) into Mission Control (Convex) so the dashboard shows live automation history.

## Current state
- Mission Control built on Next.js + Convex.
- OpenClaw cron outputs currently land in this chat / memory files.

## Proposed approach (MVP)
1) Create a small helper script that runs after each cron:
- Inputs: cron id/name, start/end timestamps, status, summary text
- Action: POST to Convex HTTP endpoint `/api/event` (already exists) or create `/api/cronRun`

2) Convex schema additions
- `cronRuns` table:
  - cronId, cronName
  - ranAt, durationMs
  - status (success/fail)
  - summary (string)
  - raw (optional)

3) Dashboard UI
- Cron Jobs tab: list latest 50 runs, filter by cronId
- Link to related ClickUp tasks (optional)

## Next steps
- Confirm Convex endpoint contract (payload shape)
- Add minimal auth (shared secret)
- Update OpenClaw cron runner to call the helper script
