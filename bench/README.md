# Code Recall — benchmarks

Two layers, kept deliberately separate so we never pass one off as the other.

## 1. Context-hygiene benchmark (deterministic, runnable now)

```sh
node bench/bench.js     # or: npm run bench
```

Builds a synthetic decision log (current + superseded/deprecated), then measures —
by running the **real CLI** — what reaches the model's context under two regimes:

- **Naive append-only** (Memory-Bank / "inject the whole log" style): the entire
  decision log is injected.
- **Code Recall** (lifecycle-aware): the digest surfaces only the top-N *current*
  decisions; `search` returns current truth by default.

It reports: decision **tokens injected**, **% stale content** in the injection,
**current decisions visible**, and **stale hits in a term search**. These are
real, reproducible numbers about *context hygiene* — the "influence rot" and
"attention budget" problems. Example output (20 decisions, 12 stale):

| metric | naive append-only | Code Recall |
|---|---|---|
| decision tokens injected | ~673 | ~66 (10× less) |
| stale content in injection | 60% (12/20) | 0% |
| stale hits in a term search | 14 (all) | 0 (current-only) |

**What this does NOT claim:** that an agent writes better code, finishes more
tasks, or repeats fewer dead-ends. That depends on the model and the task and
**cannot be measured without a live agent**. See below.

## 2. Live-agent benchmark (protocol — bring your own agent)

We do not ship faked agent numbers. To measure task-level value honestly, run a
controlled A/B with a real coding agent and **publish the raw transcripts**:

1. **Task.** Pick a multi-session task that crosses ≥1 context compaction — e.g.
   "refactor module X across N files; you will be interrupted." Fix the prompt.
2. **Arms.** (A) agent alone. (B) agent + Code Recall (`init`, hooks installed,
   protocol in `AGENTS.md`). Same model, same task, same seed/temperature where
   possible. Run each arm K times (K ≥ 5) to average out variance.
3. **Metrics** (count from transcripts, not vibes):
   - **re-litigated decisions** — times the agent re-debated/reversed a choice
     already recorded as `accepted`.
   - **repeated dead-ends** — times it retried an approach recorded in `LESSONS`.
   - **context-loss restarts** — times it re-derived the task state after a
     compaction instead of resuming.
   - **task completion** (pass/fail against a fixed rubric) and **token cost**.
4. **Report** mean ± stdev per metric per arm, the rubric, the exact prompts, and
   the raw transcripts. A result is only credible if someone else can re-run it.

Honest expectation: Code Recall should move (1)–(3) on long/compaction-heavy
tasks and do ~nothing on short single-shot tasks — that's consistent with its
positioning. Report whatever you find, including null results.
