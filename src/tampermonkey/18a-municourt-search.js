/************************************************************
   * Municourt supplemental search
   ************************************************************/
  const MUNI_BASE_URL = 'https://www.municourt.net';

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

  function mapMuniRecordToEntry(rec,sourceLabel,caseNumberHint = '') {const caseNo = valueFromAny(rec,['caseNumber','caseNo','caseNum','citationNo','citationNumber','ticketNumber']) || norm(caseNumberHint).toUpperCase() || '- - -';
                                                                       const location = valueFromAny(rec,['courtName','court','municipality','city','location']) || '- - -';
                                                                       const chargeDescription = valueFromAny(rec,['chargeDescription','offenseDescription','offense','violationDescription','charge']) || '- - -';
                                                                       const disposition = valueFromAny(rec,['disposition','caseDisposition','dispositionText']) || '- - -';
                                                                       const caseTitle = valueFromAny(rec,['caseDesc','caseDescription','style','caption','defendantName']) || '- - -';
                                                                       const judge = valueFromAny(rec,['judge','judgeName']) || '- - -';
                                                                       const nextDocketDate = valueFromAny(rec,['nextCourtDate','courtDate','upcomingCourtDate','nextDocketDate']) || '- - -';
                                                                       const warrantRaw = valueFromAny(rec,['warrantStatus','warrantSummary','warrant']);
                                                                       const summaryRaw = valueFromAny(rec,['status','caseStatus']);
                                                                       const summaryStatus = mapMuniStatus(summaryRaw,warrantRaw);
                                                                       const caseUrl = valueFromAny(rec,['caseUrl','url']) || sourceLabel;
                                                                       const entryKeyBase = (caseNo || '- - -').toUpperCase();
                                                                       return {caseKey: `${entryKeyBase}|MUNICOURT`,
                                                                               caseTitle,
                                                                               caseUrl,
                                                                               judge,
                                                                               dateFiled: valueFromAny(rec,['dateFiled','filingDate']) || '- - -',
                                                                               location,
                                                                               caseBalance: valueFromAny(rec,['caseBalance','balance','amountDue']) || '- - -',
                                                                               disposition,
                                                                               address: valueFromAny(rec,['address','defendantAddress']) || '- - -',
                                                                               yob: valueFromAny(rec,['yob','birthYear','yearOfBirth']) || '- - -',
                                                                               yobRaw: valueFromAny(rec,['yob','birthYear','yearOfBirth']) || '- - -',
                                                                               attorney: valueFromAny(rec,['attorney','attorneyName']) || '- - -',
                                                                               warrantSummary: warrantRaw || '- - -',
                                                                               summaryStatus,
                                                                               initialAppearanceDate: valueFromAny(rec,['initialAppearanceDate']) || '',
                                                                               licenseHoldDate: valueFromAny(rec,['licenseHoldDate']) || '',
                                                                               nextDocketDate,
                                                                               ftaDates: ['- - -'],
                                                                               chargeDescription,
                                                                               chargeType: valueFromAny(rec,['chargeType','offenseType']) || '- - -',
                                                                               chargeClass: valueFromAny(rec,['chargeClass','offenseClass']) || '- - -',
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

  async function searchMunicourtEntriesByName(params) {const candidates = await fetchMunicourtCandidates(params || {});
                                                      const entries = [];
                                                      const seen = new Set();
                                                      for (const c of candidates) {const entry = mapMuniRecordToEntry(c.record,c.source || MUNI_BASE_URL,'');
                                                                                 if (!entry.caseKey || seen.has(entry.caseKey)) continue;
                                                                                 seen.add(entry.caseKey);
                                                                                 entries.push(entry);}
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
