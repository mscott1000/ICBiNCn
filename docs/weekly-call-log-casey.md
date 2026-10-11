# Casey logo buttons for Weekly Call Log

Target: Intake 2026 → Weekly Call Log (sheet ID 1261396864).

- BA: the **same Casey logo image** used by the Jotform button, with a native assigned click action.
- Clicking the logo reads **the clicked image’s current row**, taking first name from N, last name from O, and birth year from Q, and starts the existing three-pass Name Search. Middle name is blank, matching Jotform.
- BB receives the exact `buildSummaryCopyText()` output used by Summary.
- BC receives the exact `buildGroupedCopyText()` output used by Copy.

For example, clicking the logo anchored at **BA7** reads **N7, O7, and Q7**, even if another cell is selected. Values are read when clicked, so editing those cells does not require refreshing the button. Date cells and text containing a four-digit birth year are supported.

## Install or update

1. Replace the existing Tampermonkey ICBiNCn script with `dist/ICBINCN.user.js.txt`. Save, enable only this version, and reload the spreadsheet and any existing court tabs. This update is required even if you already installed the earlier 2026-10-11 version.
2. In Intake 2026, choose **Extensions → Apps Script**. Add a script file named `WeeklyCallLog`, or replace the previously installed `WeeklyCallLog` file’s contents, with **all** of `src/google-apps-script/WeeklyCallLog.gs`. Keep other script files. Include the embedded logo and all generated `caseyRow…` callbacks at the bottom.
3. If the project already has another `onOpen`, keep one function and add these statements inside it, then remove the duplicate `onOpen` from the new file:

   ```javascript
   SpreadsheetApp.getUi().createMenu('Casey')
     .addItem('Connect search results', 'connectCasey')
     .addItem('Install / refresh BA Casey buttons', 'refreshCaseyLinks')
     .addToUi();
   ```

4. Save. Select **refreshCaseyLinks** in the editor’s function dropdown and click **Run**. Complete Google’s authorization prompt if requested. This installs actual Casey images over column BA and replaces the earlier paw links. It preserves BB/BC and other images. Rows with first and last names get a 30×30 logo; their height and BA’s width are raised to at least 34 pixels if needed.
5. Reload the spreadsheet. Click a Casey logo in BA. Its assigned action reads that row, opens the result sidebar, and briefly shows a connecting dialog. The updated userscript opens the court tab and starts Name Search automatically. No extra Search button press, name entry, or hyperlink popup is required. Keep the sidebar open until it reports that BB and BC were saved.

No web app deployment, API key, sharing change, or additional trigger is needed. The old `caseyOnEdit(e)` hook can be removed from your existing `onEdit`, but leaving it is harmless. Existing buttons use edited names/DOBs automatically. After importing or adding clients, choose **Casey → Install / refresh BA Casey buttons** to add their logos.

The connectors cannot install bound Apps Script, assign native image actions, or update browser extensions. The live sheet’s earlier paw links remain until you run step 4. Automated tests cover the code; the actual Google iframe relay and court search still require a browser smoke test after installation. Assigned image actions work in the desktop browser, not the Google Sheets mobile app.

## Behavior and recovery

- A missing or invalid DOB gives a row-specific error when Casey is clicked. Template/control rows 2–3 are untouched.
- Search values come from the clicked image’s current anchor, not the active selection. Moving a button out of BA or duplicating it requires a refresh. Callback functions cover rows 4–1000; extend that list before installing buttons below row 1000.
- Run searches one at a time because Casey uses one shared log. A second click during a search gives an error rather than clearing the running search.
- Results are matched to a unique first name, last name, and birth year before writing, so sorting/inserting rows during a search does not redirect output to another client. Duplicate identities or changed names/DOBs block the write and retain results.
- BB and BC are replaced only after a completed search, as literal text including line breaks and leading formula characters. Stopped searches do not publish results.
- Failed/oversized/protected-cell writes retain results. Resolve the issue, then press **Retry pending results**, or copy manually from Casey. Queued results are delivered when the sidebar is opened again.
- Successful writes are acknowledged only after a matching cell readback. Request IDs suppress duplicate deliveries. Rerunning a search deliberately updates BB and BC.
- The Jotform integration is unchanged.

## Verification

Run `node --test tests/weekly-call-log.test.cjs`, rebuild with `python scripts/build_tampermonkey.py`, and syntax-check the generated userscript and Apps Script. In the desktop browser, select another row and click BA7’s logo; confirm the search uses N7/O7/Q7 and fills the expected client’s BB/BC. Also try an edited DOB, missing DOB, stopped search, sorted row, and temporarily closed sidebar.
