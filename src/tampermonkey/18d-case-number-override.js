/************************************************************
 * Current-search case-number overrides. Never saved to the name-search log.
 ************************************************************/
const MUNI_CASE_COURTS = [
  [
    "AR",
    "Arnold Municipal Court"
  ],
  [
    "BW",
    "Ballwin Municipal Court"
  ],
  [
    "BE",
    "Bel-Nor Municipal Court"
  ],
  [
    "BN",
    "Bellefontaine Neighbors Municipal Court"
  ],
  [
    "BK",
    "Berkeley Municipal Court"
  ],
  [
    "BJ",
    "Black Jack Municipal Court"
  ],
  [
    "BC",
    "Breckenridge Hills Municipal Court"
  ],
  [
    "BR",
    "Brentwood Municipal Court"
  ],
  [
    "BT",
    "Bridgeton Municipal Court"
  ],
  [
    "BM",
    "Byrnes Mill Municipal Court"
  ],
  [
    "CV",
    "Clarkson Valley Municipal Court"
  ],
  [
    "CL",
    "Clayton Municipal Court"
  ],
  [
    "CW",
    "Crestwood Municipal Court"
  ],
  [
    "CC",
    "Creve Coeur Municipal Court"
  ],
  [
    "DP",
    "Des Peres Municipal Court"
  ],
  [
    "EU",
    "Eureka Municipal Court"
  ],
  [
    "FW",
    "Fairway Kansas Municipal Court"
  ],
  [
    "FN",
    "Fenton Municipal Court"
  ],
  [
    "FL",
    "Florissant Municipal Court"
  ],
  [
    "FR",
    "Frontenac Municipal Court"
  ],
  [
    "GD",
    "Glendale Municipal Court"
  ],
  [
    "HY",
    "Hayti Municipal Court"
  ],
  [
    "HA",
    "Hazelwood Municipal Court"
  ],
  [
    "HB",
    "Hillsboro Municipal Court"
  ],
  [
    "JC",
    "Jefferson County Municipal Court"
  ],
  [
    "JN",
    "Jennings Municipal Court"
  ],
  [
    "KS",
    "Kansas City Kansas Municipal Court"
  ],
  [
    "KC",
    "Kansas City Missouri Municipal Court"
  ],
  [
    "KW",
    "Kirkwood Municipal Court"
  ],
  [
    "LD",
    "Ladue Municipal Court"
  ],
  [
    "MW",
    "Maplewood Municipal Court"
  ],
  [
    "MM",
    "Moscow Mills Municipal Court"
  ],
  [
    "OK",
    "Oakland Municipal Division"
  ],
  [
    "OL",
    "Olivette Municipal Court"
  ],
  [
    "PC",
    "Pacific Municipal Court"
  ],
  [
    "PG",
    "Pagedale Municipal Court"
  ],
  [
    "RJ",
    "REJIS Municipal Court"
  ],
  [
    "RH",
    "Richmond Heights Municipal Court"
  ],
  [
    "RV",
    "Riverview Municipal Court"
  ],
  [
    "SW",
    "Shrewsbury Municipal Court"
  ],
  [
    "SH",
    "Sunset Hills Municipal Court"
  ],
  [
    "SY",
    "Sycamore Hills Municipal Court"
  ],
  [
    "TC",
    "Town and Country Municipal Court"
  ],
  [
    "UC",
    "University City Municipal Court"
  ],
  [
    "VP",
    "Valley Park Municipal Court"
  ],
  [
    "VH",
    "Velda Village Hills Municipal Court"
  ],
  [
    "WW",
    "Warson Woods Municipal Division"
  ],
  [
    "WG",
    "Webster Groves Municipal Court"
  ],
  [
    "WC",
    "Winchester Municipal Court"
  ],
  [
    "WT",
    "Woodson Terrace Municipal Court"
  ]
];
let nameSearchMode = 'name';
let caseOverrideDraft = {text:'',source:'casenet',court:''};
let caseOverrideRunning = false;

