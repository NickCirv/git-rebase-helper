<div align="center">

# git-rebase-helper

**Visual branch graph + interactive TUI planner that makes `git rebase -i` less painful**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?labelColor=0B0A09)](LICENSE)
[![Zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen?labelColor=0B0A09)](package.json)
[![Node >=18](https://img.shields.io/badge/node-%3E%3D18-339933?labelColor=0B0A09)](package.json)

</div>

## Install

```bash
npx github:NickCirv/git-rebase-helper
```

Or run a one-off command directly:

```bash
npx github:NickCirv/git-rebase-helper graph
npx github:NickCirv/git-rebase-helper fixups
```

## Usage

```bash
grh graph                     # ASCII branch graph — commits ahead of main
grh plan --apply              # Interactive TUI: set pick/squash/fixup/drop, press 'a' to run
grh fixups                    # Detect WIP/fix commits and suggest which parent to squash into
grh conflicts                 # Show conflict diffs during an active rebase
grh squash-wip --dry-run      # Preview auto-squash of all WIP commits
grh squash-wip                # Run auto-squash
```

| Flag | Description |
|------|-------------|
| `--base <branch>` | Base branch to compare against (default: `main`) |
| `--apply` | Apply the planned rebase when you press `a` in the TUI |
| `--dry-run` | Show the plan without executing it |

**TUI keys** (used with `grh plan`): `↑`/`↓` navigate · `p` pick · `s` squash · `f` fixup · `d` drop · `r` reword · `a` apply · `q` quit

## What it does

`grh graph` prints a colour-coded ASCII tree of all commits ahead of your base branch, flagging merge commits and fixup candidates (commits whose messages match `fix`, `wip`, `tmp`, `cleanup`, etc.).

`grh plan` opens a keyboard-driven TUI where you set the rebase action for each commit and see a live preview of the resulting history — then optionally runs `git rebase -i` for you using `GIT_SEQUENCE_EDITOR` to inject your plan.

`grh fixups` detects WIP commits and uses keyword matching to suggest which earlier commit each one likely belongs to. `grh conflicts` shows conflict hunks (ours vs theirs) during an active rebase alongside the standard resolution steps.

---
<sub>Zero dependencies · Node >=18 · MIT · by <a href="https://github.com/NickCirv">NickCirv</a></sub>
