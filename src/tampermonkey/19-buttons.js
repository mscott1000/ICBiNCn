/************************************************************
   * Buttons
   ************************************************************/
  function buildNameSearchPasses(params) {const caseTypePasses = ['criminal','traffic'];
                                   const middleRaw = norm(params?.middle || '');
                                   return caseTypePasses.map((caseType) => ({caseType,
                                                                            middle: middleRaw,
                                                                            label: middleRaw ? `${caseType} / ${middleRaw}` : `${caseType} / all middle names`}));}

  dock.addEventListener('click',async (e) => {const id = e?.target?.id;
                                             if (id === 'moJsonNameSearch') {const params = {first: norm(document.getElementById('moNsFirst')?.value || ''),
                                                                                           middle: norm(document.getElementById('moNsMiddle')?.value || ''),
                                                                                           last: norm(document.getElementById('moNsLast')?.value || ''),
                                                                                           yob: norm(document.getElementById('moNsYob')?.value || ''),};
                                                                            setStop(false);
                                                                            setRun(false);
                                                                            saveDraft({...params});
                                                                            const passes = buildNameSearchPasses(params);
                                                                            saveNameState({active:true,passIndex:0,passes,step:'go_search',params,casenetAddedTotal:0,});
                                                                            uiStatus('Searching…');
                                                                            dbg('namesearch_start',{params});
                                                                            if (!isNameSearchPage()) {location.href = canonicalNameSearchUrl();}
                                                                            else {try {await nameSearchTick();} catch {}}
                                                                            render();
                                                                            return;}
                                             if (id === 'moJsonClearEntries') {clearDraft();
                                                                              const ns = loadNameState();
                                                                              if (ns?.active) {ns.params = {first:'',middle:'',last:'',yob:''};
                                                                                               saveNameState(ns);}
                                                                              render();
                                                                              uiStatus('Entries Cleared');
                                                                              dbg('entries_cleared',{});
                                                                              return;}
                                             if (id === 'moJsonStop') {setStop(true);
                                                                      setRun(false);
                                                                      uiStatus('Stopped.');
                                                                      dbg('stop_clicked',{});
                                                                      render();
                                                                      return;}
                                             if (id === 'moJsonCopy') {const out = buildGroupedCopyText();
                                                                      GM_setClipboard(out || '','text');
                                                                      uiStatus('Copied to Clipboard');
                                                                      render();
                                                                      return;}
                                             if (id === 'moJsonSummary') {const out = buildSummaryCopyText();
                                                                         GM_setClipboard(out || '','text');
                                                                         uiStatus('Summary copied to clipboard');
                                                                         render();
                                                                         return;}
                                             if (id === 'moJsonClear') {saveLog([]);
                                                                       saveDebug([]);
                                                                       clearLastHtml();
                                                                       saveJson(KEY_NET_STATS,{byPath:{}});
                                                                       setStop(true);
                                                                       setRun(false);
                                                                       clearNameState();
                                                                       uiStatus('Log Cleared');
                                                                       dbg('log_cleared',{});
                                                                       render();
                                                                       return;}
                                             if (id === 'moJsonCopyDebug') {const rows = loadDebug();
                                                                           const out = rows.map((r) => JSON.stringify(r)).join('\n');
                                                                           GM_setClipboard(out || '(no debug rows)','text');
                                                                           uiStatus('Debug Copied');
                                                                           render();
                                                                           return;}
                                             if (id === 'moJsonCopyCebug') {const rows = loadDebug();
                                                                           const diag = typeof getMuniDiag === 'function' ? (getMuniDiag() || null) : null;
                                                                           const ns = loadNameState();
                                                                           const cebug = {generatedAt: new Date().toISOString(),
                                                                                          currentUrl: location.href,
                                                                                          status: getStatus(),
                                                                                          nameSearchState: ns,
                                                                                          municourtDiag: diag,
                                                                                          debugTail: rows.slice(-80),};
                                                                           GM_setClipboard(JSON.stringify(cebug,null,2),'text');
                                                                           uiStatus('Cebug Copied');
                                                                           render();
                                                                           return;}
                                             if (id === 'moJsonClearDebug') {saveDebug([]);
                                                                            clearLastHtml();
                                                                            uiStatus('Debug Cleared');
                                                                            render();
                                                                            return;}
                                             if (id === 'moJsonCloseX') {minimizeDock();
                                                                        return;}
                                             if (id === 'moJsonHelpBtn') {openHelpPanel();
                                                                          return;}
                                             if (id === 'moJsonTextBuilderBtn') {openTextBuilderPanel();
                                                                                 return;}
                                             if (id === 'moJsonHelpClose') {closeHelpPanel();
                                                                            return;}
                                             if (SHOW_TRACK_THIS_CASE_UI && id === 'moTrackClearEntries') {clearTrackDraft();
                                                                              clearTrackState();
                                                                              setStop(true);
                                                                              setRun(false);
                                                                              render();
                                                                              uiStatus('Track This Case entries cleared');
                                                                              dbg('track_entries_cleared',{});
                                                                              return;}
                                             if (SHOW_TRACK_THIS_CASE_UI && id === 'moTrackSignup') {const caseNumber = norm(document.getElementById('moTrackCaseNo')?.value || '').toUpperCase();
                                                                          const email = norm(document.getElementById('moTrackEmail')?.value || '');
                                                                          if (!caseNumber) {uiStatus('Enter a case number to track.');
                                                                                            return;}
                                                                          if (!email) {uiStatus('Enter an email address for Track This Case.');
                                                                                      return;}
                                                                          setStop(false);
                                                                          setRun(false);
                                                                          saveTrackDraft({caseNumber,email});
                                                                          saveTrackState({active:true,caseNumber,email,step:'go_case_search',startedAt:Date.now(),popupOpened:false,awaitingPopupClaim:false,ownerTabId:TAB_ID,done:false,error:''});
                                                                          uiStatus(`Track This Case: starting sign-up for ${caseNumber}...`);
                                                                          dbg('track_start_single',{caseNumber,email});
                                                                          location.href = new URL('/casenet/caseNoSearch.do',location.origin).toString();
                                                                          render();
                                                                          return;}
                                             if (id === 'moJsonOpenLastHtml') {openLastHtmlInNewTab();
                                                                              return;}});

  dock.addEventListener('input',(e) => {const id = e?.target?.id || '';
                                     if (['moNsFirst','moNsMiddle','moNsLast','moNsYob'].includes(id)) {const cur = loadDraft();
                                                                                                       const now = readUiParams();
                                                                                                       saveDraft({...cur,...now});
                                                                                                       return;}
                                     if (SHOW_TRACK_THIS_CASE_UI && (id === 'moTrackCaseNo' || id === 'moTrackEmail')) {const draft = loadTrackDraft();
                                                                                         saveTrackDraft({...draft,
                                                                                                         caseNumber: norm(document.getElementById('moTrackCaseNo')?.value || '').toUpperCase(),
                                                                                                         email: norm(document.getElementById('moTrackEmail')?.value || '')});
                                                                                         return;}
                                     });


  async function nameSearchTick() {if (/municourt\.net$/i.test(location.hostname || '')) return;
                                 const st = loadNameState();
                                 if (!st?.active) return;
                                 if (st.navPendingUntil && Date.now() < Number(st.navPendingUntil)) return;
                                 if (isRun()) return;
                                 if (isStop()) return;
                                 const pass = (st.passes || [])[st.passIndex || 0];
                                 const passKey = typeof pass === 'string' ? pass : pass?.caseType;
                                 const passMiddle = typeof pass === 'string' ? (st.params?.middle || '') : (pass?.middle || '');
                                 const passLabel = typeof pass === 'string' ? passKey : (pass?.label || passKey);
                                 if (!passKey) {uiStatus('Preparing pass 3/3 (Municourt)');
                                                render();
                                                if (Number(st.prepareStartedAt || 0) === 0) {st.prepareStartedAt = Date.now();
                                                                                             saveNameState(st);
                                                                                             return;}
                                                const muniPrepAge = Date.now() - Number(st.prepareStartedAt || 0);
                                                if (muniPrepAge < 3000) return;
                                                st.prepareStartedAt = 0;
                                                saveNameState(st);
                                                if (st.step === 'municourt_finalizing') {const age = Date.now() - Number(st.finalizingStartedAt || 0);
                                                                                          if (age < 120000) return;
                                                                                          dbg('namesearch_municourt_final_pass_stale_reset',{ageMs: age});
                                                                                          st.step = 'go_search';
                                                                                          st.finalizingStartedAt = 0;
                                                                                          saveNameState(st);}
                                                st.step = 'municourt_finalizing';
                                                st.finalizingStartedAt = Date.now();
                                                saveNameState(st);
                                                let muniAdded = 0;
                                                try {uiStatus('Reading Municourt...');
                                                     render();
                                                     const nextLog = loadLog();
                                                     const muniEntries = await searchMunicourtEntriesByName(st.params || {});
                                                     for (const m of muniEntries) {if (!m?.caseKey) continue;
                                                                                 if (nextLog.some((x) => x.caseKey === m.caseKey)) continue;
                                                                                 nextLog.push(withPleadAndPayTotal(m));
                                                                                 muniAdded += 1;}
                                                     saveLog(nextLog);
                                                     dbg('namesearch_municourt_final_pass_done',{count: muniAdded});}
                                                catch (e) {dbg('namesearch_municourt_final_pass_error',{msg:String(e?.message || e)});}
                                                const casenetAdded = Number(st.casenetAddedTotal || 0);
                                                dbg('namesearch_done',{casenetAdded,muniAdded});
                                                clearNameState();
                                                uiStatus(`Done. Case.net: ${casenetAdded}  Municourt.net: ${muniAdded}`);
                                                render();
                                                return;}
                                 if (isNameSearchPage()) {if (st.step === 'submitted_waiting_results') {const age = Date.now() - Number(st.submittedAt || 0);
                                                                                                        if (age < 6000) return;
                                                                                                        dbg('namesearch_resubmit',{passKey,ageMs:age});
                                                                                                        st.step = 'go_search';
                                                                                                        saveNameState(st);}
                                                          const prepMessages = ['Preparing pass 1/3 (criminal)','Preparing pass 2/3 (traffic/municipal)','Preparing pass 3/3 (Municourt)'];
                                                          const prepLabel = prepMessages[st.passIndex || 0] || `Preparing pass (${(st.passIndex || 0) + 1}/3)`;
                                                          uiStatus(prepLabel);
                                                          render();
                                                          if (Number(st.prepareStartedAt || 0) === 0) {st.prepareStartedAt = Date.now();
                                                                                                       saveNameState(st);
                                                                                                       return;}
                                                          const prepAge = Date.now() - Number(st.prepareStartedAt || 0);
                                                          if (prepAge < 3000) return;
                                                          st.prepareStartedAt = 0;
                                                          saveNameState(st);
                                                          dbg('namesearch_submit',{passKey,passMiddle});
                                                          fillNameSearchForm({...st.params,middle: passMiddle},passKey);
                                                          const ok = submitNameSearchForm();
                                                          if (!ok) {uiStatus('Search failed, refresh page and retry');
                                                                    dbg('namesearch_submit_failed',{passKey});
                                                                    return;}
                                                          st.step = 'submitted_waiting_results';
                                                          st.submittedAt = Date.now();
                                                          saveNameState(st);
                                                          return;}
                                 if (isNameSearchResultsPage()) {if (st.step === 'pulling_results') {const age = Date.now() - Number(st.pullStartedAt || 0);
                                                                                                      if (age < 120000) return;
                                                                                                      dbg('namesearch_pull_stale_reset',{passKey,ageMs:age});
                                                                                                      st.step = 'go_search';
                                                                                                      st.pullStartedAt = 0;
                                                                                                      saveNameState(st);}
                                                                setShowEntriesTo100();
                                                                const dockYob = document.getElementById('moNsYob');
                                                                if (dockYob) dockYob.value = st.params?.yob || '';
                                                                dbg('namesearch_pull_begin',{passKey});
                                                                st.step = 'pulling_results';
                                                                st.pullStartedAt = Date.now();
                                                                saveNameState(st);
                                                                let pullStats = null;
                                                                try {pullStats = await pullJsonFromResultsPage();}
                                                                catch (e) {dbg('namesearch_pull_fatal',{passKey,msg:String(e?.message || e)});
                                                                           setRun(false);}
                                                                st.casenetAddedTotal = Number(st.casenetAddedTotal || 0) + Number(pullStats?.appendedCount || 0);
                                                                dbg('namesearch_pull_done',{passKey});
                                                                st.passIndex = (st.passIndex || 0) + 1;
                                                                st.step = 'go_search';
                                                                st.pullStartedAt = 0;
                                                                st.prepareStartedAt = Date.now();
                                                                st.navPendingUntil = Date.now() + 3000;
                                                                saveNameState(st);
                                                                location.href = canonicalNameSearchUrl();
                                                                return;}
                                 location.href = canonicalNameSearchUrl();}
