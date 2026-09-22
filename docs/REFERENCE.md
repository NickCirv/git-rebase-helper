# git-rebase-helper — command reference

[Overview](../README.md) · [Research record](RESEARCH.md)

Describes revision `378a2529d8ffb5f94bfc67cced0fe393888cfac8`. Commands are source-inspected; no execution results are asserted.

## Workflow

Provides graph, fixups, conflicts, squash-wip and an interactive plan command. The planner applies only with --apply; squash-wip supports --dry-run.

Requires Git and a local repository with the relevant history. Commands are source-inspected, not executed in this review.

```bash
node index.js graph --base main
```

## Commands and controls

| Control | Behavior in the inspected implementation |
| --- | --- |
| `graph --base BRANCH` | Inspect commits ahead of the base |
| `fixups` | Suggest fixup candidates |
| `plan --apply` | Permit applying an interactive plan |
| `squash-wip --dry-run` | Preview automatic WIP squashing |
| `conflicts` | Inspect rebase conflicts |

## Interpretation and side effects

squash-wip without --dry-run can execute a rebase. Rebase changes commit IDs and can conflict with shared history. Heuristic fixup suggestions need a human review.

## Implementation reference

- [package.json](https://github.com/NickCirv/git-rebase-helper/blob/378a2529d8ffb5f94bfc67cced0fe393888cfac8/package.json)
- [index.js](https://github.com/NickCirv/git-rebase-helper/blob/378a2529d8ffb5f94bfc67cced0fe393888cfac8/index.js)
- [test/smoke.test.js](https://github.com/NickCirv/git-rebase-helper/blob/378a2529d8ffb5f94bfc67cced0fe393888cfac8/test/smoke.test.js)
