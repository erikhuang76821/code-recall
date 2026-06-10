#!/usr/bin/env sh
# install.sh — Memo-star global hook installer for Claude Code (macOS/Linux).
# Zero dependencies beyond node (no jq): node itself is the JSON editor.
#
# Usage:
#   ./install.sh                                  # install into ~/.claude/settings.json
#   ./install.sh --uninstall                      # remove only memo-star entries
#   ./install.sh --settings-path /tmp/s.json      # target a different file (testing)
#
# Guarantees (same as install.ps1):
#   - Parses settings.json first; ABORTS on parse failure (never overwrites).
#   - Timestamped backup before any write.
#   - APPEND only; existing entries are never modified or removed.
#   - Idempotent: entries whose command contains "memo-star" or this repo's
#     hooks path are detected and skipped.

set -e

# Resolve the absolute directory of this script (no symlinks assumed).
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

SETTINGS_PATH="$HOME/.claude/settings.json"
UNINSTALL=0

while [ $# -gt 0 ]; do
    case "$1" in
        --uninstall)
            UNINSTALL=1
            ;;
        --settings-path)
            if [ -z "$2" ]; then echo "[memo-star] --settings-path requires a value" >&2; exit 1; fi
            SETTINGS_PATH="$2"
            shift
            ;;
        *)
            echo "[memo-star] Unknown option: $1" >&2
            echo "Usage: $0 [--uninstall] [--settings-path <file>]" >&2
            exit 1
            ;;
    esac
    shift
done

if ! command -v node >/dev/null 2>&1; then
    echo "[memo-star] ABORT: Node.js is required but node was not found on PATH." >&2
    echo "  The memo-star hooks are Node scripts and cannot run without it." >&2
    echo "  Install Node.js from https://nodejs.org and re-run this installer." >&2
    exit 1
fi

# Absolute node path: hook commands embed it so they survive GUI-launched
# Claude Code sessions whose PATH differs from this shell.
NODE_BIN="$(command -v node)"

# All merge logic lives in this inline node script (no apostrophes inside).
MEMO_SETTINGS="$SETTINGS_PATH" MEMO_HOOKS_DIR="$SCRIPT_DIR/hooks" MEMO_NODE="$NODE_BIN" MEMO_UNINSTALL="$UNINSTALL" node -e '
const fs = require("fs");
const path = require("path");

const settingsPath = process.env.MEMO_SETTINGS;
const hooksDir = process.env.MEMO_HOOKS_DIR;
const nodeBin = process.env.MEMO_NODE || process.execPath;
const uninstall = process.env.MEMO_UNINSTALL === "1";

const hookScripts = {
  SessionStart: path.join(hooksDir, "sessionstart.js"),
  PreCompact: path.join(hooksDir, "precompact.js"),
  Stop: path.join(hooksDir, "stop.js")
};
const matchers = {
  SessionStart: "startup|resume|clear|compact",
  PreCompact: "",
  Stop: ""
};

Object.keys(hookScripts).forEach(function (k) {
  if (!fs.existsSync(hookScripts[k])) {
    console.warn("[memo-star] WARNING: hook script not found yet: " + hookScripts[k]);
  }
});

// The hook command is executed by a shell with the path inside double quotes.
// A repo path containing a double quote, backtick, $ or newline could break
// out of the quoting and inject commands — refuse to install from such paths.
if (!uninstall && (/["`$\n\r]/.test(hooksDir) || /["`$\n\r]/.test(nodeBin))) {
  console.error("[memo-star] ABORT: a path used in hook commands contains shell-unsafe characters (\" ` $ or a newline):");
  console.error("  hooks dir: " + JSON.stringify(hooksDir));
  console.error("  node:      " + JSON.stringify(nodeBin));
  console.error("  Use paths without these characters and re-run.");
  process.exit(1);
}

let settings = null;
let fileExisted = false;

if (fs.existsSync(settingsPath)) {
  fileExisted = true;
  const raw = fs.readFileSync(settingsPath, "utf8");
  if (raw.trim().length > 0) {
    try {
      settings = JSON.parse(raw);
    } catch (e) {
      console.error("[memo-star] ABORT: could not parse " + settingsPath + " as JSON. Nothing was changed.");
      console.error("  Parse error: " + e.message);
      process.exit(1);
    }
  }
} else if (uninstall) {
  console.log("[memo-star] No settings file at " + settingsPath + "; nothing to uninstall.");
  process.exit(0);
}

if (settings === null || typeof settings !== "object" || Array.isArray(settings)) {
  if (settings !== null) {
    console.error("[memo-star] ABORT: " + settingsPath + " is not a JSON object. Nothing was changed.");
    process.exit(1);
  }
  settings = {};
}

if (fileExisted) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = settingsPath + ".memo-star.bak." + stamp;
  fs.copyFileSync(settingsPath, backupPath);
  console.log("[memo-star] Backup written: " + backupPath);
}

