# Municourt HAR assessment (April 13, 2026)

## Verdict
The newly added HAR (`www.municourt.net.har`) is **not sufficient** to implement a reliable Municourt name-based pass (first name, last name, optional middle, year of birth).

## What the HAR contains
- Total requests in capture: **3**.
- Hosts observed: `www.google.com` (2 reCAPTCHA requests), `www.municourt.net` (1 API request).
- Municourt request captured:
  - `POST https://www.municourt.net/api/v1/IPay/CaseIsPayable`
  - Request body includes:
    - `AgcyIdOri` (example: `MO095221J`)
    - `CaseNumber` (example: `180294731-A`)
    - `LastName` (example: `COHEN`)
    - `id` (opaque token)
- The HAR entry does **not** include the response body text for that API call (content metadata shows size/mime, but no payload text), so we cannot validate response schema.

## Why that is insufficient for your goal
Your intended flow is identity-driven search (first/last/middle + YOB), then retrieve eligible cases. The current capture only shows a **case-payment eligibility probe** (`CaseIsPayable`) that already assumes a known case number and agency/origin code.

Missing from the capture:
1. The **name-search endpoint(s)** used after Submit By Name.
2. Full request parameters for name search (including middle initial and birth year fields used by the UI).
3. The response schema listing matching cases and required IDs.
4. Any follow-up **case-detail endpoints** needed to enrich output.
5. Any anti-automation requirements (reCAPTCHA token propagation, cookies/session dependencies, CSRF/header requirements).

## Mismatch with current implementation
Current script logic in `18a-municourt-search.js` uses broad GET probing across guessed endpoints and query parameter names (`/Search`, `/CaseSearch`, `/CaseSearch/Results`, etc.). With the captured HAR indicating API-style POST calls plus reCAPTCHA activity, this likely explains why architectural flow works but zero Municourt records are returned.

## What data is needed to add Municourt properly
Capture a new HAR while running one successful manual search that returns known eligible cases, with **Preserve log** enabled and **Save all content** (request + response bodies):

1. **Search submission request**
   - Exact URL/method.
   - Headers.
   - Full payload/form fields (first, last, middle, year of birth).
   - Any captcha token field and where it comes from.

2. **Search results request/response**
   - Endpoint and method.
   - Full JSON/HTML payload returned.
   - Case identity fields needed for downstream calls (case number, agency/origin code, internal IDs).

3. **Case detail / status calls** (for at least one returned case)
   - Endpoint(s), methods, payloads, responses.
   - Fields needed to derive your output columns (charge, status, warrant/payable indicators, dates, court, balance).

4. **Session/captcha bootstrap requests**
   - Initial page loads that set cookies/tokens.
   - reCAPTCHA solve/verification call chain and which token is ultimately attached to the search API request.

5. **Negative + positive examples**
   - One query that returns 0 cases and one query that returns cases, to distinguish filtering logic from transport issues.

## Practical implementation target once data is available
A robust Municourt pass should be implemented as:
- **Step A:** Open bootstrap/search page (obtain session cookies + hidden tokens).
- **Step B:** Submit exact search request with user identity inputs.
- **Step C:** Parse canonical result payload for matched cases.
- **Step D:** For each case, call detail endpoints as needed and normalize into existing entry format.
- **Step E:** Apply de-duplication and status mapping to current UI schema.

Without those exact request/response shapes, any implementation would be speculative and likely miss real results again.
