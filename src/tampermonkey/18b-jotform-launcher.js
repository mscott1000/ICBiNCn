/************************************************************
 * Jotform experimental launcher
 ************************************************************/
const ICBINCN_CASEY_LOGO_DATA_URL = LOGO_CASEY_IMAGE;
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

function jotformColumnTitle(header) {return norm(header?.querySelector?.('.js-columnTitle')?.textContent || header?.textContent || '');}

function jotformHeaderTitleByQid(qid) {const header = document.querySelector(`.jSheetColumn-headerWrapper[data-qid="${jotformCssEscape(qid)}"]`);
                                      return jotformColumnTitle(header);}

function findJotformColumnIdByTitle(title) {const wanted = norm(title).toLowerCase();
                                            const headers = Array.from(document.querySelectorAll('.jSheetColumn-headerWrapper[data-qid]'));
                                            const found = headers.find((h) => jotformColumnTitle(h).toLowerCase() === wanted);
                                            return found?.getAttribute('data-qid') || '';}

function findJotformRowWrappers(sourceWrapper) {const submissionId = sourceWrapper?.dataset?.submissionId || '';
                                                const rowIndex = sourceWrapper?.dataset?.rowIndex || '';
                                                let wrappers = [];
                                                if (submissionId) wrappers = Array.from(document.querySelectorAll(`.jSheetRow-cellWrapper[data-submission-id="${jotformCssEscape(submissionId)}"]`));
                                                if ((!wrappers.length || wrappers.length === 1) && rowIndex !== '') wrappers = Array.from(document.querySelectorAll(`.jSheetRow-cellWrapper[data-row-index="${jotformCssEscape(rowIndex)}"]`));
                                                return wrappers;}

function getJotformNameWrapperForRowWrapper(rowWrapper) {const rowWrappers = findJotformRowWrappers(rowWrapper);
                                                        return rowWrappers.find((w) => jotformCellType(w) === 'control_fullname' && jotformCellText(w));}

function getJotformParamsForNameWrapper(nameWrapper) {const fullName = jotformCellText(nameWrapper).replace(/\bICBiNCn Search\b/g,'').trim();
                                                     const parsedName = parseJotformFullName(fullName);
                                                     if (!parsedName?.first || !parsedName?.last) throw new Error('Could not parse first and last name from this row.');
                                                     const rowWrappers = findJotformRowWrappers(nameWrapper);
                                                     const dobColumnId = findJotformColumnIdByTitle('Date of Birth');
                                                     const dateWrapper = rowWrappers.find((w) => dobColumnId ? w.dataset?.columnId === dobColumnId : (jotformHeaderTitleByQid(w.dataset?.columnId).toLowerCase() === 'date of birth'));
                                                     const yob = parseJotformYob(jotformCellText(dateWrapper));
                                                     if (!yob) throw new Error('Could not find a valid birth year in this row Date of Birth column.');
                                                     return {...parsedName,
                                                             yob,
                                                             jotform:{submissionId:nameWrapper.dataset?.submissionId || '',
                                                                      rowIndex:nameWrapper.dataset?.rowIndex || '',
                                                                      fullName}};}

function jotformResultsMap() {return loadJson(KEY_JOTFORM_RESULTS,{});}
function saveJotformResult(rowKey,result) {const all = jotformResultsMap();
                                          all[rowKey] = {...(all[rowKey] || {}),...result,updatedAt:new Date().toISOString()};
                                          saveJson(KEY_JOTFORM_RESULTS,all);}
function jotformRowKey(meta) {return meta?.submissionId ? `submission:${meta.submissionId}` : `row:${meta?.rowIndex || ''}`;}