function parseOverrideNumbers(text) {
  const tokens = String(text || '').toUpperCase().split(/[\s,;]+/).filter(Boolean);
  if (tokens.some((token) => !/^[A-Z0-9-]+$/.test(token))) throw new Error('Use case numbers separated by spaces, commas, or new lines.');
  return [...new Set(tokens)];
}

async function searchMuniViaSubmitByCase(params) {
  const home = await gmHttpRequestText({url:`${MUNI_BASE_URL}/?sel=1`});
  if (home.status >= 400) throw new Error(`Municourt form HTTP ${home.status}`);
  const token = findVerificationToken(home.responseText);
  const captcha = await getRecaptchaTokenForSubmit(findRecaptchaSiteKey(home.responseText));
  if (!token || !captcha) throw new Error('Municourt verification unavailable. Open Municourt and retry.');
  const payload = new URLSearchParams({__RequestVerificationToken:token,SelectedSearchType:'1',CaseTicketNum:params.caseNumber,AgcyId:params.court,'g-recaptcha-response':captcha});
  const response = await gmHttpRequestText({method:'POST',url:`${MUNI_BASE_URL}/Results/SubmitByCaseTicket`,
    headers:{'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8','Referer':`${MUNI_BASE_URL}/?sel=1`},data:payload.toString()});
  if (response.status >= 400) throw new Error(`Municourt search HTTP ${response.status}`);
  const pageToken = findVerificationToken(response.responseText);
  const records = parseMuniNameResultsHtml(response.responseText);
  if (!records.length && !/no (?:records|results|cases|matches)|no matching/i.test(htmlDocFromText(response.responseText).body.textContent))
    throw new Error('Municourt returned no readable results; verification may have failed.');
  return records.map((record) => ({record,source:response.finalUrl,token:pageToken}));
}

const CASE_EXCLUSION_LABELS = {
  ct20_disabled:'Court CT20 is disabled in the normal Case.net scraper.',
  transferred_case:'Disposition indicates a transferred or bound-over case.',
  blank_title:'Case header has no usable title.',
  paid_in_full:'Docket indicates paid in full.',
  guilty_zero_balance_nonwarrant:'Guilty disposition, zero balance, and no active warrant (outside City of St. Louis Municipal).'
};

function formatOverrideReasons(entry) {
  const reasons = [...new Set(entry._exclusionReasons || [])].map((key) => CASE_EXCLUSION_LABELS[key] || key);
  return ['Normal-search exclusion reasons:',...(reasons.length ? reasons.map((reason) => `- ${reason}`) : ['- No applicable log-exclusion rule identified.']),
    ...(entry._dataWarnings?.length ? ['Data availability:',...entry._dataWarnings.map((warning) => `- ${warning}`)] : [])].join('\n');
}

function buildOverrideOutput(entries,failures) {
  const summary = [], detail = [];
  for (const raw of entries) {
    const entry = applyMuniDetailFormatting(withPleadAndPayTotal(raw));
    const groups = [{jurisdiction:entry.location,entries:[entry]}];
    const standard = buildJurisdictionSummarySections(groups).sections.join('\n').trim();
    const reasons = formatOverrideReasons(entry);
    summary.push(standard,reasons,'');
    detail.push(formatEntry(entry).trim(),reasons,'');
  }
  if (failures.length) {
    const failed = ['Lookup failures:',...failures.map((failure) => `- ${failure}`)].join('\n');
    summary.push(failed); detail.push(failed);
  }
  return {summary:summary.join('\n\n').trim(),copy:detail.join('\n\n').trim()};
}

