# Launch draft — r/ClaudeAI (NOT YET PUBLISHED)

Status: **draft**. Do not post until the demo GIF exists and the author approves.
Venue: r/ClaudeAI. Hook: "reverses its own code after a compaction."
This is part of the trustworthy-adoption proof (distribution-first; strangers-only).
See the ADR "Trustworthy-adoption proof" in `.ai/memory/DECISIONS.md`.

---

## Post

**Title:** Does your coding agent also reverse its own code after a context compaction?

Long sessions in Claude Code keep biting me: halfway through, the context window
compacts, and the agent forgets *why* we did something — re-opens a decision I
settled an hour ago, re-tries an approach we already proved was a dead end,
occasionally rewrites code it just wrote the opposite way.

The chat had the reasoning. Compaction ate it.

I got tired of re-explaining, so I made a tiny thing for myself: a local
`.ai/memory/` ledger (working state + decisions + dead-ends, plain Markdown) that
a SessionStart/PreCompact hook **re-injects in front of the agent at every reset**
— so the *why* is on screen before it acts, instead of hoping the model recalls
it. Zero dependencies, no cloud, stays in the repo, same setup works across
Claude Code / Cursor / Gemini CLI.

[20s demo gif]

Genuinely asking, not just sharing: **is this pain real for you too, or have you
solved it some other way?** MIT, link in comments if anyone wants to try it.

---

## Why it reads this way

- Title is a specific, painful *question*, not the tool name — victims self-identify.
- "made it for myself / genuinely asking" survives the sub's anti-promotion radar.
- The determinism claim is kept defensible: "in front of the agent ... instead of
  hoping the model recalls it" (NOT "guaranteed to work").
- Ends with a question, not a pitch — also collects the adoption signals the ADR
  wants (does the pain resonate, how do others solve it). Link in comments (Reddit
  norm; a bare link in the body gets suppressed).

## Demo (reproducible)

`node docs/launch/demo.js` prints the three-panel screenplay below. PANEL 3b is
the REAL output of `coderecall digest --compact` (what the SessionStart hook
injects after a compaction) — nothing is faked. Record that terminal for the
~20s GIF.

```
PANEL 1  mid-task, hour 2: GOAL / NOW / NEXT + "already decided: JWT" + blocker
PANEL 2  💥 the context window compacts — the chat's "why" is summarized away
PANEL 3a WITHOUT: agent re-opens the settled JWT question, forgets the blocker
PANEL 3b WITH:    real digest --compact re-anchors GOAL/NOW/NEXT, the JWT
                  decision, and the mobile blocker — on sight
```

Caption: **"Same compaction. Left: re-derives from scratch. Right: re-anchors from the ledger."**

**Honesty note (so a skeptic can't dunk on it):** the injected digest carries
GOAL/NOW/NEXT, the *current decision titles*, and *blocked items* inline, plus a
count of lessons and a pointer to the ledger — it does NOT inline full LESSONS
text. The contrast in the demo rests only on what is literally injected (the JWT
decision + the blocker), not on anything the digest merely references.

## Pre-publish checklist

- [x] Reproducible demo script exists (`docs/launch/demo.js`) with real CLI output.
- [x] README hero matches the hook ("your coding agent forgets *why*").
- [ ] Demo GIF recorded from `demo.js` and embedded.
- [ ] Author approves going live.
- [ ] After posting: log responses + any installs as adoption signals (Gate 1).
