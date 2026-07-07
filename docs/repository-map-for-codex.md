# Repository map for Codex agents

Use this map before editing so future changes stay focused and the bundled userscript remains stable.

## Edit decision tree

1. **Main Tampermonkey behavior:** edit the numbered files in `src/tampermonkey/`, then run `python scripts/build_tampermonkey.py` to regenerate `dist/ICBINCN.user.js.txt`.
2. **Generated install file only:** avoid hand-editing `dist/ICBINCN.user.js.txt`; it is generated from `src/tampermonkey/` and has repository-specific version/date rules in `AGENTS.md`.
3. **Independent helper scripts:** edit `userscripts/standalone/`; these are not part of the main `ICBINCN.user.js.txt` build.
4. **Jotform row/table visual changes:** read `docs/jotform-table-visual-change-instructions.md` and inspect `data/jotform-captures/` before changing selectors, layout, or display logic.
5. **Research/reference material:** keep captured data and static artifacts under `data/`, not the repository root.

## Directory responsibilities

| Path | Purpose |
| --- | --- |
| `src/tampermonkey/` | Source modules for the main userscript, sorted by numeric filename and concatenated by the build script. |
| `dist/` | Generated Tampermonkey install output. Do not edit manually unless a task explicitly requires it. |
| `scripts/` | Local tooling, including the userscript bundler. |
| `docs/` | Agent-facing instructions, requirements, gap analyses, and implementation notes. |
| `data/fine-schedules/` | Municipal fine schedule reference text. |
| `data/jotform-captures/` | Captured Jotform DOM/table examples for safe visual/table work. |
| `data/network-captures/` | HAR/text network captures used for parser and API investigation. |
| `data/reference/` | Static development references that are not source code. |
| `assets/images/` | Images and visual references. |
| `userscripts/standalone/` | Separate Tampermonkey helpers that are not bundled into the main script. |

## Validation checklist

- Run `python scripts/build_tampermonkey.py` after main userscript source edits.
- Confirm `git diff -- dist/ICBINCN.user.js.txt` is expected whenever the main bundle is rebuilt.
- Use `rg --files` to locate repository files quickly; avoid recursive `ls`/`grep` scans.
