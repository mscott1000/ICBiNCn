# Municourt HAR assessment (April 13, 2026, updated capture)

## Verdict
The updated HAR (`www.municourt.net.har`) is **closer**, but still **insufficient** to complete a robust Municourt **name-search pass** end-to-end.

## What this updated HAR now gives us

- Total requests in capture: **40**.
- Name-search submission is now visible:
  - `POST https://www.municourt.net/Results/SubmitByName`
  - Form fields captured in request body include:
    - `__RequestVerificationToken`
    - `SelectedSearchType=0`
    - `LastName`
    - `FirstName`
    - `MiddleName`
    - `DobYear`
    - `AgcyId`
    - `g-recaptcha-response`
- A follow-up full-case request is visible:
  - `POST https://www.municourt.net/Results/FullCaseView`
  - Includes `__RequestVerificationToken` and `button=fcv...`
  - Response body text is present (HTML), so at least one detail-page shape can be reverse engineered.
- A payment probe request is visible:
  - `POST https://www.municourt.net/api/v1/IPay/CaseIsPayable`
  - JSON request body includes `AgcyIdOri`, `CaseNumber`, `LastName`, and an opaque `id`.

## What is still missing (blocking)

1. **SubmitByName response body is not present** in the HAR.
   - We can see the request, but not the returned HTML/JSON that contains the result list and record identity values.
2. **CaseIsPayable response body is not present** in the HAR.
   - We cannot confirm the exact response schema (booleans, codes, payable status field names, or error states).
3. **No explicit result-list extraction path is confirmed**.
   - We need the exact fields from the name-search result page that map to per-case actions (e.g., `fcv...`, case number, agency/origin, internal IDs).
4. **Captcha/session coupling is only partially observable**.
   - The request includes captcha and anti-forgery token fields, but we still need to confirm replay/session requirements across a full run.

## Practical implication for implementation

The updated HAR is enough to stop guessing the **search submit payload** (great progress), but not enough to implement the full pass confidently because we still cannot parse the canonical search-results payload reliably.

## Step-by-step: how to capture the missing pieces correctly

Use these exact steps in Chrome/Edge DevTools to produce a decisive HAR:

1. Open DevTools → **Network**.
2. Enable:
   - **Preserve log**
   - **Disable cache**
   - (Optional but helpful) filter to `domain:municourt.net`.
3. Start from a fresh tab/session for `https://www.municourt.net`.
4. Perform one **known positive** name search (returns at least one case):
   - Enter first/last/middle (if needed) and YOB.
   - Complete captcha naturally.
   - Submit and wait for results fully rendered.
5. Click one result into **Full Case View** and let page finish loading.
6. Trigger payable check path if UI does it (or click the related action once).
7. In the Network table, click each key request and confirm **Preview/Response contains body text** for:
   - `POST /Results/SubmitByName`
   - Any request that returns the result list (if redirected or split)
   - `POST /Results/FullCaseView`
   - `POST /api/v1/IPay/CaseIsPayable`
8. Export using **Save all as HAR with content**.
9. Validate locally before sharing:
   - HAR must include non-empty `response.content.text` for SubmitByName/result-list and CaseIsPayable.
   - If those are empty, repeat capture (this is the current blocker).
10. (Recommended) Repeat with one **known negative** name search (0 results) and export a second HAR with content.

## Minimum acceptance checklist for the next HAR

- [ ] `SubmitByName` request + response body present.
- [ ] Result list response body present and parseable.
- [ ] `FullCaseView` request + response body present.
- [ ] `CaseIsPayable` request + response body present.
- [ ] Tokens/cookies visible enough to map request dependencies.
- [ ] At least one positive and one negative search example captured.

Once those are present, implementation can switch from endpoint-guessing to deterministic parsing/mapping.
