#!/usr/bin/env node
/*
 * memo-star SessionStart hook (matchers: startup|resume|clear|compact)
 *
 * Reads hook input JSON from stdin and emits the project-ledger digest as
 * additionalContext. The digest is NOT built here: it comes from
 * require('../memo.js').buildDigest() — single source of truth — so the hook
 * output is byte-identical to `node memo.js digest` for the same ledger
 * (when source == "compact", buildDigest adds the re-anchor prefix and the
 * full TASK.md body inside the untrusted-data fence).
 * Never throws; always exits 0. Standalone: run with `node sessionstart.js`.
 */
'use strict';

const fs = require('fs');
const path = require('path');

/** Read all of stdin without hanging when stdin is empty or a TTY. */
function readStdin(timeoutMs) {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) {
      resolve('');
      return;
    }
    let data = '';
    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        resolve(data);
      }
    };
    const timer = setTimeout(finish, timeoutMs || 2000);
    if (typeof timer.unref === 'function') timer.unref();
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => {
      clearTimeout(timer);
      finish();
    });
    process.stdin.on('error', () => {
      clearTimeout(timer);
      finish();
    });
  });
}

async function main() {
  const raw = await readStdin(2000);
  let input = {};
  try {
    input = JSON.parse(raw);
  } catch (e) {
    input = {};
  }
  if (!input || typeof input !== 'object') input = {};

  const cwd = typeof input.cwd === 'string' && input.cwd ? input.cwd : process.cwd();
  const memDir = path.join(cwd, '.ai', 'memory');
  if (!fs.existsSync(memDir)) return; // not a memo project — zero cost exit

  // memo.js binds its ledger paths to process.cwd() at require time, so chdir
  // to the hook-provided cwd BEFORE requiring it. Any failure below (chdir,
  // require, digest) is swallowed by main().catch — the hook still exits 0.
  process.chdir(cwd);
  const memo = require(path.join(__dirname, '..', 'memo.js'));

  const source = typeof input.source === 'string' ? input.source : '';
  const digest = memo.buildDigest({ compact: source === 'compact' });
  if (digest === null) return; // TASK.md missing — nothing useful to inject

  const payload = JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: digest,
    },
    suppressOutput: true,
  });
  // Await the flush: process.exit() would otherwise truncate piped stdout.
  await new Promise((resolve) => process.stdout.write(payload, resolve));
}

main()
  .catch(() => {})
  .finally(() => process.exit(0));
