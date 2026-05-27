# Tampermonkey script layout

This repository keeps the CaseNet userscript and supporting research materials organized by purpose.

## Repository structure

- `src/tampermonkey/` — maintainable userscript source parts grouped by feature.
- `dist/` — generated build outputs intended for install/publish workflows.
- `scripts/` — utility scripts (including build tooling).
- `docs/` — requirements, analysis notes, and implementation documentation.
- `assets/images/` — project images and visual references.
- `data/network-captures/` — raw HAR/text captures used for parsing and debugging.
- `data/reference/` — static reference artifacts used during development.
- `userscripts/standalone/` — independent helper userscripts outside the main bundle.

## Update workflow

1. Edit the relevant file(s) in `src/tampermonkey/`.
2. Rebuild the single-file output:
   ```bash
   python scripts/build_tampermonkey.py
   ```
3. Copy the contents of `dist/ICBINCN.user.js.txt` into the browser extension when you want to publish an update.

## Source map

The source parts are numbered so they concatenate in the correct order. The current breakdown mirrors the major functional areas of the original script, including storage, helpers, page detection, search automation, parsing, UI, and initialization.

## Design notes

- Case-number batch UI discovery checklist: `docs/case-number-batch-ui-requirements.md`

## Headless service scaffold

A starter service-mode migration scaffold is available in `headless/` for running recurring cycles outside the browser extension runtime. It includes:

- env-based + interactive credential input
- JSON-backed storage adapter as a `GM_*` replacement
- retry/backoff loop and scheduled execution options
- Google Sheets endpoint POST flow compatible with current architecture

See `headless/README.md` for details.