function startIcbincnSearchFromJotform(params) {const cleaned = {first:norm(params?.first || ''),
                                                               middle:'',
                                                               last:norm(params?.last || ''),
                                                               yob:norm(params?.yob || '')};
                                            if (!cleaned.first || !cleaned.last || !/^\d{4}$/.test(cleaned.yob)) throw new Error('ICBiNCn needs first name, last name, and a 4-digit YOB.');
                                            const pending = {rowKey:jotformRowKey(params.jotform),
                                                             row:params.jotform || {},
                                                             params:cleaned,
                                                             startedAt:new Date().toISOString()};
                                            saveJson(KEY_JOTFORM_PENDING,pending);
                                            setStop(false);
                                            setRun(false);
                                            saveDraft(cleaned);
                                            saveLog([]);
                                            saveDebug([]);
                                            clearLastHtml();
                                            saveJson(KEY_NET_STATS,{byPath:{}});
                                            const passes = buildNameSearchPasses(cleaned);
                                            setIcbincnTabTitleText('Searching (1/3)');
                                            saveNameState({active:true,
                                                           passIndex:0,
                                                           passes,
                                                           step:'go_search',
                                                           params:cleaned,
                                                           casenetAddedTotal:0,
                                                           autoMinimized:false,
                                                           launchedFrom:'jotform',
                                                           jotformPending:pending,
                                                           launchedAt:new Date().toISOString(),});
                                            openBackgroundTab('https://www.courts.mo.gov/casenet/nameSearch.do?newSearch=Y');}

function jotformPersistSearchResult(st) {const pending = st?.jotformPending || loadJson(KEY_JOTFORM_PENDING,null);
                                        if (!pending?.rowKey) return;
                                        const summary = buildSummaryCopyText();
                                        const copy = buildGroupedCopyText();
                                        saveJotformResult(pending.rowKey,{summary,copy,row:pending.row || {},params:pending.params || st?.params || {}});
                                        saveJson(KEY_JOTFORM_PENDING,null);}

const JOTFORM_STATUS_DISPLAY_OVERRIDES = new Map([
  ['4-kiddie pool','Form Complete'],
  ['6-deep dive','Form Complete'],
  ['5-pool rules','Birds and the Bees'],
  ['kiddie pool','Form Complete'],
  ['deep dive','Form Complete'],
  ['pool rules','Birds and the Bees'],
]);

function jotformDisplayStatusText(statusText) {const normalized = norm(statusText).toLowerCase();
                                               return JOTFORM_STATUS_DISPLAY_OVERRIDES.get(normalized) || statusText;}

function updateJotformStatusDisplayLabels() {const statusColumnId = findJotformColumnIdByTitle('Status');
                                             if (!statusColumnId) return;
                                             const wrappers = Array.from(document.querySelectorAll(`.jSheetRow-cellWrapper[data-column-id="${jotformCssEscape(statusColumnId)}"]`));
                                             for (const wrapper of wrappers) {const textNode = wrapper.querySelector('.textField.js-textField') || wrapper.querySelector('.jSheetRow-cellContent') || wrapper;
                                                                             const current = norm(textNode?.textContent || '');
                                                                             const replacement = jotformDisplayStatusText(current);
                                                                             if (replacement !== current) {textNode.textContent = replacement;
                                                                                                          wrapper.dataset.icbincnOriginalStatus = current;}}
}

const JOTFORM_TAB_DROPDOWN_GROUPS = [
  {key:'phases',title:'Phases',labels:['Phase 1','Phase 2','Phase 3','Phase 4','Phase 5']},
  {key:'courtsReady',title:'Courts - Ready to Submit',labels:['Phase 3 - Clayton','Phase 3 - Florissant','Phase 3 - Kirkwood','Phase 3 - Manchester','Phase 3 - STL City Circuit Court','Phase 3 - STL City Municipal Court','Phase 3 - STL County Circuit Court','Phase 3 - University City','Phase 3 - Webster Groves']},
];

function jotformTabText(tab) {return norm(tab?.querySelector?.('.tab-text')?.textContent || tab?.textContent || '');}

function findJotformVisibleTabByLabel(label) {const wanted = norm(label).toLowerCase();
                                             return Array.from(document.querySelectorAll('.product-tab-item[role="tab"], .tab-item[role="tab"]'))
                                                .find((tab) => jotformTabText(tab).toLowerCase() === wanted);}

