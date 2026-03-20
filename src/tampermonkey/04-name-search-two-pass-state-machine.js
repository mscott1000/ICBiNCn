
  /************************************************************
   * Name Search (two-pass) state machine
   ************************************************************/
  function loadNameState() {return loadJson(KEY_NAMESEARCH,null);}

  function saveNameState(s) {saveJson(KEY_NAMESEARCH,s || null);}

  function loadTrackState() {return loadJson(KEY_TRACK_STATE,null);}

  function saveTrackState(s) {saveJson(KEY_TRACK_STATE,s || null);}

  function clearTrackState() {saveTrackState(null);}

  function loadTrackDraft() {return loadJson(KEY_TRACK_DRAFT,{caseNumbersText:'',caseNumber:''});}

  function saveTrackDraft(d) {saveJson(KEY_TRACK_DRAFT,d || {caseNumbersText:'',caseNumber:''});}

  function clearTrackDraft() {saveTrackDraft({caseNumbersText:'',caseNumber:''});}

  function clearNameState() {saveNameState(null);}

  function isNameSearchPage() {const hasLast = !!document.querySelector('#lastName') ||
                                              !!document.querySelector('input[name="lastName"]') ||
                                              !!document.querySelector('input[name="inputVO.lastName"]') ||
                                              !!document.querySelector('input[name*="lastName"]');
                               const hasSubmit = !!document.querySelector('#findButton') ||
                                                 !!document.querySelector('form#nameSearchModel') ||
                                                 !!document.querySelector('form[name="nameSearchModel"]') ||
                                                 !!document.querySelector('button[type="submit"], input[type="submit"]');
                               return hasLast && hasSubmit;}

  function canonicalNameSearchUrl() {return new URL('/casenet/nameSearch.do?newSearch=Y',location.origin).toString();}

  function setCaseTypeForPass(passKey) {const sel = document.querySelector('#caseType');
                                        if (!sel) return false;
                                        const wantValue = passKey === 'criminal' ? 'Criminal' : 'Traffic/Municipal';
                                        const opt = Array.from(sel.options || []).find((o) => (o.value || '') === wantValue);
                                        if (!opt) return false;
                                        sel.value = wantValue;
                                        sel.dispatchEvent(new Event('input',{bubbles:true}));
                                        sel.dispatchEvent(new Event('change',{bubbles:true}));
                                        return true;}

  function setInputIfPresent(selectors,value) {const v = String(value || '');
                                               for (const sel of selectors) {const el = document.querySelector(sel);
                                                                            if (!el) continue;
                                                                            el.focus();
                                                                            el.value = v;
                                                                            el.dispatchEvent(new Event('input',{bubbles:true}));
                                                                            el.dispatchEvent(new Event('change',{bubbles:true}));
                                                                            return true;}
                                               return false;}

  function fillNameSearchForm(params,passKey) {setInputIfPresent(['#firstName','input[name="firstName"]','input[name="inputVO.firstName"]','input[name*="firstName"]'],params.first);
                                               setInputIfPresent(['#middleName','input[name="middleName"]','input[name="inputVO.middleName"]','input[name*="middleName"]'],params.middle);
                                               setInputIfPresent(['#lastName','input[name="lastName"]','input[name="inputVO.lastName"]','input[name*="lastName"]'],params.last);
                                               setInputIfPresent(['#birthYear','#yearOfBirth','#yob','input[name="birthYear"]','input[name="yearOfBirth"]','input[name="yob"]','input[name="inputVO.birthYear"]','input[name="inputVO.yearOfBirth"]','input[name*="birth"]','input[name*="yob"]'],params.yob);
                                               setCaseTypeForPass(passKey);}

  function submitNameSearchForm() {const btn = document.querySelector('#findButton') ||
                                             document.querySelector('input#findButton') ||
                                             Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"]')).find((el) => /find|search/i.test(el.value || el.textContent || ''));
                                   if (btn) {btn.click();
                                             return true;}
                                   const form = document.querySelector('form#nameSearchModel') ||
                                                document.querySelector('form[name="nameSearchModel"]') ||
                                                document.querySelector('#lastName')?.form ||
                                                null;
                                   if (form) {form.submit();
                                              return true;}
                                   return false;}

  function setShowEntriesTo100() {const sel = document.querySelector('select[name="nameSearchResult_length"]');
                                 if (!sel) return;
                                 sel.value = '100';
                                 sel.dispatchEvent(new Event('input',{bubbles:true}));
                                 sel.dispatchEvent(new Event('change',{bubbles:true}));}

  function getNextButton() {return document.querySelector('#nameSearchResult_next');}

  function nextIsDisabled(btn) {if (!btn) return true;
                                return btn.classList.contains('disabled') || btn.getAttribute('aria-disabled') === 'true';}

  function getActivePageText() {const cur = document.querySelector('#nameSearchResult_paginate a.paginate_button.current');
                                return cur ? norm(cur.textContent) : '';}
