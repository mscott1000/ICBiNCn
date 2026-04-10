/************************************************************
   * Buttons
   ************************************************************/
  function buildNameSearchPasses(params) {const caseTypePasses = ['criminal','traffic'];
                                   const middleRaw = norm(params?.middle || '');
                                   const middleVariants = middleRaw ? [middleRaw] : ['','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
                                   const out = [];
                                   for (const caseType of caseTypePasses) {for (const middle of middleVariants) out.push({caseType,middle,label: middle ? `${caseType} / ${middle}` : `${caseType} / (blank)`});}
                                   return out;}

  dock.addEventListener('click',async (e) => {const id = e?.target?.id;
                                             if (id === 'moJsonNameSearch') {const params = {first: norm(document.getElementById('moNsFirst')?.value || ''),
                                                                                           middle: norm(document.getElementById('moNsMiddle')?.value || ''),
                                                                                           last: norm(document.getElementById('moNsLast')?.value || ''),
                                                                                           yob: norm(document.getElementById('moNsYob')?.value || ''),};
                                                                            setStop(false);
                                                                            setRun(false);
                                                                            saveDraft({...params});
                                                                            const passes = buildNameSearchPasses(params);
                                                                            saveNameState({active:true,passIndex:0,passes,step:'go_search',params,});
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
                                             if (id === 'moJsonClearDebug') {saveDebug([]);
                                                                            clearLastHtml();
                                                                            uiStatus('Debug Cleared');
                                                                            render();
                                                                            return;}
                                             if (id === 'moJsonCloseX') {minimizeDock();
                                                                        return;}
                                             if (id === 'moJsonHelpBtn') {openHelpPanel();
                                                                          return;}
                                             if (id === 'moJsonHelpClose') {closeHelpPanel();
                                                                            return;}
                                             if (id === 'moTrackClearEntries') {clearTrackDraft();
                                                                              clearTrackState();
                                                                              setStop(true);
                                                                              setRun(false);
                                                                              render();
                                                                              uiStatus('Track This Case entries cleared');
                                                                              dbg('track_entries_cleared',{});
                                                                              return;}
                                             if (id === 'moTrackSignup') {const caseNumber = norm(document.getElementById('moTrackCaseNo')?.value || '').toUpperCase();
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
                                     if (id === 'moTrackCaseNo' || id === 'moTrackEmail') {const draft = loadTrackDraft();
                                                                                         saveTrackDraft({...draft,
                                                                                                         caseNumber: norm(document.getElementById('moTrackCaseNo')?.value || '').toUpperCase(),
                                                                                                         email: norm(document.getElementById('moTrackEmail')?.value || '')});
                                                                                         return;}
                                     });


  async function nameSearchTick() {const st = loadNameState();
                                 if (!st?.active) return;
                                 if (st.navPendingUntil && Date.now() < Number(st.navPendingUntil)) return;
                                 if (isRun()) return;
                                 if (isStop()) return;
                                 const pass = (st.passes || [])[st.passIndex || 0];
                                 const passKey = typeof pass === 'string' ? pass : pass?.caseType;
                                 const passMiddle = typeof pass === 'string' ? (st.params?.middle || '') : (pass?.middle || '');
                                 const passLabel = typeof pass === 'string' ? passKey : (pass?.label || passKey);
                                 if (!passKey) {dbg('namesearch_done',{});
                                                clearNameState();
                                                uiStatus('Done.');
                                                render();
                                                return;}
                                 if (isNameSearchPage()) {if (st.step === 'submitted_waiting_results') {const age = Date.now() - Number(st.submittedAt || 0);
                                                                                                        if (age < 6000) return;
                                                                                                        dbg('namesearch_resubmit',{passKey,ageMs:age});
                                                                                                        st.step = 'go_search';
                                                                                                        saveNameState(st);}
                                                          uiStatus(`Searching ${st.passIndex + 1}/${(st.passes || []).length} (${passLabel})…`);
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
                                 if (isNameSearchResultsPage()) {setShowEntriesTo100();
                                                                const dockYob = document.getElementById('moNsYob');
                                                                if (dockYob) dockYob.value = st.params?.yob || '';
                                                                uiStatus(`Ready (${passLabel})…`);
                                                                dbg('namesearch_pull_begin',{passKey});
                                                                try {await pullJsonFromResultsPage();}
                                                                catch (e) {dbg('namesearch_pull_fatal',{passKey,msg:String(e?.message || e)});
                                                                           setRun(false);}
                                                                dbg('namesearch_pull_done',{passKey});
                                                                st.passIndex = (st.passIndex || 0) + 1;
                                                                st.step = 'go_search';
                                                                st.navPendingUntil = Date.now() + 5000;
                                                                saveNameState(st);
                                                                location.href = canonicalNameSearchUrl();
                                                                return;}
                                 location.href = canonicalNameSearchUrl();}
