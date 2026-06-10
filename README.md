# 🌟 Memo-star — The Zero-Dependency AI Memory Layer

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/erikhuang76821/Memo-star/actions/workflows/ci.yml/badge.svg)](https://github.com/erikhuang76821/Memo-star/actions/workflows/ci.yml)
[![Version](https://img.shields.io/badge/version-2.0-orange.svg)](ROADMAP.md)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

**Memo-star** 是一個極致輕量的「跨工具 AI 記憶持久化層」。不需常駐程式 (daemon-less)、不需資料庫、不需 API Key、不需網路。用純 Markdown 檔案 + 生命週期 Hook，讓你的 AI Coding Agents（Claude Code、Cursor、Windsurf、Copilot…）在 **context 被壓縮 (compaction) 後仍接得回任務**。

> Zero-friction persistent memory for AI coding agents — survives context compaction, works across every IDE/CLI. No daemon, no vector DB, no API keys, no network.

**需求：** Node ≥ 10.12（2018 年後的 Node 即可；CI 實測 Node 18 / 20 × Linux / Windows）。

---

## 😫 痛點 (The Problem)

複雜開發中，AI 助手常因 Context Window 耗盡而「失憶」：

- 對話到一半被自動壓縮，agent 斷線、重做、甚至**推翻自己剛寫的東西**。
- 「為什麼選 X」「別再試 Y」只活在對話裡，視窗一滾就蒸發 → 重複踩坑。
- 跨工具切換（Claude Code ↔ Cursor ↔ Copilot）記憶無法共享，每次重講。
- 市面記憶工具（mem0 / supermemory 等）要架 DB、配向量、上雲、付費 API——對「只想讓寫 code 的 agent 別失憶、又不想把代碼送上雲」的人太重。

## 🎯 解決方案 (The Solution)

Memo-star 採「減法哲學」：把記憶濃縮成幾個靜態 Markdown 檔，靠底層 Hook 在 session 開始 / 壓縮後**自動把任務摘要重新注入**，agent 依協定持續改寫帳本。

### ✨ 核心特色

- **🍃 零依賴：** 無 DB、無背景服務、無網路、零 npm 執行期依賴；100% 本地檔案，代碼不外流。
- **🛡️ Compaction 存活：** PreCompact 壓縮前快照，壓縮後自動全量重錨定——同類最強的一格，且有 [CI 回歸測試](#-自我驗證-selftest--ci)背書。
- **🤝 跨工具共享：** 同一份 `.ai/memory/`，經 `AGENTS.md` 協定被各 IDE/CLI 讀取；git clone 就帶著走。
- **⚡ Token 紀律：** 每次只注入 ≤200 token 的摘要（整個帳本**不會**被塞進 context），非 memo 專案零成本。
- **🔎 可搜尋：** 零依賴 BM25 詞法搜尋（中英皆可），補上跨月召回。
- **🧹 防陳舊：** 時序/取代/過期模型 + `doctor` lint + 選配 git pre-commit 閘門，讓「陳舊帳本誤導」風險最小化。
- **🪟 Windows 第一優先：** PowerShell 安裝腳本，原生支援 Windows 11。

---

## 🚀 快速開始 (Quick Start)

### 1. 初始化專案記憶（每個專案一次）

```sh
# 發佈到 npm 後，免 clone 直接用（執行期仍零依賴）
npx memo-star init

# 或從原始碼
node path/to/Memo-star/memo.js init        # macOS / Linux
node path\to\Memo-star\memo.js init        # Windows
```

建立 `.ai/memory/`，並在 `AGENTS.md` 插入協定區段（無原生 Hook 工具的指令型 Hook）：

| 檔案 | 用途 |
|---|---|
| `TASK.md` | 當前目標與進度：`GOAL` / `NOW` / `NEXT` + checklist |
| `DECISIONS.md` | 架構決策與發現（附日期、信心度） |
| `LESSONS.md` | 踩坑與根因（"別重試 X 因為 Y"） |

### 2. 安裝全域 Hooks（每台機器一次，僅 Claude Code 需要）

```powershell
powershell -ExecutionPolicy Bypass -File install.ps1   # Windows
```
```sh
sh install.sh                                          # macOS / Linux
```

安裝程式只會「合併」進 `~/.claude/settings.json`：先備份、絕不覆蓋既有 hooks、可重複執行（idempotent）。解除安裝：`install.ps1 -Uninstall` / `install.sh --uninstall`。

### 3. 完成

之後不需手動操作 — Hooks 在每次 session 開始 / 壓縮後自動注入任務摘要，agent 依協定改寫帳本。

**其他工具（Cursor / Copilot / Windsurf / Cline / Roo / Gemini / Codex）：** 執行 `node memo.js sync --all` 產生各工具的指示 stub 與原生設定，協定文字本身就是它們的 Hook。

---

## 🧰 指令一覽 (Command Reference)

```sh
node memo.js <command>      # 或發佈後：npx memo-star <command>
```

| 指令 | 作用 |
|---|---|
| `init` | 建立 `.ai/memory/` + AGENTS.md 協定區段 + CLAUDE.md stub |
| `sync [--all]` | 刷新 AGENTS.md 摘要；`--all` 另產各工具 stub + Gemini/Cursor 原生設定 |
| `status` | 顯示 GOAL/NOW/NEXT、checklist、檔案大小、漂移、新鮮度 |
| `doctor [--selftest]` | 健診（hooks/帳本/路徑/lint/Codex 32KiB）；`--selftest` 加跑回歸測試 |
| `search <query> [--limit N]` | 零依賴 BM25 詞法搜尋（帳本 + archive，中英皆可） |
| `digest [--compact]` | 印出 session 注入用摘要（除錯用） |
| `consolidate` | 歸檔完成項目（月度）、退役 superseded/過期條目、去重、老化降級 |
| `snapshot` | 手動寫一份快照 |
| `graduate [--global]` | 把 >90 天高信心條目匯出到 `docs/ai_wiki/`（+選配跨專案教訓） |
| `mcp` | 啟動零依賴 stdio MCP server（把記憶寫回變成工具呼叫） |
| `precommit [--strict]` | git hook 用：刷新 digest + lint（`--strict` 阻擋） |
| `install-githook [--strict]` / `remove-githook` | 安裝/移除 git pre-commit 閘門 |
| `deinit [--yes]` | 從專案乾淨移除（預設 dry-run） |
| `selftest` / `version` | 跑 compaction 存活回歸測試 / 印版本 |

---

## 🧠 運作原理 (How it Works)

Memo-star 監聽 AI 工具的生命週期 (Lifecycle Hooks)，自動存取記憶：

1. **Session Start** — 從 `.ai/memory/` 讀摘要（≤200 token）注入為 context。
2. **Context Compaction** — `precompact.js` 在壓縮前快照 transcript 尾端；壓縮後的 session 注入**全量 TASK.md** 重錨定。
3. **End of turn** — `stop.js` 維護 heartbeat + 有上限的 `sessions.md` 時間軸。
4. **拉取式召回** — 需要時用 `memo search`（BM25）或 MCP 工具**按需**取記憶，不常駐占 context。

```
                         ┌───────────────────────────────┐
                         │      <project>/.ai/memory/    │
                         │  TASK.md      (GOAL/NOW/NEXT) │
                         │  DECISIONS.md (dated entries) │
                         │  LESSONS.md   (failures+why)  │
                         │  sessions.md  (timeline)      │
                         │  archive/     (snapshots)     │
                         └──────┬───────────────▲────────┘
                read+inject     │               │  write/rewrite
        ┌───────────────────────┤               │  (recitation / MCP tools)
        │                       │               │
┌───────▼────────┐   ┌──────────▼─────┐   ┌─────┴──────────┐
│ sessionstart.js│   │  precompact.js │   │    stop.js     │
│ digest ≤200 tok│   │ snapshot tail  │   │ heartbeat +    │
│ into context   │   │ of transcript  │   │ sessions line  │
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
| ✅ Claude Code | 原生 Hooks（SessionStart / PreCompact / Stop）— 注入、快照、重錨定全自動 |
| ✅ Cursor | `.cursor/rules` 指令型 Hook + `.cursor/hooks.json` Stop 心跳（`sync --all`） |
| ✅ GitHub Copilot | `.github/copilot-instructions.md` 指令型 Hook |
| ✅ Windsurf | `.windsurf/rules`（`trigger: always_on`） |
| ✅ Cline / Roo | `.clinerules` / `.roo/rules` 指令型 Hook |
| ✅ Gemini CLI | `.gemini/settings.json` 原生載入 AGENTS.md |
| ✅ Codex CLI | AGENTS.md（`doctor` 會警告超過 ~32KiB 讀取上限） |
| ✅ 任何 MCP client | `memo mcp` — Claude Desktop / Cursor / VS Code… 可直接呼叫記憶工具 |

逐工具的「注入 / 寫回 / compaction 存活」三層真實等級，見 [COMPATIBILITY.md](COMPATIBILITY.md)。

---

## 📊 比較 (Comparison)

|  | Memo-star | claude-mem | MemPalace | mem0 / supermemory |
|---|---|---|---|---|
| 自動注入 | ✅ hooks，零手動 | ✅ hooks | ✅ hooks | ⚠️ 需整合 SDK/API |
| Compaction 存活 | ✅ Claude Code（快照+重錨定）/ 🟡 其他 | ⚠️ 部分 | 🟡 有快照、無重錨定 | ❌ 與 context 無關 |
| 寫回 (write-back) | ✅ hooks(CC) / MCP / 指令協議 | ⚠️ | ✅ | ✅ 自動抽取 |
| 跨工具 | ✅ AGENTS.md + 各工具 stub | ❌ 僅 Claude Code | 🟡 MCP clients | ⚠️ 需各自整合 |
| 跨月召回 | 🟡 詞法 BM25（`memo search`） | ⚠️ | ✅ 語意 | ✅ 向量/語意 |
| 免 daemon / 無雲 / 無 API key | ✅ 純檔案、本地 | ❌ worker+DB | ❌ MCP server | ❌ 服務/雲端 |
| Windows | ✅ 第一優先 | ⚠️ | ⚠️ 弱 | ⚠️ |

> **定位：** Memo-star 不跟 mem0/supermemory 比語意召回或多模態（那是雲端產品的主場）。它贏在**本地、零依賴、不外流、跨工具、且專治 compaction 斷線**。詳見 [ROADMAP](ROADMAP.md) 的競品評估。

---

## 🛠️ 進階用法 (Advanced Usage)

### 🔎 搜尋記憶

```sh
node memo.js search "idempotency key"     # 預設 5 筆
node memo.js search redis 重試 --limit 3   # 中英混合
```
跨帳本 + `archive/` 的零依賴 BM25 詞法搜尋，段落／條目級結果附分數與來源。

### ✅ 自我驗證 (selftest / CI)

```sh
node memo.js selftest        # 或 doctor --selftest / npm test
```
在臨時專案模擬 compaction，並**驅動真正的 hook 腳本**（sessionstart / precompact），斷言重錨定 digest 含全量 TASK body 與快照生成（11 項檢查）。GitHub Actions 在 **Linux + Windows × Node 18/20** 每次 push/PR 跑它——把核心宣稱變成可重現的回歸測試。

### 🧹 時序 / 取代 / 過期（v2.0 零依賴）

DECISIONS/LESSONS 支援 `expires:`（到期自動遺忘）與取代鏈：寫入標題重疊的決策時，舊條目被**程式碼**標 `status: superseded` 並保留（看得到演化），不是靜默覆蓋。`consolidate` 把 superseded + 過期條目退役到 `archive/retired-YYYY-MM.md`。鏈結由程式碼維護（非 AI 手寫），不承載遍歷邏輯，故無孤兒/死循環風險。

### 🔌 選配：MCP server（讓寫回變成工具呼叫）

```jsonc
// Claude Desktop / Cursor / 任何 MCP client
{ "mcpServers": { "memo-star": { "command": "node", "args": ["<path>/Memo-star/memo.js", "mcp"] } } }
```
零依賴 stdio JSON-RPC，暴露 `read_memory` / `update_task` / `write_decision` / `write_lesson` / `search_memory`。把「榮譽制寫回」變成工具呼叫；檔案仍是儲存層，AGENTS.md 繼續覆蓋無 MCP 的工具。

### 🪝 選配：Git pre-commit 閘門（讓程式碼維護派生狀態）

```sh
node memo.js install-githook            # 勸告模式：lint 出錯只警告，commit 照過
node memo.js install-githook --strict   # 嚴格模式：格式錯誤直接擋下 commit
node memo.js remove-githook
```
commit 時自動以 `TASK.md` 重生 AGENTS.md 摘要 + lint 帳本，並 re-stage 已追蹤的 AGENTS.md/CLAUDE.md。跨平台（node 產生 sh hook）、marker 合併不覆蓋既有 hook、`deinit` 會一併移除。需繞過一次：`git commit --no-verify`。

### 🎓 選配：知識畢業 + 跨專案教訓

```sh
node memo.js graduate            # >90 天、confidence high 匯出到 docs/ai_wiki/
node memo.js graduate --global   # 另寫進 ~/.memo-star/GLOBAL-LESSONS.md（跨專案）
```
非破壞性（條目留在帳本標 `graduated:`，只匯出一次）。digest 注入跨專案教訓（限 top-3）：開 `MEMO_STAR_GLOBAL_LESSONS=1`；全域目錄可用 `MEMO_STAR_GLOBAL_DIR` 改位置。

### 🔔 選配：過期提醒 hook（預設關）

為遵守 token 紀律預設**不安裝**。在 `~/.claude/settings.json` 加 UserPromptSubmit hook 指向 `hooks/userpromptsubmit.js` 即可啟用：帳本 >45 分鐘未更新時注入一行 ~15 token 提醒，節流不重複。

### 🧹 記憶瘦身 + 🤝 團隊協作

```sh
node memo.js consolidate   # 歸檔完成項目、退役過期條目、去重
```
記憶都是純文字 Markdown，直接把 `.ai/memory/` 提交進 Git，團隊成員與 CI/CD 即可共用同一份 AI 上下文。

---

## ❓ 疑難排解 (Troubleshooting)

**Hooks 沒觸發** — 跑 `node memo.js doctor`；確認 `~/.claude/settings.json` 的 hook 是絕對路徑且檔案存在（搬 repo 後重跑安裝腳本）；重啟 Claude Code session。

**安裝程式說 JSON 解析失敗** — 刻意的安全機制：settings.json 損壞時絕不覆寫。修好 JSON（找 `settings.json.memo-star.bak.*` 備份）再重跑。

**某專案不想要記憶** — 什麼都不用做：沒有 `.ai/memory/` 的專案，所有 hooks 立即 exit 0，零成本。

**摘要過期** — 帳本 >2 小時未更新會標 STALE，摘要提醒「先驗證再信任」。跑 `node memo.js status`，請 agent 重寫 NOW/NEXT。

**帳本太大** — 跑 `node memo.js consolidate`；`doctor` 會在單檔 > ~4KB 時警告。

**解除安裝** — 全域 hooks：`install.ps1 -Uninstall` / `install.sh --uninstall`（只移除 memo-star 項目）。單一專案：`node memo.js deinit`（dry-run）→ `--yes`（執行），保留你在共享檔中的內容。

---

## 📄 授權 (License)

[MIT](LICENSE)。
