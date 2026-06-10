---
name: memo-star
description: Persistent task ledger recitation protocol for compaction-proof work. Use when the user says "memo", "memo-star", "記憶帳本", "task ledger", "resume task", "continue where we left off", when context was just compacted, or when the project contains .ai/memory/.
---

# Memo-star recitation protocol

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
   to `archive/`, dedupe DECISIONS/LESSONS (run `node memo.js consolidate`
   if available), then write the next GOAL or clear the ledger.

## Writing rules

- Keep each ledger file under ~1k tokens. Terse beats complete.
- Never paste conversation history; record only what constrains future
  reasoning.
- Never write secrets (API keys, tokens, passwords) into the ledger.
- Before appending to DECISIONS/LESSONS, check for an existing entry
  with a near-identical title — update it (refresh the date) instead of
  duplicating.

## Recovery after compaction

If the session just resumed or compacted: read TASK.md in full, state
GOAL/NOW/NEXT back in one line, then continue from NEXT. Do not redo
items already marked `[x]`; do not retry items recorded in LESSONS.md.
