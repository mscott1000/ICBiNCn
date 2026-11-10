// Deferred source: excluded from the Tampermonkey build. See docs/deferred-features.md.
function parseCaseNumbersBatch(caseNumbersText) {const raw = String(caseNumbersText || '');
                                                  const lines = raw.split(/\r?\n/);
                                                  const out = [];
                                                  const seen = new Set();
                                                  const pushEntry = (caseNumber,courtId,rawText) => {const cn = norm(caseNumber || '').toUpperCase();
                                                                                                    const ct = norm(courtId || '').toUpperCase();
                                                                                                    if (!cn) return;
                                                                                                    const key = ct ? `${cn}|${ct}` : cn;
                                                                                                    if (seen.has(key)) return;
                                                                                                    seen.add(key);
                                                                                                    out.push({raw: String(rawText || '').trim(),caseNumber: cn,courtId: ct || ''});};
                                                  for (const line of lines) {const s = norm(line || '');
                                                                             if (!s) continue;
                                                                             const pairMatch = s.match(/^([A-Z0-9-]+)\s*(?:[|,/]|-\s*COURT\s*ID\s*:?|\s+COURT\s*ID\s*:?)\s*([A-Z0-9]+)$/i);
                                                                             if (pairMatch) {pushEntry(pairMatch[1],pairMatch[2],s);
                                                                                             continue;}
                                                                             const looseParts = s.split(/[\t,; ]+/g).map((p) => norm(p).toUpperCase()).filter(Boolean);
                                                                             if (looseParts.length >= 2 &&
                                                                                 /[A-Z]/.test(looseParts[0]) &&
                                                                                 /^[A-Z0-9]{1,8}$/.test(looseParts[1]) &&
                                                                                 !/[A-Z]/.test(looseParts[1])) {pushEntry(looseParts[0],looseParts[1],s);
                                                                                                                 continue;}
                                                                             for (const token of looseParts) pushEntry(token,'',token);}
                                                  return out;}

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
                                                            body.set('inputVO.caseNumber',caseNumber);
                                                            body.set('newSearch','Y');
                                                            const resp = await stopAwareFetch(url.toString(),{method:'POST',
                                                                                                     credentials:'include',
                                                                                                     headers:{'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8'},
                                                                                                     body: body.toString()});
                                                            const txt = await resp.text();
                                                            if (!resp.ok) throw new Error(`HTTP ${resp.status} for caseNoSearch`);
                                                            return extractCaseLinksFromHtml(txt);}

