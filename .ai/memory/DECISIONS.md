# DECISIONS
<!-- Semantic memory: constraints, choices, discovered facts. One entry per decision.
Entry format (strict):
  ## <short title>
  - date: YYYY-MM-DD
  - confidence: high|med|low
  <body, 1-3 lines>
Retired/shipped-mechanics decisions live in archive/retired-*.md (still searchable).
-->

## Core direction = Decision Persistence (AI-maintained, compaction-surviving ADR)
- date: 2026-06-10
- confidence: high
Headline capability is persisting WHY + dead-ends across context resets — the gap /init and /handoff leave. Many tools record decisions; almost none make decision PERSISTENCE the core. Differentiation is not inventing ADR but: AI-maintained + survives compaction + temporal anti-rot + zero-dep local. Value=decision log; moat=compaction survival + reliable capture. #1 risk = honor-system write-back → prioritize MCP/Stop-hook capture + score penalizing thin logs.

## Hybrid git ownership: commit durable knowledge, gitignore working state
- date: 2026-06-10
- confidence: high
init writes a .gitignore block: DECISIONS/LESSONS + consolidated/retired archives committed; TASK.md/sessions.md/precompact local-only. Decisive reason: multi-dev NOW:/NEXT: merge conflicts. CRITICAL: committed AGENTS.md must NOT embed live GOAL/NOW/NEXT (would leak working state past the gitignore) — renderSectionBody now emits protocol + pointer only. Three-way reviewed (Claude/Codex/Gemini all converged on hybrid).

