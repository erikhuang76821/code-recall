# Changelog

## v1.2 (2026-06-10)

1. **Windsurf stub fixed**: `.windsurf/rules/memo-star.md` now starts with the required frontmatter (`trigger: always_on`, description) so the rule is actually applied on every request.
2. **Install node guard + doctor end-to-end check**: both installers abort with a clear message when `node` is missing, and embed the ABSOLUTE node path into hook commands (hooks now survive GUI-launched Claude Code with a different PATH). `memo doctor` gained a "hook execution" check that actually runs the registered SessionStart command through a shell with synthetic stdin (5s timeout) and reports the captured error on failure. Settings path overridable via `MEMO_STAR_SETTINGS` (testing).
3. **Honesty pass**: new [COMPATIBILITY.md](COMPATIBILITY.md) with the per-tool injection / write-back / compaction-survival matrix; README comparison table corrected (MemPalace row, new "semantic recall over months" row where Memo-star honestly loses, compaction-survival claim scoped to Claude Code).
4. **Digest upgrades**: `[!]` blocked checklist items are injected verbatim (sanitized, fenced) so the agent knows why work is stuck; the post-compaction digest names the newest pre-compaction snapshot; AGENTS.md protocol gained a stale-ledger self-check line. Fresh-from-template digest stays ≤1200 chars.
5. **Hygiene**: installers prune `settings.json.memo-star.bak.*` backups to the newest 5; README states the Node >= 10.12 floor; lock sleep guards `SharedArrayBuffer`/`Atomics.wait` availability with a busy-wait fallback.

## v1.1

Debate hardening: untrusted-data fencing of all ledger/transcript-derived text (anti prompt-injection), fence-spoof neutralization, stateful PEM-block sanitizer, shared-file (GEMINI.md / copilot-instructions.md) marker-section upsert instead of overwrite, atomic writes + re-entrant directory lock with stale-lock breaking, snapshot rotation by mtime, transcript tail-read cap (512KB), shell-unsafe-path install guards, installer uninstall round-trip guarantees.

## v1.0

Initial release: single-file zero-dependency `memo.js` (init/sync/status/doctor/digest/snapshot/consolidate), `.ai/memory/` ledgers (TASK/DECISIONS/LESSONS + archive), Claude Code hooks (SessionStart digest injection, PreCompact snapshot, Stop heartbeat), AGENTS.md marker-section protocol, cross-tool stubs, merging installers for Windows/macOS/Linux.
