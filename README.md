# git-rebase-helper

Interactive rebase helper with visual branch graph and guided conflict resolution. Makes `git rebase -i` less scary.

**Zero external dependencies.** Pure Node.js ES modules. Node 18+.

## Install

```bash
npm install -g git-rebase-helper
```

Or run directly without installing:

```bash
npx git-rebase-helper graph
```

## Commands

### `grh graph [--base <branch>]`

Show a visual ASCII branch graph of all commits since diverging from the base branch.

```
Branch graph — 5 commits since base
────────────────────────────────────────────────
├─ * a1b2c3d 2026-03-01 Nick Ashkar          feat: add user auth
│
├─ * d4e5f6a 2026-03-01 Nick Ashkar          feat: add dashboard
│
├─ ~ 7b8c9d0 2026-03-02 Nick Ashkar          fix: typo in auth
│
├─ * e1f2a3b 2026-03-02 Nick Ashkar          feat: add dark mode
│
└─ * c4d5e6f 2026-03-02 Nick Ashkar          docs: update README

Legend: * normal  M merge  ~ fixup candidate
```

- `*` normal commit
- `M` merge commit (highlighted)
- `~` fixup candidate (commit with wip/fix/tmp/cleanup in message)

### `grh plan [--base <branch>] [--apply] [--dry-run]`

Open an interactive TUI to plan your rebase actions before running them.

```
 git-rebase-helper — Interactive Rebase Planner
────────────────────────────────────────────────
 ↑/↓ navigate  p=pick  s=squash  f=fixup  d=drop  r=reword  a=apply  q=quit

   pick    c4d5e6f docs: update README
   pick    e1f2a3b feat: add dark mode
 › fixup   7b8c9d0 fix: typo in auth
   pick    d4e5f6a feat: add dashboard
   pick    a1b2c3d feat: add user auth

 Preview (what rebase will produce):
  → c4d5e6f docs: update README
  → e1f2a3b feat: add dark mode
  → d4e5f6a feat: add dashboard
  → a1b2c3d feat: add user auth
```

**Keys:**
| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate commits |
| `p` | Set action: pick |
| `s` | Set action: squash |
| `f` | Set action: fixup |
| `d` | Set action: drop |
| `r` | Set action: reword |
| `a` | Apply the plan (only if `--apply` flag passed) |
| `q` | Quit without changes |

Use `--apply` to actually run the rebase when you press `a`. Without `--apply`, it prints the plan and exits.

### `grh fixups [--base <branch>]`

Find fixup candidates and suggest which earlier commits they likely fix.

```
Found 2 fixup candidate(s):

  7b8c9d0 fix: typo in auth
    → likely fixes: a1b2c3d feat: add user auth
      suggestion: fixup or squash into that commit

  9e0f1a2 wip: dark mode toggle
    → likely fixes: e1f2a3b feat: add dark mode
      suggestion: fixup or squash into that commit
```

Detects commits with these patterns in their message: `fix`, `wip`, `tmp`, `temp`, `cleanup`, `clean up`, `fixup`, `squash`, `amend`, `hack`, `todo`, `draft`.

### `grh conflicts`

During an active rebase, show all conflicted files with context about what's in conflict.

```
Conflicts in 2 file(s):

  ✗ src/auth.js — 1 conflict section(s)
    OURS:   const user = getUser(req)
    THEIRS: const user = await getUser(req)

  ✗ src/middleware.js — 2 conflict section(s)
    OURS:   module.exports = { auth }
    THEIRS: export { auth }

Resolution guide:
  1. Edit each file to resolve conflicts (remove <<<<, ====, >>>> markers)
  2. git add <file> for each resolved file
  3. git rebase --continue to proceed
  4. Or git rebase --abort to cancel the rebase entirely
```

### `grh squash-wip [--base <branch>] [--dry-run]`

Automatically mark all WIP/fix commits as `fixup` and run `git rebase -i`. This collapses messy "fix: typo" commits into their parent commits.

Use `--dry-run` to preview the plan without executing.

## Options

| Option | Description |
|--------|-------------|
| `--base <branch>` | Base branch to compare against (default: `main`) |
| `--apply` | Apply the planned rebase (used with `plan`) |
| `--dry-run` | Show what would happen without making changes |

## Examples

```bash
# Show commits ahead of main
grh graph

# Show commits ahead of develop
grh graph --base develop

# Open interactive planner (just preview, no changes)
grh plan

# Open planner and apply when you press 'a'
grh plan --apply

# Find WIP commits and suggestions
grh fixups

# Show conflict status during a rebase
grh conflicts

# Preview auto-squash of all WIP commits
grh squash-wip --dry-run

# Run auto-squash
grh squash-wip
```

## Security

- No external dependencies — zero supply chain risk
- Uses `execFileSync` and `spawnSync` — no shell injection possible
- Never reads or writes credentials or environment secrets
- All git operations are read-only except `squash-wip` and `plan --apply`

## Requirements

- Node.js 18+
- Git

## License

MIT
