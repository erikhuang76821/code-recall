<p align="center">
  <img src="https://github.com/erikhuang76821/code-recall/blob/master/docs/assets/1.png?raw=true" alt="Code Recall — Decision Persistence Layer for AI Coding" width="100%">
</p>

<p align="center"><b>English</b> · <a href="README.zh-TW.md">繁體中文</a></p>

# 🌟 Code Recall — your coding agent forgets *why*

> Long session, the context window compacts — and your agent re-opens a decision you settled an hour ago, re-walks a dead end you already ruled out, sometimes **rewrites code it just wrote the opposite way**. The chat had the reasoning; compaction ate it. Code Recall keeps it **in front of the agent at every reset** — instead of hoping the model recalls it.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/erikhuang76821/code-recall/actions/workflows/ci.yml/badge.svg)](https://github.com/erikhuang76821/code-recall/actions/workflows/ci.yml)
[![Version](https://img.shields.io/badge/version-2.8-orange.svg)](ROADMAP.md)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

Code Recall is a tiny **local decision ledger** for AI coding agents. It holds the thing projects lose most easily and rebuild most expensively — **why a choice was made, and which paths are proven dead ends** — in plain Markdown, and a SessionStart/PreCompact hook **re-injects it in front of the agent the moment context is lost** (session start, resume, before compaction). Not a memory database; not the cloud; not a governance platform. Zero dependencies, stays in the repo, the same setup across **Claude Code / Cursor / Gemini CLI**. Think **"Git for decisions" that survives compaction.**

**Requirements** · Node ≥ 10.12 (anything since 2018; CI runs Node 18 / 20 × Linux / Windows).

---

## 🔭 Vision

Coding is commoditizing. The next differentiator isn't who writes code faster — it's who keeps **decisions** from being lost, rotting, or silently re-litigated. AI IDEs are already strong at `Retrieval → Reasoning → CodeGen`, but nearly blank on *persisting* the `Decision (why) → dead-ends (what failed)` layer — it lives only in the chat and evaporates on the next compaction. Code Recall aims to be the **local, zero-dependency foundation** for that layer: no cloud, no data egress, travels with the repo, so every AI agent sees current truth before it acts.

---

## 🧭 What it fills, and what it does not replace

Your agent already has several "memory-ish" surfaces — they just answer different questions. Code Recall doesn't replace any of them; it fills the one cell none of them cover: **why a choice was made, and which paths are proven dead ends.** Put side by side:

| | `/init` | auto-memory (`MEMORY.md`)\* | rules (`CLAUDE.md` / `AGENTS.md`) | `/handoff` | **Code Recall** |
|---|---|---|---|---|---|
| **Answers** | what the code *is* | cross-project / machine notes | the standing *rules* | where *this chat* got to | **why it was decided + which paths are dead ends** |
| **Lifespan** | one-time snapshot | accretes, cross-project | stable, long-lived | one-time | evolves, with a lifecycle |
| **Trigger** | manual `/init` | harness-managed | read every turn | manual `/handoff` | **auto via hooks** (session start / pre-compaction) |
| **Scope** | one repo | your machine | one repo | one conversation | one repo (travels with git) |
| **Travels with the repo** | ✅ (`CLAUDE.md`) | ❌ local-only | ✅ | ❌ | ✅ team-shared |
| **Survives compaction** | ⚠️ if kept resident | ⚠️ harness-decided | ✅ resident | ❌ one-shot | ✅ **re-injected by design** |
| **Stale auto-retires** | ❌ rerun by hand | manual | ❌ | n/a | ✅ supersede / expire / archive |

<sub>\* Claude Code's own file-based memory (`~/.claude/.../memory/MEMORY.md`) — a *different layer* from Code Recall. The two are kept deliberately separate (see boundary note below).</sub>

In one line each: `/init` = *what the code is* · rules = *the standing rules* · `/handoff` = *this chat's closing handoff* · auto-memory = *your cross-project/machine notes* · **Code Recall = why it was done this way, which dead ends to avoid, and where the work stands — re-surfaced automatically at every reset.** Also distinct from RAG / vector / semantic memory: that's *retrieval*; this is *decision rationale*.

**Preserves (what projects lose most):**
- **Decisions & constraints** — why it's the way it is
- **Failed attempts** — which paths not to retry (don't retry X because Y)
- **Goal & the thread in progress** — where you're mid-work (compaction can't erase it)

…and unlike a doc you'd forget to update, it's re-injected every session, snapshotted before compaction, and expired/superseded decisions auto-retire (ADR status lifecycle).

> **Boundary with auto-memory** · `.ai/memory/` is the single source of truth — decisions, lessons, and working state live there, never duplicated into the harness's auto-memory. Auto-memory holds only what Code Recall deliberately *doesn't*: project positioning, cross-project context, local OS/tool quirks. So the two never record the same fact twice and can't drift apart.

---

## 😫 The Problem

What large projects lose most easily isn't "where did I get to" (the code/git shows that) — it's:

- **Why it was done this way** + **which paths are proven dead ends** — these live only in the chat and evaporate the moment the window compacts → re-litigating settled decisions, re-walking dead ends (the most expensive waste).
- Mid-task auto-compaction: the agent loses the thread, redoes work, even **reverses what it just wrote**.
- Switching tools (Claude Code ↔ Cursor ↔ Copilot), memory isn't shared — you re-explain every time.
- Memory tools (mem0 / supermemory, etc.) want a DB, vectors, the cloud, paid APIs — too heavy for "I just want the coding agent to remember decisions, without shipping my code to a cloud."

## 🎯 The Solution

Code Recall follows a "subtractive" philosophy: condense memory into a few static Markdown files, and let lifecycle hooks **re-inject the task digest automatically** at session start / after compaction, while the agent keeps rewriting the ledger per the protocol.

### ✨ Core features

- **🍃 Zero-dependency:** no DB, no background service, no network, zero npm runtime deps; 100% local files, code never leaves.
- **🛡️ Compaction survival:** PreCompact snapshots before compaction; the post-compaction session re-anchors with the full TASK.md — the strongest in its class, backed by a [CI regression test](#-selftest--ci).
- **🤝 Cross-tool:** one `.ai/memory/`, read by every IDE/CLI via the `AGENTS.md` protocol; `git clone` carries it along.
- **⚡ Token discipline:** only a compact, budget-capped digest is injected each session — the digest's fence content is hard-capped (~1.2 KB, a few hundred tokens), so the whole ledger is **not** stuffed into context; zero cost in non-Code-Recall projects.
- **🔎 Searchable:** zero-dep BM25 lexical search (English & Chinese), covering cross-month recall.
- **🧹 Anti-rot:** temporal/supersede/expire model + `doctor` lint + an optional git pre-commit gate minimize "stale ledger misleads you."
- **🚨 Fail-loud, not fail-silent:** tolerant `TASK.md` parsing + digest/`doctor` warnings surface a malformed or append-drifted ledger — a missing-colon `NOW`, multiple `NOW` lines (appending instead of rewriting), or a `NOW` that's actually finished work — **before** the agent re-anchors to it, instead of silently shipping an empty/misleading anchor. Authored ADR fields are never silently truncated on write. (Hardened via a 3-round adversarial review against a real project whose ledger had drifted.)
- **🪟 Windows-first:** PowerShell installer, native Windows 11 support.

---

## 🚀 Quick Start

> **Mental model** · The **tool** is installed **once per machine**. **Memory is per-project**: you run `coderecall init` inside *each repo* you want tracked, and that repo's decision log lives in its own `.ai/memory/`. There is **no central memory store** — that's by design (decisions travel with the code they describe).

### 0. Make the `coderecall` command available (once per machine)

```sh
npm i -g coderecall                 # after npm publish — `coderecall` works anywhere
# or, from a local clone (no publish needed):
git clone https://github.com/erikhuang76821/code-recall && cd code-recall && npm link
```

### 1. Initialize memory inside a project (once per project)

```sh
cd path/to/your-project             # ← the project you want tracked, NOT the tool folder
coderecall init                     # creates ./.ai/memory/ in THIS project
# no global command? from a clone:  node /path/to/code-recall/coderecall.js init
```

Creates `.ai/memory/` and inserts a protocol section into `AGENTS.md` (the instruction-style hook for tools without native hooks):

| File | Purpose |
|---|---|
| `TASK.md` | Current goal & progress: `GOAL` / `NOW` / `NEXT` + checklist |
| `DECISIONS.md` | **Decision log (ADR-grade):** Context / Decision / Consequences + status (proposed/accepted/superseded/deprecated) |
| `LESSONS.md` | Pitfalls + root cause ("don't retry X because Y") |

**Git ownership (hybrid by default):** `init` writes a `.gitignore` block — **durable team knowledge (`DECISIONS.md` / `LESSONS.md` + archives) is committed**, while **each developer's volatile working state (`TASK.md` / `sessions.md` / pre-compaction snapshots) stays local**. So `TASK.md` won't cause multi-dev `NOW:`/`NEXT:` merge conflicts, and git history isn't flooded by machine edits. Want a solo private repo to track live state too? Delete the `TASK.md` lines from the block. (The committed `AGENTS.md` **deliberately does not embed** live `NOW:`/`NEXT:`, to avoid leaking state.)

### 2. Install global hooks (once per machine, Claude Code only)

```powershell
powershell -ExecutionPolicy Bypass -File install.ps1   # Windows
```
```sh
sh install.sh                                          # macOS / Linux
```

The installer only **merges** into `~/.claude/settings.json`: backs up first, never clobbers existing hooks, idempotent. Uninstall: `install.ps1 -Uninstall` / `install.sh --uninstall`.

### 3. Done

No manual steps after that — hooks auto-inject the task digest at every session start / after compaction, and the agent rewrites the ledger per the protocol.

**Other tools (Cursor / Copilot / Windsurf / Cline / Roo / Gemini / Codex):** run `node coderecall.js sync --all` to generate each tool's instruction stub + native config; the protocol text itself is their hook.

---

## 🧰 Command Reference

```sh
node coderecall.js <command>      # or, after publish: npx coderecall <command>
```

| Command | What it does |
|---|---|
| `init` | Create `.ai/memory/` + AGENTS.md protocol section + CLAUDE.md stub |
| `sync [--all]` | Refresh AGENTS.md; `--all` also writes per-tool stubs + Gemini/Cursor native config |
| `status` | Show GOAL/NOW/NEXT, checklist, file sizes, drift, freshness |
| `doctor [--selftest]` | Health check (hooks/ledger/paths/lint/Codex 32KiB); `--selftest` also runs the regression test |
| `score [--json]` | Rate working-state health (GOAL clarity / NEXT actionability / blockers reasoned / freshness) |
| `decision "<title>" [--context/--decision/--consequences/--status/--confidence] [--supersedes "<old title/substr>"] [--code "<path → symbol>"]` | Record an ADR decision in one line; `--supersedes` explicitly retires a prior decision (independent of title similarity); `--code` back-links the file/symbol it governs (`doctor` flags it if the path disappears) |
| `search <query> [--limit N] [--history]` | Lexical search — **current truth only by default** (superseded/deprecated/resolved/obsolete/archive excluded); `--history` includes them (labeled `[superseded]` / `[resolved]`) |
| `decisions [--all]` | **HEAD view:** list current accepted decisions (`--all` includes superseded/deprecated) |
| `resolve-lesson "<title>" [--status resolved\|obsolete] [--note ".."]` | Retire a lesson whose root cause is fixed (`resolved`) or whose premise is gone (`obsolete`) — kept & searchable via `--history`, just dropped from default results (mark-over-delete) |
| `reconfirm "<title>" [--file decisions\|lessons] [--confidence ..]` | Re-stamp a still-true entry's `updated:` (and optionally raise confidence) without rewriting it, so recency ranking + the staleness flag treat it as fresh |
| `digest [--compact]` | Print the session-injection digest (debugging) |
| `consolidate` | Archive done items (monthly), retire superseded/expired entries, dedupe, age-flag |
| `snapshot` | Write a manual snapshot |
| `mcp` | Run the zero-dep stdio MCP server (memory write-back as tool calls) |
| `precommit [--strict]` | Used by the git hook: refresh digest + lint (`--strict` blocks) |
| `install-githook [--strict]` / `remove-githook` | Install/remove the git pre-commit gate |
| `deinit [--yes]` | Cleanly remove from a project (dry-run by default) |
| `selftest` / `version` | Run the compaction-survival regression test / print version |

---

## 🧠 How it Works

Code Recall listens to AI-tool lifecycle hooks and accesses memory automatically:

1. **Session Start** — read a compact, budget-capped digest (fence content ≤ ~1.2 KB, a few hundred tokens) from `.ai/memory/` and inject it as context.
2. **Context Compaction** — `precompact.js` snapshots the transcript tail before compaction; the post-compaction session re-anchors with the **full TASK.md**.
3. **End of turn** — `stop.js` maintains a heartbeat + a bounded `sessions.md` timeline.
4. **Pull-based recall** — when needed, use `coderecall search` (BM25) or the MCP tools to fetch memory **on demand**, not permanently occupying context.

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

## 🤝 Supported AI Agents

| Agent | How |
|---|---|
| ✅ Claude Code | Native hooks (SessionStart / PreCompact / Stop) — inject, snapshot, re-anchor, all automatic |
| ✅ Cursor | `.cursor/rules` instruction hook + `.cursor/hooks.json` Stop heartbeat (`sync --all`) |
| ✅ GitHub Copilot | `.github/copilot-instructions.md` instruction hook |
| ✅ Windsurf | `.windsurf/rules` (`trigger: always_on`) |
| ✅ Cline / Roo | `.clinerules` / `.roo/rules` instruction hook |
| ✅ Gemini CLI | `.gemini/settings.json` loads AGENTS.md natively |
| ✅ Codex CLI | AGENTS.md (`doctor` warns past the ~32KiB read window) |
| ✅ Any MCP client | `coderecall mcp` — Claude Desktop / Cursor / VS Code… can call the memory tools directly |

Per-tool truth across the three layers (injection / write-back / compaction survival): see [COMPATIBILITY.md](COMPATIBILITY.md).

---

<p align="center">
  <img src="https://github.com/erikhuang76821/code-recall/blob/master/docs/assets/2.png?raw=true" alt="Code Recall — capture decisions, stay persistent, avoid re-litigation, episodic memory, local & zero-dependency" width="100%">
</p>

## 📊 Market scarcity — who treats *decision persistence* as the core?

Plenty of tools *record* decisions; almost none make **keeping stale decisions from misleading you while keeping current ones influential** their *core*. Most cover only one or two cells:

| Capability | Memory Bank* | llm-wiki / Obsidian | mem0 / supermemory | ADR tools† | Knowie‡ | **Code Recall** |
|---|---|---|---|---|---|---|
| Easy / low-friction capture | ✅ | ❌ manual | ✅ auto | ❌ manual | ⚠️ `/capture` | ✅ CLI/MCP |
| Auto-surfaced (no manual call) | ⚠️ varies | ❌ | ✅ | ❌ | ❌ pull | ✅ hooks |
| Decision status lifecycle (accepted/superseded) | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Stale loses influence (rot governance) | ❌ append-only | ❌ | ⚠️ semantic | ❌ humans read | ❌ | ✅ filter+weight |
| Surfacing across compaction | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ digest |
| Warn on re-litigation | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Local · zero-dep · no cloud | ✅ | ✅ | ❌ cloud/vector | ✅ | ✅ | ✅ |
| AI-maintained | ⚠️ | ❌ | ✅ | ❌ human | ⚠️ pull | ✅ |

<sub>\* append-only memory banks like Cline / Roo / Cursor Memories　† human ADR tools like adr-tools / log4brains　‡ [Knowie](https://github.com/timcsy/knowie) — local Markdown knowledge layer, slash-command driven</sub>

ADR tools have a status lifecycle but are human-authored and never surface to the agent or survive compaction. Memory banks auto-capture but have no decision-status lifecycle or influence governance (append-only → rot). Cloud memory (mem0 / supermemory) adds semantic recall but isn't local/zero-dep and has no ADR-style decision lifecycle.

**The closest neighbor is [Knowie](https://github.com/timcsy/knowie)** — also local, zero-dependency, Markdown, "record the *why*, not retrieval." The dividing line is the **trigger model**: Knowie is **pull** — you invoke `/knowie-capture`, `/knowie-next` in chat, and it deliberately favors human-authored curation; Code Recall is **push** — lifecycle hooks fire at session start and before compaction, so no one has to *remember* to call them ([CI-proven](#-selftest--ci)) — plus a decision-status lifecycle Knowie doesn't carry. In return, Knowie has a vision/principles alignment layer and git-history migration Code Recall doesn't. Different bet, not a worse one. **Code Recall's uncontested cell is the bottom stack: AI-maintained decision lifecycle + influence governance + auto-surfacing across compaction, all local and zero-dependency.**

> **Honest positioning** · We do **not** compete with mem0/supermemory on semantic recall or multi-modality (that's the cloud products' home turf), and we do **not** build a governance/approval engine. Against the nearest local peer: **Knowie waits for you to ask; Code Recall shows up on its own** — hooks fire at session start and before compaction (strongest on Claude Code, where native hooks exist; instruction-driven elsewhere). Code Recall's moat is "local, zero-dependency, decision lifecycle + surviving compaction." Per-tool reality in [COMPATIBILITY.md](COMPATIBILITY.md); competitive assessment in [ROADMAP.md](ROADMAP.md).

---

## 🛠️ Advanced Usage

### 🔎 Search memory

```sh
node coderecall.js search "idempotency key"     # 5 by default
node coderecall.js search redis retry --limit 3
```
Zero-dep BM25 lexical search across the ledger + `archive/`, paragraph/entry-level results with score and source.

### 📊 Working-state score

```sh
node coderecall.js score          # human-readable
node coderecall.js score --json   # for CI / agents
```

Answers "can an agent actually pick this ledger up?" — not whether the fields are filled, but a **machine check of actionability**: is GOAL specific, is NEXT a concrete next step (vague values like "continue"/"TBD" score low), does each `[!]` blocker have a reason, is the ledger fresh. Each dimension reports **why** and **what to fix first**. Deliberately a transparent heuristic, not a fake-precision ML score — the point is to catch false completeness ("looks filled, can't drive the next step"). `status` shows the one-line overall.

### ✅ Self-test / CI

```sh
node coderecall.js selftest        # or doctor --selftest / npm test
```
Simulates compaction in a throwaway project and **drives the real hook scripts** (sessionstart / precompact), asserting the re-anchor digest contains the full TASK body and that a snapshot is written. GitHub Actions runs it on **Linux + Windows × Node 18/20** on every push/PR — turning the headline claim into a reproducible regression test.

### 🧹 Temporal / supersede / expire / reconfirm (zero-dep)

DECISIONS/LESSONS support `expires:` (auto-forget on/after a date) and a supersede chain: writing an overlapping-title decision marks the old one `status: superseded` (kept, so evolution stays visible) by **code**, not a silent overwrite. `consolidate` retires superseded + expired entries to `archive/retired-YYYY-MM.md`. The links are code-maintained (not hand-written by the AI) and carry no traversal logic, so there are no orphans / cycles.

Two more lifecycle moves, both **mark-over-delete** (an entry is never destroyed, only re-stamped — so a hard-won lesson stays reachable via `--history`):

- **Lessons retire too:** `resolve-lesson "<title>"` marks a lesson `resolved` (root cause fixed, the pitfall no longer bites) or `obsolete` (the situation it warned about is gone). It leaves default search but stays in `--history`.
- **Re-confirm what still holds:** `reconfirm "<title>"` refreshes an entry's `- updated:` date (and can re-raise confidence) **without rewriting it**. `updated:` (last-confirmed) is tracked separately from `date:` (first-recorded), and recency ranking + the staleness flag key off `updated:` — so a still-valid old decision you re-confirm ranks fresh instead of decaying.
- **Navigable back-links:** an optional `- code: <path → symbol>` ties a decision/lesson to the file it's about; `doctor` flags it when that path disappears (the entry may be stale). URLs and bare symbols are skipped.

> **What to record (recoverability test):** before writing, ask *could a competent engineer reconstruct this from the code as it stands?* If yes, don't record it — the ledger is for what code can't show (the why, the dead ends, the pitfalls), never for what reading the code would reveal.

### 🔌 Optional: MCP server (write-back as tool calls)

```jsonc
// Claude Desktop / Cursor / any MCP client
{ "mcpServers": { "coderecall": { "command": "node", "args": ["<path>/code-recall/coderecall.js", "mcp"] } } }
```
Zero-dep stdio JSON-RPC exposing `read_memory` / `update_task` / `write_decision` / `write_lesson` / `resolve_lesson` / `reconfirm` / `search_memory`. Turns honor-system write-back into a tool call; files remain the storage layer, AGENTS.md still covers non-MCP tools.

### ♻️ Current truth & influence governance

The most dangerous thing about long-term memory isn't *forgetting* — it's *wrongly remembering*: stale/superseded decisions keep getting recalled and pollute context (influence rot). Code Recall treats decisions like **Git, not a vector store**: what matters is "which is HEAD (current)", not "which is most similar."

- **Current/history split:** `search` and MCP `search_memory` **return current decisions only by default**; superseded/deprecated/archive don't appear. Add `--history` to include them (clearly labeled `[superseded]`). `decisions` gives the HEAD view.
- **Explicit supersede:** `decision "new" --supersedes "old keyword"` retires the old decision directly — independent of title similarity.
- **Weighted ranking:** recall score = `BM25 × statusWeight (accepted/active 1.0 / proposed 0.5 / deprecated 0.2 / resolved 0.1 / superseded·obsolete 0.05) × confidence × recency`. On an equal match, current/high-confidence/recent decisions rank first.
- **Surfacing:** every session / after compaction, the digest **surfaces the top-5 current decisions** (titles only, newest-first, **accepted only** — proposed/superseded/expired excluded). Bounded curated attention, not the whole log.
- **Anti-re-litigation:** recording a decision that clearly overlaps an accepted one but is below the auto-supersede bar offers three resolutions: `--supersedes "X"`, `--confirm-new`, or revise the title.

> Design philosophy: what an LLM lacks isn't *storage*, it's **attention** — the question isn't how many you can store, but "which few should this task see."
>
> ⚠️ Zero-dep boundary: detecting that *code* contradicts a decision needs semantic understanding (LLM/vector) and is out of scope. Code Recall instead surfaces current decisions and warns at authoring time — maximizing "seen, not re-decided," without semantic contradiction detection.

### ✍️ Reliable capture

A decision log is only worth anything if decisions actually get recorded. Code Recall uses two **non-coercive** levers:

```sh
node coderecall.js decision "Adopt hexagonal architecture" \
  --context "billing tangled with HTTP" --decision "ports/adapters" --consequences "more boilerplate, easier to test"
```

- **Lower the friction:** `decision` records an ADR in one line (or MCP `write_decision`, called by the agent).
- **Nudge at the right checkpoint:** the git pre-commit hook prints **one advisory line** when you commit source but record no decision (never blocks; not a per-turn Stop-hook nag).
- No coercive prompts — real enforcement is the commit gate + the human; a prompt is just a prompt.

### 🪝 Optional: git pre-commit gate (code maintains derived state)

```sh
node coderecall.js install-githook            # advisory: lint issues warn, commit proceeds
node coderecall.js install-githook --strict   # strict: malformed entries block the commit
node coderecall.js remove-githook
```
At commit time it regenerates the AGENTS.md digest from `TASK.md` + lints the ledger, and re-stages tracked AGENTS.md/CLAUDE.md. Cross-platform (node writes an sh hook), marker-merges without clobbering an existing hook, removed by `deinit`. Bypass once: `git commit --no-verify`.

### 🎓 Optional (experimental): graduate to ADR + cross-project lessons

```sh
node coderecall.js graduate            # >90d, confidence high → docs/adr/NNNN-*.md (ADR files)
node coderecall.js graduate --global   # also append to ~/.coderecall/GLOBAL-LESSONS.md (cross-project)
```
Non-destructive (entries stay in the ledger marked `graduated:`, exported once). Decisions become conventional numbered ADR files consumable by adr-tools/log4brains. To inject cross-project lessons into the digest (top-3): set `CODE_RECALL_GLOBAL_LESSONS=1`; relocate the global dir via `CODE_RECALL_GLOBAL_DIR`.

### 🔔 Optional: staleness reminder hook (off by default)

Off by default to honor token discipline. Enable by adding a UserPromptSubmit hook in `~/.claude/settings.json` pointing at `hooks/userpromptsubmit.js`: when the ledger is >45 min stale it injects one ~15-token reminder, throttled.

### 🧹 Consolidation + 🤝 team collaboration

```sh
node coderecall.js consolidate   # archive done items, retire expired entries, dedupe
```
Memory is plain-text Markdown — commit `.ai/memory/` to git and your teammates and CI/CD share the same AI context.

---

## ❓ Troubleshooting

**Hooks not firing** — run `node coderecall.js doctor`; confirm the hook in `~/.claude/settings.json` is an absolute path that exists (re-run the installer after moving the repo); restart the Claude Code session.

**Installer says JSON parse failed** — deliberate safety: a corrupt settings.json is never overwritten. Fix the JSON (find a `settings.json.coderecall.bak.*` backup) and re-run.

**A project shouldn't have memory** — do nothing: in projects without `.ai/memory/`, all hooks exit 0 immediately, zero cost.

**Digest stale** — a ledger unchanged for >2h is flagged STALE and the digest says "verify before trusting." Run `node coderecall.js status` and have the agent rewrite NOW/NEXT.

**Ledger too big** — run `node coderecall.js consolidate`; `doctor` warns past ~4KB/file.

**Uninstall** — global hooks: `install.ps1 -Uninstall` / `install.sh --uninstall` (removes only coderecall entries). Single project: `node coderecall.js deinit` (dry-run) → `--yes` (apply), preserving your content in shared files.

---

## 📄 License

[MIT](LICENSE).
