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

## A warning AFTER the content it distrusts is no warning — placement > existence
- date: 2026-06-23
- confidence: high
Codex 3-round adversarial review of the TASK-parse fix: Round 1 said "add the warning to the digest, not just doctor" (done) → Round 2 still returned "qualified no" with ONE blocker: in `--compact` the malformed-ledger warnings were emitted AFTER `<<<…END>>>`, and the fence holds the full TASK body — so a compacted agent read the stale completed-NOW logs BEFORE the distrust signal. My "warn now, reorder later" deferral was invalid: the warning never preceded the content it warned about. Fix: move all three warnings BEFORE `LEDGER_FENCE_BEGIN` (commit c7d8b68), so distrust precedes the stale body in both plain and compact; +selftest asserting `indexOf(warning) < indexOf(fence-begin)`. Lesson: for any injected-context tool, a correctness warning is only effective if it is READ BEFORE the thing it distrusts — placement in the prompt stream is part of the warning's correctness, not cosmetic. Also: the value of multi-round adversarial review is that R2/R3 catch the SHAPE of a fix that R1's one-liner ("just add a warning") quietly got wrong. Verdict reached qualified-yes only after the reorder.

## r/ClaudeAI feed posts gated by OP karma >= 50 — cold accounts get auto-removed
- date: 2026-07-07
- updated: 2026-07-07
- status: accepted
- confidence: high
- aliases: reddit launch venue gate karma megathread showcase cold account
Launch attempt 2026-07-07: posted the prepared launch text to r/ClaudeAI from a fresh account (Thick-Reason9783). Post t3_1upq6xo was removed by mods within minutes. Root cause: subreddit now requires OP total karma >= 50 for Showcase posts on the feed; new accounts are redirected to the Built with Claude Project Showcase Megathread (comment there instead, links/images welcome). Do not burn more launch attempts on karma-gated feeds from cold accounts: either build karma first, pick venues without karma gates, or use the sanctioned megathread. Reddit RTE also escapes markdown typed via automation — switch composer to Markdown mode before entering text.

## 詞法標題相似度被當成語意同一性,又放在無人看管的自動路徑上
- date: 2026-09-17
- updated: 2026-09-17
- status: accepted
- confidence: high
- code: coderecall.js → consolidateLocked
- aliases: titleOverlap Jaccard dedupe auto-supersede consolidate data loss 相似度 去重 資料遺失
consolidate 用 titleOverlap>0.8 判定「重複」並刪掉其中一篇(不歸檔),而 PreCompact hook 每次壓縮都自動跑它。根因不是門檻調太低,而是把詞面相似度當成「這兩筆是同一個決策」的判準:titleOverlap("Use Redis for X","Do not use Redis for X")=0.83,所以「記下某決策的反面」就會把原決策吃掉。同一個 upsertEntry 路徑也套用在 LESSONS,而 lesson 根本沒有 supersede 的語意。修法:相似度只能產生「提示」,退役必須顯式且唯一命中;破壞性動作不可放在無人看管的 hook 路徑,且必須先落盤再移除來源。

## 改協定文字時,digest 的那份最容易漏掉,而它才是每個工具都收得到的那份
- date: 2026-09-17
- updated: 2026-09-17
- status: accepted
- confidence: high
- code: coderecall.js → buildDigest
- aliases: protocol wording drift digest AGENTS SKILL 協定 措辭 不一致
v2.11.0 把 AGENTS-section.md 與 SKILL.md 的規則 2 改成「狀態改變時才寫,不是每次編輯」,卻沒改 buildDigest 裡的同一句,digest 仍說 after each significant step。根因:同一條協定存在三個副本(模板/skill/digest 字串),只有前兩個是檔案、容易一起 grep 到,digest 那份是程式碼裡的字串。而 digest 是唯一每個工具都會收到的表面,不載入 AGENTS.md 的工具只看得到它,所以漏改的那份反而優先級最高。做法:改協定措辭時三處一起改,並以 grep 協定關鍵句作為檢查。

## Codex Windows hook:commandWindows 以引號路徑開頭會靜默不執行;專案級 hooks 還需專案受信任
- date: 2026-09-17
- updated: 2026-09-17
- status: accepted
- confidence: high
- code: coderecall.js → syncCodexHooks
- aliases: codex hooks commandWindows windows quoting project trust silent no-op 靜默 失效
Codex 0.154 (Windows) 的 hook,若 commandWindows 以「含空白的引號絕對路徑」開頭(例:"C:Program Files
odejs
ode.exe" "...sessionstart.js"),hook 不會執行,且 Codex 不報錯、模型也只是拿不到 context — 與「沒設定 hook」外觀完全相同。以二分法實測隔離:同一支 sessionstart.js,command 用正斜線或反斜線都可,加 additionalContextLimit/statusMessage 也可,唯獨把 commandWindows 換成引號開頭的絕對 node 路徑就失敗。注意 cmd.exe 直接執行同一字串是成功的,所以這不是單純的 cmd 去引號規則,而是 Codex 自身 spawn 路徑的行為。另一個獨立前提:專案級 <repo>/.codex/hooks.json 在「未受信任的專案」完全不載入,--dangerously-bypass-hook-trust 只繞過 hook 信任、不繞過專案信任;同樣是靜默無效。做法:產生 hook 設定時不要讓 commandWindows 以引號開頭;任何自動產生的 hook 都要有端到端探針驗證(寫檔 + 讓模型回報 codeword),不能只看設定檔長得對。

## npm EOTP 反覆失敗:帳號 2FA 是 security key 就沒有六位數可輸入,必須走瀏覽器授權
- date: 2026-09-17
- updated: 2026-09-17
- status: accepted
- confidence: high
- aliases: npm publish EOTP one-time password security key passkey TOTP 2FA 發布 失敗
npm 帳號的 2FA 是 security key(WebAuthn/passkey),不是 TOTP 驗證器。發布時 npm 要求 OTP,但輸入任何六位數都被拒(EOTP),重試多次皆然;時鐘偏差已量測排除(與 registry 相差 0 秒)。根因在帳號設定頁確認:Two-Factor Authentication 顯示「Enabled for authorization and publishing / 1 security key」,完全沒有 TOTP 方法,所以根本不存在可用的六位數,--otp= 這條路先天不可能成功。正解是用 npm 印出的瀏覽器授權流程(Open this URL in your browser to authenticate → 用安全金鑰完成),終端機會自動接續完成發布。教訓:遇到 EOTP 不要先假設是碼過期或打錯而反覆重試,先確認該帳號實際啟用的 2FA 方法是什麼;security key 與 TOTP 的補救路徑完全不同。