async function runCaseNumberOverride() {
  if (caseOverrideRunning || isRun() || loadNameState()?.active) {uiStatus('Stop the current search before starting a case-number search.'); return;}
  let numbers;
  try {numbers = parseOverrideNumbers(caseOverrideDraft.text);} catch (error) {uiStatus(error.message); return;}
  if (!numbers.length) {uiStatus('Enter at least one case number.'); return;}
  const {source,court} = caseOverrideDraft;
  if (source === 'casenet' && /municourt\.net$/i.test(location.hostname || '')) {uiStatus('Open ICBiNCn on Case.net to search Case.net case numbers.'); return;}
  if (source === 'municourt' && !MUNI_CASE_COURTS.some(([code]) => code === court)) {uiStatus('Select a Municourt court.'); return;}
  caseOverrideRunning = true; setStop(false); setRun(true);
  saveNameSearchOutput(null);
  const entries = [], failures = [], seen = new Set();
  try {
    for (const number of numbers) {
      if (isStop()) break;
      uiStatus(`Reading case ${number}…`); render();
      try {
        if (source === 'municourt') {
          const candidates = await searchMuniViaRemoteWorker({caseNumber:number,court});
          if (!candidates.length) failures.push(`${number}: no match in the selected court.`);
          for (const candidate of candidates) {
            const entry = mapMuniRecordToEntry(candidate.record,candidate.source,number);
            if (!candidate.record?.muniCaseDetailText) entry._dataWarnings = ['Full case detail unavailable; some fields could not be checked.'];
            if (!seen.has(entry.caseKey)) {seen.add(entry.caseKey); entries.push(entry);}
          }
        } else {
          const candidates = await findCaseCandidatesByCaseNumber(number);
          if (!candidates.length) failures.push(`${number}: no matching case link returned.`);
          for (const candidate of candidates) {
            if (isStop()) break;
            const entry = await scrapeCaseViaApi(candidate,'',null,{includeExcluded:true});
            if (entry._skipReason === 'backend_jndi_error') {failures.push(`${number}: Case.net backend unavailable.`); continue;}
            if (!seen.has(entry.caseKey)) {seen.add(entry.caseKey); entries.push(entry);}
          }
        }
      } catch (error) {if (!isStop()) failures.push(`${number}: ${error.message || error}`);}
    }
    if (!isStop()) {saveNameSearchOutput(buildOverrideOutput(entries,failures)); uiStatus(`${entries.length} case(s) returned. ${failures.length} lookup failure(s).`);}
    else uiStatus('Stopped.');
  } finally {caseOverrideRunning = false; setRun(false); render();}
}

  function extractCaseLinksFromHtml(htmlText) {const out = [];
                                               const seen = new Set();
                                               const doc = new DOMParser().parseFromString(String(htmlText || ''),'text/html');
                                               const links = [...doc.querySelectorAll('a[href*="caseNumber="],a[href*="inputVO.caseNumber="],a[href*="ci="]')];
                                               for (const a of links) {const parsed = parseCaseFromUrl(a.href || '');
                                                                      if (!parsed?.caseKey) continue;
                                                                      if (seen.has(parsed.caseKey)) continue;
                                                                      seen.add(parsed.caseKey);
                                                                      out.push(parsed);}
                                               return out;}

  async function findCaseCandidatesByCaseNumber(caseNumber) {const url = new URL('/casenet/caseNoSearch.do',location.origin);
                                                            const body = new URLSearchParams();
                                                            body.set('caseNumber',caseNumber);
                                                            body.set('courtType','');
                                                            body.set('countyCode','');
                                                            body.set('cortCode','SW');
                                                            const resp = await stopAwareFetch(url.toString(),{method:'POST',
                                                                                                     credentials:'include',
                                                                                                     headers:{'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8'},
                                                                                                     body: body.toString()});
                                                            const txt = await resp.text();
                                                            if (!resp.ok) throw new Error(`HTTP ${resp.status} for caseNoSearch`);
                                                            const direct = parseCaseFromUrl(resp.url || '');
                                                            return direct?.caseKey ? [direct] : extractCaseLinksFromHtml(txt);}

