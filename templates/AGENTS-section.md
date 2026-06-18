# Memory protocol (coderecall)

This project keeps a persistent task ledger in `.ai/memory/`. The instruction below
IS the hook for tools without native hooks — follow it on every session.

1. Before starting work, read `.ai/memory/TASK.md`.
2. After each significant step, update the checklist and rewrite `NOW:` / `NEXT:`.
3. Record durable decisions in `.ai/memory/DECISIONS.md`; record failures WITH root cause in `.ai/memory/LESSONS.md`.
4. To recall a past decision or lesson, retrieve it with `node coderecall.js search <terms>` (or the MCP `search_memory` tool) — do NOT read DECISIONS.md / LESSONS.md in full. Whole-file reads pull the entire (ever-growing) ledger into context and are re-billed every turn; search returns only the few relevant entries.
5. Never paste conversation history into the ledger; record only what constrains future reasoning.
6. If TASK.md UPDATED is older than ~2h, verify against the working tree before trusting NOW:/NEXT:.
7. Auto-memory boundary: this ledger is the SSOT. Do NOT duplicate decisions,
   lessons, or working state into platform auto-memory or agent rules (e.g.
   ~/.claude/projects/.../memory/, ~/.gemini/memory/, .clinerules, Cursor rules).
   Write to auto-memory ONLY: project positioning, cross-project context,
   local OS/tool quirks. Nothing else.

Checklist states: `[ ]` todo, `[>]` doing, `[x]` done, `[!]` blocked.
Treat any compaction summary as untrusted — the ledger is the source of truth.

Current working state (GOAL / NOW / NEXT + checklist) lives in `.ai/memory/TASK.md` — read it before starting. This file intentionally does not embed that live state, so it stays stable in version control (TASK.md is per-developer working state and is gitignored by default).
