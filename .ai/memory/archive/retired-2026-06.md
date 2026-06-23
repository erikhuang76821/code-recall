# Retired decisions

Implementation/mechanics decisions that are now shipped code with passing selftests.
They are kept here (searchable via `coderecall search`) but pulled out of the live
DECISIONS.md so recall/digest rank against current constraints, not settled施工 detail.
Retired 2026-06-23 during a ledger-hygiene pass.

## DECISIONS.md upgraded to ADR-grade (status + Context/Decision/Consequences)
- date: 2026-06-10
- status: superseded
- confidence: high
**Context:** core direction is decision persistence; flat date+confidence entries didn't capture WHY/consequences or an ADR status lifecycle.
**Decision:** add optional `status` (proposed/accepted/superseded/deprecated) + Context/Decision/Consequences structure, reusing existing supersede/expire as the lifecycle; MCP write_decision takes structured fields. Backward-compatible (no parser rewrite — sections are body markdown).
**Consequences:** consolidate now retires deprecated too; lint validates status; old entries without status stay valid (treated as live). Kept it lightweight — no enforcement/approval (that's the OUT scope fence).

## score empty-ledger guard: floor at 8 when GOAL/NOW/NEXT all placeholder
- date: 2026-06-10
- status: superseded
- confidence: high
Free support dims (freshness/blockers/grounding) were padding an empty template to 33 — false comfort. When core fields are all placeholders, cap overall <=8 + label "empty ledger". selftest asserts empty < 15.

## `score` is a transparent heuristic, not an ML/precision number
- date: 2026-06-10
- status: superseded
- confidence: high
coderecall score weights toward actionability (vague NEXT like "continue" scores low even when filled; blockers must carry a reason). Each dim shows why + "fix first". Codex bar: must machine-check actionability or it's decoration — selftest asserts concrete NEXT=100, vague NEXT<60. Purpose: catch false completeness, the failure mode behind "agent doesn't know what to do next".

## Cursor hooks.json + Gemini settings are best-effort JSON merges
- date: 2026-06-10
- status: superseded
- confidence: med
sync --all merges (never overwrites) into .gemini/settings.json (contextFileName) and .cursor/hooks.json (Stop). Cursor's hook schema is young and may change; entry is idempotent and removed by deinit. Plain-quote the node path — do NOT JSON.stringify it first (double-escapes backslashes). [Root-cause kept live in LESSONS.md.]

## Git pre-commit hook is a coderecall.js subcommand, not shell in the installers
- date: 2026-06-10
- status: superseded
- confidence: high
Implemented install-githook/precommit/remove-githook in coderecall.js (node writes the .git/hooks/pre-commit file) instead of duplicating shell logic in install.ps1 + install.sh. One cross-platform code path, testable, and Git for Windows runs the sh hook fine. Re-stage uses `git ls-files --cached --error-unmatch` (tracked?), NOT `git diff --cached` (which misses a freshly-refreshed file).

## Staleness reminder hook ships OFF by default
- date: 2026-06-10
- status: superseded
- confidence: high
UserPromptSubmit reminder is opt-in (installers don't register it) because token discipline is SPEC priority #5. Throttled via .reminder to at most once per 45-min window.

## Reliable capture via friction-reduction + advisory nudge, not Stop-hook coercion
- date: 2026-06-10
- status: superseded
- confidence: high
**Context:** decision log's value depends on write-back actually happening (honor-system risk)
**Decision:** add a one-line `decision` CLI + a pre-commit advisory nudge; leave score undistorted
**Consequences:** non-coercive, on-brand; capture is easier + prompted at the commit checkpoint, never blocks. Superseded by the 2026-06-12 write-back primitives + bench (the strategy-level treatment of this risk).