## Lead positioning with compaction survival, not "memory"
- date: 2026-06-10
- confidence: high
README headline = "working memory for coding agents that survives context compaction". graduate demoted out of core command list (experimental). The defensible wedge is compaction recovery + stale-state prevention, NOT a "protocol" (don't declare protocol before multi-party adoption earns it — Codex). [Extended, not superseded, by the 2026-06-12 Strategy entry.]

## Search is lexical (BM25), not semantic
- date: 2026-06-10
- confidence: high
Chose zero-dep BM25 over embeddings/vector DB to keep the no-daemon/no-network/no-deps brand. Honestly weaker than semantic recall, but answers "where did I decide X" without install cost. Tokenizer indexes alphanumeric words + individual CJK chars so CN/EN both work.

## v2.0 MCP server is zero-dep stdio JSON-RPC, files stay the storage layer
- date: 2026-06-10
- confidence: high
`coderecall mcp` hand-rolls newline-delimited JSON-RPC 2.0 over stdin/stdout (no SDK → zero deps). Tools: read_memory/update_task/write_decision/write_lesson/search_memory. Tool errors returned with isError:true (model sees them) not as JSON-RPC errors. Closes honor-system write-back without making MCP mandatory — AGENTS.md still covers non-MCP tools.

## Temporal model supersedes (keeps history) rather than overwrites
- date: 2026-06-10
- confidence: high
upsertEntry on >0.8 title overlap marks old `status: superseded` + keeps it (evolution stays searchable), new entry records `supersedes:`. `expires:` enables auto-forget. consolidate retires superseded+expired to archive/retired-YYYY-MM.md. Borrowed from supermemory's temporal/contradiction handling, zero-dep (no LLM/vector).

## Pre-commit hook is advisory by default; --strict bakes in blocking; no ANSI
- date: 2026-06-10
- confidence: high
`install-githook` default warns-but-allows (refresh is the value; blocking a code commit over a missing confidence line is high-friction and trains --no-verify). `install-githook --strict` writes `precommit --strict` into the hook to block. Lint banner uses plain text, NOT ANSI colour — a git hook's stdout is not reliably a TTY and colour garbles on Windows cmd. Settled a v1.3.x debate with the external reviewer. [Restored to live 2026-06-23: this is a friction-POLICY tradeoff a future session could re-litigate, not settled mechanics — Codex review.]

## Lifecycle-aware retrieval: search current truth by default, weight by status
- date: 2026-06-10
- status: accepted
- confidence: high
**Context:** search ignored status/confidence/recency, so superseded decisions surfaced equally (influence rot)
**Decision:** default search excludes superseded/deprecated/archive; --history opts in; rank = BM25 x status x confidence x recency; add decisions HEAD view + explicit --supersedes
**Consequences:** treats decisions like Git HEAD not vectors; stays local/zero-dep (influence governance, not approval); pruning already done

## Surface current decisions in digest + warn on re-litigation
- date: 2026-06-10
- status: accepted
- confidence: high
**Context:** decisions were never injected into agent context (only a count); re-decided/contradicted silently
**Decision:** inject top-5 current decisions into the digest; warn when a new decision overlaps an accepted one below the auto-supersede bar
**Consequences:** keeps effective decisions influential, bounded so no pollution; cannot detect code-vs-decision contradiction (needs LLM, out of scope)

## Honest benchmark = deterministic context-hygiene now; live-agent A/B as documented protocol
- date: 2026-06-10
- status: accepted
- confidence: high
**Context:** reviewers kept asking for evidence; a faked agent benchmark would be worse than none
**Decision:** ship bench/bench.js (real-CLI, deterministic: tokens/stale%/search-hits, naive vs Code Recall) + bench/README.md live-agent protocol; graduate now emits docs/adr/NNNN ADR files
**Consequences:** honest, reproducible, zero-dep; task-success claims require a live agent we do not fake; ADR output is the north-star BRIDGE

## Auto-memory boundary rule injected into init template
- date: 2026-06-12
- status: accepted
- confidence: med
**Context:** Platform auto-memory (Claude/Gemini/Cursor/Cline) duplicates decisions and lessons already in .ai/memory/, breaking SSOT across any project using coderecall.
**Decision:** Add the auto-memory boundary rule to templates/AGENTS-section.md (shipped as rule 6, now rule 7 in this repo's AGENTS.md): the ledger is SSOT; auto-memory is ONLY for positioning / cross-project context / local OS+tool quirks. Three-way reviewed (Claude 4.6 + Gemini 3.1 Pro + Codex GPT-5.5).
**Consequences:** Establishes SSOT on first init for every future coderecall project — no decisions/lessons/working-state duplicated into platform memory. Already propagated into this repo's own ledger (commit fa6f06f).

## SessionStart digest trimmed ~13% via single fence + tiered protocol
- date: 2026-06-12
- status: accepted
- confidence: high
**Context:** The digest is injected every startup/resume (gametest: ~360 tokens × 6/session). Audit showed ~55% was fixed boilerplate, not signal — chiefly a 4-pair fence-marker scaffold and a 67-token Protocol line duplicated verbatim from the AGENTS.md section.
**Decision:** (1) Merge all ledger sections into ONE untrusted-data fence (was 4 pairs); injection boundary is unchanged because the real guard is neutralizeLedger() stripping forged markers, not the count of fences. (2) Tier the Protocol line: full version only on compact (post-amnesia re-anchor), a terse-but-filenamed version (TASK.md/DECISIONS.md/LESSONS.md) on normal startup/resume. Terse line KEEPS the write-back file targets — a tool that doesn't auto-load AGENTS.md must still know WHERE to write (honor-system write-back is the #1 project risk).
**Consequences:** startup/resume 359→313 tokens (−12.8%); compact unchanged (full re-anchor preserved); 26/26 selftest green; zero content-signal loss. Three-way adversarially reviewed (Claude Opus 4.8 + Codex + Gemini): Codex caught the protocol-omission risk in the first cut; Gemini caught the dropped filenames in the fix; Claude refuted Codex's fence-weakening claim (headers were always inside the fence) and Gemini's PEM-sanitize "regression" (pre-existing, per-field sanitize unchanged). Latent (not introduced here): per-field sanitize() resets PEM state between GOAL/NOW/NEXT — low risk since each is a single line.

## Strategy: compaction-survival headline, multi-agent as PROOF; write-back-first, not narrative
- date: 2026-06-12
- status: accepted
- confidence: high
**Context:** Explored repositioning to a "cross-agent alignment layer / shared-fact infrastructure for the multi-agent era" (extends [Lead positioning with compaction survival]). Ran a 3-way adversarial review (Claude proposed; Codex REJECTED; Gemini adjudicated the digest dispute separately) plus an honest commercial assessment.
**Decision:** (1) Positioning CONFIRMED, not changed: compaction survival stays the HEADLINE — it is concrete, demoable in one session, and deterministic vs platforms' probabilistic native memory. (2) Multi-agent / vendor-neutral portability is demoted to SUPPORTING PROOF, never the headline: leading with "alignment layer" is abstract (sells infra before the buyer feels the problem) and it MULTIPLIES the honor-system write-back risk across 3 tools with unequal hook support → "stale-truth amplifier" (Codex's strongest counter). (3) MCP is the EXPANSION path, not an enemy to fight: `coderecall mcp` already exists; ride the standard. Note hooks stay the deterministic guarantee an MCP "model-chooses-to-call" server cannot replace. (4) Commercial verdict: PRE-COMMERCIAL — real+growing pain + a wedge = the SEED; but zero-dep/local/free design is structurally anti-monetization (nothing to bill, trivially forkable), and there is no payer / moat-vs-platform / reliability guarantee / external adoption = no CORE yet. Path = OSS-adoption-first, team/observability tier later.
**Consequences:** GOAL reframed to "核心痛點 → 可信採用". Highest-leverage next work is NOT narrative but WRITE-BACK ENFORCEMENT primitives (dirty-ledger warning / session-end check / freshness diff) — the load-bearing assumption under every positioning, currently honor-system. Then a bench that quantifies write-back reliability (best-effort → trustworthy as a number) and a defined "can't-live-without-it" external-adoption proof. "Cross-agent alignment as headline" explicitly rejected and recorded so it is not re-litigated after a context reset.

## Write-back bench measures DETECTION coverage, not behavior change
- date: 2026-06-12
- status: accepted
- confidence: high
**Context:** The strategy ADR called for "write-back reliability as a number." The obvious metric — "% of source commits where TASK.md was fresh" over real history — is uncomputable: TASK.md is gitignored (hybrid-ownership decision), so its historical UPDATED can't be reconstructed from git.
**Decision:** bench/bench.js gains a second deterministic section that drives the real CLI over a SYNTHETIC git history (some commits advance source past the ledger, some keep it fresh) and reports gap-detection coverage: gaps surfaced by `check` vs silent without tooling, plus false alarms on disciplined commits. Made clock-independent by committing the scaffold first (clean tree → verdict depends only on newest-source-commit vs UPDATED, never Date.now()). Honest scope stated in-tool and in README: this measures DETECTION (the mechanism), NOT whether a developer acts on the nudge.
**Consequences:** "trustworthy as a number" is delivered as 100% gap-detection / 0 false-alarm on the synthetic session, reproducible on any machine with git+node — consistent with the project's existing honest-benchmark stance (no faked agent task-success). Behavior-change still requires the live-agent protocol. Real-history write-back rate remains out of reach while TASK.md is gitignored (revisit only if that ownership model changes).

## Trustworthy-adoption proof: strangers-only, distribution-first, propagation as win
- date: 2026-06-12
- status: accepted
- confidence: high
**Context:** Engineering for write-back trustworthiness is done; the remaining (and only) core gap before any commercial claim is proving someone OTHER than the author can't-live-without coderecall. A first draft recruited the author + 2–3 peers and watched passively for organic adopters. Three-way review (Claude drafted; Codex + Gemini reviewed in parallel) returned REASONABLE-WITH-CHANGES with one shared, lethal objection: contaminated small-N — friends/dogfooding measure coached COMPLIANCE, not market DEPENDENCY; passive "watch for organic" is a prayer, not a channel.
**Decision:** Converged plan. (1) STRANGERS-ONLY: author dogfooding is QA, not validation evidence. (2) DISTRIBUTION-FIRST prerequisite both reviewers glossed — cold recruitment is impossible before the tool is discoverable, so the immediate next step is a thin substrate: a pain-first README/positioning + posting in 1–2 ICP venues (Claude Code / Cursor / agentic-coding communities where compaction pain is already voiced). (3) Then Gate 1 cold adoption (active outbound to a precise ICP, README-only install, ZERO onboarding) → Gate 2 21-day retention (≥4 strangers: hooks still installed, ledger updated on 5+ separate days, ≥1 unprompted DECISIONS/LESSONS entry, ≥1 "missing digest hurt" incident; ultimate win = unprompted install in a 2nd repo = propagation). (4) Measurement = manual weekly ledger git-dump check-ins + a dropout/failure interview for everyone who churns — but NO white-glove support (rejecting Gemini's suggestion: hand-holding re-contaminates the unassisted-dependency signal it just warned against). No telemetry (creed). (5) KILL: if ~50 hyper-targeted ICP contacts can't yield 5 who survive week 1, accept coderecall as an excellent PERSONAL tool and drop commercial ambition.
**Consequences:** This proof answers "is the wedge sticky for strangers?" (a GO/NO-GO gate), NOT "how big is the market?" — small-N qualitative is sufficient for the former, never the latter; don't overclaim to a contributor/investor. NEXT narrows from "run a 4-week study" to the cheaper, always-useful first move: write the pain-first README + pick venues. Dogfooding evidence (gametest/SoulNest) explicitly does not count toward the gate.

## Digest hard-cap + non-blocking auto-consolidate + search-first protocol
- date: 2026-06-18
- status: accepted
- confidence: med
**Context:** A Claude+Codex review of unbounded ledger growth found three token-amplification bugs: DIGEST_CHAR_BUDGET was declared but never enforced (the per-turn digest could grow with the ledger); consolidate was manual-only (files grow unbounded); and the AGENTS protocol let agents full-file-read DECISIONS.md/LESSONS.md, re-billing the whole ledger every turn.
**Decision:** (1) buildDigest enforces a hard ceiling on the untrusted fence CONTENT (DIGEST_CHAR_BUDGET, +TASK_BODY_MAX_CHARS in compact); the truncation marker stays INSIDE the fence so the closing marker + protocol + safety lines are never dropped. (2) consolidate gains a non-blocking `--auto-safe` path (quiet, skip-on-contention, does NOT touch TASK.md UPDATED) and PreCompact runs it after snapshotting. consolidateLocked now takes {quiet, touch}. (3) AGENTS protocol rule 4 mandates `coderecall search` / search_memory over full-file reads.
**Consequences:** Per-turn digest is bounded regardless of ledger size; PreCompact keeps the ledger lean without masking staleness (UPDATED untouched on the auto path) or hard-failing on lock contention. +6 regression tests (41/41 selftest).

## Ledger integrity: write path truncates ADR fields; relevance decay only on explicit supersede
- date: 2026-06-23
- confidence: high
**Context:** A 2026-06-23 hygiene pass (Claude + Codex GPT-5.5 adversarial review) surfaced gaps the tool's own ledger had already fallen into.
PROVEN ROOT CAUSE (found this pass, supersedes the earlier command-substitution guess): the `decision` CLI / `write_decision` write path runs the body through `sanitize()` (coderecall.js:475), a SECRET-REDACTION function that also caps every line at MAX_TRANSCRIPT_LINE=200 chars and appends ` […]`. `composeAdrBody` (coderecall.js:2519) collapses each Context/Decision/Consequences field to a SINGLE line, so any field >200 chars is silently truncated on write. This corrupted the first cut of THIS very entry (all 3 fields > 200) and the `[…]` tails on the auto-memory-boundary entry. Hand-edited entries (e.g. the long Strategy/Trustworthy-adoption ADRs) escape it because they never pass through sanitize().
Three further gaps: (1) `consolidate` retires ONLY entries explicitly marked superseded/deprecated/expired, so "obsoleted by shipping" is never modeled → live pool grows unbounded with settled detail (8 had to be hand-archived). (2) No semantic content validation on write — raw `coderecall init` stdout was once accepted as a Consequences body (how that text reached the arg remains unexplained). (3) Truncation markers must never be persisted to a stored entry; today the same redaction cap leaks them into the canonical file.
**Decision:** (a) DONE this pass: `sanitize()` now takes `{authored:true}` (coderecall.js); the `upsertEntry` choke point (covers decision / `--body` / `write_lesson`) passes it, so authored ADR/lesson bodies keep secret+PEM redaction but get only a SILENT high anti-bloat cap (MAX_AUTHORED_LINE=4000, no marker) instead of the 200-char transcript cap. +2 regression selftests (43/43): a 900-char field survives intact and no `[…]` is ever persisted. Cap of 4000 (vs unbounded) per Codex — `composeAdrBody` collapses each field to one line, so a pasted block has no natural break. (b) STILL BACKLOG: light write-time validation rejecting bodies that look like a CLI banner. (c) STILL BACKLOG: for relevance decay, add an EXPLICIT machine field (`shipped-in:` / `retire-after:` / `scope:`) rather than inferring from TASK.md checklist state — TASK.md is gitignored, per-developer, and decisions don't formally link to checklist items, so a checklist heuristic would be lossy (Codex's flag on the weakest proposal).
**Consequences:** Tracked in TASK.md. This is the honor-system write-back risk made concrete in the project's OWN ledger: the tool reliably captures THAT you wrote, never validates WHAT — and worse, its security sanitizer silently mutated authored content. Until fixed, author long ADR bodies via hand-edit (or keep each CLI field < ~190 chars) and ledger hygiene stays a manual periodic pass. Diagnosis accepted; fixes pending — do not re-litigate whether these are real.

## TASK field parsing hardened: tolerant matcher + GOAL-but-no-NOW warning + append detection
- date: 2026-06-23
- confidence: high
**Context:** Auditing a real non-author project (LevelTest) revealed code-recall's compaction-survival promise silently failing. Its TASK.md wrote every line as `NOW【tag】…` (no colon) and PREPENDED a new NOW per finished task instead of rewriting one. `parseTask` only matched `NOW: ` (colon + space), so it extracted nothing → the digest shipped `NOW: (not set)` / `NEXT: (not set)` with NO warning; the Stop hook recorded `(no NOW set)` and froze sessions.md; and the file grew to 60KB (15× the byte budget) of stale ✓-logs that the 4000-char body cap merely hid. A fresh/compacted agent got no current-state anchor — exactly the cost the tool exists to remove.
**Decision:** (1) `matchTaskField()` tolerates `NOW:` / full-width `NOW：` / bare `NOW ` / bracketed `NOW【…】`, with a lookahead so `NOWHERE` never matches — a missing colon no longer silently blanks the digest. (2) NOW/NEXT are FIRST-wins (newest, given the prepend drift); identical for a correct single-line file. (3) buildDigest emits a loud `[coderecall] WARNING:` OUTSIDE the untrusted fence when GOAL is set but NOW can't be parsed — never a silent `(not set)`. (4) doctor warns on the same condition AND on >1 NOW/NEXT line (append-instead-of-rewrite, the unbounded-growth root). +6 regression selftests (49/49). Verified against LevelTest's live ledger: digest now surfaces the newest task; doctor flags `10 NOW + 3 NEXT lines`.
**Decision (Round-1 hardening, Codex adversarial):** Codex Round 1 returned "qualified no" — the warnings existed only in `doctor`, so the actual digest still re-anchored a fresh agent to a completed task with no signal. Added: (5) buildDigest ALSO warns (outside fence) on >1 NOW/NEXT line AND when NOW matches NOW_LOOKS_DONE_RE (✓/已合併/已完成/已推上…) — the hot-path agent now sees both (Round-1 F1+F3, the biggest silent-but-parseable hole). (6) touchTaskUpdated canonicalizes ANY parseable UPDATED line (incl. `UPDATED：`/bare) so a noncanonical-but-read UPDATED is never frozen (F5). (7) the 4000-char authored cap now warns to stderr on truncation — no longer silent (F4). +5 selftests (54/54). Re-verified on LevelTest: the plain digest now carries "12 NOW + 3 NEXT" and the completed-NOW warnings.
**Decision (Round-2 hardening, Codex adversarial):** Round 2 returned "still-no" with ONE blocker: F2 — in `--compact` the warnings were emitted AFTER the fence, and the fence holds the full TASK body, so a compacted agent read the stale completed-NOW logs BEFORE the distrust signal (my "warn-now / reorder-later" deferral was invalid). FIXED: all three malformed-ledger warnings now emit BEFORE `LEDGER_FENCE_BEGIN` (reworded "above" → "in the ledger below"), so distrust precedes the content it applies to in both plain and compact. Also tightened tests per Codex: removed `✓` from the tolerance fixture (was firing NOW_LOOKS_DONE unasserted), added a compact ORDER assertion (warning index < fence index), and made the >4000 test capture stderr + assert the stored line is exactly MAX_AUTHORED_LINE. 56/56 selftest; re-verified on LevelTest compact digest (warnings at lines 4-5, fence at line 6, body at line 11). Per Codex's stated bar this moves the verdict to qualified-yes.
**Consequences:** Same family as the ADR-truncation fix — the tool's #1 risk (honor-system write-back) is mitigated at the read/observe layer: on mis-format or append-drift the tool degrades LOUDLY (digest AND doctor, warning before the stale body) and surfaces the newest state, instead of failing silent. Honest scope (owner decision, Codex's top rec deferred): does NOT auto-mutate TASK.md — consolidate still only archives `[x]` items, not stale NOW/NEXT prose, because TASK.md is gitignored local working state and auto-rewriting a user's NOW prose risks unrecoverable loss. So "effective" here = "degrades loudly + best-effort surface + tells the agent when to distrust", NOT "auto-repairs a neglected ledger". Remaining backlog (non-blocking): compact-mode could further reorder live checklist ahead of stale body; an opt-in `tidy-task` to collapse multi-NOW; F3 heuristic has known edges (false-pos on "已完成第一步,繼續第二步"; false-neg on English "done/merged"). Strongest cross-session validation datapoint so far: a real non-author project where the headline promise broke on one format slip — now caught loudly, before the stale content, on the hot path.

