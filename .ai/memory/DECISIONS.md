# DECISIONS
<!-- Semantic memory: constraints, choices, discovered facts. One entry per decision.
Entry format (strict):
  ## <short title>
  - date: YYYY-MM-DD
  - confidence: high|med|low
  <body, 1-3 lines>
-->

## DECISIONS.md upgraded to ADR-grade (status + Context/Decision/Consequences)
- date: 2026-06-10
- status: accepted
- confidence: high
**Context:** core direction is decision persistence; flat date+confidence entries didn't capture WHY/consequences or an ADR status lifecycle.
**Decision:** add optional `status` (proposed/accepted/superseded/deprecated) + Context/Decision/Consequences structure, reusing existing supersede/expire as the lifecycle; MCP write_decision takes structured fields. Backward-compatible (no parser rewrite — sections are body markdown).
**Consequences:** consolidate now retires deprecated too; lint validates status; old entries without status stay valid (treated as live). Kept it lightweight — no enforcement/approval (that's the OUT scope fence).

## Core direction = Decision Persistence (AI-maintained, compaction-surviving ADR)
- date: 2026-06-10
- confidence: high
Headline capability is persisting WHY + dead-ends across context resets — the gap /init and /handoff leave. Many tools record decisions; almost none make decision PERSISTENCE the core. Differentiation is not inventing ADR but: AI-maintained + survives compaction + temporal anti-rot + zero-dep local. Value=decision log; moat=compaction survival + reliable capture. #1 risk = honor-system write-back → prioritize MCP/Stop-hook capture + score penalizing thin logs.

## score empty-ledger guard: floor at 8 when GOAL/NOW/NEXT all placeholder
- date: 2026-06-10
- confidence: high
Free support dims (freshness/blockers/grounding) were padding an empty template to 33 — false comfort. When core fields are all placeholders, cap overall <=8 + label "empty ledger". selftest asserts empty < 15.

## `score` is a transparent heuristic, not an ML/precision number
- date: 2026-06-10
- confidence: high
coderecall score weights toward actionability (vague NEXT like "continue" scores low even when filled; blockers must carry a reason). Each dim shows why + "fix first". Codex bar: must machine-check actionability or it's decoration — selftest asserts concrete NEXT=100, vague NEXT<60. Purpose: catch false completeness, the failure mode behind "agent doesn't know what to do next".

## Hybrid git ownership: commit durable knowledge, gitignore working state
- date: 2026-06-10
- confidence: high
init writes a .gitignore block: DECISIONS/LESSONS + consolidated/retired archives committed; TASK.md/sessions.md/precompact local-only. Decisive reason: multi-dev NOW:/NEXT: merge conflicts. CRITICAL: committed AGENTS.md must NOT embed live GOAL/NOW/NEXT (would leak working state past the gitignore) — renderSectionBody now emits protocol + pointer only. Three-way reviewed (Claude/Codex/Gemini all converged on hybrid).

## Lead positioning with compaction survival, not "memory"
- date: 2026-06-10
- confidence: high
README headline = "working memory for coding agents that survives context compaction". graduate demoted out of core command list (experimental). The defensible wedge is compaction recovery + stale-state prevention, NOT a "protocol" (don't declare protocol before multi-party adoption earns it — Codex).

## Search is lexical (BM25), not semantic
- date: 2026-06-10
- confidence: high
Chose zero-dep BM25 over embeddings/vector DB to keep the no-daemon/no-network/no-deps brand. Honestly weaker than semantic recall, but answers "where did I decide X" without install cost. Tokenizer indexes alphanumeric words + individual CJK chars so CN/EN both work.

## Cursor hooks.json + Gemini settings are best-effort JSON merges
- date: 2026-06-10
- confidence: med
sync --all merges (never overwrites) into .gemini/settings.json (contextFileName) and .cursor/hooks.json (Stop). Cursor's hook schema is young and may change; entry is idempotent and removed by deinit. Plain-quote the node path — do NOT JSON.stringify it first (double-escapes backslashes).

## v2.0 MCP server is zero-dep stdio JSON-RPC, files stay the storage layer
- date: 2026-06-10
- confidence: high
`coderecall mcp` hand-rolls newline-delimited JSON-RPC 2.0 over stdin/stdout (no SDK → zero deps). Tools: read_memory/update_task/write_decision/write_lesson/search_memory. Tool errors returned with isError:true (model sees them) not as JSON-RPC errors. Closes honor-system write-back without making MCP mandatory — AGENTS.md still covers non-MCP tools.

## Temporal model supersedes (keeps history) rather than overwrites
- date: 2026-06-10
- confidence: high
upsertEntry on >0.8 title overlap marks old `status: superseded` + keeps it (evolution stays searchable), new entry records `supersedes:`. `expires:` enables auto-forget. consolidate retires superseded+expired to archive/retired-YYYY-MM.md. Borrowed from supermemory's temporal/contradiction handling, zero-dep (no LLM/vector).

## Git pre-commit hook is a coderecall.js subcommand, not shell in the installers
- date: 2026-06-10
- confidence: high
Implemented install-githook/precommit/remove-githook in coderecall.js (node writes the .git/hooks/pre-commit file) instead of duplicating shell logic in install.ps1 + install.sh. One cross-platform code path, testable, and Git for Windows runs the sh hook fine. Re-stage uses `git ls-files --cached --error-unmatch` (tracked?), NOT `git diff --cached` (which misses a freshly-refreshed file).

## Pre-commit hook is advisory by default; --strict bakes in blocking; no ANSI
- date: 2026-06-10
- confidence: high
`install-githook` default warns-but-allows (refresh is the value; blocking a code commit over a missing confidence line is high-friction and trains --no-verify). `install-githook --strict` writes `precommit --strict` into the hook to block. Lint banner uses plain text, NOT ANSI colour — a git hook's stdout is not reliably a TTY and colour garbles on Windows cmd. Settled a v1.3.x debate with the external reviewer.

## Staleness reminder hook ships OFF by default
- date: 2026-06-10
- confidence: high
UserPromptSubmit reminder is opt-in (installers don't register it) because token discipline is SPEC priority #5. Throttled via .reminder to at most once per 45-min window.

## Reliable capture via friction-reduction + advisory nudge, not Stop-hook coercion
- date: 2026-06-10
- status: accepted
- confidence: high
**Context:** decision log's value depends on write-back actually happening (honor-system risk)
**Decision:** add a one-line `decision` CLI + a pre-commit advisory nudge; leave score undistorted
**Consequences:** non-coercive, on-brand; capture is easier + prompted at the commit checkpoint, never blocks

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
**Decision:** Add rule 6 to templates/AGENTS-section.md: ledger is SSOT, auto-memory only for positioning/cross-project context/tool quirks. Three-way reviewed (Claude 4.6 + Gemini 3.1 Pro + Codex GPT […]
**Consequences:** Every future coderecall init complete — this project now has a decision log at .ai/memory/ (per-project, lives in THIS repo).   kept existing: .ai\memory\TASK.md, .ai\memory\DECISION […]

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
