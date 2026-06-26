<p align="center">
  <img src="https://github.com/erikhuang76821/code-recall/blob/master/docs/assets/1.png?raw=true" alt="Code Recall — Decision Persistence Layer for AI Coding" width="100%">
</p>

<p align="center"><a href="README.md">English</a> · <b>繁體中文</b></p>

# 🌟 Code Recall — 你的 coding agent 會忘記*為什麼*

> 長 session 跑到一半,context 視窗一壓縮——agent 就重開你一小時前拍板的決定、重走你已排除的死路,有時甚至**把剛寫的 code 反過來重寫**。理由本來在對話裡,壓縮把它吃掉了。Code Recall 讓它在**每次重置時都擺在 agent 面前**——而不是指望模型自己想起來。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/erikhuang76821/code-recall/actions/workflows/ci.yml/badge.svg)](https://github.com/erikhuang76821/code-recall/actions/workflows/ci.yml)
[![Version](https://img.shields.io/badge/version-2.9-orange.svg)](ROADMAP.md)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

Code Recall 是給 AI coding agent 的一個極輕量**本地決策 ledger**。它保存專案最容易弄丟、也最難重建的東西——**為什麼當初這樣做、哪些路已被證明走不通**——用純 Markdown 存,並由 SessionStart hook 在 **context 重置的那一刻把它重新注入到 agent 面前**(session 啟動、resume、壓縮後)——另有 PreCompact hook 在壓縮前先把對話尾端快照下來(這是 Claude Code 原生 hook;其他工具為指令驅動,見下)。不是記憶資料庫,不上雲,不是治理平台。零依賴、留在 repo 裡,Claude Code / Cursor / Gemini CLI 同一套設定。就是「**撐過 compaction 的決策版 Git**」。

**需求 / Requirements** · Node ≥ 10.12（2018 年後即可；CI 實測 Node 18 / 20 × Linux / Windows）。

---

## 🎬 看它運作 — 壓縮後 agent 看到什麼

一份真實的 ledger,主題是*「替付款 webhook 加 idempotency」*。做到一半,context 視窗壓縮。**沒有** Code Recall 時,agent 斷線——重提你已否決的設計,或重加它剛寫好的 dedup key。**有**它時,在新(壓縮後)context 一開始的那一刻,Code Recall 的 SessionStart hook 就把這個重新注入(`coderecall digest --compact`,代表性真實輸出、已截短):

```text
Context was just compacted. Re-anchor from the ledger NOW before doing anything else.
…
<<<CODE-RECALL:UNTRUSTED-LEDGER-DATA:BEGIN>>>
GOAL: Add idempotency to the payments webhook so retries can't double-charge
NOW: writing the Redis dedup key — chose a 24h TTL (Stripe retries up to 3 days, but our events expire in 24h)
NEXT: backfill the last 7 days of events, then enable in prod behind a flag

Blocked: - [!] backfill blocked — need prod Redis credentials from ops

Current decisions (2, newest first — read before proposing changes):
- Process webhooks async, ack immediately
- Use Redis SETNX for webhook idempotency
<<<CODE-RECALL:UNTRUSTED-LEDGER-DATA:END>>>
```

agent 重錨定到當前的 `NOW` **連同它的理由**(為什麼 24h TTL),看到 blocker *和它的原因*,也看到兩條已在生效的決策——而不是重新推導或反過來牴觸它們。這是**真實 hook** 的輸出;一個 [CI 回歸測試](#-自我驗證-selftest--ci)在 Linux + Windows 上實際驅動真 hook、釘住這個重錨定**行為**(測試用的是它自己的 fixture,不是這份展示用的 ledger)。

<details>
<summary>產生它的整份 ledger(三個小檔)</summary>

```md
# TASK   (.ai/memory/TASK.md)
GOAL: Add idempotency to the payments webhook so retries can't double-charge
NOW: writing the Redis dedup key — chose a 24h TTL (Stripe retries up to 3 days, but our events expire in 24h)
NEXT: backfill the last 7 days of events, then enable in prod behind a flag
UPDATED: 2026-06-26T10:00:00+08:00

## Checklist
- [x] reproduce the double-charge under webhook retry
- [>] add the Redis SETNX idempotency key
- [!] backfill blocked — need prod Redis credentials from ops
```

`DECISIONS.md` 存上面那兩條決策(Context / Decision / Consequences + 狀態);`LESSONS.md` 存「別重試 X 因為 Y」的坑。這就是全部格式——純 Markdown,沒有 schema 要學。
</details>

> **「自動」的誠實範圍** · 全自動注入只有 **Claude Code**(原生 SessionStart/PreCompact hook)。在 Cursor / Copilot / Windsurf / Codex 上是**指令驅動**——`AGENTS.md` 裡的協定文字*就是* hook,所以它取決於工具是否遵守,而非一個保證觸發的生命週期事件。逐工具真實等級見 [COMPATIBILITY.md](COMPATIBILITY.md)。

---

## 🧭 它補的洞，和它不做的事

你的 agent 早就有好幾個「類記憶」表面——它們只是各自回答不同問題。Code Recall 不取代任何一個,它補的是**沒有人涵蓋的那一格:為什麼這樣決定、哪些路已證明是死路。** 放在同一檯面:

| | `/init` | 自動記憶（`MEMORY.md`）\* | 規則檔（`CLAUDE.md` / `AGENTS.md`） | `/handoff` | **Code Recall** |
|---|---|---|---|---|---|
| **回答的問題** | 程式碼*是什麼* | 跨專案 / 本機雜項 | 常駐*規矩* | *這場對話*聊到哪 | **為什麼這樣決定 + 哪條路是死路** |
| **時間性** | 一次性快照 | 持續累積、跨專案 | 長期穩定 | 一次性 | 持續演化、有生命週期 |
| **觸發** | 手動 `/init` | harness 管理 | 每回合自動讀 | 手動 `/handoff` | **hook 自動**(session 開場 / 壓縮前) |
| **範圍** | 單一 repo | 你的機器 | 單一 repo | 單次對話 | 單一 repo(跟著 git 走) |
| **跟著 repo 走** | ✅（`CLAUDE.md`） | ❌ 只在本機 | ✅ | ❌ | ✅ 團隊共用 |
| **跨 compaction 存活** | ⚠️ 若常駐 | ⚠️ harness 決定 | ✅ 常駐 | ❌ 一次性 | ✅ **設計上自動重新注入** |
| **過期自動退役** | ❌ 要手動重跑 | 手動 | ❌ | 不適用 | ✅ supersede / expire / 歸檔 |

<sub>\* Claude Code 自帶的 file-based 記憶（`~/.claude/.../memory/MEMORY.md`）——和 Code Recall 是**不同層**,兩者刻意分開（見下方 boundary 說明）。</sub>

各一句話:`/init` = *程式碼是什麼* · 規則檔 = *常駐規矩* · `/handoff` = *這場對話的結尾交接* · 自動記憶 = *你跨專案/本機的雜項* · **Code Recall = 為什麼這樣做、哪些死路要避開、現在做到哪——每次重置都自動重現。** 也和 RAG / 向量 / 語意記憶不同:那是**檢索**,這是**決策 rationale**。

**保存（專案最常弄丟的）：**
- **決策與約束** — 為什麼是現在這樣
- **失敗嘗試** — 哪些路別再走（don't retry X because Y）
- **目標與進行中的線** — 你正做到哪（compaction 抹不掉）

…而且不像你會忘記更新的 doc，它每 session 重新注入、compaction 前快照、過期/被取代的決策自動退役（ADR 狀態生命週期）。

> **與自動記憶的 boundary** · `.ai/memory/` 是唯一事實來源——決策、教訓、工作狀態都住這裡,絕不重複寫進 harness 的自動記憶。自動記憶只放 Code Recall 刻意*不管*的:專案定位、跨專案脈絡、本機 OS/工具怪癖。兩者因此永不記同一件事兩次,也不會各自漂移。

---

## 😫 痛點 (The Problem)

大型專案最容易遺失的，往往不是「做到哪」（看 code/git 就知道），而是：

- **為什麼當初這樣做** + **哪些路已證明走不通**——只活在對話裡，視窗一壓縮就蒸發 → 重新 litigate 已定決策、重走死路（最貴的浪費）。
- 對話到一半被自動壓縮，agent 斷線、重做、甚至**推翻自己剛寫的東西**。
- 跨工具切換（Claude Code ↔ Cursor ↔ Copilot）記憶無法共享，每次重講。
- 市面記憶工具（mem0 / supermemory 等）要架 DB、配向量、上雲、付費 API——對「只想讓寫 code 的 agent 別忘了決策、又不想把代碼送上雲」的人太重。

## 🎯 解決方案 (The Solution)

Code Recall 採「減法哲學」：把記憶濃縮成幾個靜態 Markdown 檔，靠底層 Hook 在 session 開始 / 壓縮後**自動把任務摘要重新注入**，agent 依協定持續改寫帳本。

### ✨ 核心特色

- **🍃 零依賴：** 無 DB、無背景服務、無網路、零 npm 執行期依賴；100% 本地檔案，代碼不外流。
- **🛡️ Compaction 存活：** PreCompact 壓縮前快照，壓縮後自動全量重錨定。這是我們唯一守在證據上的宣稱——一個 [CI 回歸測試](#-自我驗證-selftest--ci)在 Linux + Windows 上實際驅動真 hook，每次 push 都斷言重錨定成立。
- **🤝 跨工具共享：** 同一份 `.ai/memory/`，經 `AGENTS.md` 協定被各 IDE/CLI 讀取；git clone 就帶著走。
- **⚡ Token 紀律：** 每次只注入一份精簡、有預算上限的摘要——digest 的 fence 內容有硬上限（~1.2 KB、數百 token），整個帳本**不會**被塞進 context；非 Code Recall 專案零成本。
- **🔎 可搜尋：** 零依賴 BM25 詞法搜尋（中英皆可），補上跨月召回。
- **🧹 防陳舊：** 時序/取代/過期模型 + `doctor` lint + 選配 git pre-commit 閘門，讓「陳舊帳本誤導」風險最小化。
- **🚨 出錯大聲，不靜默失敗：** 容錯的 `TASK.md` 解析 + digest/`doctor` 警告，會在 agent 重錨定**之前**就把格式錯亂或 append 漂移的帳本攤開——漏冒號的 `NOW`、多行 `NOW`（只 append 不 rewrite）、或內容其實已完成的 `NOW`——而不是靜默送出空的/誤導的錨點。`GOAL`/`NOW`/`NEXT` 只在標頭區解析，檔案深處的散文行無法劫持現行狀態錨點。寫入的 ADR 欄位也絕不被靜默截斷；帳本鎖帶 ownership token，長時間寫入不會被誤判 stale 而把鎖刪到別人手裡（無並行寫入毀損）。

> **它做不到的事(誠實邊界)** · 帳本只跟它被維護的程度一樣可靠。一旦停止更新,它就變成**看起來很權威的過期錯誤**——緩解靠的是偵測(`doctor` lint、stale flag、出錯大聲),不是預防。而且它**無法判斷 code 已經背叛某個決策**——那需要語意理解(LLM/向量),超出零依賴範圍;Code Recall 把*現行*決策推到 agent 眼前 + 寫入時示警,最大化「被看到」的機率,但不做矛盾偵測。全自動注入也只在 Claude Code 保證(見上)。

---

## 🚀 快速開始 (Quick Start)

> **心智模型** · **工具**每台機器裝**一次**；**記憶是 per-project**：你在**每個要追蹤的 repo** 底下跑 `coderecall init`，那個 repo 的決策日誌就住在它自己的 `.ai/memory/`。**沒有中央記憶庫**——這是刻意設計（決策跟著它描述的程式碼走）。

### 0. 讓 `coderecall` 指令可用（每台機器一次）

```sh
# 從原始碼安裝（目前的方式 — 尚未發佈到 npm）：
git clone https://github.com/erikhuang76821/code-recall && cd code-recall && npm link
# npm i -g coderecall              # 發佈後可用，隨處可裝
```

> 尚未上 npm、也還沒有 tagged release——請用上面的 clone 安裝。精神上仍是 pre-1.0;版本號追蹤的是內部變更,不是已發佈的套件。

### 1. 在專案底下初始化記憶（每個專案一次）

```sh
cd path/to/your-project             # ← 你要追蹤的專案，不是工具資料夾
coderecall init                     # 在「這個專案」建立 ./.ai/memory/
# 還沒裝全域指令？從 clone 跑：  node /path/to/code-recall/coderecall.js init
```

建立 `.ai/memory/`，並在 `AGENTS.md` 插入協定區段（無原生 Hook 工具的指令型 Hook）：

| 檔案 | 用途 |
|---|---|
| `TASK.md` | 當前目標與進度：`GOAL` / `NOW` / `NEXT` + checklist |
| `DECISIONS.md` | **決策日誌（ADR 級）**：Context / Decision / Consequences + status（proposed/accepted/superseded/deprecated）|
| `LESSONS.md` | 踩坑與根因（"別重試 X 因為 Y"） |

**Git 歸屬（預設 hybrid）：** `init` 會在 `.gitignore` 寫入一段——**耐久的團隊知識（`DECISIONS.md` / `LESSONS.md` + 歸檔）進版控**，**每位開發者各自的工作狀態（`TASK.md` / `sessions.md` / 壓縮快照）留本機**。這樣 `TASK.md` 不會在多人之間造成 `NOW:`/`NEXT:` 合併衝突，git 歷史也不會被機器高頻改動洗版。想在個人私有 repo 也追蹤即時狀態？刪掉 `.gitignore` 區段裡的 `TASK.md` 兩行即可。（committed 的 `AGENTS.md` **刻意不嵌入**即時 `NOW:`/`NEXT:`，避免狀態外洩。）

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

**其他工具（Cursor / Copilot / Windsurf / Cline / Roo / Gemini / Codex）：** 執行 `node coderecall.js sync --all` 產生各工具的指示 stub 與原生設定，協定文字本身就是它們的 Hook。

---

## 🧰 指令一覽 (Command Reference)

```sh
node coderecall.js <command>      # 或發佈後：npx coderecall <command>
```

| 指令 | 作用 |
|---|---|
| `init` | 建立 `.ai/memory/` + AGENTS.md 協定區段 + CLAUDE.md stub |
| `sync [--all]` | 刷新 AGENTS.md 摘要；`--all` 另產各工具 stub + Gemini/Cursor 原生設定 |
| `status` | 顯示 GOAL/NOW/NEXT、checklist、檔案大小、漂移、新鮮度 |
| `doctor [--selftest]` | 健診（hooks/帳本/路徑/lint/Codex 32KiB）；`--selftest` 加跑回歸測試 |
| `score [--json]` | 評估工作狀態健康度（GOAL 清晰度 / NEXT 可執行性 / blockers 有無理由 / 新鮮度） |
| `decision "<title>" [--context/--decision/--consequences/--status/--confidence] [--supersedes "<舊標題/關鍵字>"] [--code "<path → symbol>"]` | 一行記下一筆 ADR 決策；`--supersedes` 顯式取代既有決策（不靠標題相似度）；`--code` 回連它治理的檔案/符號（路徑消失時 `doctor` 會示警）；`--aliases "<同義詞/舊名>"` 加額外搜尋詞，讓詞法搜尋能用標題/內文以外的字找到它 |
| `search <query> [--limit N] [--history]` | 詞法搜尋，**預設只回現行真相**（superseded/deprecated/resolved/obsolete/archive 排除）；`--history` 才含歷史（標 `[superseded]` / `[resolved]`） |
| `decisions [--all]` | **HEAD 視圖**：列出目前 accepted 的決策（`--all` 含已取代/棄用） |
| `resolve-lesson "<title>" [--status resolved\|obsolete] [--note ".."]` | 退役一筆教訓：根因已修（`resolved`）或前提已不存在（`obsolete`）——保留且可經 `--history` 查到，只退出預設結果（mark-over-delete） |
| `reconfirm "<title>" [--file decisions\|lessons] [--confidence ..]` | 重蓋一筆仍成立條目的 `updated:`（可順帶升 confidence）而不重寫內容，讓 recency 排序與 staleness 旗標把它當「新鮮」 |
| `digest [--compact]` | 印出 session 注入用摘要（除錯用） |
| `consolidate` | 歸檔完成項目（月度）、退役 superseded/過期條目、去重、老化降級 |
| `snapshot` | 手動寫一份快照 |
| `mcp` | 啟動零依賴 stdio MCP server（把狀態寫回變成工具呼叫） |
| `precommit [--strict]` | git hook 用：刷新 digest + lint（`--strict` 阻擋） |
| `install-githook [--strict]` / `remove-githook` | 安裝/移除 git pre-commit 閘門 |
| `deinit [--yes]` | 從專案乾淨移除（預設 dry-run） |
| `selftest` / `version` | 跑 compaction 存活回歸測試 / 印版本 |

---

## 🧠 運作原理 (How it Works)

Code Recall 監聽 AI 工具的生命週期 (Lifecycle Hooks)，自動存取記憶：

1. **Session Start** — 從 `.ai/memory/` 讀一份精簡、有預算上限的摘要（fence 內容 ≤ ~1.2 KB、數百 token）注入為 context。
2. **Context Compaction** — `precompact.js` 在壓縮前快照 transcript 尾端；壓縮後的 session 注入**全量 TASK.md** 重錨定。
3. **End of turn** — `stop.js` 維護 heartbeat + 有上限的 `sessions.md` 時間軸。
4. **拉取式召回** — 需要時用 `coderecall search`（BM25）或 MCP 工具**按需**取記憶，不常駐占 context。

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
│ compact digest │   │ snapshot tail  │   │ heartbeat +    │
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
| ✅ 任何 MCP client | `coderecall mcp` — Claude Desktop / Cursor / VS Code… 可直接呼叫記憶工具 |

逐工具的「注入 / 寫回 / compaction 存活」三層真實等級，見 [COMPATIBILITY.md](COMPATIBILITY.md)。

---

<p align="center">
  <img src="https://github.com/erikhuang76821/code-recall/blob/master/docs/assets/2.png?raw=true" alt="Code Recall — capture decisions, stay persistent, avoid re-litigation, episodic memory, local & zero-dependency" width="100%">
</p>

## 🔭 這一層為什麼存在

寫 code 的能力正在商品化。下一個差異化不再是「誰寫得快」，而是「**誰能讓決策不流失、不腐爛、不被無意識重開**」。AI IDE 已經很強在 `Retrieval → Reasoning → CodeGen`，但對 `Decision（為什麼）→ 死路（什麼行不通）` 這層的**持久化**幾乎空白——它通常只活在對話裡，視窗一壓縮就蒸發。Code Recall 想成為那一層的**本地、零依賴地基**：不上雲、不外流、跟著 repo 走，讓每個 AI agent 在動手前都看得到「現行真相」。

## 📊 它在「決策記憶」工具裡的位置

「能記決策」的工具很多；但把「**讓過時決策失去影響力、讓現行決策保持影響力**」當**核心能力**的，少之又少。各家通常只覆蓋其中一兩格：

| 能力 | Memory Bank* | llm-wiki / Obsidian | mem0 / supermemory | ADR tools† | Knowie‡ | **Code Recall** |
|---|---|---|---|---|---|---|
| 低摩擦捕捉 | ✅ | ❌ 手動 | ✅ 自動 | ❌ 手動 | ⚠️ `/capture` | ✅ CLI/MCP |
| 自動浮現（不需手動呼叫） | ⚠️ 視工具 | ❌ | ✅ | ❌ | ❌ pull | ✅ hooks |
| 決策狀態生命週期（accepted/superseded） | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| 過時失去影響力（rot 治理） | ❌ append-only | ❌ | ⚠️ 語意 | ❌ 靠人讀 | ❌ | ✅ 過濾+加權 |
| 跨 compaction 主動浮現 | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ digest |
| 防再 litigate（重疊示警） | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| 本地 / 零依賴 / 無雲 | ✅ | ✅ | ❌ 雲/向量 | ✅ | ✅ | ✅ |
| AI 原生維護 | ⚠️ | ❌ | ✅ | ❌ 人寫 | ⚠️ pull | ✅ |

<sub>\* Cline / Roo / Cursor Memories 類的 append-only memory bank　† adr-tools / log4brains 等人工 ADR 工具　‡ [Knowie](https://github.com/timcsy/knowie) — 本地 Markdown 知識層、slash command 驅動</sub>

ADR 工具有狀態生命週期，但靠人手寫、不會浮現給 agent、也不撐 compaction；memory bank 會自動捕捉，但沒有決策狀態生命週期或影響力治理（append-only → 腐爛）；雲端記憶（mem0 / supermemory）多了語意召回，但不是本地零依賴、也沒有 ADR 式決策生命週期。

**最近身的鄰居是 [Knowie](https://github.com/timcsy/knowie)** — 同樣本地、零依賴、Markdown、「記 *why* 而非 retrieval」。分水嶺在**觸發模型**：Knowie 是 **pull**——你在 chat 主動下 `/knowie-capture`、`/knowie-next`，且刻意偏好人工策展；Code Recall 是 **push**——lifecycle hook 在 session 開始與壓縮前自動觸發，沒人需要「記得」去呼叫（[有 CI 證明](#-自我驗證-selftest--ci)），再加上 Knowie 沒有的決策狀態生命週期。反過來，Knowie 有 vision/principles 對齊層與 git history 遷移，是 Code Recall 沒有的。是不同的賭注，不是比較差。**Code Recall 專注的那個角落：AI 維護的決策生命週期 + 影響力治理 + 跨 compaction 自動浮現，且全本地零依賴**——目前少有工具瞄準這個組合。

> **誠實定位 (Honest positioning)** · 我們**不**跟 mem0/supermemory 比語意召回或多模態（那是雲端產品的主場），也**不**做治理/審批引擎。對最近的本地同類：**Knowie 等你開口問；Code Recall 自己現身**——hook 在 session 開始與壓縮前觸發（在 Claude Code 最強，因有原生 hook；其他工具則靠 instruction 驅動）。Code Recall 的特出之處在那個組合:本地、零依賴、決策生命週期 + 撐過 compaction。逐工具真實等級見 [COMPATIBILITY.md](COMPATIBILITY.md)，競品評估見 [ROADMAP.md](ROADMAP.md)。

---

## 🛠️ 進階用法 (Advanced Usage)

### 🧭 如何瀏覽你的決策(哪個工具回答哪個問題)

帳本**不該整份讀**——那會把整份(且不斷長大的)檔案每回合重新塞進 context、重複計費。四個表面各回答不同問題,所以你只拉任務需要的那一格:

| 你的問題 | 用什麼 | 得到什麼 |
|---|---|---|
| *現況是什麼——我現在站在哪?* | **注入的 digest**(session 開場 / 壓縮後自動) | `GOAL`/`NOW`/`NEXT`、blocked 項,加一份**現行**決策＋教訓**標題**的常駐索引(含總數) |
| *目前有哪些決策在生效?* | `coderecall decisions`(`--all` 連 superseded) | 完整 HEAD：所有 accepted 決策標題 |
| *關於主題 X,有什麼、為什麼?* | `coderecall search <主題>` | 命中條目的**內文**,現行真相優先,按 相關度 × 狀態 × 新鮮度 排序 |
| *我不知道它被歸在哪個字下* | 在條目加 `- aliases:`(同義詞／舊名) | 詞法搜尋現在能用標題/內文以外的字找到它 |

口訣:digest 是**地圖**(有什麼存在),`search` 按需載入**疆域**(為什麼)。你幾乎不需要手動打開 `DECISIONS.md`/`LESSONS.md`。(沒有「主題瀏覽」指令:主題軸經評估後刻意暫緩——`search` + `aliases` 已涵蓋主題召回;rationale 見專案自己的 `DECISIONS.md`。)

### 🔎 搜尋記憶

```sh
node coderecall.js search "idempotency key"     # 預設 5 筆
node coderecall.js search redis 重試 --limit 3   # 中英混合
```
跨帳本 + `archive/` 的零依賴 BM25 詞法搜尋，段落／條目級結果附分數與來源。

### 📊 工作狀態評分 (score)

```sh
node coderecall.js score          # 人類可讀
node coderecall.js score --json   # 給 CI / agent 消費
```

回答「這份帳本**真的**能讓 agent 接手嗎？」——不是看欄位有沒有填，而是**機器檢查可執行性**：GOAL 是否具體、NEXT 是否是一個明確的下一步（"continue" / "TBD" 這種模糊值會被扣分）、每個 `[!]` blocker 有沒有寫理由、帳本是否新鮮。每個維度都附**為什麼**與**先修哪個**。刻意是透明啟發式、不是假精準的 ML 分數——目的是抓出「看起來填好了、其實驅動不了下一步」的假完整。`status` 也會帶一行總分。

### ✅ 自我驗證 (selftest / CI)

```sh
node coderecall.js selftest        # 或 doctor --selftest / npm test
```
在臨時專案模擬 compaction，並**驅動真正的 hook 腳本**（sessionstart / precompact），斷言重錨定 digest 含全量 TASK body 與快照生成。GitHub Actions 在 **Linux + Windows × Node 18/20** 每次 push/PR 跑它——把核心宣稱變成可重現的回歸測試。

### 🧹 時序 / 取代 / 過期 / 再確認（零依賴）

DECISIONS/LESSONS 支援 `expires:`（到期自動遺忘）與取代鏈：寫入標題重疊的決策時，舊條目被**程式碼**標 `status: superseded` 並保留（看得到演化），不是靜默覆蓋。`consolidate` 把 superseded + 過期條目退役到 `archive/retired-YYYY-MM.md`。鏈結由程式碼維護（非 AI 手寫），不承載遍歷邏輯，故無孤兒/死循環風險。

另外兩個生命週期動作，都是 **mark-over-delete**（條目永不銷毀、只重新標記——所以辛苦得來的教訓仍能用 `--history` 找回）：

- **教訓也會退役：** `resolve-lesson "<title>"` 把教訓標 `resolved`（根因已修、坑不再咬人）或 `obsolete`（它警告的情境已不存在）。退出預設搜尋，但留在 `--history`。
- **再確認仍成立的條目：** `reconfirm "<title>"` 刷新條目的 `- updated:` 日期（可順帶升 confidence）而**不重寫內容**。`updated:`（最後確認）與 `date:`（首次記錄）分開追蹤，recency 排序與 staleness 旗標都以 `updated:` 為準——所以你再確認過的舊決策會被當「新鮮」而非衰減。
- **可導航的回連：** 選填的 `- code: <path → symbol>` 把決策/教訓綁到它描述的檔案；該路徑消失時 `doctor` 會示警（條目可能已過時）。URL 與純符號會略過。

> **該記什麼（可恢復性測試）：** 下筆前先問——*一個夠格的工程師能不能單看現有 code 重建這條資訊？* 能的話就別記——帳本是給 code 顯示不出來的東西（為什麼、死路、坑），絕不是給讀 code 就能還原的內容。

### 🔌 選配：MCP server（讓寫回變成工具呼叫）

```jsonc
// Claude Desktop / Cursor / 任何 MCP client
{ "mcpServers": { "coderecall": { "command": "node", "args": ["<path>/code-recall/coderecall.js", "mcp"] } } }
```
零依賴 stdio JSON-RPC，暴露 `read_memory` / `update_task` / `write_decision` / `write_lesson` / `resolve_lesson` / `reconfirm` / `search_memory`。把「榮譽制寫回」變成工具呼叫；檔案仍是儲存層，AGENTS.md 繼續覆蓋無 MCP 的工具。

### ♻️ 決策的「現行真相」與影響力治理 (influence governance)

長期記憶最危險的不是**忘記**，而是**錯誤地記住**——過時/被取代的決策仍被反覆召回，污染 context（influence rot）。Code Recall 把決策當 **Git 而非向量庫**：重點是「**哪個是 HEAD（現行）**」而非「哪個最像」。

- **現行/歷史分離**：`search` 與 MCP `search_memory` **預設只回現行決策**；superseded/deprecated/archive 不出現。要看歷史才加 `--history`（明確標 `[superseded]`）。`decisions` 給你 HEAD 視圖。
- **顯式取代**：`decision "新決定" --supersedes "舊關鍵字"` 直接讓舊決策失去影響力——不靠標題相似度。
- **加權排序**：召回分數 = `BM25 × 狀態權重(accepted/active 1.0 / proposed 0.5 / deprecated 0.2 / resolved 0.1 / superseded·obsolete 0.05) × confidence × recency`。同樣命中時，**現行、高信心、近期**的決策一定排前面。
- **主動浮現（常駐索引·抗斷片）**：每次 session / compaction 後，digest 列出**現行決策標題與 active 教訓標題**（newest-first），每個表頭**永遠帶總數**＋取得其餘的路徑（`decisions` 列全部、`search` 拉內文）。agent 因此看得到*哪些*決策與坑存在——不會靜默漏掉一條而重決／重踩——內文維持按需載入（**地圖**常駐、**疆域**按需）。受各區標題上限＋fence 預算封頂。**誠實 scope**：常駐的是*存在性地圖*（標題＋總數＋存取路徑），**不是內文**；且檢索是詞法的，只靠同義詞才找得到的條目仍可能漏。在條目加 `- aliases: <同義詞／舊名>` 即可零依賴補上這個洞。
- **防再 litigate**：記新決策時若與某條 accepted 決策明顯重疊但未到自動取代門檻，提示三條解法：`--supersedes "X"`、`--confirm-new`、或改寫標題。

> 設計哲學：LLM 缺的不是 storage，是 **attention**——問題不是能存幾條，而是「這個任務該被看到的是哪幾條」。
>
> ⚠️ 零依賴邊界：偵測「**程式碼**牴觸決策」需要語意理解（LLM/向量），不在範圍內。Code Recall 的做法是**把現行決策推到 agent 眼前 + 作者下筆時示警**——最大化「看得到、不重決」的機率，但不做語意級的矛盾偵測。

### ✍️ 可靠捕捉決策 (reliable capture)

決策日誌只有在「真的被記下來」時才有價值。Code Recall 用兩個**非脅迫**的槓桿降低漏記：

```sh
node coderecall.js decision "Adopt hexagonal architecture" \
  --context "billing 邏輯與 HTTP 糾纏" --decision "ports/adapters" --consequences "更多樣板但好測"
```

- **降低摩擦**：`decision` 一行就記一筆 ADR（或用 MCP `write_decision`，agent 直接呼叫）。
- **在對的關卡輕推**：git pre-commit 若偵測到你 commit 了原始碼卻沒記任何決策，會印**一行勸告**（永不阻擋；不是每回合的 Stop hook 嘮叨）。
- 不靠脅迫式 prompt——真正的把關交給 commit 閘 + 人；提示只是提示。

### 🪝 選配：Git pre-commit 閘門（讓程式碼維護派生狀態）

```sh
node coderecall.js install-githook            # 勸告模式：lint 出錯只警告，commit 照過
node coderecall.js install-githook --strict   # 嚴格模式：格式錯誤直接擋下 commit
node coderecall.js remove-githook
```
commit 時自動以 `TASK.md` 重生 AGENTS.md 摘要 + lint 帳本，並 re-stage 已追蹤的 AGENTS.md/CLAUDE.md。跨平台（node 產生 sh hook）、marker 合併不覆蓋既有 hook、`deinit` 會一併移除。需繞過一次：`git commit --no-verify`。

### 🎓 選配（實驗性，非核心）：知識畢業 + 跨專案教訓

```sh
node coderecall.js graduate            # >90 天、confidence high 匯出成 docs/adr/NNNN-*.md（ADR 檔）
node coderecall.js graduate --global   # 另寫進 ~/.coderecall/GLOBAL-LESSONS.md（跨專案）
```
非破壞性（條目留在帳本標 `graduated:`，只匯出一次）。決策會輸出成慣例的編號 ADR 檔，可被 adr-tools/log4brains 消費。digest 注入跨專案教訓（限 top-3）：開 `CODE_RECALL_GLOBAL_LESSONS=1`；全域目錄可用 `CODE_RECALL_GLOBAL_DIR` 改位置。

### 🔔 選配：過期提醒 hook（預設關）

為遵守 token 紀律預設**不安裝**。在 `~/.claude/settings.json` 加 UserPromptSubmit hook 指向 `hooks/userpromptsubmit.js` 即可啟用：帳本 >45 分鐘未更新時注入一行 ~15 token 提醒，節流不重複。

### 🧹 記憶瘦身 + 🤝 團隊協作

```sh
node coderecall.js consolidate   # 歸檔完成項目、退役過期條目、去重
```
記憶都是純文字 Markdown，直接把 `.ai/memory/` 提交進 Git，團隊成員與 CI/CD 即可共用同一份 AI 上下文。

---

## ❓ 疑難排解 (Troubleshooting)

**Hooks 沒觸發** — 跑 `node coderecall.js doctor`；確認 `~/.claude/settings.json` 的 hook 是絕對路徑且檔案存在（搬 repo 後重跑安裝腳本）；重啟 Claude Code session。

**安裝程式說 JSON 解析失敗** — 刻意的安全機制：settings.json 損壞時絕不覆寫。修好 JSON（找 `settings.json.coderecall.bak.*` 備份）再重跑。

**某專案不想要記憶** — 什麼都不用做：沒有 `.ai/memory/` 的專案，所有 hooks 立即 exit 0，零成本。

**摘要過期** — 帳本 >2 小時未更新會標 STALE，摘要提醒「先驗證再信任」。跑 `node coderecall.js status`，請 agent 重寫 NOW/NEXT。

**帳本太大** — 跑 `node coderecall.js consolidate`；`doctor` 會在單檔 > ~4KB 時警告。

**解除安裝** — 全域 hooks：`install.ps1 -Uninstall` / `install.sh --uninstall`（只移除 coderecall 項目）。單一專案：`node coderecall.js deinit`（dry-run）→ `--yes`（執行），保留你在共享檔中的內容。

---

## 📄 授權 (License)

[MIT](LICENSE)。
