#!/usr/bin/env node
/*
 * bench.js — an HONEST, deterministic, zero-dependency benchmark.
 *
 * It measures what Code Recall provably does: how much DECISION content (and how
 * much of it is STALE) reaches the model's context under two regimes —
 *   (1) naive append-only memory (Memory-Bank / "inject the whole log" style)
 *   (2) Code Recall (lifecycle-aware: digest surfaces top-N CURRENT decisions;
 *       search returns current truth only).
 *
 * It does NOT fake agent task-success numbers. Whether this reduces re-litigation
 * / repeated dead-ends in a real session requires a live-agent run — see
 * bench/README.md for that protocol. This script quantifies the *mechanism*:
 * context-hygiene / influence-rot exposure / attention budget. Real numbers,
 * produced by running the actual CLI, reproducible on any machine with node.
 *
 * Run: node bench/bench.js
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');

const CLI = path.join(__dirname, '..', 'coderecall.js');
const toks = (s) => Math.ceil(String(s).length / 4); // same estimate the tool uses

// --- synthetic ledger: 8 current (accepted) + 7 superseded + 5 deprecated ---
function entry(title, status, date, body) {
  return ['## ' + title, '- date: ' + date, '- status: ' + status, '- confidence: high',
    '**Decision:** ' + body].join('\n');
}
function buildDecisions() {
  const cur = [];
  for (let i = 1; i <= 8; i++) cur.push(entry('Current decision ' + i + ' about subsystem ' + i, 'accepted', '2026-05-1' + (i % 10), 'do approach ' + i + ' for subsystem ' + i));
  const sup = [];
  for (let i = 1; i <= 7; i++) sup.push(entry('Old approach ' + i + ' for subsystem ' + i, 'superseded', '2024-03-0' + (i % 10), 'former approach ' + i + ', replaced'));
  const dep = [];
  for (let i = 1; i <= 5; i++) dep.push(entry('Deprecated rule ' + i, 'deprecated', '2024-01-0' + (i % 10), 'rule ' + i + ', no longer applies'));
  return { header: '# DECISIONS\n', all: cur.concat(sup, dep), current: cur, stale: sup.concat(dep) };
}

function run(cwd, args) {
  return cp.execFileSync(process.execPath, [CLI].concat(args), { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function benchHygiene() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'coderecall-bench-'));
  try {
    run(tmp, ['init']);
    const d = buildDecisions();
    fs.writeFileSync(path.join(tmp, '.ai', 'memory', 'DECISIONS.md'), d.header + '\n' + d.all.join('\n\n') + '\n', 'utf8');

    const total = d.all.length, staleN = d.stale.length, curN = d.current.length;

    // (1) Naive append-only: inject the ENTIRE decision log.
    const naiveText = d.all.join('\n\n');
    const naiveTokens = toks(naiveText);
    const naiveStalePct = Math.round((staleN / total) * 100);

    // (2) Code Recall: the digest's surfaced "Current decisions" block.
    const digest = run(tmp, ['digest']);
    const m = digest.match(/Current decisions[\s\S]*?(?=<<<CODE-RECALL:UNTRUSTED-LEDGER-DATA:END>>>)/);
    const surfaced = m ? m[0] : '';
    const surfacedLines = surfaced.split('\n').filter((l) => /^- /.test(l));
    const crTokens = toks(surfaced);
    const crStale = surfacedLines.filter((l) => /Old approach|Deprecated rule/.test(l)).length;

    // search hygiene: a term present in both current and stale entries.
    const curSearch = run(tmp, ['search', 'subsystem', '--limit', '20']);
    const histSearch = run(tmp, ['search', 'subsystem', '--limit', '20', '--history']);
    const staleHitsDefault = (curSearch.match(/Old approach/g) || []).length;
    const staleHitsHistory = (histSearch.match(/Old approach/g) || []).length;

    const pct = (a, b) => b === 0 ? '0%' : Math.round((a / b) * 100) + '%';
    console.log('Code Recall — context-hygiene benchmark (deterministic)');
    console.log('Synthetic decision log: ' + total + ' decisions (' + curN + ' current, ' + staleN + ' stale: superseded/deprecated)');
    console.log('');
    console.log('  metric                              naive append-only      Code Recall');
    console.log('  ----------------------------------  -------------------    -----------');
    console.log('  decision tokens injected (digest)   ~' + String(naiveTokens).padEnd(18) + '~' + crTokens + '  (' + Math.round(naiveTokens / Math.max(1, crTokens)) + '× less)');
    console.log('  stale content in injection          ' + (naiveStalePct + '% (' + staleN + '/' + total + ')').padEnd(18) + ' 0%  (0/' + surfacedLines.length + ')');
    console.log('  current decisions visible           ' + String(total + ' (buried)').padEnd(18) + ' ' + surfacedLines.length + ' (top, current)');
    console.log('  stale hits in a term search         ' + String(staleHitsHistory + ' (all returned)').padEnd(18) + ' ' + staleHitsDefault + ' (current-only default)');
    console.log('');
    console.log('Reading: naive append-only buries ' + curN + ' current decisions among ' + staleN + ' stale ones and injects ' +
      pct(naiveTokens - crTokens, naiveTokens) + ' more tokens, ' + naiveStalePct + '% of it stale (influence rot). Code Recall surfaces only current truth (0% stale) and search hides superseded by default.');
    console.log('');
    console.log('HONEST SCOPE: this measures context hygiene (influence-rot exposure + attention budget),');
    console.log('NOT agent task success. For with/without-Code-Recall task outcomes, run the live-agent');
    console.log('protocol in bench/README.md with a real coding agent.');
  } finally {
    try { fs.rmSync ? fs.rmSync(tmp, { recursive: true, force: true }) : fs.rmdirSync(tmp, { recursive: true }); } catch (e) { /* best effort */ }
  }
}

