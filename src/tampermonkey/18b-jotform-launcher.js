/************************************************************
 * Jotform experimental launcher
 ************************************************************/
function isJotformTablesPage() {return /(^|\.)jotform\.com$/i.test(location.hostname || '') && location.pathname.startsWith('/tables/');}

function hideIcbincnDockOnJotform() {try {dock.classList.add('moHidden');
                                          launcher.classList.add('moHidden');
                                          closeHelpPanel();
                                          closeTextBuilderPanel();}
                                     catch {}}

function parseJotformFullName(fullName) {const parts = norm(fullName).split(' ').filter(Boolean);
                                         if (!parts.length) return null;
                                         if (parts.length === 1) return {first:parts[0],middle:'',last:''};
                                         return {first:parts[0],middle:'',last:parts[parts.length - 1]};}

function parseJotformYob(dateText) {const raw = norm(dateText);
                                    const explicitYear = raw.match(/\b(19|20)\d{2}\b/);
                                    if (explicitYear) return explicitYear[0];
                                    const parsed = Date.parse(raw);
                                    if (!Number.isNaN(parsed)) {const y = new Date(parsed).getFullYear();
                                                                if (y >= 1900 && y <= 2099) return String(y);}
                                    return '';}

function jotformCellText(wrapper) {return norm(wrapper?.querySelector?.('.textField.js-textField')?.textContent ||
                                               wrapper?.querySelector?.('.jSheetRow-cellContent')?.textContent ||
                                               wrapper?.textContent || '');}

function jotformCellType(wrapper) {return wrapper?.querySelector?.('[data-type]')?.getAttribute('data-type') || '';}

function jotformCssEscape(value) {if (window.CSS?.escape) return CSS.escape(String(value || ''));
                                  return String(value || '').replace(/["\\]/g,'\\$&');}

function findJotformRowWrappers(sourceWrapper) {const submissionId = sourceWrapper?.dataset?.submissionId || '';
                                                const rowIndex = sourceWrapper?.dataset?.rowIndex || '';
                                                let wrappers = [];
                                                if (submissionId) wrappers = Array.from(document.querySelectorAll(`.jSheetRow-cellWrapper[data-submission-id="${jotformCssEscape(submissionId)}"]`));
                                                if ((!wrappers.length || wrappers.length === 1) && rowIndex !== '') wrappers = Array.from(document.querySelectorAll(`.jSheetRow-cellWrapper[data-row-index="${jotformCssEscape(rowIndex)}"]`));
                                                return wrappers;}

function getJotformParamsForNameWrapper(nameWrapper) {const fullName = jotformCellText(nameWrapper).replace(/\bICBiNCn Search\b/g,'').trim();
                                                     const parsedName = parseJotformFullName(fullName);
                                                     if (!parsedName?.first || !parsedName?.last) throw new Error('Could not parse first and last name from this row.');
                                                     const rowWrappers = findJotformRowWrappers(nameWrapper);
                                                     const dateWrapper = rowWrappers.find((w) => jotformCellType(w) === 'control_datetime' && parseJotformYob(jotformCellText(w)));
                                                     const yob = parseJotformYob(jotformCellText(dateWrapper));
                                                     if (!yob) throw new Error('Could not find a valid birth year in this row.');
                                                     return {...parsedName,yob};}

function startIcbincnSearchFromJotform(params) {const cleaned = {first:norm(params?.first || ''),
                                                               middle:'',
                                                               last:norm(params?.last || ''),
                                                               yob:norm(params?.yob || '')};
                                            if (!cleaned.first || !cleaned.last || !/^\d{4}$/.test(cleaned.yob)) throw new Error('ICBiNCn needs first name, last name, and a 4-digit YOB.');
                                            setStop(false);
                                            setRun(false);
                                            saveDraft(cleaned);
                                            saveLog([]);
                                            saveDebug([]);
                                            clearLastHtml();
                                            saveJson(KEY_NET_STATS,{byPath:{}});
                                            const passes = buildNameSearchPasses(cleaned);
                                            saveNameState({active:true,
                                                           passIndex:0,
                                                           passes,
                                                           step:'go_search',
                                                           params:cleaned,
                                                           casenetAddedTotal:0,
                                                           autoMinimized:false,
                                                           launchedFrom:'jotform',
                                                           launchedAt:new Date().toISOString(),});
                                            window.open('https://www.courts.mo.gov/casenet/nameSearch.do?newSearch=Y','_blank','noopener,noreferrer');}

function injectJotformSearchButtons() {const wrappers = Array.from(document.querySelectorAll('.jSheetRow-cellWrapper'))
                                            .filter((w) => jotformCellType(w) === 'control_fullname');
                                      for (const wrapper of wrappers) {if (wrapper.querySelector(':scope > .icbincnJotformSearchBtn')) continue;
                                                                      const btn = document.createElement('button');
                                                                      btn.type = 'button';
                                                                      btn.className = 'icbincnJotformSearchBtn';
                                                                      btn.textContent = 'ICBiNCn Search';
                                                                      btn.title = 'Run ICBiNCn Case.net name search for this row';
                                                                      btn.addEventListener('click',(e) => {e.preventDefault();
                                                                                                           e.stopPropagation();
                                                                                                           try {const params = getJotformParamsForNameWrapper(wrapper);
                                                                                                                startIcbincnSearchFromJotform(params);
                                                                                                                btn.textContent = 'Opening…';
                                                                                                                setTimeout(() => {btn.textContent = 'ICBiNCn Search';},2500);}
                                                                                                           catch (err) {btn.textContent = 'Missing data';
                                                                                                                        setTimeout(() => {btn.textContent = 'ICBiNCn Search';},2500);
                                                                                                                        alert(`ICBiNCn Search: ${String(err?.message || err)}`);}});
                                                                      wrapper.appendChild(btn);}}

function initializeJotformIntegration() {hideIcbincnDockOnJotform();
                                        GM_addStyle(`.icbincnJotformSearchBtn{position:absolute;right:4px;bottom:4px;z-index:99999;border:1px solid #1d4ed8;border-radius:6px;background:#2563eb;color:#fff;font:700 10px/1.1 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;padding:4px 6px;cursor:pointer;box-shadow:0 2px 5px rgba(15,23,42,.22);}
                                                     .icbincnJotformSearchBtn:hover{background:#1d4ed8;}
                                                     .jSheetRow-cellWrapper{min-width:0;}`);
                                        injectJotformSearchButtons();
                                        const obs = new MutationObserver(() => injectJotformSearchButtons());
                                        obs.observe(document.body || document.documentElement,{childList:true,subtree:true});
                                        setInterval(injectJotformSearchButtons,2000);}
