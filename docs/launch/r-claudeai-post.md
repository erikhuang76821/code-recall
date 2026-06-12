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

## Demo GIF spec (author records; ~20s, silent, terminal capture → GIF)

```
[0-4s]   a long session in progress (show TASK.md GOAL/NOW/NEXT)
[4-8s]   trigger / simulate a compaction (context being compacted on screen)
[8-14s]  new session starts → SessionStart hook injects the digest, the agent's
         first line correctly resumes NOW/NEXT (no re-asking, no re-walking)
[14-20s] side-by-side / caption: without Code Recall, the agent asks "what were
         we doing?" from scratch
```

Caption: **"Same compaction. Left: agent re-derives from scratch. Right: re-anchors from the ledger."**

## Pre-publish checklist

- [ ] Demo GIF recorded and embedded.
- [ ] README hero matches the hook (done: "your coding agent forgets *why*").
- [ ] Author approves going live.
- [ ] After posting: log responses + any installs as adoption signals (Gate 1).
