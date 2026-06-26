# LESSONS
<!-- Procedural memory + tried-and-failed. "Do not retry X because Y."

What belongs here: only what reading the current code could NOT recover — a pitfall,
a surprise that turned out to be intentional, an API quirk that bit you. Litmus test:
"could a competent engineer reconstruct this from the code as it stands?" If yes, it is
not a lesson — skip it.

Entry format (strict):
  ## <short title>
  - date: YYYY-MM-DD       # first recorded
  - updated: YYYY-MM-DD     # last confirmed still true (starts == date; refresh via `reconfirm`)
  - confidence: high|med|low
  - code: src/foo.ts → bar  # OPTIONAL back-link to the file (and symbol) the pitfall lives in
  <what failed AND the root cause, 1-3 lines>

Lifecycle (mark, don't delete): when the root cause is fixed mark `- status: resolved`;
when the situation it warned about no longer exists mark `- status: obsolete`
(`node coderecall.js resolve-lesson "<title>"`). Retired lessons drop out of default
search but stay searchable with --history, so a hard-won lesson is never lost.
-->
