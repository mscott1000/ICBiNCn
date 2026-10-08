# Copilot Workflow Instructions for ICBiNCn

**IMPORTANT: Read this file at the start of every repo update session.**

This document is the single source of truth for how Copilot should handle edits to the ICBiNCn Tampermonkey userscript. It contains both operational instructions and meta-directives to ensure consistency across sessions.

---

## Meta-Directive: When to Consult This File

**Trigger points** — Read this file first when:
- A user requests edits to the ICBiNCn repository
- You're about to create a branch or make commits
- You need to understand the build process
- You're unsure about metadata updates or PR workflow

**How to remember:** This instruction is embedded in the `README.md` update workflow section. If you see a request involving `src/tampermonkey/` or `dist/ICBINCN.user.js.txt`, immediately fetch and review this file before proceeding.

---

## Build Architecture

### Source Organization
- **Location:** `src/tampermonkey/`
- **Format:** Individual `.js` files, numbered with prefixes (00, 01, ..., 09a, 10, ..., 16a, ..., 20)
- **Total files:** 25 source parts (verified to match current dist exactly)
- **Key files:**
  - `00-preamble.js` — Userscript metadata (name, version) + opens shared function scope
  - `20-init.js` — Initialization code + closes shared function scope
  - All files between share one lexical scope

### Build Process
**Command:** `python scripts/build_tampermonkey.py` (from repo root)

**Algorithm:**
1. Read all `*.js` files from `src/tampermonkey/`
2. Sort alphabetically (this respects numeric prefixes: 00, 01, ..., 09a, 10, ..., 20)
3. Strip trailing whitespace from each file
4. Concatenate with newlines between
5. Write to `dist/ICBINCN.user.js.txt`

**Important:** The alphabetical order is deterministic and must be preserved. Do not edit files in `dist/` directly — always regenerate via the build script.

---

## Metadata Updates

**When to update metadata:** Every time you regenerate the dist file (unless user explicitly requests a reversion).

**File:** `src/tampermonkey/00-preamble.js`

**Fields to update:**
```javascript
// @name         ICBiNCn X.XX    (use MMDD format, e.g., "10.07" for Oct 7)
// @version      YYYY-MM-DD      (use full ISO date of update, e.g., "2026-10-07")
```

**Additional update:** `AGENTS.md` must also be updated with matching version and date whenever dist is regenerated (except explicit reversions).

---

## Standard Workflow for Edit Requests

Follow these steps for every edit request:

### 1. Parse & Preview
- Identify the source file(s) affected by the requested change
- Retrieve the relevant section(s) and show the user a focused diff
- Explain the impact on functionality

### 2. Get Approval
- Wait for user to review the diff
- User says "go ahead" or requests refinements
- Do not proceed without explicit approval (even if it seems obvious)

### 3. Create Branch
**Branch naming convention:** `{type}/{short-description}`
- `type` = fix, feature, refactor, docs, etc.
- `short-description` = kebab-case, concise (e.g., `fix/richmond-heights-court-name`)

### 4. Execute Changes
On the branch, make these commits in order:

**Commit 1: Update source file(s)**
- Edit `src/tampermonkey/{filename}.js`
- Preserve file numbering and scope structure
- Commit message: Descriptive but concise (e.g., "Change Richmond Heights label in Text Builder")

**Commit 2: Update metadata**
- Edit `src/tampermonkey/00-preamble.js`
- Update `@name` and `@version` to today's date
- Commit message: "Update metadata: version YYYY-MM-DD"

**Commit 3: Update AGENTS.md**
- Append or update entry with new version and date
- Commit message: "Update AGENTS.md: version YYYY-MM-DD"

### 5. Regenerate Distribution
- Read all 25 source files in alphabetical order
- Generate the concatenated output manually
- Write to `dist/ICBINCN.user.js.txt`
- Commit with message: "Regenerate dist: version YYYY-MM-DD"

**Note:** You cannot execute the Python script directly, so you must concatenate the source files in code. Verify the order against the build script's alphabetical sort logic.

