# Deferred features: future development reminder

On 2026-11-10 the user requested: "retain in repo, remove from tampermonkey dist script, leave a reminder for yourself in order to build upon in the future".

Keep both features below in this repository. They are intentionally outside `src/tampermonkey/` so the build excludes them. Do not delete them during unused-code cleanup, add them to the bundle automatically, or present them as working standalone scripts.

## Google Voice assistant

`src/deferred/google-voice-assistant.js` retains the complete queue, phone formatting, localStorage drafts, greeting composition, preview and renderer from the uploaded 11.10 script. Its original renderer had no caller or APP_VIEWS entry. Buttons were rendered but had no connected click handlers in that attachment.

Before restoring it, define the intended navigation and button behavior with the user. It expects shared `norm`, `escapeHtml`, `addBlock`, browser DOM, localStorage and the main UI styles. Keep storage key `gv_batch_sender_state_v1` compatible. Test queue alignment, invalid phones, clipboard behavior, advancing and clearing. Do not add automatic message sending without the user's direction.

## Older case-number batch scraper

`src/deferred/case-number-batch.js` retains `runBatchByCaseNumbers`, input parsing, candidate lookup, HTML case-link extraction, Municourt case-number lookup, and the previously unused batch draft helpers/key. Its entry function had no caller in the attachment.

It expects the main userscript's API scrapers, log formatting/persistence, UI status/render helpers, stop handling, concurrency pool, parsing and Municourt infrastructure. It cannot run by itself. Shared dependencies still used by active features remain in the main source. Existing stored drafts were not cleared.

The visible **Upcoming Court Dates** tool is separate and remains active. Before reintroducing the older batch scraper, read `docs/case-number-batch-ui-requirements.md`, agree on the intended full-case batch workflow, and supply a UI entry point. Verify ambiguous court selection, duplicates, stop behavior, errors and Case.net/Municourt output.

## Cleanup and validation

This change also carries forward the reviewed cleanup: ten uncalled helpers removed from the active source, duplicate URL/field parsers consolidated, and three identical Casey logo values shared through aliases. The two original batch draft helpers are preserved with the deferred batch code. Other dormant popup/history structures, Track This Case, network fallback paths, court datasets and the embedded Inter font remain intact.

Rebuild with `python scripts/build_tampermonkey.py`. Run `node --test tests/*.test.cjs`. Full-bundle DOM comparisons against the attachment covered startup for Case.net, Municourt, Jotform and Sheets plus navigation through all four main tools. These are simulated checks, not live authenticated scraping or tracking signups.
