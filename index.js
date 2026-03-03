#!/usr/bin/env node
/**
 * git-rebase-helper — Interactive rebase helper with visual branch graph and guided conflict resolution
 * Zero external dependencies. Pure Node.js ES modules.
 */

import { execFileSync, spawnSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync, mkdtempSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import * as readline from 'readline';

// ─── ANSI colours ─────────────────────────────────────────────────────────────
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
};
const col = (code, s) => `${code}${s}${C.reset}`;

// ─── Git helpers ──────────────────────────────────────────────────────────────
function git(...args) {
  try {
    return execFileSync('git', args, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch (e) {
    return '';
  }
}

function gitLines(...args) {
  const out = git(...args);
  return out ? out.split('\n') : [];
}

function assertGitRepo() {
  const result = spawnSync('git', ['rev-parse', '--git-dir'], { encoding: 'utf8' });
  if (result.status !== 0) {
    die('Not inside a git repository.');
  }
}

function getCommits(base) {
  const raw = git('log', '--format=%H\t%aI\t%an\t%s\t%P', `${base}..HEAD`);
  if (!raw) return [];
  return raw.split('\n').filter(Boolean).map(line => {
    const [hash, date, author, subject, parents] = line.split('\t');
    return {
      hash: hash || '',
      shortHash: (hash || '').slice(0, 7),
      date: date ? date.slice(0, 10) : '',
      author: (author || '').slice(0, 20),
      subject: subject || '',
      parents: parents ? parents.split(' ').filter(Boolean) : [],
      isMerge: parents ? parents.includes(' ') : false,
    };
  });
}

function getFilesChanged(base, hash) {
  try {
    const out = execFileSync('git', ['diff', '--stat', `${base}..${hash}`], {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    const lastLine = out.split('\n').pop() || '';
    const m = lastLine.match(/(\d+) file/);
    return m ? parseInt(m[1], 10) : 0;
  } catch {
    return 0;
  }
}

function currentBranch() {
  return git('rev-parse', '--abbrev-ref', 'HEAD');
}

function isInRebase() {
  const gitDir = git('rev-parse', '--git-dir');
  return existsSync(join(gitDir, 'rebase-merge')) || existsSync(join(gitDir, 'rebase-apply'));
}

// ─── Fixup detection ──────────────────────────────────────────────────────────
const WIP_PATTERNS = /\b(fix|wip|tmp|temp|cleanup|clean up|fixup|squash|amend|hack|todo|refactor draft|draft)\b/i;

function isFixupCandidate(subject) {
  return WIP_PATTERNS.test(subject);
}

function guessParent(commits, idx) {
  // Look at commits before this one for a plausible parent by keyword proximity
  const candidate = commits[idx];
  const words = candidate.subject.toLowerCase().replace(WIP_PATTERNS, '').trim().split(/\s+/);
  let best = null;
  let bestScore = 0;
  for (let i = idx + 1; i < commits.length; i++) {
    const other = commits[i];
    if (isFixupCandidate(other.subject)) continue;
    const otherWords = other.subject.toLowerCase().split(/\s+/);
    const shared = words.filter(w => w.length > 3 && otherWords.includes(w)).length;
    if (shared > bestScore) {
      bestScore = shared;
      best = other;
    }
  }
  return best;
}

// ─── ASCII graph ──────────────────────────────────────────────────────────────
function renderGraph(commits) {
  const lines = [];
  const width = process.stdout.columns || 120;

  lines.push(col(C.bold + C.cyan, `Branch graph — ${commits.length} commits since base`));
  lines.push(col(C.dim, '─'.repeat(Math.min(width, 80))));

  if (commits.length === 0) {
    lines.push(col(C.yellow, '  No commits found ahead of base branch.'));
    return lines.join('\n');
  }

  // Build simple left-side graph markers
  const hashSet = new Set(commits.map(c => c.hash));

  commits.forEach((commit, i) => {
    const isLast = i === commits.length - 1;
    const connector = isLast ? '└─' : '├─';
    const vertLine = isLast ? '  ' : '│ ';

    let glyph = col(C.green, '*');
    if (commit.isMerge) glyph = col(C.magenta, 'M');
    else if (isFixupCandidate(commit.subject)) glyph = col(C.yellow, '~');

    const hashStr = col(C.yellow, commit.shortHash);
    const dateStr = col(C.dim, commit.date);
    const authorStr = col(C.cyan, commit.author.padEnd(20));
    const subjectStr = commit.isMerge
      ? col(C.magenta, commit.subject)
      : isFixupCandidate(commit.subject)
      ? col(C.yellow, commit.subject)
      : commit.subject;

    lines.push(`${col(C.dim, connector)} ${glyph} ${hashStr} ${dateStr} ${authorStr} ${subjectStr}`);

    if (!isLast) {
      lines.push(col(C.dim, vertLine));
    }
  });

  lines.push('');
  lines.push(col(C.dim, `Legend: ${col(C.green, '*')} normal  ${col(C.magenta, 'M')} merge  ${col(C.yellow, '~')} fixup candidate`));
  return lines.join('\n');
}

// ─── cmd: graph ───────────────────────────────────────────────────────────────
function cmdGraph(args) {
  assertGitRepo();
  const base = getFlagValue(args, '--base') || 'main';
  const commits = getCommits(base);

  // Enrich with file counts
  commits.forEach(c => {
    c.filesChanged = getFilesChanged(base, c.hash);
  });

  console.log(renderGraph(commits));

  if (commits.length > 0) {
    console.log(col(C.bold, '\nCommit details:'));
    commits.forEach(c => {
      const mark = c.isMerge ? col(C.magenta, '[MERGE] ') : isFixupCandidate(c.subject) ? col(C.yellow, '[WIP?]  ') : '        ';
      const files = c.filesChanged > 0 ? col(C.dim, ` (${c.filesChanged} files)`) : '';
      console.log(`  ${mark}${col(C.yellow, c.shortHash)} ${c.subject}${files}`);
    });
  }
}

// ─── cmd: fixups ──────────────────────────────────────────────────────────────
function cmdFixups(args) {
  assertGitRepo();
  const base = getFlagValue(args, '--base') || 'main';
  const commits = getCommits(base);

  const candidates = commits
    .map((c, i) => ({ commit: c, idx: i }))
    .filter(({ commit }) => isFixupCandidate(commit.subject));

  if (candidates.length === 0) {
    console.log(col(C.green, 'No fixup candidates found. Clean commit history!'));
    return;
  }

  console.log(col(C.bold + C.yellow, `Found ${candidates.length} fixup candidate(s):\n`));

  candidates.forEach(({ commit, idx }) => {
    const parent = guessParent(commits, idx);
    console.log(`  ${col(C.yellow, commit.shortHash)} ${col(C.bold, commit.subject)}`);
    if (parent) {
      console.log(`    ${col(C.dim, '→ likely fixes:')} ${col(C.green, parent.shortHash)} ${parent.subject}`);
      console.log(`    ${col(C.dim, '  suggestion: fixup or squash into that commit')}`);
    } else {
      console.log(`    ${col(C.dim, '→ no clear parent found — review manually')}`);
    }
    console.log();
  });

  console.log(col(C.dim, 'Run `git-rebase-helper plan` to interactively set fixup actions.'));
}

// ─── cmd: conflicts ───────────────────────────────────────────────────────────
function cmdConflicts() {
  assertGitRepo();

  if (!isInRebase()) {
    console.log(col(C.yellow, 'Not currently in a rebase. Start one first with `git rebase -i <base>`.'));
    return;
  }

  const conflicted = gitLines('diff', '--name-only', '--diff-filter=U');

  if (conflicted.length === 0 || (conflicted.length === 1 && conflicted[0] === '')) {
    console.log(col(C.green, 'No conflicts detected. Run `git rebase --continue` to proceed.'));
    return;
  }

  console.log(col(C.bold + C.red, `Conflicts in ${conflicted.length} file(s):\n`));

  conflicted.filter(Boolean).forEach(file => {
    let content = '';
    try {
      content = readFileSync(file, 'utf8');
    } catch {
      console.log(`  ${col(C.red, '✗')} ${file} (cannot read)`);
      return;
    }

    const conflictSections = content.split('<<<<<<< ').length - 1;
    console.log(`  ${col(C.red, '✗')} ${col(C.bold, file)} — ${conflictSections} conflict section(s)`);

    // Show first conflict section
    const firstConflict = content.match(/<<<<<<< (.+?)\n([\s\S]*?)=======\n([\s\S]*?)>>>>>>> .+/);
    if (firstConflict) {
      const ours = firstConflict[2].trim().split('\n').slice(0, 3).join('\n    ');
      const theirs = firstConflict[3].trim().split('\n').slice(0, 3).join('\n    ');
      console.log(`    ${col(C.green, 'OURS:  ')} ${ours}`);
      console.log(`    ${col(C.red, 'THEIRS:')} ${theirs}`);
    }
    console.log();
  });

  console.log(col(C.bold, 'Resolution guide:'));
  console.log(`  1. Edit each file to resolve conflicts (remove <<<<, ====, >>>> markers)`);
  console.log(`  2. ${col(C.cyan, 'git add <file>')} for each resolved file`);
  console.log(`  3. ${col(C.cyan, 'git rebase --continue')} to proceed`);
  console.log(`  4. Or ${col(C.yellow, 'git rebase --abort')} to cancel the rebase entirely`);
}

// ─── cmd: squash-wip ──────────────────────────────────────────────────────────
function cmdSquashWip(args) {
  assertGitRepo();
  const base = getFlagValue(args, '--base') || 'main';
  const dryRun = args.includes('--dry-run');
  const commits = getCommits(base);

  const wipIdxs = commits
    .map((c, i) => ({ commit: c, idx: i }))
    .filter(({ commit }) => isFixupCandidate(commit.subject));

  if (wipIdxs.length === 0) {
    console.log(col(C.green, 'No WIP commits found to squash.'));
    return;
  }

  // Build todo list: mark each WIP commit as fixup into the next non-WIP
  const actions = commits.map(c => ({
    action: isFixupCandidate(c.subject) ? 'fixup' : 'pick',
    hash: c.shortHash,
    subject: c.subject,
  }));

  // Reverse because git rebase -i shows oldest first
  const todoLines = [...actions].reverse().map(a => `${a.action} ${a.hash} ${a.subject}`);
  const todoContent = todoLines.join('\n') + '\n';

  console.log(col(C.bold + C.cyan, `Squash-WIP plan (${wipIdxs.length} WIP commits → fixup):\n`));
  todoLines.forEach(line => {
    const [action, hash, ...rest] = line.split(' ');
    const actionStr = action === 'fixup'
      ? col(C.yellow, 'fixup')
      : col(C.green, 'pick ');
    console.log(`  ${actionStr} ${col(C.dim, hash)} ${rest.join(' ')}`);
  });

  if (dryRun) {
    console.log(col(C.dim, '\n--dry-run: no changes made.'));
    return;
  }

  // Write todo to temp file
  const tmpDir = mkdtempSync(join(tmpdir(), 'grh-'));
  const todoFile = join(tmpDir, 'git-rebase-todo');
  writeFileSync(todoFile, todoContent, 'utf8');

  // Use GIT_SEQUENCE_EDITOR to inject our todo
  const editorScript = `#!/bin/sh\ncp "${todoFile}" "$1"\n`;
  const editorPath = join(tmpDir, 'editor.sh');
  writeFileSync(editorPath, editorScript, { mode: 0o755 });

  console.log(col(C.cyan, '\nRunning git rebase -i ...'));
  const result = spawnSync('git', ['rebase', '-i', base], {
    env: { ...process.env, GIT_SEQUENCE_EDITOR: editorPath },
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    console.log(col(C.red, '\nRebase encountered issues. Check conflicts with `git-rebase-helper conflicts`.'));
  } else {
    console.log(col(C.green, '\nSquash complete!'));
  }
}

// ─── cmd: plan (interactive TUI) ─────────────────────────────────────────────
const ACTION_KEYS = { p: 'pick', s: 'squash', f: 'fixup', d: 'drop', r: 'reword' };
const ACTION_COLOURS = {
  pick: C.green,
  squash: C.blue,
  fixup: C.yellow,
  drop: C.red,
  reword: C.magenta,
};

function renderPlan(commits, actions, cursor, preview) {
  process.stdout.write('\x1b[2J\x1b[H'); // clear screen

  const width = process.stdout.columns || 120;
  const header = col(C.bold + C.cyan, ' git-rebase-helper — Interactive Rebase Planner ');
  console.log(header);
  console.log(col(C.dim, '─'.repeat(Math.min(width, 80))));
  console.log(col(C.dim, ' ↑/↓ navigate  p=pick  s=squash  f=fixup  d=drop  r=reword  a=apply  q=quit\n'));

  // Show oldest first (git rebase -i order)
  const displayed = [...commits].reverse();
  const displayedActions = [...actions].reverse();

  displayed.forEach((commit, i) => {
    const realIdx = commits.length - 1 - i;
    const action = displayedActions[i];
    const isCursor = realIdx === cursor;
    const actionColour = ACTION_COLOURS[action] || C.white;
    const actionStr = col(actionColour, action.padEnd(7));
    const hashStr = col(C.yellow, commit.shortHash);
    const subjectStr = action === 'drop'
      ? col(C.dim + C.red, commit.subject)
      : action === 'squash' || action === 'fixup'
      ? col(C.dim, commit.subject)
      : commit.subject;

    const prefix = isCursor ? col(C.bgBlue + C.bold, ' › ') : '   ';
    console.log(`${prefix}${actionStr} ${hashStr} ${subjectStr}`);
  });

  console.log(col(C.dim, '\n─'.repeat(Math.min(width, 80))));
  console.log(col(C.bold, ' Preview (what rebase will produce):'));

  // Build preview
  let previewCommits = [];
  let squashBuffer = null;
  [...displayed].forEach((commit, i) => {
    const action = displayedActions[i];
    if (action === 'drop') return;
    if (action === 'pick' || action === 'reword') {
      if (squashBuffer) {
        previewCommits.push(squashBuffer);
        squashBuffer = null;
      }
      previewCommits.push({ ...commit, action });
    } else if (action === 'squash') {
      if (!squashBuffer) squashBuffer = { ...commit, action: 'pick' };
      squashBuffer.subject += ` + ${commit.subject}`;
    } else if (action === 'fixup') {
      if (!squashBuffer) squashBuffer = { ...commit, action: 'pick' };
      // fixup discards message — no change to subject
    }
  });
  if (squashBuffer) previewCommits.push(squashBuffer);

  previewCommits.forEach(c => {
    const mark = c.action === 'reword' ? col(C.magenta, '[reword] ') : '';
    console.log(`  ${col(C.dim, '→')} ${col(C.yellow, c.shortHash)} ${mark}${c.subject}`);
  });

  console.log();
}

function cmdPlan(args) {
  assertGitRepo();
  const base = getFlagValue(args, '--base') || 'main';
  const apply = args.includes('--apply');
  const dryRun = args.includes('--dry-run');

  const commits = getCommits(base);
  if (commits.length === 0) {
    console.log(col(C.yellow, `No commits found ahead of '${base}'.`));
    return;
  }

  if (!process.stdin.isTTY) {
    console.log(col(C.red, 'Interactive plan requires a TTY.'));
    process.exit(1);
  }

  // Default actions
  const actions = commits.map(c => (isFixupCandidate(c.subject) ? 'fixup' : 'pick'));
  let cursor = 0;

  renderPlan(commits, actions, cursor, true);

  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding('utf8');

  let applying = false;

  process.stdin.on('data', key => {
    if (applying) return;

    // Arrow keys
    if (key === '\x1b[A') { // up
      cursor = Math.max(0, cursor - 1);
    } else if (key === '\x1b[B') { // down
      cursor = Math.min(commits.length - 1, cursor + 1);
    } else if (key === 'q' || key === '\x03') {
      process.stdin.setRawMode(false);
      process.stdout.write('\x1b[2J\x1b[H');
      console.log(col(C.yellow, 'Aborted. No changes made.'));
      process.exit(0);
    } else if (key in ACTION_KEYS) {
      actions[cursor] = ACTION_KEYS[key];
    } else if (key === 'a') {
      applying = true;
      process.stdin.setRawMode(false);
      process.stdout.write('\x1b[2J\x1b[H');

      // Build todo content (oldest-first, as git rebase -i expects)
      const todoLines = [...commits].reverse().map((c, i) => {
        const revIdx = commits.length - 1 - i;
        return `${actions[revIdx]} ${c.shortHash} ${c.subject}`;
      });
      const todoContent = todoLines.join('\n') + '\n';

      console.log(col(C.bold + C.cyan, 'Rebase plan:\n'));
      todoLines.forEach(line => {
        const [action, hash, ...rest] = line.split(' ');
        const actionColour = ACTION_COLOURS[action] || C.white;
        console.log(`  ${col(actionColour, action.padEnd(7))} ${col(C.dim, hash)} ${rest.join(' ')}`);
      });

      if (dryRun || !apply) {
        console.log(col(C.dim, '\nRun with --apply to execute this rebase.'));
        process.exit(0);
      }

      const tmpDir = mkdtempSync(join(tmpdir(), 'grh-'));
      const todoFile = join(tmpDir, 'git-rebase-todo');
      writeFileSync(todoFile, todoContent, 'utf8');

      const editorScript = `#!/bin/sh\ncp "${todoFile}" "$1"\n`;
      const editorPath = join(tmpDir, 'editor.sh');
      writeFileSync(editorPath, editorScript, { mode: 0o755 });

      console.log(col(C.cyan, '\nRunning git rebase -i ...'));
      const result = spawnSync('git', ['rebase', '-i', base], {
        env: { ...process.env, GIT_SEQUENCE_EDITOR: editorPath },
        stdio: 'inherit',
      });

      if (result.status !== 0) {
        console.log(col(C.red, '\nRebase encountered issues. Check conflicts with `git-rebase-helper conflicts`.'));
      } else {
        console.log(col(C.green, '\nRebase complete!'));
      }
      process.exit(result.status || 0);
    }

    renderPlan(commits, actions, cursor, true);
  });
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function getFlagValue(args, flag) {
  const idx = args.indexOf(flag);
  if (idx !== -1 && idx + 1 < args.length && !args[idx + 1].startsWith('-')) {
    return args[idx + 1];
  }
  return null;
}

function die(msg) {
  console.error(col(C.red, `Error: ${msg}`));
  process.exit(1);
}

function printHelp() {
  console.log(`
${col(C.bold + C.cyan, 'git-rebase-helper')} ${col(C.dim, '(grh)')} — Interactive rebase helper

${col(C.bold, 'USAGE')}
  grh <command> [options]

${col(C.bold, 'COMMANDS')}
  ${col(C.green, 'graph')}       [--base <branch>]           Show visual ASCII branch graph
  ${col(C.green, 'plan')}        [--base <branch>] [--apply] [--dry-run]
                                  Interactive rebase planner (TUI)
  ${col(C.green, 'fixups')}      [--base <branch>]           Find and suggest fixup candidates
  ${col(C.green, 'conflicts')}                               Show conflict status during rebase
  ${col(C.green, 'squash-wip')}  [--base <branch>] [--dry-run]
                                  Auto-squash all WIP commits into their parents

${col(C.bold, 'OPTIONS')}
  --base <branch>   Base branch to compare against (default: main)
  --apply           Apply the planned rebase (used with 'plan')
  --dry-run         Show what would happen without making changes

${col(C.bold, 'EXAMPLES')}
  grh graph                         # Show commits ahead of main
  grh graph --base develop          # Show commits ahead of develop
  grh plan                          # Open interactive planner (no changes)
  grh plan --apply                  # Open planner and apply on 'a' key
  grh fixups                        # Find WIP/fix commits
  grh conflicts                     # Show conflict status during a rebase
  grh squash-wip --dry-run          # Preview auto-squash
  grh squash-wip                    # Run auto-squash

${col(C.bold, 'PLAN TUI KEYS')}
  ↑/↓   Navigate commits
  p     Set action: pick
  s     Set action: squash
  f     Set action: fixup
  d     Set action: drop
  r     Set action: reword
  a     Apply the plan (only if --apply flag passed)
  q     Quit without changes
`);
}

// ─── Entry point ─────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const cmd = argv[0];
const rest = argv.slice(1);

switch (cmd) {
  case 'graph':
    cmdGraph(rest);
    break;
  case 'plan':
    cmdPlan(rest);
    break;
  case 'fixups':
    cmdFixups(rest);
    break;
  case 'conflicts':
    cmdConflicts();
    break;
  case 'squash-wip':
    cmdSquashWip(rest);
    break;
  case '--help':
  case '-h':
  case 'help':
  case undefined:
    printHelp();
    break;
  default:
    console.error(col(C.red, `Unknown command: ${cmd}`));
    printHelp();
    process.exit(1);
}
