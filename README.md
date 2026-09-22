![git-rebase-helper — Nicholas Ashkar repository collection](assets/nicholas-ashkar/banner.png)

# git-rebase-helper

Inspect and plan a rebase before rewriting local commit history.


<a id="usage"></a>

## What it does

Provides graph, fixups, conflicts, squash-wip and an interactive plan command. The planner applies only with --apply; squash-wip supports --dry-run. See the pinned [implementation](https://github.com/NickCirv/git-rebase-helper/blob/378a2529d8ffb5f94bfc67cced0fe393888cfac8/index.js).


<a id="install"></a>

## Quickstart

Node requirement from the inspected manifest: **`>=20`**. Requires Git and a local repository with the relevant history. Commands are source-inspected, not executed in this review.

The following example is **source-inspected, not executed**. It uses a pinned checkout; npm package publication is not assumed. Replace project paths or provide the stated input fixtures before running it.

```bash
git clone https://github.com/NickCirv/git-rebase-helper.git
cd git-rebase-helper
git checkout 378a2529d8ffb5f94bfc67cced0fe393888cfac8
npm install --ignore-scripts
node index.js graph --base main
```

Dependencies are installed with lifecycle scripts disabled in this recipe. Read the package scripts before enabling any lifecycle step required by your environment.

## Usage and reference

`git-rebase-helper` | `grh` are the executable names declared by the package. [Command reference](docs/REFERENCE.md) covers source-backed options and entry points.

| Control | Behavior in the inspected implementation |
| --- | --- |
| `graph --base BRANCH` | Inspect commits ahead of the base |
| `fixups` | Suggest fixup candidates |
| `plan --apply` | Permit applying an interactive plan |
| `squash-wip --dry-run` | Preview automatic WIP squashing |
| `conflicts` | Inspect rebase conflicts |

## Limits and operational notes

squash-wip without --dry-run can execute a rebase. Rebase changes commit IDs and can conflict with shared history. Heuristic fixup suggestions need a human review.

## Development

No runtime checks were executed for this documentation review. The committed smoke test checks entrypoint JavaScript syntax; it does not exercise the command behavior.

| Script | Declared command |
| --- | --- |
| `test` | `node --test` |

Work from the pinned source, keep changes focused, and reproduce the affected behavior with a small fixture before proposing a change. Existing contribution and security policies remain authoritative where present.

## Research and status

[Research record](docs/RESEARCH.md) identifies the inspected revision, source evidence, documentation disposition and verification gaps. Static inspection supports the descriptions here; runtime behavior, dependency installation and current hosted services remain unverified.

## License and author

[License](https://github.com/NickCirv/git-rebase-helper/blob/378a2529d8ffb5f94bfc67cced0fe393888cfac8/LICENSE)

[Nicholas Ashkar](https://nicholashkar.com) · Applied AI, systems and consulting.
