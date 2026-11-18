# Case-number overrides

Name Search opens with the original name-entry panel. Use “Switch to Case Search” at the top right of that panel to replace the name fields with the case-number fields. “Switch to Name Search” in the same position restores the name fields. Switching preserves entered values and the current Summary/Detail output; returning from Home defaults to Name Search. Enter case numbers separated by new lines, commas, semicolons, or spaces. Choose Case.net or Municourt; Municourt also requires a court selection. Search Case Numbers generates fresh editable Summary and Detail panes using the existing formatters. Name and birth year fields are ignored.

Override results are scoped to this search. They never enter or change the normal appended case log, and no permanent whitelist is stored. Output retains the existing editable-output storage and undo behavior. Run separate searches for different sources or Municourt courts. Duplicate input numbers and duplicate returned case keys are removed. Multiple returned matches are included without a selection dialog. Stop discards an unfinished batch; lookup errors appear in both output panes.

For each case, a dedicated Normal-search exclusion reasons section follows its standard information, with bullets for all applicable log-exclusion rules. The Case.net scraper continues through transferred, blank-title, paid-in-full and disabled-court checks for this explicit override. It also reports guilty/zero-balance/nonwarrant exclusion with the existing City municipal exception. Actual statuses and other case facts remain unchanged. Unknown or unavailable data is reported separately, rather than represented as a completed exclusion check. No birth-year comparisons run.

## Evidence and implementation

User-supplied HAR captures established:

- Case.net POST `/casenet/caseNoSearch.do` with `caseNumber`, empty `courtType`/`countyCode`, and `cortCode=SW`; a single match redirects to a header URL containing the case number and court ID.
- Municourt GET search form with all 50 `AgcyId` options, POST `/Results/SubmitByCaseTicket` with `SelectedSearchType=1`, case number, selected court, current verification token and reCAPTCHA response; then POST `/Results/FullCaseView` using the returned result button and token.

`18d-case-number-override.js` owns the new workflow. Municourt uses the established remote browser worker to obtain fresh verification data; captured tokens are never replayed. The older unverified batch scraper stays deferred. Uploaded HAR files, case data, and tokens are not committed.

## Validation

- `node --test tests/*.test.cjs`
- `node tests/case-number-override.browser.cjs` (requires Playwright and Chromium; `CHROMIUM_EXECUTABLE` can select the executable)
- `python scripts/build_tampermonkey.py` and `node --check < dist/ICBINCN.user.js.txt`

Additional local headless-browser checks parsed the supplied Case.net and Municourt response bodies and generated both outputs. These are fixture and simulated-browser checks, not live authenticated site tests.
