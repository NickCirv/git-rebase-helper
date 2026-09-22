# git-rebase-helper — research record

## Revision and scope

- Repository: [NickCirv/git-rebase-helper](https://github.com/NickCirv/git-rebase-helper)
- Commit: `378a2529d8ffb5f94bfc67cced0fe393888cfac8`
- Tree: `ed5cfbe5df04292298c9174024da7916c21dec99`
- Captured: 6 of 6 eligible text files (all eligible text files).
- Recursive tree truncated: `False`.
- Runtime verification: **unverified**; no repository code, installation or test command was executed.

The captured file inventory is broader than the semantic review. Authoring inspected package metadata, entrypoint/argument handling and implementation paths relevant to the claims below, plus test declarations. This is documentation research, not a line-by-line security audit. Generated/binary artifacts, lockfiles and file types outside the acquisition filter were not inspected.

## Claim and evidence

| Claim | Pinned evidence | Status |
| --- | --- | --- |
| Runtime requirement and executable mapping | [package.json](https://github.com/NickCirv/git-rebase-helper/blob/378a2529d8ffb5f94bfc67cced0fe393888cfac8/package.json) | verified in manifest; installation unverified |
| Inspect and plan a rebase before rewriting local commit history. | [implementation](https://github.com/NickCirv/git-rebase-helper/blob/378a2529d8ffb5f94bfc67cced0fe393888cfac8/index.js) | partially verified by static implementation review |
| Operational limits and side effects | [implementation](https://github.com/NickCirv/git-rebase-helper/blob/378a2529d8ffb5f94bfc67cced0fe393888cfac8/index.js) and source map in [reference](REFERENCE.md) | partially verified; runtime unverified |
| Test command definition | [package.json](https://github.com/NickCirv/git-rebase-helper/blob/378a2529d8ffb5f94bfc67cced0fe393888cfac8/package.json) | verified as a declaration only |

## Findings carried into the rewrite

squash-wip without --dry-run can execute a rebase. Rebase changes commit IDs and can conflict with shared history. Heuristic fixup suggestions need a human review.

No runtime checks were executed for this documentation review. The committed smoke test checks entrypoint JavaScript syntax; it does not exercise the command behavior.

## Documentation inventory and disposition

| Existing document | Disposition |
| --- | --- |
| [README.md](https://github.com/NickCirv/git-rebase-helper/blob/378a2529d8ffb5f94bfc67cced0fe393888cfac8/README.md) | Rewritten overview; historical copy remains at this pinned URL. |

New supporting documents: `docs/REFERENCE.md` and `docs/RESEARCH.md`. No original source or protected legal/security file was changed.

## Protected-file evidence

- `LICENSE` SHA-256 `68729cab364d82364078b08d8580ccfa51dc69c81a7d64e8d8d47a1da6c9349d`.

## Remaining verification

Clean installation, useful-command execution, malformed input, side-effect boundaries, platform compatibility and end-to-end tests remain unverified. Package-registry availability and live API destinations were not checked. No performance, customer-adoption, compliance or production-readiness claim is made.

## Captured evidence index

- [LICENSE](https://github.com/NickCirv/git-rebase-helper/blob/378a2529d8ffb5f94bfc67cced0fe393888cfac8/LICENSE) · blob `05b804beeec7d1a6c933d087387ba4adf6463d93`.
- [README.md](https://github.com/NickCirv/git-rebase-helper/blob/378a2529d8ffb5f94bfc67cced0fe393888cfac8/README.md) · blob `c2f4fa5357c0a9ebf1e1e2620999fab156c77422`.
- [package.json](https://github.com/NickCirv/git-rebase-helper/blob/378a2529d8ffb5f94bfc67cced0fe393888cfac8/package.json) · blob `7944409553512630f7329714e3c00833761e5e81`.
- [.github/workflows/ci.yml](https://github.com/NickCirv/git-rebase-helper/blob/378a2529d8ffb5f94bfc67cced0fe393888cfac8/.github/workflows/ci.yml) · blob `44515034a394670de44454a7a1bd2c7ef0c9836e`.
- [index.js](https://github.com/NickCirv/git-rebase-helper/blob/378a2529d8ffb5f94bfc67cced0fe393888cfac8/index.js) · blob `c2ad985a5433e94eff4a08329eb3b10e07ee8a5a`.
- [test/smoke.test.js](https://github.com/NickCirv/git-rebase-helper/blob/378a2529d8ffb5f94bfc67cced0fe393888cfac8/test/smoke.test.js) · blob `ebbccaaf2583b4850575f835313e4b0afd21bff7`.

## Tree files outside the captured text set

No additional blob paths are present outside the captured set.
