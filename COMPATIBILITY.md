# Memo-star Compatibility Matrix (v1.2.0)

> 繁中摘要：Memo-star 對每個工具的支援分三層 — **被動注入**（工具自動載入協定/摘要）、
> **寫回**（agent 更新帳本的機制：確定性 hooks vs 指令協議「榮譽制」）、
> **Compaction 存活**（context 壓縮後任務能否無損續行）。
> 只有 **Claude Code** 三層全滿（hooks 注入 + hooks 寫觸發 + PreCompact 快照與
> compact 後全量重錨定）。其他工具：注入靠 rules/instructions 檔（每個請求都會重送，
> 所以協定本身撐得過 compaction），寫回靠指令協議，但**沒有** PreCompact 快照、
> 也**沒有** compact 後的重錨定注入 — 故標示 PARTIAL。

Three layers, per tool:

- **Passive injection** — how the memory protocol + digest reaches the model without user action.
- **Write-back** — how the ledger gets updated: deterministic *hooks* (machine-enforced) vs *instruction-protocol* (the rules file tells the agent to do it; honor-system).
- **Compaction survival** — FULL = pre-compaction snapshot **and** post-compaction re-anchor injection; PARTIAL = the rules/instructions file is re-sent on every request (so the protocol survives), but there is no snapshot of the lost conversation tail and no automatic re-anchor.

| Tool | Passive injection (mechanism + file) | Write-back | Compaction survival | Why |
|---|---|---|---|---|
| Claude Code (CLI / VS Code / JetBrains) | Hooks: SessionStart `additionalContext` digest; plus `CLAUDE.md` → `@AGENTS.md` import | **Hooks** (Stop heartbeat, PreCompact `UPDATED:` touch) + protocol | **FULL** — PreCompact snapshot of the transcript tail + `source=compact` re-anchor injects full TASK.md | Only tool with a hook API covering session start, stop, and pre-compaction. |
| Cursor | `.cursor/rules/memo-star.mdc` (`alwaysApply: true`) | Instruction-protocol | **PARTIAL** | Rules are re-attached to every request, but no snapshot/re-anchor hook exists. |
| Windsurf | `.windsurf/rules/memo-star.md` (`trigger: always_on` frontmatter) | Instruction-protocol | **PARTIAL** | Always-on rule re-sent per request; no compaction hook. |
| Codex CLI | `AGENTS.md` (native, read at session start) | Instruction-protocol | **PARTIAL** | AGENTS.md re-read per session; no pre-compaction snapshot or re-anchor. |
| GitHub Copilot | `.github/copilot-instructions.md` (marker-managed section) | Instruction-protocol | **PARTIAL** | Instructions file included with each request; no compaction lifecycle access. |
| Gemini CLI | `GEMINI.md` (marker-managed section; or `context.fileName: AGENTS.md`) | Instruction-protocol | **PARTIAL** | Context file loaded per session; no snapshot/re-anchor mechanism. |
| Cline | `.clinerules/memo-star.md` | Instruction-protocol | **PARTIAL** | Rules dir injected on every task; no compaction hook. |
| Roo Code | `.roo/rules/memo-star.md` | Instruction-protocol | **PARTIAL** | Rules dir injected on every task; no compaction hook. |

Notes:

- PARTIAL is still useful: because the rules file (with the read-the-ledger protocol) accompanies **every** request, an agent that loses context via compaction is re-instructed to read `.ai/memory/TASK.md` on its next turn. What it loses versus Claude Code: the verbatim snapshot of the pre-compaction conversation tail, and the *immediate* forced re-anchor with the full TASK.md body.
- Write-back via instruction-protocol is honor-system: well-behaved agents follow it; nothing machine-enforces it. A zero-dependency local MCP front-end to close this gap is on the roadmap (v2.0, optional).
- Honest loss: Memo-star has **no semantic recall over months** (no vector store, no search command yet — lexical search planned for v1.3). Tools like MemPalace win that dimension.
