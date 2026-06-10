# TASK
GOAL: Ship Memo-star v1.0 — daemon-less cross-tool memory layer that survives compaction
NOW: v1.1 — three-way debate (Claude/Codex/Gemini) findings all fixed and verified; awaiting user to run install.ps1
NEXT: user runs install.ps1, then restart a Claude Code session to see the SessionStart digest
UPDATED: 2026-06-10T13:30:00+08:00

## Checklist
- [x] Research competitors (claude-mem, MemPalace, mem0, Letta) and hook mechanisms
- [x] SPEC.md design (ledger schema, hook contract, cross-tool sync, security)
- [x] Build memo.js CLI + templates (init/sync/status/doctor/digest/snapshot/consolidate)
- [x] Build hooks (sessionstart/precompact/stop) + installers + skill + README
- [x] Adversarial review + fix rounds (rotation, sanitizer, injection fencing, CRLF, digest parity)
- [x] Three-way debate: Codex + Gemini cross-review → 8 confirmed fixes (locking/atomic writes, AGENTS.md fencing, PEM block redaction, shell-injection guards, transcript tail-read, shared-file marker sections, code-fence parsing, PS JSON type guard)
- [ ] Run install.ps1 to register global hooks (user action — classifier blocks automated settings.json edits)
- [ ] Optional: memo sync --all in real work projects for Cursor/Codex/Copilot stubs