async function runBatchByCaseNumbers(caseNumbersText) {const requested = parseCaseNumbersBatch(caseNumbersText);
                                                        if (!requested.length) {uiStatus('Enter at least one case number.');
                                                                                  return;}
                                                        setStop(false);
                                                        setRun(true);
                                                        try {clearLastHtml();
                                                             saveJson(KEY_NET_STATS,{byPath:{}});
                                                             uiStatus(`Resolving ${requested.length} case number(s)...`);
                                                             render();
                                                             const existing = loadLog();
                                                             const seenCaseKeys = new Set(existing.map((e) => e.caseKey));
                                                             const resolved = [];
                                                             const unresolved = [];
                                                             for (const item of requested) {if (isStop()) break;
                                                                                            const caseNumber = item.caseNumber;
                                                                                            try {if (item.courtId) {const caseKey = `${caseNumber}|${item.courtId}`;
                                                                                                                    if (!seenCaseKeys.has(caseKey)) resolved.push({caseKey,caseNumber,courtId:item.courtId,url:''});
                                                                                                                    continue;}
                                                                                                 const candidates = await findCaseCandidatesByCaseNumber(caseNumber);
                                                                                                 if (!candidates.length) {const directKey = caseNumber.toUpperCase();
                                                                                                                         if (!seenCaseKeys.has(directKey)) resolved.push({caseKey: directKey,caseNumber,courtId:'',url:''});
                                                                                                                         dbg('case_batch_resolve_direct',{caseNumber,reason:'no_candidates'});
                                                                                                                         continue;}
                                                                                                 const uniqueByKey = [];
                                                                                                 const seenKeys = new Set();
                                                                                                 for (const c of candidates) {if (!c?.caseKey) continue;
                                                                                                                            if (seenKeys.has(c.caseKey)) continue;
                                                                                                                            seenKeys.add(c.caseKey);
                                                                                                                            uniqueByKey.push(c);}
                                                                                                 if (uniqueByKey.length > 1) {const directKey = caseNumber.toUpperCase();
                                                                                                                               if (!seenCaseKeys.has(directKey)) resolved.push({caseKey: directKey,caseNumber,courtId:'',url:''});
                                                                                                                               dbg('case_batch_resolve_direct',{caseNumber,reason:'ambiguous',count:uniqueByKey.length,courtIds: uniqueByKey.map((c) => c.courtId).slice(0,12)});
                                                                                                                               continue;}
                                                                                                 const choice = uniqueByKey[0];
                                                                                                 if (!choice?.caseKey) {unresolved.push(caseNumber);
                                                                                                                        dbg('case_batch_resolve_bad_choice',{caseNumber,count:candidates.length});
                                                                                                                        continue;}
                                                                                                 if (!seenCaseKeys.has(choice.caseKey)) resolved.push(choice);}
                                                                                            catch (e) {unresolved.push(caseNumber);
                                                                                                       dbg('case_batch_resolve_error',{caseNumber,msg:String(e?.message || e)});}}
                                                             if (isStop()) {uiStatus('Stopped.');
                                                                            return;}
                                                             if (!resolved.length) {uiStatus(`No case links found. Unresolved: ${unresolved.length}.`);
                                                                                   return;}
                                                             uiStatus(`Resolved ${resolved.length}. Reading docket entries...`);
                                                             render();
                                                             const {results,errors} = await runPool(resolved,DEFAULT_CONCURRENCY,async (item) => {if (isStop()) return null;
                                                                                                                                                 await sleep(80);
                                                                                                                                                 const out = await scrapeCaseViaApi(item,'');
                                                                                                                                                 if (out && (out._skipReason === 'blank_title' || out._skipReason === 'paid_in_full' || out._skipReason === 'guilty_zero_balance_nonwarrant' || out._skipReason === 'transferred_case')) return null;
                                                                                                                                                 return out;});
                                                             if (isStop()) {uiStatus('Stopped.'); return;}
                                                             const nextLog = loadLog();
                                                             for (const r of results) {if (!r || !r.caseKey) continue;
                                                                                      if (nextLog.some((x) => x.caseKey === r.caseKey)) continue;
                                                                                      nextLog.push(withPleadAndPayTotal(r));}
                                                             saveLog(nextLog);
                                                             let muniAdded = 0;
                                                             if (isStop()) {uiStatus('Stopped.'); return;}
                                                             try {uiStatus(`Resolved ${resolved.length}. Reading Municourt supplement...`);
                                                                  render();
                                                                  const muniEntries = await searchMunicourtEntriesByCaseNumbers(requested);
                                                                  if (isStop()) {uiStatus('Stopped.'); return;}
                                                                  for (const m of muniEntries) {if (!m?.caseKey) continue;
                                                                                              if (nextLog.some((x) => x.caseKey === m.caseKey)) continue;
                                                                                              nextLog.push(withPleadAndPayTotal(m));
                                                                                              muniAdded += 1;}
                                                                  saveLog(nextLog);
                                                                  if (muniAdded) dbg('municourt_case_batch_added',{count: muniAdded});}
                                                             catch (e) {dbg('municourt_case_batch_error',{msg:String(e?.message || e)});}
                                                             const okCount = results.filter(Boolean).length;
                                                             const errCount = (errors || []).length;
                                                             const unresolvedMsg = unresolved.length ? ` Unresolved case numbers: ${unresolved.length}.` : '';
                                                             if (isStop()) uiStatus('Stopped.');
                                                             else uiStatus(`${okCount} Case.net cases + ${muniAdded} Municourt cases added from case-number batch.${unresolvedMsg} Errors: ${errCount}.`);
                                                             if (unresolved.length) dbg('case_batch_unresolved',{count:unresolved.length,items:unresolved.slice(0,40)});
                                                             if (errCount) dbg('case_batch_run_errors',{errors: errors.slice(0,12)});}
                                                        catch (e) {if (isStop()) uiStatus('Stopped.');
                                                                   else {dbg('case_batch_fatal',{msg:String(e?.message || e),stack:String(e?.stack || '')});
                                                                         uiStatus('*error*: ' + String(e?.message || e));}}
                                                        finally {setRun(false);
                                                                 render();}}

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

const KEY_CASE_BATCH_DRAFT = 'mo_casenet_case_batch_draft_v1';

function loadCaseBatchDraft() {return loadJson(KEY_CASE_BATCH_DRAFT,{caseNumbersText:''});}

function saveCaseBatchDraft(d) {saveJson(KEY_CASE_BATCH_DRAFT,d || {caseNumbersText:''});}
