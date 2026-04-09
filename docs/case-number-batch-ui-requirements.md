# Case-number batch UI: production requirements (no-guess implementation plan)

## Why this exists
The repository already contains a **partial** batch-by-case-number path (`runBatchByCaseNumbers`) that attempts to resolve each case number by posting directly to `/casenet/caseNoSearch.do` and then scraping links from returned HTML. That approach is not currently wired into the UI, and more importantly it assumes request/response behavior without a captured browser-truth contract for Case.net's case-number search flow. This document defines what must be collected before implementing a separate production Tampermonkey script.

## Existing architecture that can be reused safely

### Reusable downstream data pull (already grounded)
- The JSON/XHR data pull from a known `(caseNumber, courtId)` tuple already exists in `scrapeCaseViaApi` and calls:
  - `/casenet/cases/newHeaderData.do`
  - `/casenet/cases/party.do`
  - `/casenet/cases/docketEntriesSearch.do`
  - optional `/casenet/cases/charges.do`
- The docket parser for “next docket date” already exists (`findFirstCurrentOrFutureScheduledLine`), and this is the core piece to keep for the new tool.

### Existing but currently unverified case-number resolver path
- `findCaseCandidatesByCaseNumber` currently posts only:
  - `caseNumber`
  - `inputVO.caseNumber`
  - `newSearch=Y`
- `runBatchByCaseNumbers` currently treats multiple matches for a case number as unresolved ambiguity.

This is exactly where reality capture is needed: whether those POST fields are actually sufficient in production, and what deterministic key is available for disambiguation.

## Required evidence to move from guesswork to production
Collect these from browser DevTools Network while a human performs **Search by Case Number** on Case.net.

1. **Case-number search form contract**
   - Full request URL.
   - Method (`GET` vs `POST`).
   - Full form payload including hidden fields (`inputVO.*`, tokens, checkboxes, case-type selectors, etc.).
   - Required headers (including any anti-CSRF/custom headers if present).
   - Whether cookies/session state are required beyond normal authenticated browser session.

2. **Search result contract (for one-result and multi-result cases)**
   - Raw HTML response body (or at least relevant table/anchor fragment).
   - Exact anchor patterns that identify case links.
   - Which parameters are always present for each result (`caseNumber`, `courtId`, `caseType`, `locnCode`, etc.).
   - Whether same case number can legally return multiple courts/case variants.

3. **Direct case-header navigation contract**
   - Confirm whether constructing URL with `inputVO.caseNumber` + `inputVO.courtId` is sufficient in all cases.
   - If not, identify additional required query params.

4. **Docket data truth sample set**
   - At least 10-20 real cases (mixed statuses) with:
     - one with future date,
     - one with no upcoming setting,
     - one continued/rescheduled history,
     - one disposed/closed,
     - one transferred edge case.
   - For each, include docket JSON payload from `/docketEntriesSearch.do` and expected human interpretation.

5. **Business rule definition for “new court date”**
   This must be explicit before coding output logic:
   - Is “new” compared to previous run result stored by script, or simply “next upcoming date currently on docket”?
   - If previously stored date disappears/replaces, should output be:
     - “updated date”,
     - “no new court date”, or
     - “date removed”?
   - Tie-break rule when multiple future docket settings exist.

6. **Input normalization rules for batch case numbers**
   - Canonical formats accepted (e.g., `18SL-CR01234`, spacing, lowercase).
   - Whether users may include optional court ID on each line.
   - Whether duplicates should be ignored silently.

7. **Rate-limit and safety boundaries**
   - Acceptable concurrency and pacing (e.g., 3-5 concurrent requests max).
   - Any known lockout/captcha thresholds.

## Proposed output contract for the new UI (after evidence is gathered)
For each input line:
- `caseNumber`
- `status` one of:
  - `upcoming_date_found`
  - `no_upcoming_date_found`
  - `case_not_found`
  - `ambiguous_case_number`
  - `error`
- `nextCourtDate` (ISO + display format) when found
- `note` (short reason / ambiguity details)

This keeps output machine-readable and copy-friendly.

## Implementation guardrails
Do **not** ship case-number batch automation until the artifacts above are captured and attached (or committed in sanitized form). Without those artifacts, any implementation is an inference and may fail against real Case.net behavior.

## Suggested artifact package to provide now
Please provide a folder (sanitized for PII as needed) containing:
- `search-by-case-number-request.txt` (headers + form payload)
- `search-by-case-number-response-single.html`
- `search-by-case-number-response-multi.html`
- `resolved-case-header-request.txt`
- `docket-samples/*.json` (10+)
- `expected-results.csv` with columns:
  - `caseNumber`
  - `expectedStatus`
  - `expectedNextCourtDate`
  - `notes`

Once those are available, a separate Tampermonkey script (`*.user.js.txt`) can be built against actual contracts instead of assumptions.
