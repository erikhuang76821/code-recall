#!/usr/bin/env node
/*
 * demo.js — reproducible "compaction survival" demo for the launch GIF.
 *
 * Builds a throwaway project with a realistic Code Recall ledger mid-task, then
 * prints a three-panel screenplay. PANEL 3 (with Code Recall) is the REAL output
 * of `coderecall digest --compact` — the exact text the SessionStart hook injects
 * after a compaction. PANEL 3 (without) is the honest baseline: nothing.
 *
 * Run: node docs/launch/demo.js     (from the repo root)
 * Record this terminal for the ~20s GIF. Nothing here is faked or persisted.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');

const CLI = path.join(__dirname, '..', '..', 'coderecall.js');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'coderecall-demo-'));
const run = (args) => cp.execFileSync(process.execPath, [CLI].concat(args), { cwd: tmp, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const line = (s) => process.stdout.write(s + '\n');
const rule = () => line('─'.repeat(64));

try {
  run(['init']);
  // A realistic mid-task ledger: refactoring auth, mid-migration.
  fs.writeFileSync(path.join(tmp, '.ai', 'memory', 'TASK.md'), [
    '# TASK',
    'GOAL: migrate auth from server sessions to JWT without logging users out',
    'NOW: swapped the login route to issue JWTs; wiring the refresh-token flow next',
    'NEXT: add refresh-token rotation, then delete the old session table',
    'UPDATED: 2026-06-12T09:00:00+08:00',
    '',
    '## Checklist',
    '- [x] issue JWT on login',
    '- [>] refresh-token rotation',
    '- [!] blocked: mobile app pins the old /session cookie — needs a client release first',
    '',
  ].join('\n'), 'utf8');
  fs.writeFileSync(path.join(tmp, '.ai', 'memory', 'DECISIONS.md'), [
    '# DECISIONS',
    '',
    '## Chose JWT over sticky server sessions',
    '- date: 2026-06-11',
    '- status: accepted',
    '- confidence: high',
    '**Decision:** stateless JWT so we can scale horizontally without a shared session store.',
    '',
  ].join('\n'), 'utf8');
  fs.writeFileSync(path.join(tmp, '.ai', 'memory', 'LESSONS.md'), [
    '# LESSONS',
    '',
    '## Do not store refresh tokens in localStorage',
    '- date: 2026-06-11',
    '- confidence: high',
    'XSS can read it. Tried it, reverted — use an httpOnly cookie.',
    '',
  ].join('\n'), 'utf8');

  line('');
  rule();
  line('  PANEL 1 — mid-task, hour 2 of a long session');
  rule();
  line('  GOAL: migrate auth from server sessions to JWT');
  line('  NOW:  wiring the refresh-token flow');
  line('  NEXT: refresh-token rotation, then drop the session table');
  line('  (already decided: JWT over sessions · blocked: mobile app still');
  line('   pins the old /session cookie · lessons recorded in the ledger)');
  line('');
  rule();
  line('  PANEL 2 — 💥 the context window compacts');
  rule();
  line('  The chat history — including every "why" above — is summarized away.');
  line('');
  rule();
  line('  PANEL 3a — WITHOUT Code Recall');
  rule();
  line('  Agent: "What were we working on? Let me re-read the codebase…"');
  line('  → re-opens the settled JWT-vs-sessions question and forgets the');
  line('    mobile blocker. You re-explain. Again.');
  line('');
  rule();
  line('  PANEL 3b — WITH Code Recall  (real `digest --compact`, auto-injected)');
  rule();
  process.stdout.write(run(['digest', '--compact']));
  line('');
  rule();
  line('  Same compaction. 3a re-derives from scratch; 3b re-anchors from the ledger.');
  rule();
  line('');
} finally {
  try { fs.rmSync ? fs.rmSync(tmp, { recursive: true, force: true }) : fs.rmdirSync(tmp, { recursive: true }); } catch (e) { /* best effort */ }
}
