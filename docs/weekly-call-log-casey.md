# Lightweight Casey for Weekly Call Log

The hybrid version has one small browser-injected Casey logo. Tampermonkey handles selection, reading the selected row, and launching the existing background search. Apps Script only validates and writes completed Summary/Copy outputs to BB/BC; it does not create images, resize rows, install per-row callbacks, read launch parameters, or poll for results.

## Install/update

1. Replace your existing Tampermonkey ICBiNCn script with all of `dist/ICBINCN.user.js.txt`. Save and enable only this version. Replace it even if your current script already says 10.11: earlier revisions used the same date.
2. In Intake 2026 → Extensions → Apps Script, replace the entire `WeeklyCallLog` file with all of `src/google-apps-script/WeeklyCallLog.gs`. Keep other scripts. Remove the new file’s `onOpen` if you already have a combined `onOpen`, and replace its Casey menu portion with:

   ```javascript
   ui.createMenu('Casey')
     .addItem('Connect search results', 'connectCasey')
     .addItem('Remove old Casey images / links', 'removeLegacyCaseyButtons')
     .addToUi();
   ```

3. Save, select `removeLegacyCaseyButtons` in the editor function dropdown, and Run once. This removes only the old Casey drawings and Casey hyperlink formulas in BA; BB/BC and other images are preserved. No image installer is needed. Remove any old `caseyRow…`, image-installer, or duplicate WeeklyCallLog files you added separately; keep unrelated code. An old `caseyOnEdit(e)` call is harmless but can be removed.
4. Reload Sheets and any open court tabs. Choose **Casey → Connect search results** once per spreadsheet reload. Keep the small connection sidebar open; it does no periodic polling or server work while idle. Reopen it to reconnect after closing it. If the browser read hangs, a ten-second timeout allows retry.
5. Select a single cell in **BA**, such as **BA7**. One Casey logo appears at the selected cell if Sheets exposes its selection outline; otherwise it appears beside the cell-address/name box at the top left. Its tooltip identifies the selected row. Click it. It reads **N7, O7, and Q7’s birth year**, ignores middle name P, and launches the existing search in an inactive court tab. The selected row is captured on click, so changing selection during the read cannot change the requested row. Edits must be committed before clicking.
6. When the search completes, Tampermonkey pushes the exact Summary/Copy output once to the connected sidebar. The server writes **BB/BC** together and verifies readback before acknowledgement. No manual paste is required. Results remain queued if the sidebar is closed or a write fails; reconnect or use Retry.

## Safeguards

- This integration is restricted to Intake 2026’s Weekly Call Log (gid 1261396864). The logo is hidden on other tabs, template rows 1–3, other columns, and multi-cell selections.
- A click reads only N:Q for that row using Google Sheets’ signed-in, same-origin visualization endpoint. There are no workbook exports, all-row reads, cached client data, API keys, or external data services. Invalid names/DOB, login responses, and inaccessible reads block launch.
- Searches run one at a time because Casey uses a shared log. The call-log launcher requires Tampermonkey’s inactive-tab API and never falls back to a foreground tab.
- Results are matched to one unique first/last name and birth year before writing, including after sorting/inserting rows. Changed or duplicate identities, protected cells, and oversized outputs retain the result for retry/review rather than guessing.
- Outputs are written literally, preserving line breaks and leading formula characters. Repeated delivery is deduplicated by request ID. Rerunning a search deliberately updates BB/BC.
- Button updates use lightweight selection checks (600ms while visible) plus pointer/keyboard/resize events. One DOM button and one 128×110 image are reused; no broad mutation observer or repeated image creation is used.

## Verification and limits

Node tests cover selected BA-row validation, N/O/Q mapping (dates, numeric birth years, date serials), bounded reads, background search launch, completion push/ack, writer identity checks, duplicate/failed writes, and legacy cleanup. Syntax-check the generated bundle and Apps Script after rebuilding with `python scripts/build_tampermonkey.py`.

The actual selected-cell DOM, signed-in Google visualization response, and browser focus need a smoke test in the user’s desktop browser. There is no live browser-control tool in the development environment. This is a prepared/tested code change, not a verified installed browser integration. If the logo does not appear, report the value displayed in Sheets’ cell-address box after selecting BA7 so the selector can be checked against the live UI.
