# Code Recall Compatibility Matrix

> 繁中摘要:本表把「工具**能**做什麼」和「coderecall **已經**做了什麼」分開列。
> 很多工具在 2026 年都補上了 hooks,但除非 coderecall 真的產出那個設定檔並經過實測,
> 否則它對使用者就還不是能力。第三欄寫明驗證範圍與日期;沒寫的就是沒測過。

Each row has three independent columns — conflating them is how a compatibility
table starts lying:

- **Harness capability** — what the tool itself exposes (hook events, instruction
  files, MCP config), regardless of coderecall.
- **coderecall adapter** — what `init` / `sync` / the installers actually produce
  today. "none" means the capability exists but you would have to wire it by hand.
- **Verified** — what was actually observed, and when. Anything else is untested.

Layers, as before: **passive injection** (how the protocol/digest reaches the model
without user action), **write-back** (deterministic hooks vs instruction-protocol
honor system vs MCP tool calls), **compaction survival** (pre-compaction snapshot
and/or post-compaction re-anchor).

| Tool | Harness capability | coderecall adapter (v2.11.0) | Verified |
|---|---|---|---|
| **Claude Code** (CLI / VS Code / JetBrains) | SessionStart (`startup\|resume\|clear\|compact`), PreCompact, Stop, UserPromptSubmit, SessionEnd + more; `hookSpecificOutput.additionalContext` injection; `CLAUDE.md` `@import`; project `.mcp.json`; plugins can ship hooks + skills + MCP | **Full**: `install.ps1`/`install.sh` register SessionStart + PreCompact + Stop globally; `init` writes `CLAUDE.md` → `@AGENTS.md`; optional MCP server; optional UserPromptSubmit staleness hook (off by default) | Hooks registered and firing on 2.1.263 (Windows); `selftest` drives `sessionstart.js` + `precompact.js` end-to-end on Linux + Windows × Node 18/20 in CI |
| **Codex CLI** | 12 hook events incl. SessionStart (`startup\|resume\|clear\|compact`), PreCompact/PostCompact (`transcript_path`), Stop, UserPromptSubmit; `hookSpecificOutput.additionalContext` (default ~2500-token cap, spills to a file beyond that); `~/.codex/hooks.json`, `<repo>/.codex/hooks.json` (trusted projects), inline `[hooks]`, or a plugin; every non-managed hook needs a one-time `/hooks` trust review and re-trust after any change; AGENTS.md re-rendered after compaction; `.agents/skills/`; `[mcp_servers.*]` | **Partial — instruction-protocol + optional MCP.** AGENTS.md is written by `init`; the MCP server can be registered by hand. **No hooks are generated yet** (planned; see the note below for a hand-rolled config). | Codex 0.154.0: `hooks` = stable; `hooks/sessionstart.js` used unchanged as a Codex SessionStart hook injected the digest and gpt-6-astra quoted the `GOAL:` line back verbatim — **scope: `codex exec`, `source=startup`, with `--dangerously-bypass-hook-trust`**. The normal `/hooks` trust flow, `source=compact` re-anchoring, and PreCompact/Stop under Codex are NOT yet verified. AGENTS.md re-render after compaction confirmed in a local rollout (gpt-5.6-sol) |
| **Cursor** | `.cursor/rules/*.mdc` (`alwaysApply`); `.cursor/hooks.json` v1 with `sessionStart` (can return `additional_context`), `preCompact`, `stop`; reads AGENTS.md natively; Memories removed in 2.1.x | Rules stub + a `stop` heartbeat entry in `.cursor/hooks.json`. No `sessionStart` / `preCompact` entry. | Schema of the emitted `stop` entry matches the documented v1 shape; runtime behaviour not re-tested this cycle |
| **Codex/Claude-format hook readers** (VS Code Copilot, Devin CLI) | Documented to execute `~/.claude/settings.json` hooks | Whatever the installers already registered | **Not verified** — the stdin payload parity (`cwd`, `source`) has not been tested |
| **Devin Desktop** (formerly Windsurf) | Devin Local reads AGENTS.md, `CLAUDE.md`, `.cursor/rules`; hooks: SessionStart, Stop, PostCompaction with `additionalContext`. Legacy Cascade agent: rules only, hooks cannot inject | AGENTS.md (native) + a `.windsurf/rules/` stub. `.windsurf/rules` is now a **legacy fallback**; the preferred path is `.devin/rules/` — not yet emitted | Docs only |
| **GitHub Copilot** (CLI / cloud / VS Code) | AGENTS.md native on all surfaces; `.github/hooks/*.json` with `sessionStart` (`additionalContext`), `preCompact` (`transcriptPath`), `agentStop`; shares `.mcp.json` with Claude Code | AGENTS.md + a marker section in `.github/copilot-instructions.md` (redundant now that AGENTS.md is native, harmless). No hooks emitted | Docs only |
| **Gemini CLI** | `GEMINI.md`; context files configured via the **nested** `context.fileName`; SessionStart / BeforeAgent `additionalContext`; PreCompress | `GEMINI.md` marker section + `.gemini/settings.json` `context.fileName` including AGENTS.md. **Fixed in v2.11.0** — earlier versions wrote a top-level `contextFileName`, which current Gemini ignores, so AGENTS.md was never actually loaded; `sync` now migrates the old key | Key name and migration verified locally (round-trips through `sync` and `deinit`); model-side loading not re-tested |
| **Cline** | `.clinerules/`; hooks under `.clinerules/hooks/` (TaskStart / TaskComplete / PreCompact, `.ps1` on Windows) with `contextModification`; reads AGENTS.md | `.clinerules/coderecall.md` stub | Docs only; hook schema and reliability unverified |
| **Roo Code** | `.roo/rules/`; AGENTS.md native; `.roo/mcp.json` | `.roo/rules/coderecall.md` stub | Docs only |
| **Antigravity, Kiro, OpenCode, Amp, JetBrains Junie** | All read AGENTS.md (Kiro also `.kiro/steering/`, Antigravity `.agents/rules/`); Antigravity/Kiro/OpenCode/Amp expose hooks or plugins that could inject or re-anchor | AGENTS.md only (no per-tool stub) | Docs only |