function buildJotformTabDropdown(group,tabs) {const wrap = document.createElement('div');
                                             wrap.className = 'icbincnJotformTabDropdown';
                                             wrap.dataset.icbincnTabGroup = group.key;
                                             const button = document.createElement('button');
                                             button.type = 'button';
                                             button.className = 'icbincnJotformTabDropdownButton';
                                             button.setAttribute('aria-haspopup','true');
                                             button.setAttribute('aria-expanded','false');
                                             button.textContent = group.title;
                                             const menu = document.createElement('div');
                                             menu.className = 'icbincnJotformTabDropdownMenu';
                                             menu.setAttribute('role','menu');
                                             for (const label of group.labels) {const item = document.createElement('button');
                                                                               item.type = 'button';
                                                                               item.className = 'icbincnJotformTabDropdownItem';
                                                                               item.setAttribute('role','menuitem');
                                                                               item.textContent = label;
                                                                               item.addEventListener('click',(e) => {e.preventDefault();
                                                                                                                       e.stopPropagation();
                                                                                                                       wrap.classList.remove('isOpen');
                                                                                                                       button.setAttribute('aria-expanded','false');
                                                                                                                       const tab = findJotformVisibleTabByLabel(label);
                                                                                                                       if (tab) tab.click();});
                                                                               menu.appendChild(item);}
                                             button.addEventListener('click',(e) => {e.preventDefault();
                                                                                    e.stopPropagation();
                                                                                    const nextOpen = !wrap.classList.contains('isOpen');
                                                                                    for (const other of Array.from(document.querySelectorAll('.icbincnJotformTabDropdown.isOpen'))) {if (other !== wrap) {other.classList.remove('isOpen');
                                                                                                                                                                                                            other.querySelector('.icbincnJotformTabDropdownButton')?.setAttribute('aria-expanded','false');}}
                                                                                    wrap.classList.toggle('isOpen',nextOpen);
                                                                                    button.setAttribute('aria-expanded',String(nextOpen));});
                                             wrap.appendChild(button);
                                             wrap.appendChild(menu);
                                             const activeTab = tabs.find((tab) => tab.getAttribute('data-active') === 'true' || tab.classList.contains('active'));
                                             if (activeTab) wrap.classList.add('hasActiveTab');
                                             return wrap;}

function consolidateJotformFilterTabs() {for (const group of JOTFORM_TAB_DROPDOWN_GROUPS) {const tabs = group.labels.map(findJotformVisibleTabByLabel).filter(Boolean);
                                                                                         if (!tabs.length) continue;
                                                                                         const firstTab = tabs[0];
                                                                                         const parent = firstTab.parentElement;
                                                                                         if (!parent) continue;
                                                                                         let dropdown = parent.querySelector(`.icbincnJotformTabDropdown[data-icbincn-tab-group="${group.key}"]`);
                                                                                         if (!dropdown) {dropdown = buildJotformTabDropdown(group,tabs);
                                                                                                         parent.insertBefore(dropdown,firstTab);}
                                                                                         dropdown.classList.toggle('hasActiveTab',tabs.some((tab) => tab.getAttribute('data-active') === 'true' || tab.classList.contains('active')));
                                                                                         for (const tab of tabs) {tab.classList.add('icbincnJotformTabHidden');
                                                                                                                   tab.setAttribute('aria-hidden','true');}}}

function initializeJotformTabConsolidation() {consolidateJotformFilterTabs();
                                             document.addEventListener('click',(e) => {if (e.target?.closest?.('.icbincnJotformTabDropdown')) return;
                                                                                      for (const dropdown of Array.from(document.querySelectorAll('.icbincnJotformTabDropdown.isOpen'))) {dropdown.classList.remove('isOpen');
                                                                                                                                                                                          dropdown.querySelector('.icbincnJotformTabDropdownButton')?.setAttribute('aria-expanded','false');}},true);}

function injectJotformSearchButtons() {const statusColumnId = findJotformColumnIdByTitle('Status');
                                      const wrappers = Array.from(document.querySelectorAll('.jSheetRow-cellWrapper'))
                                            .filter((w) => statusColumnId ? w.dataset?.columnId === statusColumnId : jotformHeaderTitleByQid(w.dataset?.columnId).toLowerCase() === 'status');
                                      for (const wrapper of wrappers) {if (wrapper.querySelector(':scope > .icbincnJotformSearchBtn')) continue;
                                                                      const nameWrapper = getJotformNameWrapperForRowWrapper(wrapper);
                                                                      if (!nameWrapper) continue;
                                                                      const btn = document.createElement('button');
                                                                      btn.type = 'button';
                                                                      btn.className = 'icbincnJotformSearchBtn';
                                                                      btn.title = 'Run ICBiNCn Case.net name search for this row';
                                                                      btn.setAttribute('aria-label','Run ICBiNCn search with Casey');
                                                                      const img = document.createElement('img');
                                                                      img.alt = 'Casey';
                                                                      img.src = ICBINCN_CASEY_LOGO_DATA_URL;
                                                                      btn.appendChild(img);
                                                                      btn.addEventListener('click',(e) => {e.preventDefault();
                                                                                                           e.stopPropagation();
                                                                                                           try {const params = getJotformParamsForNameWrapper(nameWrapper);
                                                                                                                startIcbincnSearchFromJotform(params);
                                                                                                                btn.classList.add('isOpening');
                                                                                                                setTimeout(() => {btn.classList.remove('isOpening');},2500);}
                                                                                                           catch (err) {btn.classList.add('isError');
                                                                                                                        setTimeout(() => {btn.classList.remove('isError');},2500);
                                                                                                                        alert(`ICBiNCn Search: ${String(err?.message || err)}`);}});
                                                                      wrapper.appendChild(btn);}}