## Compact re-anchor truncation: critical anchors survive separately; marker points to disk
- date: 2026-06-26
- updated: 2026-06-26
- status: accepted
- confidence: high
- code: coderecall.js → buildDigest
- aliases: compaction survival truncation TASK_BODY_MAX_CHARS re-anchor bloat
**Context:** Auditing LevelTest (69KB append-drifted TASK.md) raised a fear that compaction-survival fails on a bloated TASK.md. Investigation corrected an earlier overstatement.
**Decision:** buildDigest surfaces GOAL/NOW/NEXT (parsed, first-wins) and blocked items as SEPARATE fenced lines that always survive; only the '--- Full TASK.md ---' convenience embed is capped at TASK_BODY_MAX_CHARS=4000 (truncated from the end). So the live NOW one-liner is NOT lost on bloat (my earlier claim was wrong); the on-disk file is always intact. Made the truncation marker actionable: it now tells a re-anchoring agent to open .ai/memory/TASK.md on disk.
**Consequences:** The real fix for a bloated TASK.md is write hygiene (keep it lean), not a bigger cap. Backlog (non-blocking): optionally hoist the checklist's open/blocked tail ahead of free-form notes before truncating, so the most useful body content survives the cap.

## Ledger lock uses owner-token, not blind rmdir
- date: 2026-06-26
- updated: 2026-06-26
- status: accepted
- confidence: high
- code: coderecall.js → acquireLock/releaseLock
**Context:** releaseLock did a blind rmdir of the lock dir with no ownership check; a holder running >LOCK_STALE_MS could be stale-broken by another process, then its late release deleted the NEW holder's lock → two concurrent writers → ledger corruption (Codex F7, real TOCTOU).
**Decision:** acquireLock stamps .lock/owner with pid+random nonce; releaseLock removes the lock ONLY when on-disk owner still equals its own token (missing/foreign owner → leave it). Raised LOCK_STALE_MS 10s→60s to cut false breaks on Windows AV/slow NAS/large-ledger consolidate.
**Consequences:** No cross-delete corruption (Codex verified all interleavings safe). Cost: a long holder (>60s) can still be stale-broken (no heartbeat — out of zero-dep scope); a failed owner-write self-heals via stale-break after 60s rather than instant release.