// An entry is "ours" if any command string mentions memo-star or our hooks dir.
function isMemoStarEntry(entry) {
  if (!entry || !Array.isArray(entry.hooks)) return false;
  return entry.hooks.some(function (h) {
    const cmd = h && typeof h.command === "string" ? h.command : "";
    const lc = cmd.toLowerCase();
    return lc.indexOf("memo-star") !== -1 || lc.indexOf(hooksDir.toLowerCase()) !== -1;
  });
}

if (!settings.hooks || typeof settings.hooks !== "object" || Array.isArray(settings.hooks)) {
  settings.hooks = {};
}

if (uninstall) {
  // Round-trip guarantee (mirrors install.ps1): events we touched that end up
  // EMPTY are removed entirely, so install + uninstall is a semantic no-op.
  // Events we removed nothing from keep pre-existing empty arrays untouched.
  let removed = 0;
  Object.keys(settings.hooks).forEach(function (ev) {
    if (!Array.isArray(settings.hooks[ev])) return;
    const before = settings.hooks[ev].length;
    const kept = settings.hooks[ev].filter(function (e) { return !isMemoStarEntry(e); });
    const removedHere = before - kept.length;
    if (removedHere > 0) {
      if (kept.length === 0) {
        delete settings.hooks[ev];
      } else {
        settings.hooks[ev] = kept;
      }
      removed += removedHere;
    }
  });
  // Empty hooks container is semantically identical to no hooks at all.
  if (Object.keys(settings.hooks).length === 0) {
    delete settings.hooks;
  }
  console.log("[memo-star] Removed " + removed + " memo-star hook entr(y/ies).");
} else {
  ["SessionStart", "PreCompact", "Stop"].forEach(function (ev) {
    if (!Array.isArray(settings.hooks[ev])) {
      settings.hooks[ev] = settings.hooks[ev] ? [settings.hooks[ev]] : [];
    }
    if (settings.hooks[ev].some(isMemoStarEntry)) {
      console.log("  [skip] " + ev + " already has a memo-star entry.");
      return;
    }
    // JSON.stringify provides the quoting (JSON-safe escaping); combined with
    // the unsafe-character guard above, the embedded paths cannot break out.
    // Absolute node path (not bare node): GUI-launched Claude Code may run
    // hooks with a PATH that lacks node. Idempotency detection matches on the
    // hooks dir path, so old-format bare-node entries are still recognized.
    settings.hooks[ev].push({
      matcher: matchers[ev],
      hooks: [{ type: "command", command: JSON.stringify(nodeBin) + " " + JSON.stringify(hookScripts[ev]) }]
    });
    console.log("  [add]  " + ev + " -> " + hookScripts[ev]);
  });
}

fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n", "utf8");
console.log("[memo-star] Updated " + settingsPath);

// Prune old backups, keeping the newest 5 (best effort — never fail install).
try {
  const bakKeep = 5;
  const dir = path.dirname(settingsPath);
  const prefix = path.basename(settingsPath) + ".memo-star.bak.";
  const baks = fs.readdirSync(dir)
    .filter(function (n) { return n.indexOf(prefix) === 0; })
    .map(function (n) {
      let mtime = 0;
      try { mtime = fs.statSync(path.join(dir, n)).mtimeMs; } catch (e) { mtime = 0; }
      return { name: n, mtime: mtime };
    })
    .sort(function (a, b) { return b.mtime - a.mtime || (b.name > a.name ? 1 : -1); });
  baks.slice(bakKeep).forEach(function (b) {
    try {
      fs.unlinkSync(path.join(dir, b.name));
      console.log("  [prune] old backup removed: " + b.name);
    } catch (e) { /* best effort */ }
  });
} catch (e) { /* best effort */ }
if (!uninstall) {
  console.log("[memo-star] Done. Hooks are global; per-project memory activates only where .ai/memory/ exists (run \"node memo.js init\").");
}
'
