# TASK
GOAL: Ship Memo-star v2.0 — temporal/contradiction model, selftest, graduate, zero-dep MCP server, npm packaging
NOW: v2.0 code complete and verified end-to-end (temporal/retire, selftest 8/8, MCP session, graduate+global, npm pack); docs + version bumped to 2.0.0
NEXT: commit on a v2.0 branch, push, open PR to master
UPDATED: 2026-06-10T19:05:00+08:00

## Checklist
- [x] v1.0–v1.3 shipped (search, deinit, lint, sessions, git hook) — on master
- [x] v2.0 #15 — temporal/contradiction/expiry: supersedes/superseded-by/expires; upsert supersedes not overwrites; consolidate retires to archive/retired-YYYY-MM.md
- [x] v2.0 #16 — `memo selftest` / `doctor --selftest`: 8/8 compaction-survival checks; npm test wired
- [x] v2.0 #14 — `memo graduate [--global]`: export to docs/ai_wiki + optional ~/.memo-star/GLOBAL-LESSONS.md (MEMO_STAR_GLOBAL_DIR override); opt-in digest injection
- [x] v2.0 #13 — `memo mcp`: zero-dep stdio JSON-RPC MCP server (read_memory/update_task/write_decision/write_lesson/search_memory)
- [x] v2.0 #12 — package.json + bin for `npx memo-star` + LICENSE; zero runtime deps; `memo version`
- [x] Docs (CHANGELOG/SPEC/COMPATIBILITY/README/ROADMAP) + version 2.0.0
- [x] Found+fixed: os.homedir() USERPROFILE gotcha (global-dir env override); cleaned real-home pollution
- [ ] Commit v2.0 on branch + open PR to master
