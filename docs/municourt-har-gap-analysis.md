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

## Step-by-step: exact capture procedure (button-by-button)

The current HAR appears to be **sanitized**, which removes response bodies we need.  
If your DevTools only offers **"Export HAR (sanitized)"**, do this exact fallback procedure:

### Part A — Record the traffic

1. Open `https://www.municourt.net`.
2. Press **F12** (or right-click page → **Inspect**) to open DevTools.
3. Click the **Network** tab.
4. At the top of Network:
   - make sure the **record button** is red (recording on),
   - check **Preserve log**,
   - check **Disable cache**.
5. Click the **clear** icon (circle with slash) so the request list is empty.
6. In the filter box, type: `municourt.net`
7. On the site, run one **real name search** that returns at least one case:
   - enter name/YOB,
   - complete captcha,
   - submit.
8. Open one result in **Full Case View**.
9. Trigger the payable check once (if there is a pay/check-payable button).

### Part B — Export what DevTools allows

10. In Network request table, right-click any row.
11. Click **Export HAR (sanitized)**.
12. Save file (example: `municourt-sanitized.har`).

### Part C — Manually capture the missing response bodies (required)

For each request below, do **all** of these actions:
- `POST /Results/SubmitByName`
- `POST /Results/FullCaseView`
- `POST /api/v1/IPay/CaseIsPayable`

Steps per request:

1. Click the request row in Network.
2. Click the **Headers** tab:
   - in **Request URL**, confirm endpoint path.
3. Click the **Payload** tab:
   - right-click inside payload → **Copy all** (or copy visible payload text).
4. Click the **Response** tab:
   - click inside response body,
   - **Ctrl+A**, **Ctrl+C** to copy entire response body.
5. Paste into a text file using this template:

```txt
=== REQUEST: /Results/SubmitByName ===
Request URL: <paste url>
Request Method: <paste method>
Request Payload:
<paste payload>
Response Body:
<paste full response>
=== END REQUEST ===
```

6. Repeat for the other two endpoints.

### Part D — Deliverables to share

Provide all of the following:

1. `municourt-sanitized.har`
2. `municourt-manual-responses.txt` (the copied payload + full response bodies)

Without Part C, implementation is blocked because sanitized HAR omits exactly the fields needed for deterministic parsing.

## Minimum acceptance checklist for the next HAR

- [ ] `SubmitByName` request + response body present (from HAR or manual copy).
- [ ] Result list response body present and parseable.
- [ ] `FullCaseView` request + response body present (from HAR or manual copy).
- [ ] `CaseIsPayable` request + response body present (from HAR or manual copy).
- [ ] Tokens/cookies visible enough to map request dependencies.
- [ ] At least one positive and one negative search example captured.

Once those are present, implementation can switch from endpoint-guessing to deterministic parsing/mapping.
