# Memo-star ⭐ (v1.2.0)

> AI coding agent 的零摩擦持久記憶層 — 撐得過 context compaction、跨所有 IDE/CLI、不需要 daemon、向量資料庫或 API key。
>
> Zero-friction persistent memory layer for AI coding agents — survives context compaction, works across every IDE/CLI, no daemon, no vector DB, no API keys.

需求 Requirements: Node >= 10.12（任何 2018 年後的 Node 即可；建議 Node 18+）。
Requires Node >= 10.12 (any 2018+ Node; Node 18+ recommended).

## 快速開始 Quickstart

**1. 在你的專案裡初始化記憶帳本（每個專案一次） / Initialize the ledger (once per project):**

```
node path\to\Memo-star\memo.js init
```

建立 `.ai/memory/`（TASK.md / DECISIONS.md / LESSONS.md）與 AGENTS.md 協定區段。
Creates `.ai/memory/` (TASK.md / DECISIONS.md / LESSONS.md) and the AGENTS.md protocol section.

**2. 安裝全域 hooks（每台機器一次） / Install global hooks (once per machine):**

```powershell
# Windows
powershell -ExecutionPolicy Bypass -File install.ps1
```

```sh
# macOS / Linux
sh install.sh
```

安裝程式只會「合併」進 `~/.claude/settings.json`：先備份、絕不動到你既有的 hooks、可重複執行（idempotent）。解除安裝：`install.ps1 -Uninstall` / `install.sh --uninstall`。
The installer MERGES into `~/.claude/settings.json`: backup first, never touches your existing hooks, idempotent. Uninstall: `install.ps1 -Uninstall` / `install.sh --uninstall`.

**3. 完成。 Done.**

之後完全不用手動操作 — hooks 會在每次 session 開始/compaction 後自動把任務摘要注入，agent 依照協定持續改寫帳本。
No manual steps from here on — hooks auto-inject the task digest on every session start / after compaction, and the agent keeps rewriting the ledger per protocol.

其他工具（Cursor / Copilot / Windsurf / Cline / Roo / Gemini CLI / Codex CLI）：執行 `node memo.js sync --all` 產生各工具的指示 stub，協定本身就是它們的 hook。
Other tools: run `node memo.js sync --all` to generate per-tool instruction stubs — the protocol text IS the hook for hookless tools.

## 架構 Architecture

```
                         ┌──────────────────────────────┐
                         │      <project>/.ai/memory/    │
                         │  TASK.md      (GOAL/NOW/NEXT) │
                         │  DECISIONS.md (dated entries) │
                         │  LESSONS.md   (failures+why)  │
                         │  archive/     (snapshots)     │
                         └──────┬───────────────▲────────┘
                read+inject     │               │  write/rewrite
        ┌───────────────────────┤               │  (recitation by agent)
        │                       │               │
┌───────▼────────┐   ┌──────────▼─────┐   ┌─────┴──────────┐
│ sessionstart.js│   │  precompact.js │   │    stop.js     │
│ digest ≤200 tok│   │ snapshot tail  │   │ heartbeat +    │
│ into context   │   │ of transcript  │   │ staleness flag │
└───────▲────────┘   └──────────▲─────┘   └─────▲──────────┘
        │   Claude Code hooks (installed by install.ps1/.sh)
        └──────────────────────┬┴──────────────┬┘
                               │               │
                    ┌──────────┴─────┐  ┌──────┴────────────────────┐
                    │  Claude Code   │  │ AGENTS.md marker section  │
                    │  (hook-driven) │  │ → CLAUDE.md / .cursor /   │
                    └────────────────┘  │ copilot / windsurf / roo… │
                                        │ (instruction-driven)      │
                                        └───────────────────────────┘
```

## 比較 Comparison

| | Memo-star | claude-mem | MemPalace | mem0 | 內建 IDE 記憶 Built-in IDE memories |
|---|---|---|---|---|---|
| 自動擷取 Auto-capture | ✅ hooks，零手動 | ✅ hooks | ✅ hooks（逐字 verbatim） | ⚠️ 需程式整合 SDK integration | ⚠️ 不定期、不可控 opportunistic |
| Compaction 存活 Compaction survival* | ✅ Claude Code / 🟡 其他 others（見 see COMPATIBILITY.md） | ⚠️ 部分 partial | 🟡 部分 partial（有快照、無重錨定注入 snapshot, no re-anchor injection） | ❌ 與 context 無關 context-unaware | ❌ |
| 跨工具 Cross-tool | ✅ AGENTS.md + 各工具 stub | ❌ 僅 Claude Code | 🟡 部分 partial（MCP clients） | ⚠️ 需各自整合 per-app | ❌ 鎖在單一工具 single tool |
| 跨月語意召回 Semantic recall over months | ❌ 無（v1.3 規劃詞法搜尋 lexical search planned v1.3） | ⚠️ | ✅ | ✅ 向量檢索 vector recall | ❌ |
| 免 daemon No daemon | ✅ 純檔案 plain files | ❌ worker + DB | ✅ | ❌ 服務/API service | ✅ |
| Windows | ✅ 第一優先 first-class | ⚠️ | ⚠️ 弱 weak | ⚠️ | ✅ |

\* 逐工具的「注入／寫回／compaction 存活」三層真實等級，見 per-tool injection / write-back / compaction-survival details: [COMPATIBILITY.md](COMPATIBILITY.md)。

## 疑難排解 Troubleshooting

**Hooks 沒有觸發 / Hooks not firing**
- 執行 `node memo.js doctor` 檢查 settings.json 與帳本狀態。Run `node memo.js doctor`.
- 確認 `~/.claude/settings.json` 的 hook command 是「絕對路徑」且檔案存在；搬移 repo 後需重跑 install。Hook commands use absolute paths — re-run the installer if you moved this repo.
- 重啟 Claude Code session（hooks 在 session 啟動時載入）。Restart the session; hooks load at session start.

**安裝程式說 JSON 解析失敗 / Installer aborts with a JSON parse error**
- 這是刻意的安全機制：settings.json 壞掉時絕不覆寫。手動修好 JSON（找最近的 `settings.json.memo-star.bak.*` 備份）再重跑。This is intentional — we never overwrite a broken settings.json. Fix the JSON (see the `*.memo-star.bak.*` backups) and re-run.

**某個專案不想要記憶 / Don't want memory in a project**
- 什麼都不用做：沒有 `.ai/memory/` 的專案，hooks 一律立即 exit 0，零成本。Nothing to do — in projects without `.ai/memory/` every hook exits immediately at zero cost.

**摘要內容過期 / Digest looks stale**
- 帳本超過 2 小時未更新會被標記 STALE，摘要會提醒「先驗證再信任」。執行 `node memo.js status` 查看，請 agent 重寫 NOW/NEXT。The ledger is flagged STALE after 2h; run `node memo.js status` and have the agent rewrite NOW/NEXT.

**帳本長太大 / Ledger growing too large**
- 執行 `node memo.js consolidate` 歸檔已完成項目並去重。`doctor` 會在單檔 > ~4KB 時警告。Run `node memo.js consolidate`; `doctor` warns above ~4KB per file.

**解除安裝 / Uninstall**
- `install.ps1 -Uninstall`（或 `install.sh --uninstall`）只移除 memo-star 的 hook 項目，其餘設定原封不動；專案內刪除 `.ai/memory/` 與 AGENTS.md 標記區段即可。Removes only memo-star entries; delete `.ai/memory/` and the AGENTS.md marker section per project.

## License

MIT