function removeJotformCaseyColumns() {for (const old of Array.from(document.querySelectorAll('.icbincnJotformSynthetic'))) old.remove();}

const JOTFORM_TARGET_GROUP_NAME = 'Status';
const JOTFORM_GROUP_REMOVE_CLICK_COOLDOWN_MS = 750;
const JOTFORM_FILTER_RESULT_CLOSE_CLICK_COOLDOWN_MS = 750;
let jotformLastGroupRemoveClickTime = 0;
let jotformLastFilterResultCloseClickTime = 0;

function normalizeJotformGroupingText(text) {return String(text || '')
                                                   .replace(/\s+/g,' ')
                                                   .trim()
                                                   .toLowerCase();}

function isVisibleJotformGroupingControl(el) {if (!el) return false;
                                             const style = window.getComputedStyle(el);
                                             const rect = el.getBoundingClientRect();
                                             return style.display !== 'none' &&
                                                    style.visibility !== 'hidden' &&
                                                    style.opacity !== '0' &&
                                                    rect.width > 0 &&
                                                    rect.height > 0;}

function removeJotformGroupedByStatus() {const groupingElements = document.querySelectorAll('.js-groupBy.forGrouping, .js-groupBy');
                                        for (const groupingElement of groupingElements) {const text = normalizeJotformGroupingText(groupingElement.textContent);
                                                                                          const isGroupedByElement = text.includes('grouped by') || text.includes('grouped bystatus');
                                                                                          const isStatusGrouping = text.includes(JOTFORM_TARGET_GROUP_NAME.toLowerCase());
                                                                                          if (!isGroupedByElement || !isStatusGrouping) continue;
                                                                                          const removeButton = groupingElement.querySelector('button.js-removeGrouping, button[aria-label="Remove grouping"], .jSheetRemove');
                                                                                          if (!removeButton || !isVisibleJotformGroupingControl(removeButton)) continue;
                                                                                          const now = Date.now();
                                                                                          if (now - jotformLastGroupRemoveClickTime < JOTFORM_GROUP_REMOVE_CLICK_COOLDOWN_MS) return;
                                                                                          jotformLastGroupRemoveClickTime = now;
                                                                                          removeButton.click();
                                                                                          console.log('[ICBiNCn] Removed Jotform "Grouped by Status" filter.');
                                                                                          return;}}

function initializeJotformGroupedByStatusRemoval() {removeJotformGroupedByStatus();
                                                   const target = document.body || document.documentElement;
                                                   if (!target) return;
                                                   const observer = new MutationObserver(() => {removeJotformGroupedByStatus();});
                                                   observer.observe(target,{childList:true,subtree:true});
                                                   setInterval(removeJotformGroupedByStatus,1000);}

function closeJotformFilterResultBar() {const bars = document.querySelectorAll('.jSheetFilterResultBar');
                                       for (const bar of bars) {const closeButton = bar.querySelector('button[aria-label="Close Filter"], .jSheetIconButton');
                                                               if (!closeButton || !isVisibleJotformGroupingControl(closeButton)) continue;
                                                               const now = Date.now();
                                                               if (now - jotformLastFilterResultCloseClickTime < JOTFORM_FILTER_RESULT_CLOSE_CLICK_COOLDOWN_MS) return;
                                                               jotformLastFilterResultCloseClickTime = now;
                                                               closeButton.click();
                                                               console.log('[ICBiNCn] Closed Jotform filter result message.');
                                                               return;}}

