# Code Recall 改版計畫 (Roadmap)

> 來源:六方評估(低依賴稽核 / 兼容矩陣稽核 / vs llm-wiki / vs MemPalace / Codex CLI 8.5 / Gemini CLI 7.8),2026-06-10。

## ⭐ 北極星 (Product goal + 範圍柵欄)

**Code Recall 是 AI 輔助開發的「決策持久化層」(Decision Persistence Layer)。** 它捕捉並保存:**決定了什麼、為什麼、否決了什麼、哪些是已證實的死路**——由 AI 自動維護、本地、零依賴,跨 compaction 與交接不流失、不腐爛。它是 Decision Lifecycle 的**地基**,不是治理引擎。

**填補的缺口:** AI IDE 強在 Retrieval → Reasoning → CodeGen,弱在 Decision → Approval → Governance。`/init`(codebase 文件)與 `/handoff`(對話交接)已有,但**持久 decision log 沒有**。能記決策的工具很多,把「決策持久化」當核心的幾乎沒有。

**範圍柵欄(每個 PR 的取捨依據,防止漂移):**
- **IN(做):** 決策捕捉、理由、死路、ADR 級狀態生命週期(proposed/accepted/superseded/deprecated)、跨 compaction 存活、**本地勸告式**「這牴觸決策 #N」、相關決策浮現。
- **OUT(不做 — 屬另一個產品,需身分/伺服器/多人,背叛零依賴/本地/無雲):** 審批流、RBAC/簽核、合規強制、成本預算閘、稽核/問責伺服器、多人治理、雲。
- **BRIDGE(橋接):** 匯出/互通,讓真正的治理工具(GitHub/Jira/ServiceNow/企業 agent)來**消費** Code Recall 的決策紀錄。

**Governance 天花板 = 本地 advisory(agent 浮現/示警牴觸)+ 既有本地 git pre-commit 閘(`--strict`)。** 越過此線就是別人的戰場——不往上爬治理棧,往下扎根把 record 層做成標準。

## 🧭 主軸 (Core direction):Decision Persistence — AI 維護、撐過 compaction 的 ADR

**定位收斂結論(三方審查 + 多輪定位辯論後拍板):** Code Recall 的核心能力是「**決策持久化**」——保存「**為什麼這樣做**」與「**哪些路已證明走不通**」,並讓它們**跨 context 重置/compaction/交接不流失、不腐爛**。

為什麼是這塊:Claude Code 已有 `/init`(codebase 總覽)與 `/handoff`(對話交接),但**沒有 decision log**。大型專案最貴、最難重建的不是「做到哪」(看 code/git 即知),而是**決策理由與死路**——重新 litigate 已定決策、重試已失敗方法是最大浪費。**能記決策的工具很多,但把「決策持久化」當核心能力、形成主流產品的,目前幾乎沒有。** 這是無人佔據的車道。

誠實邊界:ADR(Architecture Decision Record)是既有實務(adr-tools / log4brains 等)。Code Recall 的差異**不是發明決策紀錄**,而是:**AI agent 自動維護 + 撐過 compaction + 時序防腐(supersede/expire) + 零依賴本地 + 跨工具**。

**價值 = decision log(賣點);機制 = compaction 存活 + 自動捕捉 + 防腐(護城河)。** 主打價值,用機制背書(「不像你會忘記更新的 doc」)。

