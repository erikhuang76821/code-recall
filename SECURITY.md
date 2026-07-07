# Security

Code Recall asks you to let it inject text in front of your coding agent and (optionally)
edit `~/.claude/settings.json`. That is a real trust request, so this page states exactly
what the tool does and does not do. Every claim below is verifiable in `coderecall.js` —
it is a single file, and the line anchors are given so you can check.

## What it touches

| Surface | What | When |
|---|---|---|
| `.ai/memory/` in your repo | The ledger (TASK / DECISIONS / LESSONS, archives, snapshots) | `init` and normal operation |
| `AGENTS.md` + per-tool rule stubs (`.cursor/`, `.clinerules`, …) | Marker-fenced protocol sections only; your content outside the markers is preserved byte-for-byte | `init` / `sync`, removable via `deinit` |
| `~/.claude/settings.json` (optional, installer only) | Merges SessionStart / PreCompact / Stop hook entries | `install.sh` / `install.ps1`, removable via `--uninstall` |
| `.git/hooks/pre-commit` (optional) | Marker-merged section; existing hook content preserved | `install-githook`, removable via `remove-githook` |

It never touches anything else on your machine.

## No network, no telemetry

- **Zero runtime npm dependencies** (CI asserts this on every push) and **zero network
  access**: the code never opens a socket — no `http`/`https`/`net`/`dgram`/`tls`
  imports exist anywhere in `coderecall.js`.
- The only child processes it spawns are `git` (for the optional pre-commit gate and
  `affected`) and itself (selftest).
- The MCP server (`coderecall mcp`) is **stdio-only** JSON-RPC — it binds no port and
  accepts no remote connections.
- Nothing is uploaded, logged remotely, or "phoned home". Your code and your ledger
  stay in your repo.

## Secret redaction

Transcript snapshots (the PreCompact hook saves the conversation tail before compaction)
pass through a value-anchored sanitizer before anything is written to disk
(`SECRET_PATTERNS`, `coderecall.js:264`): OpenAI/Anthropic/GitHub/GitLab/Google/Slack/AWS
key shapes, JWTs, `password=`/`api_key=` assignments, and full PEM private-key blocks are
dropped or redacted. Authored ledger content keeps the same secret/PEM masking.

## Prompt-injection stance

Ledger content is *data*, not instructions — and the injection layer says so explicitly:

- Everything read from the ledger is wrapped in
  `<<<CODE-RECALL:UNTRUSTED-LEDGER-DATA:BEGIN/END>>>` fences with a standing instruction
  to the agent that directives inside the fence must be ignored
  (`coderecall.js:759`).
- Ledger text that tries to *spoof* those fence markers is stripped before injection
  (`coderecall.js:767`), so a poisoned ledger cannot fake an early fence-close and smuggle
  instructions outside the fence. A CI selftest pins this behavior.
- This mitigates, but cannot fully eliminate, prompt injection: an agent that chooses to
  obey text it was told to distrust is beyond any tool's control. Treat ledgers in repos
  you don't trust the way you treat their README: readable, not authoritative.

## Installer safety

`install.sh` / `install.ps1` parse `settings.json` first and abort on failure, write a
timestamped backup before every change (keeping the last 5), are idempotent (re-running
never duplicates entries), refuse shell-unsafe repo paths, and support full removal via
`--uninstall` / `-Uninstall`.

## What stays local vs. committed

By default `.ai/memory/TASK.md`, `sessions.md`, and pre-compaction snapshots are
**gitignored** (per-developer working state); `DECISIONS.md` / `LESSONS.md` / archives are
committed (durable, team-valuable). So conversation-tail snapshots never leave your
machine unless you deliberately change the gitignore.

## Reporting a vulnerability

Open a [GitHub issue](https://github.com/erikhuang76821/code-recall/issues) — or, for
anything sensitive, use GitHub's private
[security advisory](https://github.com/erikhuang76821/code-recall/security/advisories/new)
form. Zero-dependency single-file design means fixes ship fast; expect a response within
a few days.
