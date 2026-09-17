---
name: coderecall
description: Persistent task ledger for compaction-proof work. Use when starting or resuming work in a project that has .ai/memory/, after context compaction, when a task reaches a checkpoint, when a durable decision is made, or when a failure's root cause has been verified. Also on "memo", "coderecall", "記憶帳本", "task ledger", "resume task", "continue where we left off". Only for projects that already have a ledger; do not create one implicitly.
---

# Code Recall — working with the ledger

The project keeps a persistent task ledger in `.ai/memory/`. It survives context
compaction, so it is the best starting point for resuming work — but it is
evidence, not an oracle: it can be stale, and the user's latest instruction or a
fact you just verified in the working tree beats it. When they conflict, follow
the newer evidence and then correct the ledger.

## Files

- `.ai/memory/TASK.md` — GOAL / NOW / NEXT lines + checklist (`[ ]` todo, `[>]` doing, `[x]` done, `[!]` blocked)
- `.ai/memory/DECISIONS.md` — durable constraints, choices, discovered facts
- `.ai/memory/LESSONS.md` — things that failed, WITH a verified root cause ("do not retry X because Y")
- `.ai/memory/archive/` — retired entries, completed phases, pre-compaction snapshots

## When to read

- Starting or resuming work in this project: read `TASK.md` first.
- Just compacted / resumed: read `TASK.md` in full, state GOAL/NOW/NEXT back in one
  line, continue from NEXT. Do not redo `[x]` items; do not retry what LESSONS.md
  warns about.
- About to reopen a design choice or retry an approach that failed before:
  `coderecall search <terms>` (or MCP `search_memory`) — never read
  DECISIONS.md/LESSONS.md whole; that re-bills the entire ledger every turn. A hit
  carries the reasoning, not just the title; add `--full` (MCP: `detail:"full"`)
  to read the whole entry.

## When to write

Write at **state changes**, not on a timer and not after every file you touch:

- A sub-goal completed, a blocker appeared or cleared, the next action changed, or
  you are about to hand off → rewrite `NOW:` / `NEXT:`, update the checklist,
  refresh `UPDATED:` (CLI: edit the file; MCP: `update_task`). If the state has not
  changed, write nothing.
- A durable choice that constrains future work → `coderecall decision "<title>"
  --context .. --decision .. --consequences ..` (MCP: `write_decision`).
- A failure whose root cause you actually verified → `write_lesson` / append to
  LESSONS.md: when it applies, what failed, the evidence for the cause, what to do
  instead. An unverified hypothesis stays in TASK.md; do not freeze a guess as a
  lesson.

Prefer the CLI/MCP tools over hand-editing: they write the required `- date:` /
`- confidence:` metadata that `coderecall doctor` lints for.

## Writing rules

- Keep each ledger file small. Terse beats complete.
- Recoverability test before you write: *could a competent engineer reconstruct this
  from the code as it stands?* If yes, do NOT record it — the ledger is for what code
  can't show (the why, the dead ends, the pitfalls).
- Optional `- code: <path → symbol>` back-links the file an entry is about, so
  `doctor` can flag it when that path disappears and `coderecall affected` can
  surface it when you touch that file.
- Optional `- aliases: <synonyms / old names>` makes an entry findable by words that
  are not in its title or body (search is lexical, not semantic).
- Never paste conversation history. Never write secrets.
- One agent per working directory owns `TASK.md` — a convention, not a lock. If you
  are a delegated/sub agent, report your result back instead of rewriting NOW/NEXT.

## Superseding and retiring (nothing is deleted)

- Recording a decision does **not** retire anything automatically. If a new decision
  replaces an old one, say so: `--supersedes "<old title substring>"` (MCP:
  `supersedes`). The substring must match exactly one active entry; the old entry is
  kept, marked `superseded`, and stays searchable with `--history`.
- If a near-identical title is flagged but the two really are different decisions,
  pass `--confirm-new` (MCP: `confirmNew`) or revise the title. Both stay live until
  someone says which supersedes which.
- A lesson whose root cause is fixed: `coderecall resolve-lesson "<title>"`
  (`--status obsolete` if the situation it warned about is gone). It leaves default
  search, stays in `--history`.
- An old entry you verified still holds: `coderecall reconfirm "<title>"` — refreshes
  `updated:` so recency ranking and the re-check flag treat it as fresh, without
  rewriting it.
- `coderecall consolidate` archives completed checklist items and retires
  superseded/expired entries into `archive/`. It never merges or drops entries on its
  own: near-duplicate titles are reported for a human or agent to resolve.