### 主軸下的優化項(依序)
1. **[M] DECISIONS.md 升級為 ADR 級紀錄**:支援 `Context / Decision / Consequences / Status` 結構;現有 supersede/expire 直接對應 ADR 狀態生命週期(accepted → superseded)。向後相容現有 `## title / date / confidence`。
2. **[M] 可靠捕捉(頭號風險 = 榮譽制寫回)**:MCP `write_decision` + Stop-hook capture 提示 + `score` 對「決策 log 過薄/過期」扣分。讓「記一筆決策」盡量不靠 agent 自律。
3. **[M] 浮現 + 防再 litigate**:相關決策在 agent 觸碰相關區域時浮現(先靠 `search`/digest);進階:當提案牴觸一條 accepted 決策時示警。
4. **[S] 定位落地**:README 改 decision-log-led(招牌 = 「your agent's decision log: why + dead-ends, preserved across compaction」);not-replace(`/init` `/handoff` `CLAUDE.md` RAG)/preserves 區塊。
5. ✅ **[S] ADR 畢業路徑**:`graduate` 把 >90 天高信心決策輸出成 `docs/adr/NNNN-*.md`(慣例 ADR 檔,可被 adr-tools/log4brains 消費);lessons → `docs/adr/lessons.md`。(順手修掉 graduate 漏接 `accepted` 狀態的 bug。)
6. 🟡 **[L] 證據**:`bench/bench.js`(`npm run bench`)已交付**確定性 context-hygiene benchmark**(naive append-only vs Code Recall 的注入 token 數 / 陳舊內容占比 / 搜尋陳舊命中數,用真 CLI 量)。**live-agent benchmark**(有/無 decision log 的重決/重走死路/完成率)以**誠實協定**寫在 `bench/README.md`,需自帶 agent 跑——刻意不出假數字。

## 對比總表

## 需求符合度判定

| 需求 | 判定 | 證據 |
|---|---|---|
| 低依賴 | ✅ 符合 (9/10) | 實證零 npm 依賴(僅 fs/path/os/crypto)、零網路存取、無 daemon/DB,16 檔 ~95KB;語法地板 ~Node 10.12。唯一瑕疵:install.ps1 未檢查 node 在 PATH |
| 高兼容 | 🟡 部分符合 | 被動注入 7/8 工具經 2026 官方文件驗證正確;但 Windsurf stub 缺 `trigger: always_on` frontmatter(bug);write-back 與 compaction 完整存活只在 Claude Code 是確定性的,其他工具靠指令協議 |
| 勝過 llm-wiki / MemPalace(任務連續性) | ✅ 符合 | compaction 任務存活是同類最強(PreCompact 快照 + compact 後全量重錨定);輸的維度在需求之外(長期語意召回、知識深度) |
| 無感零摩擦 | 🟡 部分符合 | Claude Code 上裝完即無感;邊緣摩擦:需 clone + 絕對路徑(無 npx)、缺 node 時靜默死亡且 doctor 測不到 |

## 對比總表

| 維度 | Code Recall v1.1 | llm-wiki | MemPalace v3.3 |
|---|---|---|---|
| 自動化 | Claude Code 確定性 hooks;其他 7 工具指令驅動 | 無 — 5 種操作全手動 | hooks + 自啟 MCP server,逐字捕捉 |
| Compaction 存活 | Claude Code 完整(快照+重錨定);其他部分 | 無 — 開場儀式本身死於 compaction | 部分 — 有捕捉、無重錨定注入 |
| Token 成本 | ≤200 token 摘要,非 memo 專案零成本 | 無上限,每 session 1–5k+ | ~170 token + 29 個 MCP tool schema 常駐 |
| 知識深度 | 刻意淺(3 個 ≤1k token 帳本) | 最佳 — 複利累積 wiki | 逐字 drawer,無策展,40k+ 會 OOM |
| 長期召回 | 近零(無 search 指令) | 好(query + 引用) | 最佳(LongMemEval R@5 ~96%,但 100% 宣稱為過擬合) |
| 安裝摩擦 | 近零 | 中(Python + 2 npm 工具鏈) | 高(pip/chromadb 衝突、MSVC 編譯) |
| Windows | 一級支援(實證) | 未處理 | 弱(#650 靜默失敗、#686) |

結論:llm-wiki 是互補不是對手(知識庫 vs 任務連續性)→ 走整合路線;MemPalace 真正贏的只有「跨月語意召回」→ 用零依賴詞法搜尋縮小差距。

## v1.2 — 速贏(天級)

1. **[S] 修 Windsurf stub frontmatter**:補 `trigger: always_on` — 唯一被驗證壞掉的整合。驗收:sync 產出的 .windsurf/rules/coderecall.md 以正確 frontmatter 開頭。
2. **[S] install.ps1 node 檢查 + doctor 端到端 hook 實測**:缺 node 時中止安裝並嵌入絕對 node 路徑;doctor 真的用 shell 跑一次註冊的 hook 指令。驗收:無 node 環境安裝即報錯;doctor 能抓出死掉的 hook。
3. **[S] 誠實檔 COMPATIBILITY.md + 修正 README MemPalace 列**:逐工具標注「注入/寫回/compaction」三層真實等級;補一列我們誠實輸的「跨月語意召回」。
4. **[S] Digest 升級**:注入 `[!]` blocked 項目全文(agent 必須知道為何卡住)、compact 後附最新快照路徑、AGENTS.md 協議加一行過期自查。驗收:fresh digest 仍 ≤1200 字元。
5. **[S] 衛生包**:備份檔輪替(留 5)、README 標注 Node ≥10.12 地板、鎖等待的 SharedArrayBuffer fallback。

## v1.3 — 中期(週級) ✅ 已交付 (2026-06-10)

6. ✅ **[M] `coderecall search`**:零依賴 BM25 詞法搜尋(帳本 + archive,段落/條目級結果,中英混合 tokenizer);consolidate 改為月度歸檔 `consolidated-YYYY-MM.md` 而非刪除。回應 MemPalace 使用者最想念的功能。
7. ✅ **[M] 跨工具深化**:Gemini 走 `.gemini/settings.json` contextFileName 原生載入、產出 `.cursor/hooks.json` stop 心跳(best-effort, JSON merge)、AGENTS.md 內嵌摘要加「Ledger as of」戳記、doctor 警告 Codex ~32KiB 上限。
8. ✅ **[S] `coderecall deinit`**:專案級乾淨移除(dry-run 預設,`--yes` 執行;剝 marker 區段、刪自有 stub、還原 Gemini/Cursor 設定、刪帳本,共享檔使用者內容逐位元保留;不動全域 hooks)。
9. ✅ **[S] 選配 UserPromptSubmit 過期提醒 hook(預設關)**:`hooks/userpromptsubmit.js`,帳本 >45 分鐘未更新時注入一行 ~15 token 提醒,以 `.reminder` 節流(每 45 分鐘最多一次)。
10. ✅ **[M] 可觀測性**:doctor `[lint]` 段(日期/confidence/checklist 狀態合法性)+ stop.js 維護 bounded `sessions.md` 時間軸(最新 50 筆,連續相同 NOW 去重)。
11. ✅ **[S] 選配 Git pre-commit hook**(回應「派生狀態用程式碼維護,別靠 AI 自律」的外部建議):`coderecall install-githook` 在 commit 時重生 AGENTS.md 摘要 + lint 帳本,跨平台(node 產生 hook),marker 合併不覆蓋既有 hook,`--strict` 可阻擋,`deinit` 一併移除。

## v2.0 — 戰略(月級) ✅ 已交付 (2026-06-10)

> 註:v1.3 的 git-hook 暫編為「11」,正式併入時重歸 v1.3;v2.0 項次為 12–16。

12. ✅ **[M] npm 發佈**:`package.json` + `bin` → `npx coderecall <cmd>`;發佈通道 ≠ 執行期依賴,**零 runtime deps 維持**;新增 `coderecall version`。(實際 `npm publish` 需登入/2FA,屬使用者動作。)
13. ✅ **[L] 選配零依賴本機 MCP server(stdio)**:`coderecall mcp` 暴露 read_memory / update_task / write_decision / write_lesson / search_memory(newline-delimited JSON-RPC 2.0,tool 錯誤以 isError 回傳)。補上「honor-system 寫回」最弱層,檔案仍是儲存層,AGENTS.md 繼續覆蓋無 MCP 工具。(裁決:加法不取代。)
14. ✅ **[L] 知識長青**:`coderecall graduate [--global]` 把 >90 天高信心條目輸出到 `docs/ai_wiki/`(整合 llm-wiki)+ 選配 `~/.coderecall/GLOBAL-LESSONS.md`(可用 `CODE_RECALL_GLOBAL_DIR` 改位置);digest 注入限 top-3 且需 `CODE_RECALL_GLOBAL_LESSONS=1`。
15. ✅ **[M] 時序/矛盾/過期模型(借鏡 supermemory,零依賴)**:`supersedes`/`superseded-by`/`expires`;upsert 標題重疊改為「標記取代+保留演化」而非靜默覆蓋;consolidate 把 superseded+過期條目退役到 `archive/retired-YYYY-MM.md`。直接硬化「陳舊/矛盾帳本」頭號失效模式。
16. ✅ **[S] compaction 存活自我驗證**:`coderecall selftest` / `doctor --selftest` 模擬 `source=compact`,斷言全量 TASK body(8 項檢查);`npm test` 跑它。借 supermemory 的 eval 紀律,不借其 benchmark。

## 已裁決的評審分歧

- Gemini「全面 MCP 化、放棄 AGENTS.md」vs 兼容稽核「指令層才到得了無 hook 工具」→ MCP 為 v2.0 選配前端,不取代檔案+指令架構。
- Gemini 反對全域記憶(隔離/token 膨脹)vs MemPalace 對比組支持 → v2.0 收錄但 opt-in、僅 LESSONS、限額注入。
- npx 與「零依賴」品牌衝突 → 不衝突:發佈通道非執行期依賴。
- 過期提醒 hook 預設開或關 → 預設關(token 紀律是 SPEC 第 5 優先)。
