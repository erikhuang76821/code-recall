# 🌟 Memo-star: The Zero-Dependency AI Memory Layer

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
[![Version](https://img.shields.io/badge/version-1.2-orange.svg)](ROADMAP.md)

**Memo-star** 是一個極致輕量的「跨工具 AI 記憶持久化層」。它不需要常駐程式 (Daemon-less)、不需要資料庫、也不需要 API Key。透過純 Markdown 檔案與 Hook 機制，讓您的 AI Coding Agents（如 Claude Code、Cursor、Windsurf 等）擁有過目不忘的長期記憶。

> Zero-friction persistent memory layer for AI coding agents — survives context compaction, works across every IDE/CLI, no daemon, no vector DB, no API keys.

**需求 Requirements：** Node >= 10.12（任何 2018 年後的 Node 即可；建議 Node 18+）。

---

## 😫 痛點 (The Problem)

在進行複雜的軟體開發或管理多個系統架構時，AI 助手常常會因為 Context Window 耗盡而「失憶」：

- 忘記專案的架構約定或依賴版本。
- 在 CLI 跑完指令後，回到 IDE 裡的 AI 助手又得重新對齊上下文。
- 市面上的記憶工具（如 mem0）過於笨重，需要啟動 Docker、配置向量資料庫或付費 API。
- 跨工具切換時（Claude Code ↔ Cursor ↔ Copilot），記憶無法共享，每次都要重新說明。

## 🎯 解決方案 (The Solution)

Memo-star 採用「減法哲學」。它將記憶濃縮為三個核心的靜態 Markdown 檔案，並透過底層 Hook 在 AI Agent 壓縮或重置 Context 時自動將記憶重新注入。

### ✨ 核心特色

- **🍃 零依賴 (Zero-Dependency)：** 沒有 DB、沒有背景服務，100% 依賴本地檔案，保護程式碼隱私。
- **🤝 跨工具共享：** 無論是在 CLI 使用 Claude Code，還是在 IDE 使用 Cursor，皆可共用同一份 `.ai/memory` 記憶體。
- **⚡ 輕量且防干擾：** 記憶注入限制在 ≤200 Token，不排擠實際用於傳輸程式碼的 Context 空間。
- **🛡️ Compaction 存活：** PreCompact hook 在壓縮前自動快照，重啟後立即恢復狀態。
- **🛠️ CI/CD 友善：** 純文字 Markdown，直接提交至 Git，無縫整合 GitHub Actions 或其他自動化流程。
- **🪟 Windows 第一優先：** PowerShell 安裝腳本，原生支援 Windows 11。

---

## 🚀 快速開始 (Quick Start)

### 1. 初始化專案記憶 (每個專案一次)

在您的專案根目錄下執行：

```powershell
# Windows
node path\to\Memo-star\memo.js init
```

```sh
# macOS / Linux
node path/to/Memo-star/memo.js init
```

這將在您的專案中建立 `.ai/memory/` 目錄，包含以下核心檔案：

| 檔案 | 用途 |
|---|---|
| `TASK.md` | 追蹤目前的開發目標與進度（GOAL / NOW / NEXT） |
| `DECISIONS.md` | 記錄架構決策與踩坑記錄（附日期） |
| `LESSONS.md` | 存放 AI 學習到的專案特定語法或限制（含根因） |

同時會在 `AGENTS.md` 插入協定區段，作為無原生 Hook 工具（Cursor / Copilot 等）的指令型 Hook。

### 2. 安裝全域 Hooks (每台機器一次)

```powershell
# Windows
powershell -ExecutionPolicy Bypass -File install.ps1
```

```sh
# macOS / Linux
sh install.sh
```

安裝程式只會「合併」進 `~/.claude/settings.json`：先備份、絕不覆蓋既有 hooks、可重複執行（idempotent）。

解除安裝：`install.ps1 -Uninstall` / `install.sh --uninstall`

### 3. 完成。(Done.)

之後完全不需手動操作 — Hooks 會在每次 session 開始 / compaction 後自動把任務摘要注入，Agent 依照協定持續改寫帳本。

**其他工具（Cursor / Copilot / Windsurf / Cline / Roo / Gemini CLI / Codex CLI）：**
執行 `node memo.js sync --all` 產生各工具的指示 stub，協定文字本身就是它們的 Hook。

---

## 🧠 運作原理 (How it Works)

Memo-star 透過監聽 AI 工具的生命週期 (Lifecycle Hooks)，實現自動化的記憶存取：

1. **Session Start：** 從 `.ai/memory` 讀取摘要（≤200 Token）並注入為 System Prompt。
2. **Context Compaction：** AI 面臨上下文壓縮時，`precompact.js` 強制快照 transcript 尾端，保留關鍵錨點。
3. **Cross-sync：** 藉由 `AGENTS.md` 協定，確保本地 LLM、MCP 伺服器或不同 IDE 間的狀態保持一致。

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

---

## 🤝 支援的 AI Agents

| Agent | 支援方式 |
|---|---|
| ✅ Claude Code | 原生 Hooks（sessionStart / preCompact / stop） |
| ✅ Cursor | AGENTS.md 指令型 Hook + sync stub |
| ✅ GitHub Copilot | AGENTS.md 指令型 Hook + sync stub |
| ✅ Windsurf | AGENTS.md 指令型 Hook + sync stub |
| ✅ Cline / Roo / Codex CLI | AGENTS.md 指令型 Hook + sync stub |
| 🔜 持續新增中... | 歡迎提交 PR！ |

---

## 📊 比較 (Comparison)

| | Memo-star | claude-mem | MemPalace | mem0 | 內建 IDE 記憶 |
|---|---|---|---|---|---|
| 自動擷取 Auto-capture | ✅ hooks，零手動 | ✅ hooks | ✅ hooks（逐字 verbatim） | ⚠️ 需程式整合 SDK integration | ⚠️ 不定期、不可控 opportunistic |
| Compaction 存活 Compaction survival* | ✅ Claude Code / 🟡 其他 others（見 COMPATIBILITY.md） | ⚠️ 部分 partial | 🟡 部分 partial（有快照、無重錨定注入） | ❌ 與 context 無關 context-unaware | ❌ |
| 跨工具 Cross-tool | ✅ AGENTS.md + 各工具 stub | ❌ 僅 Claude Code | 🟡 部分 partial（MCP clients） | ⚠️ 需各自整合 per-app | ❌ 鎖在單一工具 single tool |
| 跨月語意召回 Semantic recall | ❌ 無（v1.3 規劃詞法搜尋） | ⚠️ | ✅ | ✅ 向量檢索 vector recall | ❌ |
| 免 daemon No daemon | ✅ 純檔案 plain files | ❌ worker + DB | ✅ | ❌ 服務/API service | ✅ |
| Windows | ✅ 第一優先 first-class | ⚠️ | ⚠️ 弱 weak | ⚠️ | ✅ |

\* 逐工具的「注入／寫回／compaction 存活」三層真實等級，見 [COMPATIBILITY.md](COMPATIBILITY.md)。

---

## 🛠️ 進階用法 (Advanced Usage)

### 記憶瘦身 (Consolidation)

當專案開發週期拉長，`DECISIONS.md` 可能過於龐大。執行自動歸檔：

```sh
node memo.js consolidate
```

或直接要求 Agent：「請幫我整理並壓縮目前的 DECISIONS.md，保留最新的架構決策即可。」

`doctor` 指令會在單檔超過 ~4KB 時自動警告：

```sh
node memo.js doctor
```

### 與團隊協作 (Team Collaboration)

由於記憶都儲存為純文字 Markdown，您可以直接將 `.ai/memory/` 提交至 Git 儲存庫，讓團隊成員無縫接軌專案的 AI 上下文，也可以整合進 CI/CD pipeline 進行版控。

### 狀態檢查

```sh
node memo.js status   # 查看帳本新鮮度與摘要
node memo.js doctor   # 完整健診（hooks / 帳本 / 路徑）
```

---

## ❓ 疑難排解 (Troubleshooting)

**Hooks 沒有觸發**
- 執行 `node memo.js doctor` 檢查 settings.json 與帳本狀態。
- 確認 `~/.claude/settings.json` 的 hook command 是絕對路徑且檔案存在；搬移 repo 後需重跑安裝腳本。
- 重啟 Claude Code session（hooks 在 session 啟動時載入）。

**安裝程式說 JSON 解析失敗**
- 這是刻意的安全機制：settings.json 損壞時絕不覆寫。手動修好 JSON（找最近的 `settings.json.memo-star.bak.*` 備份）再重跑。

**某個專案不想要記憶**
- 什麼都不用做：沒有 `.ai/memory/` 的專案，所有 hooks 一律立即 exit 0，零成本。

**摘要內容過期**
- 帳本超過 2 小時未更新會被標記 STALE，摘要會提醒「先驗證再信任」。執行 `node memo.js status` 查看，請 Agent 重寫 NOW/NEXT。

**帳本長太大**
- 執行 `node memo.js consolidate` 歸檔已完成項目並去重。`doctor` 會在單檔 > ~4KB 時警告。

**解除安裝**
- `install.ps1 -Uninstall`（或 `install.sh --uninstall`）只移除 memo-star 的 hook 項目，其餘設定原封不動；專案內刪除 `.ai/memory/` 與 AGENTS.md 標記區段即可。

---

## 📄 授權條款 (License)

本專案採用 [MIT](LICENSE) 授權條款。
