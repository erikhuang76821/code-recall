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
A `graduate --global` test set HOME=/tmp/... but node still wrote to the REAL ~/.memo-star (polluted C:\Users\erikhuang). Root cause: on Windows os.homedir() uses USERPROFILE, ignoring HOME. Fix: GLOBAL_DIR honors MEMO_STAR_GLOBAL_DIR env override; tests must use that, not HOME.

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