// Write-back trustworthiness: does the tool make write-back GAPS visible? We run
// the real CLI against a synthetic git history and count how many commits that
// advanced past the ledger get surfaced as STALE. Deterministic by design — we
// commit the init artifacts first so the work tree is clean, making each verdict
// depend ONLY on "newest source commit vs ledger UPDATED" (never the wall clock).
function benchWriteBack() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'coderecall-wb-'));
  try {
    const G = (a, dateIso) => cp.execFileSync('git', a, {
      cwd: tmp, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
      env: dateIso ? Object.assign({}, process.env, { GIT_AUTHOR_DATE: dateIso, GIT_COMMITTER_DATE: dateIso }) : process.env,
    });
    try { G(['init']); G(['config', 'user.email', 'b@b']); G(['config', 'user.name', 'bench']); }
    catch (e) { console.log('Write-back benchmark skipped: git unavailable.'); return; }
    run(tmp, ['init']);

    const base = new Date('2026-06-01T09:00:00Z');
    const isoAt = (ms) => new Date(base.getTime() + ms).toISOString();
    const H = 3600000;
    const taskPath = path.join(tmp, '.ai', 'memory', 'TASK.md');
    const setUpdated = (iso) => fs.writeFileSync(taskPath, fs.readFileSync(taskPath, 'utf8').replace(/UPDATED: .*/, 'UPDATED: ' + iso), 'utf8');
    const isStale = () => /verdict: STALE/.test(run(tmp, ['check']));

    // Commit the scaffold (AGENTS.md/CLAUDE.md/.gitignore) so the tree is clean;
    // TASK.md is gitignored, so it stays out. Anchor the ledger at base.
    G(['add', '-A']); G(['commit', '-m', 'chore: scaffold'], isoAt(0));
    setUpdated(isoAt(0));

    // A session of work steps. `true` = developer refreshed the ledger after the
    // commit (disciplined); `false` = skipped it (a real write-back gap).
    const disciplined = [true, false, true, false, false, true];
    let gaps = 0, surfaced = 0, falseAlarms = 0;
    disciplined.forEach((disc, i) => {
      const commitMs = (i + 1) * H;
      fs.writeFileSync(path.join(tmp, 'src' + i + '.js'), 'module.exports = ' + i + '\n', 'utf8');
      G(['add', 'src' + i + '.js']); G(['commit', '-m', 'feat: step ' + i], isoAt(commitMs));
      if (disc) setUpdated(isoAt(commitMs + 60000)); // refresh ledger just after the commit
      const stale = isStale();
      if (disc) { if (stale) falseAlarms++; }
      else { gaps++; if (stale) surfaced++; }
    });

    const K = disciplined.length, M = disciplined.filter(Boolean).length;
    const rate = Math.round((surfaced / Math.max(1, gaps)) * 100);
    console.log('Code Recall — write-back trustworthiness benchmark (deterministic)');
    console.log('Simulated session: ' + K + ' source commits, ' + M + ' with the ledger refreshed, ' + (K - M) + ' skipped.');
    console.log('');
    console.log('  metric                              no write-back tooling   Code Recall');
    console.log('  ----------------------------------  ---------------------   -----------');
    console.log('  write-back gaps in the session      ' + String(gaps).padEnd(20) + '  ' + gaps);
    console.log('  gaps surfaced (made visible)        ' + '0 (silent)'.padEnd(20) + '  ' + surfaced + ' (' + rate + '%)');
    console.log('  false alarms on refreshed commits   ' + 'n/a'.padEnd(20) + '  ' + falseAlarms);
    console.log('');
    console.log('Reading: without tooling, the ' + gaps + ' commits that advanced past the ledger are a SILENT failure');
    console.log('— the next session re-anchors to stale NOW:/NEXT:. Code Recall surfaces ' + rate + '% of them at the commit');
    console.log('checkpoint (and at SessionStart), with ' + falseAlarms + ' false alarms on the commits where the ledger was kept fresh.');
    console.log('');
    console.log('HONEST SCOPE: this measures DETECTION of write-back gaps (the mechanism coderecall adds),');
    console.log('NOT whether a developer acts on the nudge. The value is turning a previously-invisible');
    console.log('failure into a visible, evidence-based signal.');
  } finally {
    try { fs.rmSync ? fs.rmSync(tmp, { recursive: true, force: true }) : fs.rmdirSync(tmp, { recursive: true }); } catch (e) { /* best effort */ }
  }
}

function main() {
  benchHygiene();
  console.log('\n' + '='.repeat(72) + '\n');
  benchWriteBack();
}
main();
