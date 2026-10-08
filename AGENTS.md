# Repository Agent Rules

## Permanent update rule for `dist/ICBINCN.user.js.txt`
When Codex updates `dist/ICBINCN.user.js.txt`, it must also update the userscript `@version` and date metadata to the current date.

Codex must also update the Tampermonkey userscript title (`@name`) so its trailing version-style date matches the updated `@version` date in `M.DD` / `MM.DD` format without a leading zero for the month. For example, when `@version` is updated to `2026-05-29`, `@name` must be updated to `ICBiNCn 5.29`.

### Exception
Do **not** update the date/version or title when the requested change explicitly requires reverting `dist/ICBINCN.user.js.txt` to a previous version.

## Jotform table visual-change data requirement
Before making changes that visually alter Jotform table rows or columns, follow `docs/jotform-table-visual-change-instructions.md`: analyze the existing captured Jotform row HTML/data in the repo first, and ask the Codex user for more representative data if the existing data is not sufficient to safely and accurately implement the requested change.

## Current userscript release

- Version/date: `2026-10-08`
- Userscript title: `ICBiNCn 10.08`

## GitHub delivery workflow

For completed, verified changes, commit and push a feature branch, then open a pull request against the default branch ready for review (`draft: false`; omit `--draft` with `gh pr create`). Use a final descriptive title without a `[WIP]` prefix. Drafts are only for work explicitly requested as draft or unfinished. If an existing PR is a draft and the work is complete, mark it ready for review automatically.

Verify the remote branch matches the local commit and that the PR is open with `draft: false` before reporting completion. Report any blocker instead of stopping at local edits. Keep merging separate: merge only when the user authorizes it. This rule supersedes the draft-PR defaults in older workflow instructions.

## Required completion checklist for Codex

For requested code changes, unless the user explicitly requests local-only work:

1. Update the source and required generated files, including the userscript metadata and current release entry when applicable.
2. Run the appropriate checks and review the final diff against the latest target branch.
3. Commit only the task's changes on a feature branch.
4. Push that branch to GitHub.
5. Verify that the remote branch contains the exact local commit.
6. Open or update a pull request against the default branch, ready for review for completed work, and verify its head commit and state.
7. Report the PR URL, branch, commit hash, and validation results. If committing, pushing, or PR creation is blocked, report the blocker and mark GitHub delivery incomplete; do not present local edits as completed delivery.

A plain-language edit request authorizes implementation, validation, committing, pushing, and PR preparation without another pre-edit approval round. The user reviews the concrete PR and can request refinements or authorize merging. After merge authorization, merge through GitHub and verify the merged state before reporting success. Creating a PR does not itself mean it has been merged.

This checklist governs Codex's completion workflow and supersedes conflicting pre-edit approval or draft-default instructions in older workflow documents. Explicit user instructions still take precedence.
