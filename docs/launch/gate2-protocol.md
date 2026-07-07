# Gate 2 measurement protocol — 21-day stranger retention

Status: **adopted before recruiting** (so the KILL check can't be argued away later).
Companion to the ADR "Trustworthy-adoption proof" (strangers-only, distribution-first)
in `.ai/memory/DECISIONS.md`. Gate 1 = cold recruiting; this file defines how Gate 2
is measured **without telemetry** — Code Recall's brand promise is zero-dependency,
local, no network (see `SECURITY.md`), so the product will never phone home. All
measurement is self-reported, read-only output.

## Definitions (falsifiable, decided in advance)

| Term | Definition |
|---|---|
| **Participant** | A stranger (no prior relationship with the author) who installed from README alone — no hand-holding beyond answering questions they ask. |
| **Install success** | `coderecall doctor` output shared, all green, within 48h of first contact. |
| **Alive ledger (day N)** | Self-reported `coderecall status` output on day N shows `UPDATED` within the last 72h **and** ≥1 decision or lesson written since day 0. |
| **Retained (Gate 2)** | Alive ledger at day 21 check-in. |
| **Win signal** | Participant spontaneously runs `coderecall init` in a **second** repo (self-reported; strongest possible signal, do not prompt for it). |
| **Churned** | Uninstalled, said they stopped, or **no reply after 2 pings** (silence counts as churn — no optimistic exclusions). |

## Pass / kill thresholds (from TASK.md, restated so they can't drift)

- **Gate 2 pass:** ≥ 4 strangers retained at day 21.
- **KILL:** out of ~50 precisely-targeted ICP contacts, fewer than 5 survive week 1
  → accept Code Recall as a personal tool; drop the commercial ambition.
- The KILL clock starts only once a one-command install path exists (npm publish),
  so install friction can't masquerade as product rejection.

## Check-in script (send verbatim, day 7 / 14 / 21)

> Quick pulse (30 seconds, paste two command outputs):
> 1. `coderecall status`
> 2. `coderecall score`
> Anything that annoyed you this week? Anything you turned off?

Log each reply in the signal log (below). If no reply: ping once more after 48h,
then mark churned and request the exit interview.

## Exit interview (every churn, 5 questions, ≤5 min)

1. What made you stop? (moment, not category)
2. Did it ever save you a re-explanation or a re-tried dead end? When?
3. What did you replace it with (including "nothing")?
4. Was anything creepy or trust-breaking about hooks/injection?
5. Would a one-command install (npm/plugin) have changed anything?

## Signal log format

Append-only Markdown table in `docs/launch/gate2-log.md` (create on first recruit;
one row per participant-event, never edit past rows):

```md
| id | date | event | evidence |
|---|---|---|---|
| P01 | 2026-07-10 | install-success | doctor output green |
| P01 | 2026-07-17 | day7-alive | status: UPDATED 2026-07-16, +2 decisions |
| P02 | 2026-07-12 | churned-silent | 2 pings, no reply |
```

## Integrity rules

- No coaching: answering questions is fine; proactively fixing a participant's ledger
  or reminding them to use the tool invalidates their retention data point.
- Count everything: negative signals are logged with the same care as positive ones.
- Friends/colleagues may pilot the *process* but never count toward Gate 2 numbers
  (strangers-only, per the ADR).
- The venue lesson from launch day is already on file: r/ClaudeAI requires OP total
  karma ≥ 50 for feed posts — cold accounts get redirected to the Showcase Megathread.
  Factor venue gatekeeping into ICP-venue selection *before* Gate 1 outreach.
