# Tampermonkey script layout

This repository keeps the CaseNet userscript in two forms:

- `src/tampermonkey/`: maintainable source parts grouped by feature.
- `ICBINCN.user.js.txt`: generated mirror of the same bundled script for compatibility with the original workflow.

## Update workflow

1. Edit the relevant file(s) in `src/tampermonkey/`.
2. Rebuild the single-file output:
   ```bash
   python scripts/build_tampermonkey.py
   ```
3. Copy the contents of `ICBINCN.user.js.txt` into the browser extension when you want to publish an update.

## Source map

The source parts are numbered so they concatenate in the correct order. The current breakdown mirrors the major functional areas of the original script, including storage, helpers, page detection, search automation, parsing, UI, and initialization.
## Design notes

- Case-number batch UI discovery checklist: `docs/case-number-batch-ui-requirements.md`
