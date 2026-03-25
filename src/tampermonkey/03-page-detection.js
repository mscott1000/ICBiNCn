
  /************************************************************
   * Page Detection
   ************************************************************/
  function isNoMatchesMessagePage() {const text = (document.querySelector('#nameSearchResult')?.innerText ||
                                                  document.body?.innerText ||
                                                  '')
                                                 .replace(/\s+/g,' ')
                                                 .toLowerCase();
                                    return text.includes('your query returned no matches');}

  function isNameSearchResultsPage() {return !!document.querySelector('select[name="nameSearchResult_length"]');}

  async function waitForResultsReady() {const start = Date.now();
                                       while (Date.now() - start < RESULTS_READY_TIMEOUT_MS) {
                                         if (isNoMatchesMessagePage()) return {ready:true,noMatches:true};
                                         const hasAnyCaseLink = document.querySelector('a[href*="inputVO.caseNumber"]') ||
                                                                document.querySelector('a[href*="caseNumber="]') ||
                                                                document.querySelector('a[href*="ci="]');
                                         const hasResultsLengthSelect = document.querySelector('select[name="nameSearchResult_length"]');
                                         const processingEl = document.querySelector('#nameSearchResult_processing');
                                         const isProcessing = !!(processingEl && getComputedStyle(processingEl).display !== 'none' && processingEl.getAttribute('aria-hidden') !== 'true');
                                         const tbody = document.querySelector('#nameSearchResult tbody');
                                         const bodyText = norm(tbody?.textContent || '');
                                         const hasRows = !!tbody?.querySelector('tr');
                                         const hasNoData = /no data available/i.test(bodyText);
                                         if (hasAnyCaseLink) return {ready:true,noMatches:false};
                                         if (hasResultsLengthSelect && hasRows && !hasNoData && !isProcessing) return {ready:true,noMatches:false};
                                         await sleep(RESULTS_READY_POLL_MS);}
                                       return {ready:false,noMatches:false};}
