#!/usr/bin/env node
/*
 * memo-star Stop hook
 *
 * Lightweight end-of-turn heartbeat. Maintains .ai/memory/.heartbeat with
 * the last-stop timestamp. Staleness is NOT computed here: buildDigest in
 * memo.js derives it from TASK.md's UPDATED age (it still honors a legacy
 * STALE heartbeat line for back-compat, but this hook no longer writes one).
 * Never blocks, never outputs anything, always exits 0.
 * Standalone: run with `node stop.js`.
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

  // memo.js binds its paths to process.cwd() at require time, so chdir first
  // (same as sessionstart.js). On any failure, fall back to a plain write —
  // the heartbeat is a whole-file replace, so atomic rename alone (no lock)
  // is enough; the hook must never block on lock contention.
  let memo = null;
  try {
    process.chdir(cwd);
    memo = require(path.join(__dirname, '..', 'memo.js'));
  } catch (e) {
    memo = null;
  }

  const nowIso = new Date().toISOString();
  const content = 'LAST_STOP: ' + nowIso + '\n';
  const hbPath = path.join(memDir, '.heartbeat');
  try {
    if (memo) {
      memo.writeFileAtomic(hbPath, content);
    } else {
      fs.writeFileSync(hbPath, content, 'utf8');
    }
  } catch (e) {
    // read-only fs — ignore
  }
  // Stop hooks must never output anything that interrupts the agent.
}

main()
  .catch(() => {})
  .finally(() => process.exit(0));
