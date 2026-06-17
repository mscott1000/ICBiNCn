/************************************************************
   * Buttons
   ************************************************************/
  function buildNameSearchPasses(params) {const caseTypePasses = ['criminal','traffic'];
                                   const middleRaw = norm(params?.middle || '');
                                   return caseTypePasses.map((caseType) => ({caseType,
                                                                            middle: middleRaw,
                                                                            label: middleRaw ? `${caseType} / ${middleRaw}` : `${caseType} / all middle names`}));}

  dock.addEventListener('click',async (e) => {const id = e?.target?.id;
                                             if (id === 'moHomeNameSearch') {setAppView('name'); return;}
                                             if (id === 'moHomeTextBuilder') {setAppView('text'); return;}
                                             if (id === 'moHomeUpcomingCourtDates') {setAppView('upcoming'); return;}
                                             if (id === 'moHomeTrackThisCase') {setAppView('track'); return;}
                                             if (id === 'moHomeGoogleVoiceAssist') {setAppView('voice'); return;}
                                             if (id === 'moJsonBackBtn') {goBackView(); return;}
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
                                             if (id === 'moJsonHelpBtn') {if (appView === 'name') {restoreNameHelpPanel(); openHelpPanel();} else openBlankHelpPanel();
                                                                          return;}
                                             if (id === 'moJsonTextBuilderBtn') {setAppView('text');
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
                                             if (id === 'moUpcomingRun') {runUpcomingBatchIntegrated().catch((err) => {upcomingActiveRun = null; upcomingSetStatus(`Error: ${String(err?.message || err)}`);}); return;}
                                             if (id === 'moUpcomingStop') {upcomingStopRequested = true; if (upcomingActiveRun?.controller) upcomingActiveRun.controller.abort(); upcomingDebug('stop_requested',{}); upcomingSetStatus('Stopping...'); return;}
                                             if (id === 'moUpcomingClear') {upcomingStorageSet(UPCOMING_INPUT_KEY,''); upcomingStorageSet(UPCOMING_OUTPUT_KEY,''); render(); upcomingSetStatus('Upcoming Court Dates entries cleared.'); return;}
                                             if (id === 'moUpcomingCopy') {GM_setClipboard(document.getElementById('moUpcomingOutput')?.value || '','text'); upcomingSetStatus('Results copied to clipboard.'); return;}
                                             if (id === 'moUpcomingCopyDebug') {GM_setClipboard(upcomingStorageGet(UPCOMING_DEBUG_KEY) || '(no debug rows)','text'); upcomingSetStatus('Debug copied to clipboard.'); return;}
                                             if (id === 'moUpcomingClearDebug') {upcomingStorageSet(UPCOMING_DEBUG_KEY,''); upcomingSetStatus('Debug cleared.'); return;}
                                             if (id === 'moGvLoad') {try {gvLoadPairs(); uiStatus('Google Voice pairs loaded.');} catch (err) {gvRenderStatus(`Load error: ${String(err?.message || err)}`);} return;}
                                             if (id === 'moGvClear') {['moGvPhones','moGvNames','moGvLastNames','moGvMessage'].forEach((x) => {const el = document.getElementById(x); if (el) el.value = '';}); gvQueue = []; gvFocusedPair = null; gvSaveFromUi(); gvRenderStatus(); uiStatus('Google Voice entries cleared.'); return;}
                                             if (id === 'moGvNumber') {if (!gvFocusedPair) {gvRenderStatus('Load at least one pair first.'); return;} GM_setClipboard(gvFocusedPair.phoneDisplay || gvFocusedPair.phoneRaw,'text'); uiStatus('Google Voice number copied.'); return;}
                                             if (id === 'moGvText') {if (!gvFocusedPair) {gvRenderStatus('Load at least one pair first.'); return;} GM_setClipboard(gvCompose(gvFocusedPair.firstName,document.getElementById('moGvMessage')?.value || ''),'text'); uiStatus('Google Voice text copied.'); return;}
                                             if (id === 'moGvName') {if (!gvFocusedPair) {gvRenderStatus('Load at least one pair first.'); return;} const fullName = [gvFocusedPair.firstName,gvFocusedPair.lastName].filter(Boolean).join(' '); if (!fullName) {gvRenderStatus('Focused pair has no name.'); return;} GM_setClipboard(fullName,'text'); uiStatus('Google Voice name copied.'); return;}
                                             if (id === 'moGvNext') {if (!gvQueue.length) {gvFocusedPair = null; gvRenderStatus(); return;} gvQueue.shift(); gvRemoveFirstLine('moGvPhones'); gvRemoveFirstLine('moGvNames'); gvRemoveFirstLine('moGvLastNames'); gvFocusedPair = gvQueue[0] || null; gvSaveFromUi(); gvRenderStatus(); uiStatus('Google Voice advanced to next pair.'); return;}
                                             if (id === 'moJsonOpenLastHtml') {openLastHtmlInNewTab();
                                                                              return;}});


  dock.addEventListener('click',(e) => {const action = e?.target?.dataset?.tbAction;
                                     if (!action || appView !== 'text') return;
                                     const value = e?.target?.dataset?.tbValue;
                                     if (action === 'back') return textBuilderBack();
                                     if (action === 'chooseRoot') {if (value === 'Initial Text') return textBuilderSet('staff',{workflow:'initial'}); if (value === 'Post-Research Response') return textBuilderSet('staff',{workflow:'postResearch'}); return textBuilderSet('followUp',{workflow:'followUp'});}
                                     if (action === 'chooseStaff') {if (textBuilderState.data.workflow === 'initial') return textBuilderSet('message',{staff:value}); if (textBuilderState.data.workflow === 'followUpNewCourtDate') return textBuilderSet('courts',{staff:value,courts:[]}); return textBuilderSet('researchType',{staff:value});}
                                     if (action === 'chooseResearchType') {if (value === 'Nothing Found') return textBuilderSet('message',{researchType:value}); if (value === 'CanDo - everything' || value === 'CanDo + Can’tDo') return textBuilderSet('courts',{researchType:value,courts:[]}); if (value === 'Walk-In Client') return textBuilderSet('eligibleDropin',{researchType:value,workflow:'walkInDropIn'}); if (value === 'Can’tDo - private attorney') return textBuilderSet('privateAttorneyDropin',{researchType:value}); if (value === 'Can’tDo - out of network' || value === 'Can’tDo - repeat attempt') return textBuilderSet('ineligibleDropin',{researchType:value,ineligiblePlaceholder:'Enter summary of ineligible cases'});}
                                     if (action === 'confirmEligible') return textBuilderState.data.workflow === 'walkInDropIn' ? textBuilderSet('ineligibleDropin',{ineligiblePlaceholder:'Enter summary of ineligible cases'}) : (textBuilderState.data.researchType === 'CanDo + Can’tDo' ? textBuilderSet('ineligibleDropin',{ineligiblePlaceholder:'Enter summary of ineligible cases'}) : textBuilderSet('address'));
                                     if (action === 'confirmIneligible') {if (textBuilderState.data.workflow === 'walkInDropIn' || ['Can’tDo - out of network','Can’tDo - repeat attempt'].includes(textBuilderState.data.researchType)) return textBuilderSet('message'); if (textBuilderState.data.researchType === 'CanDo + Can’tDo') return textBuilderSet('address'); return textBuilderSet('courts',{courts:[]});}
                                     if (action === 'confirmPrivateAttorney') return textBuilderSet('remainingIneligibleDropin');
                                     if (action === 'confirmRemainingIneligible') return textBuilderSet('courts',{courts:[]});
                                     if (action === 'toggleCourt') {const courts = new Set(textBuilderState.data.courts || []); courts.has(value) ? courts.delete(value) : courts.add(value); textBuilderState.data.courts = [...courts]; return renderTextBuilder();}
                                     if (action === 'confirmCourts') {if (textBuilderState.data.workflow === 'followUpNewCourtDate') return textBuilderSet('newCourtDateInput'); if (['CanDo - everything','CanDo + Can’tDo'].includes(textBuilderState.data.researchType)) return textBuilderSet('eligibleDropin'); if (textBuilderState.data.researchType === 'Can’tDo - private attorney') return textBuilderSet('message'); return textBuilderSet('address');}
                                     if (action === 'chooseAddress') return value === 'Have Address' ? textBuilderSet('addressInput',{addressMode:value}) : textBuilderSet('message',{addressMode:value});
                                     if (action === 'chooseFollowUp') return value === 'Ready to Submit' ? textBuilderSet('followUpReadyDay',{workflow:'followUpReady'}) : textBuilderSet('staff',{workflow:'followUpNewCourtDate'});
                                     if (action === 'chooseFollowUpReadyDay') return textBuilderSet('message',{followUpDay:value});
                                     if (action === 'confirmNewCourtDate' || action === 'confirmAddress') return textBuilderSet('message');
                                     if (action === 'copyMessage') {GM_setClipboard(textBuilderBuildMessage(),'text'); return uiStatus('Text Builder message copied to clipboard');}
                                     if (action === 'copyIneligibleMessage') {GM_setClipboard(textBuilderDropInIneligibleMessage(),'text'); return uiStatus('Text Builder ineligible cases message copied to clipboard');}
                                     if (action === 'copyEligibleMessage') {GM_setClipboard(textBuilderDropInEligibleMessage(false),'text'); return uiStatus('Text Builder eligible cases message copied to clipboard');}});

  dock.addEventListener('input',(e) => {const id = e?.target?.id || '';
                                     const tbKey = e?.target?.dataset?.tbInput;
                                     if (tbKey && appView === 'text') {textBuilderState.data[tbKey] = e.target.value; return;}
                                     if (id === 'moUpcomingInput') {upcomingStorageSet(UPCOMING_INPUT_KEY,e.target.value || ''); return;}
                                     if (id === 'moUpcomingOutput') {upcomingStorageSet(UPCOMING_OUTPUT_KEY,e.target.value || ''); return;}
                                     if (id === 'moUpcomingConcurrency') {upcomingStorageSet(UPCOMING_CONCURRENCY_KEY,String(upcomingConcurrency(e.target.value))); return;}
                                     if (['moGvPhones','moGvNames','moGvLastNames','moGvMessage'].includes(id)) {gvSaveFromUi(); return;}
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
