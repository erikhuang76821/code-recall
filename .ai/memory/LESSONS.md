# LESSONS
<!-- Procedural memory + tried-and-failed. "Do not retry X because Y."
Entry format (strict):
  ## <short title>
  - date: YYYY-MM-DD
  - confidence: high|med|low
  <what failed AND the root cause, 1-3 lines>
-->

## Do not JSON.stringify a path before embedding it in a JSON config
- date: 2026-06-10
- confidence: high
First .cursor/hooks.json command came out with quadruple backslashes. Root cause: JSON.stringify(path) doubled the backslashes, then JSON.stringify(obj) doubled them again. Fix: plain-quote the path ('node "'+p+'"'); the final serialize escapes once.

## os.homedir() reads USERPROFILE on Windows, not the HOME env var
- date: 2026-06-10
- confidence: high
A `graduate --global` test set HOME=/tmp/... but node still wrote to the REAL ~/.coderecall (polluted C:\Users\erikhuang). Root cause: on Windows os.homedir() uses USERPROFILE, ignoring HOME. Fix: GLOBAL_DIR honors CODE_RECALL_GLOBAL_DIR env override; tests must use that, not HOME.

## A git hook whose last command is a non-zero check aborts the commit
- date: 2026-06-10
- confidence: high
First pre-commit hook used `grep -qx ... && git add` in a for-loop; when the last file was not staged, grep returned 1, so the script's final exit status was 1 and git aborted the commit. Root cause: a hook's exit status is its last command's. Fix: `if grep; then git add; fi` — a non-taken if returns 0.

## git diff --cached misses a file the hook just refreshed
- date: 2026-06-10
- confidence: high
Re-staging via `git diff --cached --name-only | grep file` failed to pick up AGENTS.md when the staged copy still equaled HEAD (common: user stages only TASK.md). Root cause: diff --cached only lists files differing from HEAD. Fix: gate on `git ls-files --cached --error-unmatch` (is it tracked/staged at all), then git add the refreshed version.

## node -e chdir to an MSYS /tmp path fails on native Windows node
- date: 2026-06-10
- confidence: med
Inline `node -e 'process.chdir("/tmp/...")'` threw ENOENT during testing because Windows node can't resolve the MSYS mount path. Root cause: bash translates /tmp for its own cwd but not for arguments. Let bash `cd` set the cwd and rely on process.cwd() instead of passing POSIX paths to node.

## The `decision` write path silently truncates any ADR field over 200 chars
- date: 2026-06-23
- confidence: high
PROVEN root cause (Codex GPT-5.5 review corrected an earlier guess): `cmdDecision`/`write_decision` → `upsertEntry` runs the body through `sanitize()` (coderecall.js:475). `sanitize` is the SECRET-REDACTION pass, but it ALSO caps every line at MAX_TRANSCRIPT_LINE=200 and appends ` […]`. `composeAdrBody` (coderecall.js:2519) collapses each Context/Decision/Consequences field to ONE line, so any field >200 chars is silently truncated on write. Reproduced live: recording the 2026-06-23 integrity decision via the CLI truncated all three fields; the same cap left `[…]` tails on the auto-memory-boundary entry (committed fa6f06f). Hand-edited entries escape it (they never pass through sanitize) — which is why the long Strategy ADRs are intact. SEPARATE, still-unexplained: that same fa6f06f entry's Consequences held raw `coderecall init` stdout — how that text reached the `--consequences` arg is NOT evidenced by the commit (the earlier "shell command-substitution" claim was speculation; only the `[…]` truncation is proven). Fixes tracked in DECISIONS ("Ledger integrity…"). Until fixed: author long ADR bodies via hand-edit or keep each CLI field < ~190 chars; treat `[…]` in any stored entry as corruption; never reuse a security/redaction sanitizer as a content-length limiter on authored data.

## A missing colon (`NOW【…】`) silently blanked the cross-session re-anchor — never fail silent on parse
- date: 2026-06-23
- confidence: high
On a real non-author project (LevelTest), TASK.md drifted to `NOW【tag】body` (no colon) and a prepend-per-task worklog. `parseTask` matched only `NOW: ` → extracted nothing → the SessionStart/compaction digest shipped `NOW: (not set)` / `NEXT: (not set)` with no warning, the Stop hook froze sessions.md at `(no NOW set)`, and TASK.md ballooned to 60KB of stale ✓-logs (the 4000-char body cap just hid it). Net: the tool's headline promise (cheap, accurate compaction re-anchor) silently failed — a fresh agent had to read 60KB to reconstruct state. Root cause = a strict parser with NO loud failure path + nothing detecting append-instead-of-rewrite. Fix (DECISIONS "TASK field parsing hardened"): tolerant matcher, first-wins, digest+doctor WARN when GOAL set but NOW unparseable, doctor flag on >1 NOW/NEXT line. Lesson: a memory tool must NEVER emit an empty anchor silently — if a required field is set elsewhere (GOAL) but its companion can't be parsed, that is almost always a format slip; warn loudly. Parse leniently for input, fail loudly on ambiguity.
