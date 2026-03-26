
  /************************************************************
   * Main run
   ************************************************************/
  async function harvestAllResultCaseKeys() {const seen = new Set();
                                            const out = [];
                                            const table = document.querySelector('#nameSearchResult');
                                            const tbody = table?.querySelector('tbody');
                                            const snapshotTbody = () => norm(tbody?.textContent || '');
                                            const waitForTbodyChange = async (beforeSnap,timeoutMs = 8000) => {const t0 = Date.now();
                                                                                                               while (Date.now() - t0 < timeoutMs) {await sleep(150);
                                                                                                                                                    const afterSnap = snapshotTbody();
                                                                                                                                                    if (afterSnap && afterSnap !== beforeSnap) return true;}
                                                                                                               return false;};
                                            const lenSel = document.querySelector('select[name="nameSearchResult_length"]');
                                            if (lenSel && lenSel.value !== '100') {const before = snapshotTbody();
                                                                                   lenSel.value = '100';
                                                                                   lenSel.dispatchEvent(new Event('input',{bubbles:true}));
                                                                                   lenSel.dispatchEvent(new Event('change',{bubbles:true}));
                                                                                   await waitForTbodyChange(before,8000);
                                                                                   await sleep(150);}
                                            const getNextBtn = () => document.querySelector('#nameSearchResult_next,a.paginate_button.next,li.next a');
                                            const nextIsDisabledLocal = (btn) => {if (!btn) return true;
                                                                                  const li = btn.closest('li');
                                                                                  return btn.classList.contains('disabled') || btn.getAttribute('aria-disabled') === 'true' || (li && li.classList.contains('disabled'));};
                                            const harvestThisPage = () => {const anchors = [...document.querySelectorAll('a[href*="caseNumber="],a[href*="inputVO.caseNumber="],a[href*="ci="],a[href*="courtCode="],a[href*="courtId="],a[href*="inputVO.courtId="],a[href*="l="]')];
                                                                           for (const a of anchors) {const p = parseCaseFromUrl(a.href || '');
                                                                                                    if (!p?.caseKey) continue;
                                                                                                    if (seen.has(p.caseKey)) continue;
                                                                                                    seen.add(p.caseKey);
                                                                                                    out.push(p);}};
                                            {const tbodyText = snapshotTbody();
                                             const noData = /no data available/i.test(tbodyText);
                                             dbg('results_page_probe',{noData,sample: tbodyText.slice(0,160)});}
                                            for (let guard = 0;guard < 250;guard++) {harvestThisPage();
                                                                                    const nextBtn = getNextBtn();
                                                                                    if (nextIsDisabledLocal(nextBtn)) break;
                                                                                    const beforeSnap = snapshotTbody();
                                                                                    nextBtn.click();
                                                                                    const changed = await waitForTbodyChange(beforeSnap,8000);
                                                                                    if (!changed) {dbg('pagination_no_redraw',{guard});
                                                                                                   break;}
                                                                                    await sleep(150);}
                                            return out;}


  async function waitForCaseLinksToRender(timeoutMs = 30000) {const t0 = Date.now();
                                                             let lastSnap = '';
                                                             let lastChangeAt = Date.now();
                                                             while (Date.now() - t0 < timeoutMs) {
                                                               const links = document.querySelectorAll('a[href*="caseNumber="],a[href*="inputVO.caseNumber="],a[href*="ci="]');
                                                               if (links.length) return true;
                                                               const tbody = document.querySelector('#nameSearchResult tbody');
                                                               const snap = norm(tbody?.textContent || '');
                                                               if (snap !== lastSnap) {lastSnap = snap;
                                                                                      lastChangeAt = Date.now();}
                                                               const processingEl = document.querySelector('#nameSearchResult_processing');
                                                               const isProcessing = !!(processingEl && getComputedStyle(processingEl).display !== 'none' && processingEl.getAttribute('aria-hidden') !== 'true');
                                                               const hasRows = !!tbody?.querySelector('tr');
                                                               if (hasRows && !isProcessing && Date.now() - lastChangeAt > 2500) break;
                                                               await sleep(250);
                                                             }
                                                             return false;}

  function parseCaseNumbersBatch(caseNumbersText) {const raw = String(caseNumbersText || '');
                                                  const parts = raw.split(/[\n,\t; ]+/g).map((x) => norm(x).toUpperCase()).filter(Boolean);
                                                  return uniq(parts);}

  async function runBatchByCaseNumbers(caseNumbersText) {const caseNumbers = parseCaseNumbersBatch(caseNumbersText);
                                                        if (!caseNumbers.length) {uiStatus('Enter at least one case number.');
                                                                                  return;}
                                                        setStop(false);
                                                        setRun(true);
                                                        try {clearLastHtml();
                                                             saveJson(KEY_NET_STATS,{byPath:{}});
                                                             uiStatus(`Reading ${caseNumbers.length} case number(s)...`);
                                                             render();
                                                             const existing = loadLog();
                                                             const seenCaseNumbers = new Set(existing.map((e) => norm(String(e?.caseKey || '').split('|')[0]).toUpperCase()).filter(Boolean));
                                                             const todo = caseNumbers.map((caseNumber) => ({caseKey: `${caseNumber}|`,caseNumber,courtId:''}))
                                                                                     .filter((item) => !seenCaseNumbers.has(item.caseNumber));
                                                             if (!todo.length) {uiStatus('Already ran these, clear log to run again.');
                                                                               return;}
                                                             uiStatus(`Queue: ${todo.length}. Reading docket entries...`);
                                                             render();
                                                             const unresolved = [];
                                                             const {results,errors} = await runPool(todo,DEFAULT_CONCURRENCY,async (item) => {if (isStop()) return null;
                                                                                                                                                 await sleep(80);
                                                                                                                                                 const out = await scrapeCaseViaApi(item,'');
                                                                                                                                                 if (out && (out._skipReason === 'blank_title' || out._skipReason === 'missing_case_identifiers')) {unresolved.push(item.caseNumber);
                                                                                                                                                                                                                               return null;}
                                                                                                                                                 if (out && out._skipReason === 'paid_in_full') return null;
                                                                                                                                                 return out;});
                                                             const nextLog = loadLog();
                                                             for (const r of results) {if (!r || !r.caseKey) continue;
                                                                                      if (nextLog.some((x) => x.caseKey === r.caseKey)) continue;
                                                                                      nextLog.push(r);}
                                                             saveLog(nextLog);
                                                             const okCount = results.filter(Boolean).length;
                                                             const errCount = (errors || []).length;
                                                             const unresolvedMsg = unresolved.length ? ` Unresolved case numbers: ${unresolved.length}.` : '';
                                                             if (isStop()) uiStatus('Stopped.');
                                                             else uiStatus(`${okCount} cases added from case-number batch.${unresolvedMsg} Errors: ${errCount}.`);
                                                             if (unresolved.length) dbg('case_batch_unresolved',{count:unresolved.length,items:unresolved.slice(0,40)});
                                                             if (errCount) dbg('case_batch_run_errors',{errors: errors.slice(0,12)});}
                                                        catch (e) {dbg('case_batch_fatal',{msg:String(e?.message || e),stack:String(e?.stack || '')});
                                                                   uiStatus('*error*: ' + String(e?.message || e));}
                                                        finally {setRun(false);
                                                                 render();}}

  async function pullJsonFromResultsPage() {if (!isNameSearchResultsPage()) {uiStatus('Landed on non-results page.');
                                                                           render();
                                                                           return;}
                                           const ready = await waitForResultsReady();
                                           if (ready?.noMatches) {uiStatus('No matches found for this search.');
                                                                  render();
                                                                  return;}
                                           if (!ready?.ready) {uiStatus('Results are still loading. Try again in a moment.');
                                                               render();
                                                               return;}
                                           setShowEntriesTo100();
                                           const ns = loadNameState();
                                           const yobExpected = norm(ns?.params?.yob || document.getElementById('moNsYob')?.value || '');
                                           const conc = DEFAULT_CONCURRENCY;
                                           clearLastHtml();
                                           saveJson(KEY_NET_STATS,{byPath:{}});
                                           uiStatus('Harvesting all results pages…');
                                           render();
                                           await sleep(5000);
                                           let cases = await harvestAllResultCaseKeys();
                                           for (let retry = 0;retry < 4 && !cases.length;retry++) {dbg('harvest_empty_retry',{retry: retry + 1});
                                                                                                    uiStatus('Waiting for case links to render…');
                                                                                                    render();
                                                                                                    await waitForResultsReady();
                                                                                                    await waitForCaseLinksToRender(30000);
                                                                                                    await sleep(350);
                                                                                                    setShowEntriesTo100();
                                                                                                    cases = await harvestAllResultCaseKeys();}
                                           dbg('harvest_done',{count: cases.length});
                                           if (!cases.length) {uiStatus('No case links found.');
                                                               render();
                                                               return;}
                                           setStop(false);
                                           setRun(true);
                                           uiStatus('Reading...');
                                           render();
                                           try {dbg('run_start',{count: cases.length,conc,yobExpected});
                                                const existing = loadLog();
                                                const seen = new Set(existing.map((e) => e.caseKey));
                                                const todo = cases.filter((c) => !seen.has(c.caseKey));
                                                if (!todo.length) {uiStatus('Already ran these,clear log to run again');
                                                                   return;}
                                                uiStatus(`Queue: ${todo.length}. Reading...`);
                                                render();
                                                let yobMismatchCount = 0;
                                                const {results,errors} = await runPool(todo,conc,async (item) => {if (isStop()) return null;
                                                                                                                 await sleep(80);
                                                                                                                 const out = await scrapeCaseViaApi(item,yobExpected);
                                                                                                                 if (out && out._skipReason === 'yob_mismatch') {yobMismatchCount += 1;
                                                                                                                                                                 return null;}
                                                                                                                 if (out && out._skipReason === 'paid_in_full') return out;
                                                                                                                 if (out && out._skipReason === 'blank_title') return null;
                                                                                                                 return out;});
                                                const nextLog = loadLog();
                                                for (const r of results) {if (!r || !r.caseKey) continue;
                                                                         if (r._skipReason === 'paid_in_full') {const idx = nextLog.findIndex((x) => x.caseKey === r.caseKey);
                                                                                                               if (idx >= 0) nextLog.splice(idx,1);
                                                                                                               continue;}
                                                                         if (nextLog.some((x) => x.caseKey === r.caseKey)) continue;
                                                                         nextLog.push(r);}
                                                saveLog(nextLog);
                                                const okCount = results.filter(Boolean).length;
                                                const skipCount = results.filter((r) => r && r._skipReason === 'backend_jndi_error').length;
                                                const errCount = (errors || []).length;
                                                if (isStop()) {uiStatus('Stopped.');
                                                               dbg('run_stopped',{okCount,skipCount,errCount});}
                                                else {uiStatus(`${okCount} cases added. YOB mismatches: ${yobMismatchCount}. Errors: ${errors.length}.`);}
                                                if (errCount) dbg('run_errors',{errors: errors.slice(0,12)});}
                                           catch (err) {dbg('fatal_pull',{msg: String(err?.message || err),stack: String(err?.stack || ''),});
                                                       uiStatus('*error*: ' + String(err?.message || err));}
                                           finally {setRun(false);
                                                    render();}}
