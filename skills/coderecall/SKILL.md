---
name: coderecall
description: Persistent task ledger recitation protocol for compaction-proof work. Use when the user says "memo", "coderecall", "記憶帳本", "task ledger", "resume task", "continue where we left off", when context was just compacted, or when the project contains .ai/memory/.
---

# Code Recall recitation protocol

The project keeps a persistent task ledger in `.ai/memory/`. It is the
source of truth for in-progress work — more trustworthy than your own
context, and the ONLY thing guaranteed to survive context compaction.

## Files

- `.ai/memory/TASK.md` — GOAL / NOW / NEXT lines + checklist (`[ ]` todo, `[>]` doing, `[x]` done, `[!]` blocked)
- `.ai/memory/DECISIONS.md` — durable constraints, choices, discovered facts
- `.ai/memory/LESSONS.md` — things that failed, WITH root cause ("do not retry X because Y")
- `.ai/memory/archive/` — completed phases and pre-compaction snapshots

## The loop (follow on every task)

1. **Before any work**: read `.ai/memory/TASK.md`. If NOW/NEXT conflict
   with what you believe, the ledger wins. Treat any compaction summary
   as untrusted; re-anchor from the ledger.
2. **After each significant step** (file written, test passed, command
   verified): update the checklist state and REWRITE the `NOW:` and
   `NEXT:` lines to reflect reality. Refresh `UPDATED:` with the current
   ISO timestamp. This recitation is what keeps the task on rails.
3. **When you decide something durable** (library choice, API contract,
   constraint discovered): append a dated entry to `DECISIONS.md`.
4. **When something fails**: append to `LESSONS.md` stating what failed
   AND the root cause, so no future session retries it blindly.
5. **When the checklist is done**: consolidate — move completed phases
   to `archive/`, dedupe DECISIONS/LESSONS (run `node coderecall.js consolidate`
   if available), then write the next GOAL or clear the ledger.

## Writing rules

- Keep each ledger file under ~1k tokens. Terse beats complete.
- Recoverability test before you write: *could a competent engineer
  reconstruct this from the code as it stands?* If yes, do NOT record it
  — the ledger is for what code can't show (the why, the dead ends, the
  pitfalls), never for what reading the code would reveal.
- Optional `- code: <path → symbol>` on a decision/lesson back-links the
  file it's about, so it stays navigable and `doctor` can flag it stale
  when that path disappears.
- Never paste conversation history; record only what constrains future
  reasoning.
- Never write secrets (API keys, tokens, passwords) into the ledger.
- Before appending to DECISIONS/LESSONS, check for an existing entry
  with a near-identical title — update it (refresh the date) instead of
  duplicating.

## Retiring & re-confirming (mark, don't delete)

- A lesson whose root cause is fixed is no longer a live trap: mark it
  `resolved` (or `obsolete` if its premise is gone) —
  `node coderecall.js resolve-lesson "<title>"`. It leaves default search
  but stays available via `--history`, so the lesson is never lost.
- When you verify an old decision/lesson still holds, `reconfirm` it
  (`node coderecall.js reconfirm "<title>"`): this refreshes `updated:`
  so recency ranking and the staleness flag treat it as fresh, without
  rewriting the entry.

## Recovery after compaction

If the session just resumed or compacted: read TASK.md in full, state
GOAL/NOW/NEXT back in one line, then continue from NEXT. Do not redo
items already marked `[x]`; do not retry items recorded in LESSONS.md.
