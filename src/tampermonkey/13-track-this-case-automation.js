
/************************************************************
 * Track This Case automation
 ************************************************************/
function isCaseNoSearchPage() {return location.pathname.includes('/casenet/caseNoSearch.do') &&
                                      !!document.querySelector('#caseNumber');}

function isTrackLandingPage() {return location.pathname.includes('/casenet/trackThisCaseLanding.do');}

function isTrackEntryPage() {return location.pathname.includes('/casenet/trackThisCaseEntry.do') &&
                                    (!!document.querySelector('#email') || !!document.querySelector('input[name="email"]'));}

function findFindButton() {return document.querySelector('#findButton') ||
                                  Array.from(document.querySelectorAll('input[type="submit"],button[type="submit"],button')).find((el) => /find/i.test(el.value || el.textContent || '')) ||
                                  null;}

function findTrackLinkOnHeader() {return document.querySelector('a[href*="trackThisCaseLanding.do"]') ||
                                        (document.querySelector('#trackThisCaseLinkImg')?.closest('a')) ||
                                        null;}

function findContinueLink() {return document.querySelector('a[href*="trackThisCaseEntry.do"]') ||
                                   Array.from(document.querySelectorAll('a.btn, a')).find((a) => /continue/i.test(a.textContent || '')) ||
                                   null;}

function findFinalTrackButton() {return document.querySelector('button[onclick*="submitForm"][onclick*="track"]') ||
                                        Array.from(document.querySelectorAll('button')).find((b) => /track this case/i.test(b.textContent || '')) ||
                                        null;}


function getTrackCaseNumber(st) {return norm(st?.caseNumber).toUpperCase();}

function getTrackEmail(st) {return norm(st?.email);}

async function trackTick() {const st = loadTrackState();
                            if (!st?.active) return;
                            if (st.done) return;
                            if (isStop()) return;
                            if (isRun()) return;
                            const onTrackFlowPage = isTrackLandingPage() || isTrackEntryPage();
                            if (st.ownerTabId && st.ownerTabId !== TAB_ID) {if (st.awaitingPopupClaim && onTrackFlowPage) {st.ownerTabId = TAB_ID;
                                                                                                                           st.awaitingPopupClaim = false;
                                                                                                                           st.popupOpened = false;
                                                                                                                           saveTrackState({...st});
                                                                                                                           dbg('track_claim_owner',{ownerTabId:TAB_ID});}
                                                                             else {return;}}
                            else if (!st.ownerTabId) {st.ownerTabId = TAB_ID;
                                                      saveTrackState({...st});}
                            const caseNumber = getTrackCaseNumber(st);
                            if (!caseNumber) {st.error = 'missing_case_number';
                                              saveTrackState({...st,active:false,done:true});
                                              uiStatus('Track This Case: missing case number.');
                                              dbg('track_abort_missing_case',{});
                                              return;}
                            if (st.navPendingUntil && Date.now() < Number(st.navPendingUntil)) return;

                            if (isCaseNoSearchPage()) {const box = document.querySelector('#caseNumber');
                                                      if (box && norm(box.value) !== caseNumber) {box.focus();
                                                                                                box.value = caseNumber.toUpperCase();
                                                                                                box.dispatchEvent(new Event('input',{bubbles:true}));
                                                                                                box.dispatchEvent(new Event('change',{bubbles:true}));}
                                                      const btn = findFindButton();
                                                      if (btn) {uiStatus('Track This Case: finding case...');
                                                                dbg('track_submit_case_search',{caseNumber});
                                                                st.step = 'submitted_case_search';
                                                                st.submittedAt = Date.now();
                                                                saveTrackState({...st});
                                                                btn.click();
                                                                return;}
                                                      uiStatus('Track This Case: Find button not found.');
                                                      dbg('track_find_button_missing',{});
                                                      saveTrackState({...st,error:'find_button_missing'});
                                                      return;}

                            const trackLink = findTrackLinkOnHeader();
                            if (trackLink && !st.popupOpened) {uiStatus('Track This Case: opening in new window...');
                                                           dbg('track_open_popup',{href:trackLink.href || ''});
                                                           st.popupOpened = true;
                                                           st.awaitingPopupClaim = true;
                                                           st.navPendingUntil = Date.now() + 1500;
                                                           saveTrackState({...st});
                                                           try {window.open(trackLink.href,'_blank','noopener,noreferrer');}
                                                           catch {}
                                                           return;}

                            if (isTrackLandingPage()) {const c = findContinueLink();
                                                       if (!c) {uiStatus('Track This Case: Continue link not found.');
                                                                dbg('track_continue_missing',{});
                                                                saveTrackState({...st,error:'continue_missing'});
                                                                return;}
                                                       uiStatus('Track This Case: continuing...');
                                                       dbg('track_click_continue',{href:c.href || ''});
                                                       st.navPendingUntil = Date.now() + 1200;
                                                       saveTrackState({...st});
                                                       c.click();
                                                       return;}

                            if (isTrackEntryPage()) {const email = getTrackEmail(st);
                                                     if (!email) {st.error = 'missing_email';
                                                                  saveTrackState({...st,active:false,done:true});
                                                                  uiStatus('Track This Case: missing email address.');
                                                                  dbg('track_abort_missing_email',{});
                                                                  return;}
                                                     const e1 = document.querySelector('#email') || document.querySelector('input[name="email"]');
                                                     const e2 = document.querySelector('#confirmEmail') || document.querySelector('input[name="confirmEmail"]');
                                                     if (e1) {e1.focus();
                                                              e1.value = email;
                                                              e1.dispatchEvent(new Event('input',{bubbles:true}));
                                                              e1.dispatchEvent(new Event('change',{bubbles:true}));}
                                                     if (e2) {e2.focus();
                                                              e2.value = email;
                                                              e2.dispatchEvent(new Event('input',{bubbles:true}));
                                                              e2.dispatchEvent(new Event('change',{bubbles:true}));}
                                                     const cb = document.querySelector('#trackDocketRequestSelected1') ||
                                                                document.querySelector('input[name="trackDocketRequestSelected"][value="trackDocketNotification"]') ||
                                                                null;
                                                     if (cb && !cb.checked) {cb.click();}
                                                     const btn = findFinalTrackButton();
                                                     if (!btn) {uiStatus('Track This Case: final Track button not found.');
                                                                dbg('track_final_button_missing',{});
                                                                saveTrackState({...st,error:'final_button_missing'});
                                                                return;}
                                                     uiStatus('Track This Case: submitting...');
                                                     dbg('track_submit_final',{caseNumber,email});
                                                     st.done = true;
                                                     st.active = false;
                                                     st.awaitingPopupClaim = false;
                                                     saveTrackState({...st});
                                                     btn.click();
                                                     uiStatus(`Track This Case complete for ${caseNumber} - close this browser window.`);
                                                     return;}

                            if (st.popupOpened) {uiStatus('Track This Case working in new tab');
                                                 return;}

                            uiStatus('Reading...');
                            return;}
