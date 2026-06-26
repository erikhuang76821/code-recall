# DECISIONS
<!-- Decision log (ADR-grade). One entry per decision; this is the durable record
of WHY the project is the way it is and WHAT was rejected.

Record only what reading the current code could NOT recover — the WHY, the forces, the
paths you rejected. If a competent engineer could reconstruct it from the code as it
stands, it is not a decision worth logging here.

Entry format (backward-compatible — date + confidence + free body still valid):
  ## <short title>
  - date: YYYY-MM-DD        # first recorded
  - updated: YYYY-MM-DD      # last confirmed still true (starts == date; refresh via `reconfirm`)
  - status: accepted        # proposed | accepted | superseded | deprecated
  - confidence: high|med|low
  - code: src/foo.ts → bar  # OPTIONAL back-link to the file (and symbol) this decision governs
  - aliases: k8s helm        # OPTIONAL extra search terms (synonyms / old names) so lexical search finds this by words not in the title/body
  # optional lifecycle: supersedes / superseded-by / expires: YYYY-MM-DD / graduated
  **Context:** why this came up / the forces at play
  **Decision:** what we decided
  **Consequences:** trade-offs, what this rules out, follow-ups

Re-confirming an old-but-still-true decision: `node coderecall.js reconfirm "<title>"`
refreshes `updated:` so recency ranking and the staleness flag treat it as fresh,
without rewriting the entry.

Lifecycle: a new decision whose title overlaps an existing ACTIVE one marks the old
`status: superseded` (kept for history); `consolidate` retires superseded/deprecated/
expired entries to archive/. Record dead-ends as LESSONS.md entries ("do not retry X
because Y") — together they answer "why" and "what doesn't work".
-->
