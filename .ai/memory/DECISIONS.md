# DECISIONS
<!-- Semantic memory: constraints, choices, discovered facts. One entry per decision.
Entry format (strict):
  ## <short title>
  - date: YYYY-MM-DD
  - confidence: high|med|low
  <body, 1-3 lines>
-->

## Search is lexical (BM25), not semantic
- date: 2026-06-10
- confidence: high
Chose zero-dep BM25 over embeddings/vector DB to keep the no-daemon/no-network/no-deps brand. Honestly weaker than semantic recall, but answers "where did I decide X" without install cost. Tokenizer indexes alphanumeric words + individual CJK chars so CN/EN both work.

## Cursor hooks.json + Gemini settings are best-effort JSON merges
- date: 2026-06-10
- confidence: med
sync --all merges (never overwrites) into .gemini/settings.json (contextFileName) and .cursor/hooks.json (Stop). Cursor's hook schema is young and may change; entry is idempotent and removed by deinit. Plain-quote the node path — do NOT JSON.stringify it first (double-escapes backslashes).

## Git pre-commit hook is a memo.js subcommand, not shell in the installers
- date: 2026-06-10
- confidence: high
Implemented install-githook/precommit/remove-githook in memo.js (node writes the .git/hooks/pre-commit file) instead of duplicating shell logic in install.ps1 + install.sh. One cross-platform code path, testable, and Git for Windows runs the sh hook fine. Re-stage uses `git ls-files --cached --error-unmatch` (tracked?), NOT `git diff --cached` (which misses a freshly-refreshed file).

## Pre-commit hook is advisory by default; --strict bakes in blocking; no ANSI
- date: 2026-06-10
- confidence: high
`install-githook` default warns-but-allows (refresh is the value; blocking a code commit over a missing confidence line is high-friction and trains --no-verify). `install-githook --strict` writes `precommit --strict` into the hook to block. Lint banner uses plain text, NOT ANSI colour — a git hook's stdout is not reliably a TTY and colour garbles on Windows cmd. Settled a v1.3.x debate with the external reviewer.

## Staleness reminder hook ships OFF by default
- date: 2026-06-10
- confidence: high
UserPromptSubmit reminder is opt-in (installers don't register it) because token discipline is SPEC priority #5. Throttled via .reminder to at most once per 45-min window.
