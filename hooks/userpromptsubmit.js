#!/usr/bin/env node
/*
 * memo-star UserPromptSubmit hook (OPTIONAL — default OFF)
 *
 * Injects a single ~15-token reminder when the ledger has gone stale
 * (TASK.md UPDATED older than ~45 min), throttled to at most once per that
 * same window so it never nags. Token discipline is SPEC priority #5, so this
 * is opt-in: the installers do NOT register it. Enable by adding a
 * UserPromptSubmit hook in ~/.claude/settings.json pointing at this file
 * (see README "Optional staleness reminder").
 *
 * The reminder text is memo-star's own (not ledger-derived), so it carries no
 * untrusted-data fence. Never throws; always exits 0.
 * Standalone: run with `node userpromptsubmit.js`.
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

  // memo.js binds its ledger paths to process.cwd() at require time.
  process.chdir(cwd);
  const memo = require(path.join(__dirname, '..', 'memo.js'));

  const reminder = memo.buildStaleReminder();
  if (!reminder) return; // fresh ledger, or already reminded inside the throttle window

  const payload = JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: reminder,
    },
    suppressOutput: true,
  });
  // Await the flush: process.exit() would otherwise truncate piped stdout.
  await new Promise((resolve) => process.stdout.write(payload, resolve));
}

main()
  .catch(() => {})
  .finally(() => process.exit(0));
