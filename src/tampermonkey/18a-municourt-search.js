/************************************************************
   * Municourt supplemental search
   ************************************************************/
  const MUNI_BASE_URL = 'https://www.municourt.net';
  const MUNI_NAME_SEARCH_URL = `${MUNI_BASE_URL}/?sel=0`;
  const MUNI_DIAG_KEY = '__municourt_diag_v1';

  function setMuniDiag(diag = {}) {try {window[MUNI_DIAG_KEY] = {ts: new Date().toISOString(),...diag};}
                                   catch {}}

  function getMuniDiag() {try {return window[MUNI_DIAG_KEY] || null;}
                          catch {return null;}}

  function gmHttpRequestText(details) {return new Promise((resolve,reject) => {if (typeof GM_xmlhttpRequest !== 'function') {reject(new Error('GM_xmlhttpRequest is unavailable'));
                                                                                return;}
                                                                                GM_xmlhttpRequest({method: details.method || 'GET',
                                                                                                   url: details.url,
                                                                                                   headers: details.headers || {},
                                                                                                   data: details.data || undefined,
                                                                                                   timeout: Number(details.timeout || 20000),
                                                                                                   onload: (resp) => {resolve({status: Number(resp?.status || 0),
                                                                                                                               responseText: String(resp?.responseText || ''),
                                                                                                                               finalUrl: String(resp?.finalUrl || details.url),
                                                                                                                               responseHeaders: String(resp?.responseHeaders || ''),});},
                                                                                                   ontimeout: () => reject(new Error(`Timeout for ${details.url}`)),
                                                                                                   onerror: (err) => reject(new Error(String(err?.error || err?.message || `Request failed for ${details.url}`))),});});}

  function tryParseJsonText(txt) {try {return JSON.parse(String(txt || ''));}
                                  catch {return null;}}

  function valueFromAny(obj,keys) {for (const k of keys) {const v = obj?.[k];
                                                          if (v === undefined || v === null) continue;
                                                          const s = norm(String(v));
                                                          if (s) return s;}
                                 return '';}

  function mapMuniStatus(rawStatus,rawWarrant) {const blob = `${norm(rawStatus)} ${norm(rawWarrant)}`.toLowerCase();
                                                if (!blob) return 'nonwarrant';
                                                if (/hold/.test(blob)) return 'nonwarrant and HOLD placed on license';
                                                if (/warrant|capias|failure to appear/.test(blob) && !/recalled|served|withdrawn|canceled|cancelled/.test(blob)) return 'warrant';
                                                return 'nonwarrant';}

  function htmlDocFromText(txt) {return new DOMParser().parseFromString(String(txt || ''),'text/html');}

  function findVerificationToken(docOrText) {const doc = typeof docOrText === 'string' ? htmlDocFromText(docOrText) : docOrText;
                                            const input = doc?.querySelector('input[name="__RequestVerificationToken"]');
                                            return norm(input?.value || input?.getAttribute('value') || '');}

  function findRecaptchaResponse(docOrText) {const doc = typeof docOrText === 'string' ? htmlDocFromText(docOrText) : docOrText;
                                            const input = doc?.querySelector('textarea[name="g-recaptcha-response"],input[name="g-recaptcha-response"]');
                                            return norm(input?.value || input?.textContent || input?.getAttribute('value') || '');}

  function middleVariants(rawMiddle) {const mid = norm(rawMiddle || '');
                                      const out = [];
                                      const push = (v) => {const n = norm(v || '');
                                                           if (!out.includes(n)) out.push(n);};
                                      push(mid);
                                      if (mid) push(mid.charAt(0));
                                      push('');
                                      return out;}

  function parseMuniNameResultsHtml(htmlText) {const doc = htmlDocFromText(htmlText);
                                               const out = [];
                                               const tables = [...doc.querySelectorAll('table')];
                                               for (const table of tables) {const headerCells = [...table.querySelectorAll('thead th')];
                                                                            const headers = headerCells.map((th) => norm(th.textContent || '').toLowerCase()).filter(Boolean);
                                                                            const rows = [...table.querySelectorAll('tbody tr, tr')];
                                                                            for (const row of rows) {const tds = [...row.querySelectorAll('td')];
                                                                                                    if (!tds.length) continue;
                                                                                                    const buttonInput = row.querySelector('input[name="button"][value],button[name="button"][value]');
                                                                                                    const button = norm(buttonInput?.value || buttonInput?.getAttribute('value') || '');
                                                                                                    if (!button || !/^fcv/i.test(button)) continue;
                                                                                                    const cells = tds.map((td) => norm(td.textContent || ''));
                                                                                                    const rec = {button};
                                                                                                    if (headers.length) {for (let i = 0;i < headers.length;i++) rec[headers[i].replace(/[^a-z0-9]+/g,'_')] = cells[i] || '';
                                                                                                                       rec.resultRowText = cells.join('   ');}
                                                                                                    else {rec.resultRowText = cells.join('   ');
                                                                                                          rec.defendantName = cells[0] || '';
                                                                                                          rec.ticketNumber = cells[1] || '';
                                                                                                          rec.courtName = cells[2] || '';
                                                                                                          rec.chargeDescription = cells[3] || '';
                                                                                                          rec.status = cells[cells.length - 1] || '';}
                                                                                                    out.push(rec);}}
                                               return out;}

  function parseMuniFullCaseHtmlToCopyText(htmlText) {const doc = htmlDocFromText(htmlText);
                                                     const lines = [];
                                                     const container = doc.querySelector('#mcn-centercontent .container.body-content > div') || doc.body;
                                                     for (const row of [...container.querySelectorAll('.divrow')]) {const spans = [...row.querySelectorAll('span')].map((s) => norm(s.textContent || '')).filter(Boolean);
                                                                                                                     if (!spans.length) continue;
                                                                                                                     const parts = [];
                                                                                                                     for (let i = 0;i < spans.length;i++) {const token = spans[i];
                                                                                                                                                            if (/:$/.test(token) && i + 1 < spans.length) {parts.push(`${token} ${spans[i + 1]}`);
                                                                                                                                                                                                            i += 1;
                                                                                                                                                                                                            continue;}
                                                                                                                                                            parts.push(token);}
                                                                                                                     lines.push(parts.join('   ').trim());}
                                                     for (const tr of [...container.querySelectorAll('table tr')]) {const tds = [...tr.querySelectorAll('td')].map((td) => norm(td.textContent || '')).filter(Boolean);
                                                                                                                    if (!tds.length) continue;
                                                                                                                    if (tds.length === 1) lines.push(tds[0]);
                                                                                                                    else lines.push(`${tds[0]} ${tds.slice(1).join(' ')}`.trim());}
                                                     return lines.join('\n').replace(/\n{3,}/g,'\n\n').trim();}

  async function searchMuniViaSubmitByName(params) {const first = norm(params?.first || '');
                                                   const last = norm(params?.last || '');
                                                   const yob = norm(params?.yob || '');
                                                   if (!first || !last || !yob) return [];
                                                   const homeResp = await gmHttpRequestText({method: 'GET',url: MUNI_NAME_SEARCH_URL});
                                                   const homeDoc = htmlDocFromText(homeResp.responseText);
                                                   const token = findVerificationToken(homeDoc);
                                                   const recaptchaResponse = findRecaptchaResponse(homeDoc);
                                                   if (!token) throw new Error('Municourt verification token not found');
                                                   if (!recaptchaResponse) {dbg('municourt_recaptcha_missing',{url: MUNI_NAME_SEARCH_URL});
                                                                            setMuniDiag({phase:'blocked_recaptcha_missing',
                                                                                         first,
                                                                                         middleInput: norm(params?.middle || ''),
                                                                                         last,
                                                                                         yob,
                                                                                         hadRecaptcha: false,
                                                                                         reason: 'SubmitByName requires g-recaptcha-response'});
                                                                            return [];}

                                                   const records = [];
                                                   const seen = new Set();
                                                   let rollingToken = token;
                                                   const attemptedMiddles = [];
                                                   for (const middle of middleVariants(params?.middle || '')) {attemptedMiddles.push(middle || '(blank)');
                                                                                                               const payload = new URLSearchParams();
                                                                                                               payload.set('__RequestVerificationToken',rollingToken);
                                                                                                               payload.set('SelectedSearchType','0');
                                                                                                               payload.set('LastName',last);
                                                                                                               payload.set('FirstName',first);
                                                                                                               payload.set('MiddleName',middle);
                                                                                                               payload.set('DobYear',yob);
                                                                                                               payload.set('AgcyId','');
                                                                                                               if (recaptchaResponse) payload.set('g-recaptcha-response',recaptchaResponse);
                                                                                                               const resp = await gmHttpRequestText({method: 'POST',
                                                                                                                                                     url: `${MUNI_BASE_URL}/Results/SubmitByName`,
                                                                                                                                                     headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                                                                                                                                                               'Origin': MUNI_BASE_URL,
                                                                                                                                                               'Referer': MUNI_NAME_SEARCH_URL},
                                                                                                                                                     data: payload.toString()});
                                                                                                               if (resp.status >= 400) continue;
                                                                                                               const pageToken = findVerificationToken(resp.responseText) || rollingToken;
                                                                                                               rollingToken = pageToken || rollingToken;
                                                                                                               for (const rec of parseMuniNameResultsHtml(resp.responseText)) {const key = `${rec.button}|${rec.resultRowText || ''}`;
                                                                                                                                                                                if (seen.has(key)) continue;
                                                                                                                                                                                seen.add(key);
                                                                                                                                                                                records.push({record: rec,source: resp.finalUrl || `${MUNI_BASE_URL}/Results/SubmitByName`,token: pageToken});}}
                                                   setMuniDiag({phase:'submit_by_name',
                                                                first,
                                                                middleInput: norm(params?.middle || ''),
                                                                last,
                                                                yob,
                                                                attemptedMiddles,
                                                                candidateCount: records.length,
                                                                hadRecaptcha: !!recaptchaResponse});
                                                   return records;}

  async function attachMuniFullCaseDetails(items) {const out = [];
                                                  for (const item of items || []) {const rec = item?.record || {};
                                                                                  const button = norm(rec?.button || '');
                                                                                  const token = norm(item?.token || '');
                                                                                  if (!button || !token) {out.push(item);
                                                                                                           continue;}
                                                                                  try {const payload = new URLSearchParams();
                                                                                       payload.set('__RequestVerificationToken',token);
                                                                                       payload.set('button',button);
                                                                                       const resp = await gmHttpRequestText({method: 'POST',
                                                                                                                             url: `${MUNI_BASE_URL}/Results/FullCaseView`,
                                                                                                                             headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                                                                                                                                       'Referer': `${MUNI_BASE_URL}/Results/SubmitByName`},
                                                                                                                             data: payload.toString()});
                                                                                       rec.muniCaseDetailText = parseMuniFullCaseHtmlToCopyText(resp.responseText);
                                                                                       rec.caseUrl = resp.finalUrl || `${MUNI_BASE_URL}/Results/FullCaseView`;
                                                                                       out.push({...item,record: rec});}
                                                                                  catch (e) {dbg('municourt_full_case_error',{button,msg: String(e?.message || e)});
                                                                                              out.push(item);}}
                                                  return out;}

  function mapMuniRecordToEntry(rec,sourceLabel,caseNumberHint = '') {const caseNo = valueFromAny(rec,['ticketNumber','ticket_','caseNumber','case_','caseNo','caseNum','citationNo','citationNumber']) || norm(caseNumberHint).toUpperCase() || '- - -';
                                                                       const location = valueFromAny(rec,['courtName','court_name','court','municipality','city','location']) || '- - -';
                                                                       const chargeDescription = valueFromAny(rec,['chargeDescription','charge_description','offenseDescription','offense','violationDescription','charge']) || '- - -';
                                                                       const disposition = valueFromAny(rec,['disposition','caseDisposition','dispositionText']) || '- - -';
                                                                       const caseTitle = valueFromAny(rec,['defendantName','defendant','caseDesc','caseDescription','style','caption']) || '- - -';
                                                                       const judge = valueFromAny(rec,['judge','judgeName']) || '- - -';
                                                                       const nextDocketDate = valueFromAny(rec,['current_court_date','nextCourtDate','courtDate','upcomingCourtDate','nextDocketDate']) || '- - -';
                                                                       const warrantRaw = valueFromAny(rec,['warrantStatus','warrantSummary','warrant']);
                                                                       const summaryRaw = valueFromAny(rec,['status','caseStatus']);
                                                                       const summaryStatus = mapMuniStatus(summaryRaw,warrantRaw);
                                                                       const caseUrl = valueFromAny(rec,['caseUrl','url']) || sourceLabel;
                                                                       const entryKeyBase = (caseNo || '- - -').toUpperCase();
                                                                       const summaryRow = norm(rec?.resultRowText || `${caseTitle}   ${caseNo}   ${location}   ${chargeDescription}   ${summaryRaw || summaryStatus}`);
                                                                       return {caseKey: `${entryKeyBase}|MUNICOURT`,
                                                                               caseTitle,
                                                                               caseUrl,
                                                                               judge,
                                                                               dateFiled: valueFromAny(rec,['case_filed_date','dateFiled','filingDate']) || '- - -',
                                                                               location,
                                                                               caseBalance: valueFromAny(rec,['caseBalance','balance','amountDue']) || '- - -',
                                                                               disposition,
                                                                               address: valueFromAny(rec,['address','defendantAddress']) || '- - -',
                                                                               yob: valueFromAny(rec,['birth_year','yob','birthYear','yearOfBirth']) || '- - -',
                                                                               yobRaw: valueFromAny(rec,['birth_year','yob','birthYear','yearOfBirth']) || '- - -',
                                                                               attorney: valueFromAny(rec,['attorney','attorneyName']) || '- - -',
                                                                               warrantSummary: warrantRaw || summaryRaw || '- - -',
                                                                               summaryStatus,
                                                                               initialAppearanceDate: valueFromAny(rec,['initialAppearanceDate']) || '',
                                                                               licenseHoldDate: valueFromAny(rec,['licenseHoldDate']) || '',
                                                                               nextDocketDate,
                                                                               ftaDates: ['- - -'],
                                                                               chargeDescription,
                                                                               chargeType: valueFromAny(rec,['chargeType','offenseType']) || '- - -',
                                                                               chargeClass: valueFromAny(rec,['chargeClass','offenseClass']) || '- - -',
                                                                               muniSummaryRow: summaryRow,
                                                                               muniCaseDetailText: norm(rec?.muniCaseDetailText || ''),
                                                                               _source: 'municourt',};}

  function flattenLikelyCaseRecords(node) {const out = [];
                                           const visit = (value) => {if (!value) return;
                                                                     if (Array.isArray(value)) {for (const item of value) visit(item);
                                                                                                return;}
                                                                     if (typeof value !== 'object') return;
                                                                     const keys = Object.keys(value);
                                                                     const joined = keys.join(' ').toLowerCase();
                                                                     if (/case|citation|ticket|offense|charge|court/.test(joined)) out.push(value);
                                                                     for (const k of keys) visit(value[k]);};
                                           visit(node);
                                           return out;}

  function parseMuniHtmlRecords(htmlText) {const doc = new DOMParser().parseFromString(String(htmlText || ''),'text/html');
                                           const out = [];
                                           const tables = [...doc.querySelectorAll('table')];
                                           for (const table of tables) {const headers = [...table.querySelectorAll('th')].map((th) => norm(th.textContent).toLowerCase());
                                                                        if (!headers.length) continue;
                                                                        if (!headers.some((h) => /case|citation|ticket|court|charge|offense/.test(h))) continue;
                                                                        const rows = [...table.querySelectorAll('tbody tr')];
                                                                        for (const row of rows) {const cells = [...row.querySelectorAll('td')].map((td) => norm(td.textContent));
                                                                                                if (!cells.length) continue;
                                                                                                const rec = {};
                                                                                                for (let i = 0;i < headers.length;i++) rec[headers[i].replace(/[^a-z0-9]+/g,'_')] = cells[i] || '';
                                                                                                const link = row.querySelector('a[href]');
                                                                                                if (link) rec.url = new URL(link.getAttribute('href'),MUNI_BASE_URL).toString();
                                                                                                out.push(rec);}}
                                           return out;}

  async function fetchMunicourtCandidates(queryObj) {const query = Object.fromEntries(Object.entries(queryObj || {}).filter(([,v]) => norm(v)));
                                                     if (!Object.keys(query).length) return [];
                                                     const endpoints = ['/','/Search','/CaseSearch','/CaseSearch/Search','/CaseSearch/Results'];
                                                     const paramSets = [{lastName: query.last || '',firstName: query.first || '',middleName: query.middle || '',birthYear: query.yob || '',caseNumber: query.caseNumber || ''},
                                                                        {last: query.last || '',first: query.first || '',middle: query.middle || '',yob: query.yob || '',citation: query.caseNumber || ''},
                                                                        {lname: query.last || '',fname: query.first || '',mname: query.middle || '',byear: query.yob || '',case: query.caseNumber || ''}];
                                                     const records = [];
                                                     const seenSig = new Set();
                                                     for (const ep of endpoints) {for (const params of paramSets) {const sp = new URLSearchParams();
                                                                                                                        for (const [k,v] of Object.entries(params)) if (norm(v)) sp.set(k,v);
                                                                                                                        if (!sp.toString()) continue;
                                                                                                                        const url = `${MUNI_BASE_URL}${ep}?${sp.toString()}`;
                                                                                                                        try {const resp = await gmHttpRequestText({method:'GET',url});
                                                                                                                             if (resp.status >= 400) continue;
                                                                                                                             const json = tryParseJsonText(resp.responseText);
                                                                                                                             if (json) {for (const rec of flattenLikelyCaseRecords(json)) {const sig = JSON.stringify(rec);
                                                                                                                                                                                if (seenSig.has(sig)) continue;
                                                                                                                                                                                seenSig.add(sig);
                                                                                                                                                                                records.push({record: rec,source: resp.finalUrl || url});}
                                                                                                                                      continue;}
                                                                                                                             for (const rec of parseMuniHtmlRecords(resp.responseText)) {const sig = JSON.stringify(rec);
                                                                                                                                                                                         if (seenSig.has(sig)) continue;
                                                                                                                                                                                         seenSig.add(sig);
                                                                                                                                                                                         records.push({record: rec,source: resp.finalUrl || url});}}
                                                                                                                        catch (e) {dbg('municourt_query_failed',{url,msg:String(e?.message || e)});}}}
                                                     return records;}

  async function searchMunicourtEntriesByName(params) {setMuniDiag({phase:'start',params: {...params}});
                                                      let candidates = [];
                                                      try {candidates = await searchMuniViaSubmitByName(params || {});
                                                           candidates = await attachMuniFullCaseDetails(candidates);}
                                                      catch (e) {dbg('municourt_submit_by_name_failed',{msg:String(e?.message || e)});}
                                                      if (!candidates.length) candidates = await fetchMunicourtCandidates(params || {});
                                                      const entries = [];
                                                      const seen = new Set();
                                                      for (const c of candidates) {const entry = mapMuniRecordToEntry(c.record,c.source || MUNI_BASE_URL,'');
                                                                                 if (!entry.caseKey || seen.has(entry.caseKey)) continue;
                                                                                 seen.add(entry.caseKey);
                                                                                 entries.push(entry);}
                                                      setMuniDiag({phase:'done',
                                                                   params: {...params},
                                                                   candidateCount: candidates.length,
                                                                   entryCount: entries.length,
                                                                   sampleCaseKeys: entries.slice(0,5).map((e) => e.caseKey)});
                                                      return entries;}

  async function searchMunicourtEntriesByCaseNumbers(batch) {const entries = [];
                                                            const seen = new Set();
                                                            for (const item of batch || []) {const caseNumber = norm(item?.caseNumber || '').toUpperCase();
                                                                                            if (!caseNumber) continue;
                                                                                            const candidates = await fetchMunicourtCandidates({caseNumber});
                                                                                            for (const c of candidates) {const entry = mapMuniRecordToEntry(c.record,c.source || MUNI_BASE_URL,caseNumber);
                                                                                                                       if (!entry.caseKey || seen.has(entry.caseKey)) continue;
                                                                                                                       seen.add(entry.caseKey);
                                                                                                                       entries.push(entry);}}
                                                            return entries;}