function initializeJotformFilterResultBarClosing() {closeJotformFilterResultBar();
                                                  const target = document.body || document.documentElement;
                                                  if (!target) return;
                                                  const observer = new MutationObserver(() => {closeJotformFilterResultBar();});
                                                  observer.observe(target,{childList:true,subtree:true});
                                                  setInterval(closeJotformFilterResultBar,1000);}

function isJotformBrandingTextNode(node) {if (!node || node.nodeType !== Node.TEXT_NODE || norm(node.nodeValue) !== 'Jotform') return false;
                                         const parent = node.parentElement;
                                         if (!parent || parent.closest?.('input,textarea,select,[contenteditable="true"],.jSheetRow,.jSheetRow-cellWrapper,.jfSpreadsheet,.jSheetTable')) return false;
                                         const rect = parent.getBoundingClientRect?.();
                                         if (!rect || rect.width <= 0 || rect.height <= 0) return false;
                                         if (rect.left > 360 || rect.top > 180) return false;
                                         const ancestry = [];
                                         for (let el = parent; el && el !== document.body && ancestry.length < 6; el = el.parentElement) {ancestry.push(`${el.className || ''} ${el.id || ''} ${el.getAttribute?.('aria-label') || ''} ${el.getAttribute?.('title') || ''} ${el.getAttribute?.('href') || ''}`);}
                                         const haystack = ancestry.join(' ').toLowerCase();
                                         return /logo|brand|header|navbar|topbar|app-header|jf/.test(haystack);}