## Notes

- **The instruction layer is the floor, and it is wider than it used to be.** AGENTS.md
  is read natively by most of the tools above (Claude Code needs the `@AGENTS.md`
  import, Gemini needs `context.fileName`). It is re-sent with every request or
  rebuilt every run, so the *protocol* survives compaction everywhere. What it cannot
  carry is live state: the marker section deliberately omits `NOW:`/`NEXT:` so that a
  committed file never leaks per-developer working state. That is what hooks add.
- **Write-back via instruction-protocol is honor-system** — a well-behaved agent
  follows it, nothing enforces it. The optional MCP server (`coderecall mcp`) turns
  the writes into tool calls for any MCP client. As of v2.11.0 those tools keep a
  strict write contract: a failure returns `isError` and the server stays up, and a
  write is never reported as success unless it happened.
- **Using coderecall's hooks with Codex today (unsupported, but it works).** Put this
  in `~/.codex/hooks.json`, then run `/hooks` inside Codex once to trust it. Start
  Codex from the directory that holds `.ai/memory/` — the hook reads the session cwd
  and no-ops elsewhere. Any later edit to the command string requires re-trusting.
  ```json
  { "hooks": { "SessionStart": [ { "matcher": "startup|resume|clear|compact",
      "hooks": [ { "type": "command",
        "command": "node \"/abs/path/code-recall/hooks/sessionstart.js\"",
        "commandWindows": "node \"C:/abs/path/code-recall/hooks/sessionstart.js\"",
        "additionalContextLimit": 6000, "timeout": 10 } ] } ] } }
  ```
  `PreCompact` is deliberately omitted: `precompact.js` parses Claude's transcript
  format, so under Codex it would write an empty snapshot rather than the
  conversation tail. A Codex-aware snapshot is planned, not shipped.
- **MCP ledger binding is per launch cwd**, resolved once when the server starts — so
  a single *global* MCP registration is only correct if the client spawns the server
  per project. Verified 2026-08-14 on Codex CLI (`codex -C <project>`): two concurrent
  sessions → two server processes, each bound to its own project's ledger. Untested,
  and the real risk: a client that switches project folder *without restarting* keeps
  the first project's binding, with no error on reads or writes. `read_memory` is a
  read-only way to check which ledger a live server is on.
- **Every hook mechanism has a one-time trust step** that no installer can skip for
  you: Codex `/hooks` (hash-based, re-prompts after any change), Claude Code's
  `.mcp.json` approval prompt, Gemini's fingerprint warning, Antigravity's folder
  trust. Treat "registered" and "trusted and firing" as different states.
- **Recall is lexical.** `coderecall search` is zero-dependency BM25 over the ledger +
  archive. This is honestly weaker than the semantic recall of a vector store (it
  matches terms, not meaning) — `- aliases:` on an entry is the zero-dep mitigation.
