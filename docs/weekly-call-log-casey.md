# Casey for Weekly Call Log

Target: Intake 2026 → Weekly Call Log (sheet ID 1261396864).

- BA: native **🐾 Casey** hyperlink, using FN in N, LN in O, and DOB in Q.
- BB: the exact `buildSummaryCopyText()` output used by Name Search's Summary button.
- BC: the exact `buildGroupedCopyText()` output used by Name Search's Copy button.

The BA links start the existing three-pass search. No separate scraper or public web app is used. A bound Apps Script sidebar receives completed results from the same Tampermonkey script through its shared storage, and writes the two cells under your Google account.

## One-time installation

1. Replace the existing Tampermonkey ICBiNCn script with `dist/ICBINCN.user.js.txt` (version 2026-10-11). Save it and reload the spreadsheet and any existing court tabs. Keep only one version enabled.
2. In Intake 2026, open **Extensions → Apps Script**. Add a script file named `WeeklyCallLog` and paste `src/google-apps-script/WeeklyCallLog.gs` into it. Keep any existing code.
3. If the project already has `onOpen`, add the Casey menu statements from the new file to that function and remove the duplicate `onOpen` declaration. For new rows, add `caseyOnEdit(e);` to an existing `onEdit(e)` handler, or create `function onEdit(e) { caseyOnEdit(e); }` if there is none.
4. Save, reload the spreadsheet, and select **Casey → Connect search results**. Complete Google's authorization prompt. Keep the sidebar open while using Casey. No deployment, sharing change, API key, or web app URL is required.
5. Click a **🐾 Casey** link in BA and follow the hyperlink popup to open the court search. When the search completes, the sidebar writes BB and BC and reports the destination row. Searches must run one at a time because the existing tool uses one shared log.

The connectors cannot install bound Apps Script or browser extensions, so these installation steps must be performed in your browser. The implementation is prepared and unit-tested; the actual Google iframe relay and a real court search still require a browser smoke test after installation.

## Behavior and recovery

- Blank names/DOBs produce no link; invalid DOBs display **Check DOB**. Rows 2–3 are template/control rows and are untouched.
- Use **Casey → Refresh BA search links** after importing new rows or if another automation overwrites the formulas. The edit hook refreshes BA when N–Q are edited manually.
- Results are matched to a unique first name, last name, and birth year before writing, so sorting/inserting rows during a search does not redirect the output to another client. Duplicate identities or changed names/DOBs block the write and retain the results.
- BB and BC are replaced only after a completed search. Their contents are written as literal text, including line breaks and leading formula characters. Stopped searches do not publish results.
- Failed/oversized/protected-cell writes retain results. Resolve the issue, then press **Retry pending results**, or copy the text manually from Casey. Results queued while the sidebar is closed are delivered when it is opened again.
- Successful writes are acknowledged only after a matching cell readback. Request IDs suppress duplicate deliveries. Rerunning a search deliberately updates BB and BC.
- The bridge is restricted to this workbook/tab; it does not alter the Jotform integration.

## Verification

Run `node --test tests/weekly-call-log.test.cjs`, rebuild with `python scripts/build_tampermonkey.py`, and syntax-check the generated userscript. In the browser, confirm a real BA search fills the expected client's BB/BC, then try a missing DOB, an interrupted search, a sorted row, and a temporarily closed sidebar.