function jotformNotformLogoDataUrl() {const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="156" height="32" viewBox="0 0 156 32" role="img" aria-label="Notform Logo"><text x="0" y="24" fill="#0a1551" font-family="Inter, Arial, Helvetica, sans-serif" font-size="26" font-weight="700">Notform</text></svg>`;
                                  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;}

function updateJotformBrandingLogoImages(root = document.body) {if (!root) return;
                                                              const selector = 'img.jfLogo,img[src*="jotform-logo"],img[alt*="JotForm"],img[alt*="Jotform"],img[aria-label*="JotForm"],img[aria-label*="Jotform"],img[title*="JotForm"],img[title*="Jotform"]';
                                                              const candidates = root.matches?.(selector) ? [root] : Array.from(root.querySelectorAll?.(selector) || []);
                                                              for (const img of candidates) {const src = img.getAttribute('src') || '';
                                                                                             const alt = img.getAttribute('alt') || '';
                                                                                             const title = img.getAttribute('title') || '';
                                                                                             const aria = img.getAttribute('aria-label') || '';
                                                                                             const haystack = `${img.className || ''} ${src} ${alt} ${title} ${aria}`.toLowerCase();
                                                                                             if (!/jotform|jflogo|jotform-logo/.test(haystack)) continue;
                                                                                             img.setAttribute('src',jotformNotformLogoDataUrl());
                                                                                             img.setAttribute('alt','Notform Logo');
                                                                                             if (title) img.setAttribute('title',title.replace(/JotForm|Jotform/g,'Notform'));
                                                                                             if (aria) img.setAttribute('aria-label',aria.replace(/JotForm|Jotform/g,'Notform'));
                                                                                             img.dataset.icbincnNotformLogo = 'true';}}

function updateJotformBrandingText(root = document.body) {if (!root) return;
                                            updateJotformBrandingLogoImages(root);
                                            const attrElements = root.querySelectorAll?.('[aria-label*="Jotform"],[aria-label*="JotForm"],[title*="Jotform"],[title*="JotForm"],[alt*="Jotform"],[alt*="JotForm"]') || [];
                                            for (const el of Array.from(attrElements)) {for (const attr of ['aria-label','title','alt']) {const value = el.getAttribute(attr);
                                                                                                                                          if (value && /JotForm|Jotform/.test(value)) el.setAttribute(attr,value.replace(/JotForm|Jotform/g,'Notform'));}}
                                            const walker = document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(node) {return isJotformBrandingTextNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;}});
                                            const matches = [];
                                            for (let node = walker.nextNode(); node; node = walker.nextNode()) matches.push(node);
                                            for (const node of matches) node.nodeValue = node.nodeValue.replace(/Jotform/g,'Notform');}

function initializeJotformBrandingReplacement() {updateJotformBrandingText();
                                               const observer = new MutationObserver((mutations) => {for (const mutation of mutations) {if (mutation.type === 'characterData') {const node = mutation.target;
                                                                                                                                               if (isJotformBrandingTextNode(node)) node.nodeValue = node.nodeValue.replace(/Jotform/g,'Notform');}
                                                                                                      for (const node of Array.from(mutation.addedNodes || [])) {if (node.nodeType === Node.TEXT_NODE) {if (isJotformBrandingTextNode(node)) node.nodeValue = node.nodeValue.replace(/Jotform/g,'Notform');}
                                                                                                                                                                      else if (node.nodeType === Node.ELEMENT_NODE) updateJotformBrandingText(node);}}});
                                               observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true});
                                               setInterval(updateJotformBrandingText,2000);}

function initializeJotformIntegration() {hideIcbincnDockOnJotform();
                                        initializeJotformBrandingReplacement();
                                        initializeJotformGroupedByStatusRemoval();
                                        initializeJotformFilterResultBarClosing();
                                        initializeJotformTabConsolidation();
                                        GM_addStyle(`.icbincnJotformTabHidden{display:none!important;}
                                                     .icbincnJotformTabDropdown{position:relative;display:inline-flex;align-items:center;margin-right:6px;height:36px;z-index:100000;}
                                                     .icbincnJotformTabDropdownButton{height:36px;min-width:132px;border:0;border-radius:6px;padding:0 28px 0 12px;background:#1f2937;color:#fff;font:600 14px/1 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;cursor:pointer;box-shadow:inset 0 -1px 0 rgba(255,255,255,.18);position:relative;}
                                                     .icbincnJotformTabDropdownButton::after{content:'▾';position:absolute;right:10px;top:50%;transform:translateY(-50%);font-size:12px;}
                                                     .icbincnJotformTabDropdown.hasActiveTab .icbincnJotformTabDropdownButton{background:#fff;color:#183153;}
                                                     .icbincnJotformTabDropdownMenu{display:none;position:absolute;top:40px;left:0;min-width:260px;max-height:70vh;overflow:auto;background:#fff;color:#0f172a;border:1px solid #cbd5e1;border-radius:8px;box-shadow:0 12px 28px rgba(15,23,42,.22);padding:6px;z-index:100001;}
                                                     .icbincnJotformTabDropdown.isOpen .icbincnJotformTabDropdownMenu{display:block;}
                                                     .icbincnJotformTabDropdownItem{display:block;width:100%;border:0;border-radius:6px;background:transparent;color:#0f172a;text-align:left;padding:8px 10px;font:500 13px/1.25 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;cursor:pointer;white-space:nowrap;}
                                                     .icbincnJotformTabDropdownItem:hover,.icbincnJotformTabDropdownItem:focus{background:#e0f2fe;outline:none;}
                                                     .icbincnJotformSearchBtn{position:absolute;right:4px;bottom:4px;z-index:99999;width:30px;height:30px;border:2px solid #1d4ed8;border-radius:999px;background:#fff;padding:0;cursor:pointer;box-shadow:0 2px 5px rgba(15,23,42,.22);overflow:hidden;}
                                                     .icbincnJotformSearchBtn img{display:block;width:100%;height:100%;object-fit:cover;}
                                                     .icbincnJotformSearchBtn:hover{border-color:#f97316;transform:translateY(-1px);}
                                                     .icbincnJotformSearchBtn.isOpening{outline:3px solid #22c55e;}
                                                     .icbincnJotformSearchBtn.isError{outline:3px solid #ef4444;}
                                                     .jSheetRow-cellWrapper{min-width:0;}`);
                                        injectJotformSearchButtons();
                                        removeJotformCaseyColumns();
                                        updateJotformStatusDisplayLabels();
                                        const obs = new MutationObserver(() => {removeJotformCaseyColumns();
                                                                                 injectJotformSearchButtons();
                                                                                 updateJotformStatusDisplayLabels();
                                                                                 consolidateJotformFilterTabs();});
                                        obs.observe(document.body || document.documentElement,{childList:true,subtree:true});
                                        setInterval(() => {removeJotformCaseyColumns(); injectJotformSearchButtons(); updateJotformStatusDisplayLabels(); consolidateJotformFilterTabs();},2000);}