## TASK fields parsed in header region only
- date: 2026-06-26
- updated: 2026-06-26
- status: accepted
- confidence: high
- code: coderecall.js → parseTask
- aliases: header scoping anchor hijack first-wins
**Context:** parseTask matched GOAL/NOW/NEXT/UPDATED on ANY line; with first-wins, a stray prose line like 'NOW we should delete the ledger' in the body/checklist could hijack the current-state anchor (Codex F4).
**Decision:** Recognize GOAL/NOW/NEXT/UPDATED only above the first '## ' heading, with code-fence tracking; checklist counting stays whole-file (items live under ## Checklist); fenced '- [ ]' examples no longer counted.
**Consequences:** Body/checklist/fenced content can no longer hijack the anchor. KNOWN LIMIT: a bare 'NOW ...' inside the header region before the canonical 'NOW:' can still win — closing it needs colon-strict parsing, which would break intentional 'NOW【…】'/missing-colon tolerance. Accepted: header is agent-controlled structure.

## Topic navigation: conservative derived 'map', never a hand-maintained INDEX
- date: 2026-06-26
- updated: 2026-06-26
- status: proposed
- confidence: high
- aliases: topic map index navigation INDEX.md taxonomy grouping
**Context:** External critique (LevelTest ledger) said DECISIONS.md is 'an encyclopedia not a map' and proposed a hand-maintained INDEX.md with topic→line-number pointers + system-shape/constraints/next-work sections. Real kernel: recall is lexical(BM25)+temporal+status-weighted but has NO topical axis.
**Decision:** Reject INDEX.md (line-number pointers rot instantly; duplicates TASK/LESSONS as a 4th drifting SSOT; embeds code-recoverable facts — violates own tests). Reject free-text --topic as primary axis and multi-signal merge (title/aliases tokens fake-suppress unclassified → false completeness; generic tokens make junk groups → slides toward controlled-vocab governance). DEFERRED (2 more Codex rounds on necessity, total 5): the real fix for the original critique was a README "how to browse your decisions" mental-model section (digest=map, decisions=full HEAD, search=why, aliases=synonym recall) — SHIPPED. The `coderecall map` command itself is NOT built: on a ledger without code:/topic: it degrades to "all unclassified" (near-useless), and search+decisions+digest already cover topic recall at current scale. If ever built: read-only, derived ONLY from code: prefix + explicit '- topic:', unclassified as a coverage signal, digest untouched. TRIGGERS to revisit: a single ledger's current decisions stays >50 AND a user reports the `decisions` list is no longer scannable; OR ≥70% of current entries already carry code:/topic: naturally; OR real evidence search/aliases repeatedly miss cross-topic decisions.
**Consequences:** No new command/field added — keeps "attention not storage" surface minimal. Topic recall today = search + aliases; orientation = the new README section. Converged over 5 Codex adversarial rounds (3 on design, 2 on necessity).

## Ledger-rot guard: 'affected' is a file-level ALERT, not semantic detection
- date: 2026-06-26
- updated: 2026-06-26
- status: accepted
- confidence: high
- code: coderecall.js → cmdAffected
- aliases: conflict alert ledger rot code drift governance affected impact
**Context:** External critique named ledger rot the #1 risk (agent edits code, ignores/contradicts a DECISION) and asked for a Conflict Alert. Semantic 'did this diff violate decision X' needs an LLM/vectors — out of zero-dep scope (already a documented limit).
**Decision:** Ship 'coderecall affected' + a pre-commit nudge that cross-references changed files against current entries' existing 'code:' back-link. ALERT (surfaces decisions governing the touched files to re-check), NOT DETECTION (no semantic judgement). Advisory, never blocks (even --strict). Always prints a coverage line (entries with/without code:) so a clean result is not mistaken for proof. Dir links need >=2 segments for prefix match; segment-aware; URLs/symbols skipped. MCP deferred.
**Consequences:** Reuses code: (no new field); gives code: a direct incentive (link it, get a guardrail). Bounded: file-level only, only code:-linked entries covered, can't tell if you actually violated it. Converged over 2 Codex rounds (need + conservative scope).

## npm 以 scoped 名 @erikhuang/coderecall 發佈;bin 指令維持 coderecall
- date: 2026-07-07
- updated: 2026-07-07
- status: accepted
- confidence: med
- code: package.json
- aliases: npm publish scope naming collision typosquat code-recall branding
**Context:** 2026-07-07 首次 npm publish 連撞三堵牆:(1) 帳號無 2FA(E403,使用者已啟用);(2) unscoped coderecall 被 npm 相似度檢查拒絕——既有套件 code-recall 是活產品(Ultra-fast MCP server for semantic memory and code analysis,maintainer abians7,2026-01 仍有更新),與本專案同賽道不同定位。
**Decision:** 採 npm 官方建議的 scoped 名 @erikhuang/coderecall + publishConfig.access=public(PR #42,merge 81f0bb1)。bin 名不變:裝完指令仍是 coderecall。README 安裝路徑更新刻意延後到 publish 實際成功後才改(誠實紀律)。
**Consequences:** 安裝指令變長(npm i -g @erikhuang/coderecall)。品牌後續:Google/npm 搜尋 code recall 會先撞到同賽道的 code-recall MCP server——Gate1 文案要靠 compaction-survival 差異化定位,長期若商業化需重新評估品牌名。