### 6. Open Ready-for-Review PR
- Push the branch to the remote
- Open a ready-for-review PR against the default branch (`draft: false`; omit `--draft` with `gh pr create`)
- Title: "{description of changes}" (no `[WIP]` prefix)
- Include a summary of what changed and why
- Verify the pushed commit and confirm the PR is open with `draft: false` before reporting completion
- If a completed PR already exists as a draft, mark it ready for review automatically
- Use drafts only when the user requests a draft or the work is unfinished
- Merge only when authorized by the user

### 7. Delivery
- User approves or requests changes
- Once approved, the dist file (`dist/ICBINCN.user.js.txt`) is ready to copy-paste into the user's Tampermonkey workspace
- Provide a direct link to the dist file in the PR or final comment

---

## File Order Reference

Source files are concatenated in this order:

```
00-preamble.js
01-storage.js
02-utilities.js
03-case-net-helpers.js
04-name-search-flow.js
05-case-parsing.js
06-batch-tools.js
07-log-management.js
08-upcoming-court-dates.js
09-municipalcourt-helpers.js
09a-plead-pay-totals.js
10-name-state-management.js
11-case-tracking.js
12-track-state-management.js
13-logging.js
14-debug.js
15-log-formatting-reused-from-your-dom-tool-adapted.js
16-upcoming-ui-helpers.js
16a-upcoming-ui-table-generation.js
17-ui.js
18-ui-event-handlers.js
18a-text-builder-event-handlers.js
18b-ui-upcoming-event-handlers.js
19-page-detection.js
20-init.js
```

**Verify this order matches the alphabetical sort of actual files before each build.**

---

## Common Tasks

### Updating a UI string or constant
- File location: Usually `17-ui.js` for main UI, or specific feature files
- Metadata: Update `00-preamble.js` only
- Build: Regenerate dist
- PR: Standard workflow

### Fixing a parsing or logic bug
- Identify the feature file (e.g., `05-case-parsing.js`, `09-municipalcourt-helpers.js`)
- Make the fix, preserve scope structure
- Metadata: Update `00-preamble.js`
- Build: Regenerate dist
- PR: Standard workflow

### Adding a new feature
- Determine which feature file(s) it belongs to, or create a new numbered file
- Keep numbering consistent (e.g., new feature between 10 and 15 might go in a new `10a-feature.js`)
- Metadata: Update `00-preamble.js`
- Build: Regenerate dist
- PR: Standard workflow + explain feature addition

---

## Troubleshooting

### "The dist file doesn't match what the Python script produces"
- Verify you read all 25 source files in exact alphabetical order
- Confirm trailing whitespace was stripped from each file
- Check that newlines separate files (not multiple, not zero)
- If uncertain, ask the user to run the Python script locally to verify

### "Metadata is out of sync with the dist file"
- This happens if dist is regenerated but `00-preamble.js` is not updated
- Always update metadata **before** generating dist, or regenerate dist **after** updating metadata
- Verify in the PR that both are in sync

### "User requests a reversion"
- User may say: "Go back to version X.XX"
- Do NOT update metadata if explicitly instructed not to
- Only edit source files to the reverted state
- Regenerate dist without changing version/date
- Commit as normal but note in PR that this is a reversion

---

## Session Checklist

Use this checklist at the start of each session:

- [ ] Read this file (`COPILOT_INSTRUCTIONS.md`)
- [ ] Confirm the user's edit request and show a focused diff
- [ ] Wait for explicit approval before creating a branch
- [ ] Use correct branch naming (`{type}/{description}`)
- [ ] Make commits in order: source → metadata → AGENTS.md → dist
- [ ] Verify file order before regenerating dist
- [ ] Push the branch and open a ready-for-review PR with a clear summary; verify remote commit and `draft: false`
- [ ] Ensure dist file is ready for copy-paste into Tampermonkey

---

## Questions?

If you encounter a situation not covered here:
1. Check the `README.md` for high-level workflow context
2. Review relevant source files to understand current implementation
3. Ask the user for clarification rather than guessing
4. Update this file if the workflow changes

---

**Last Updated:** 2026-10-08
**Session Reference:** Established as persistent instruction for all future ICBiNCn edit requests
