
  /************************************************************
   * Helpers (storage / utils)
   ************************************************************/
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim();

  function loadJson(key, fallback) {try {const raw = GM_getValue(key, JSON.stringify(fallback));
                                        const parsed = JSON.parse(raw);
                                        return parsed === undefined || parsed === null ? fallback : parsed;}
                                   catch {return fallback;}}

  function saveJson(key, val) {GM_setValue(key, JSON.stringify(val));}

  const loadLog = () => loadJson(KEY_LOG, []);
  const saveLog = (arr) => saveJson(KEY_LOG, Array.isArray(arr) ? arr : []);

  const setRun = (v) => GM_setValue(KEY_RUN, v === true);
  const isRun = () => GM_getValue(KEY_RUN, false) === true;

  const setStop = (v) => GM_setValue(KEY_STOP, v === true);
  const isStop = () => GM_getValue(KEY_STOP, false) === true;

  const setStatus = (s) => GM_setValue(KEY_STATUS, String(s || ''));
  const getStatus = () => String(GM_getValue(KEY_STATUS, ''));

  function hasRealTitle(title) {const t = norm(title || '');
                                if (!t) return false;
                                if (t === '(- - -)') return false;
                                return true;}

  function loadDebug() {return loadJson(KEY_DEBUG, []);}

  function saveDebug(a) {saveJson(KEY_DEBUG, Array.isArray(a) ? a.slice(-DEBUG_MAX) : []);}

  function dbg(event, data = {}) {const row = {ts: new Date().toISOString(),
                                              event: String(event || ''),
                                              url: location.href,
                                              ...data,};
                                  const cur = loadDebug();
                                  cur.push(row);
                                  saveDebug(cur);}

  function saveLastHtml(obj) {saveJson(KEY_LAST_HTML, obj || null);}

  function loadLastHtml() {return loadJson(KEY_LAST_HTML, null);}

  function uniq(arr) {return [...new Set(arr.filter(Boolean))];}

  function getTabId() {try {let id = sessionStorage.getItem(TAB_ID_KEY);
                            if (!id) {id = `tab_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
                                     sessionStorage.setItem(TAB_ID_KEY,id);}
                            return id;}
                       catch {return `tab_fallback_${Math.random().toString(36).slice(2,10)}`;}}

  const TAB_ID = getTabId();

  function isJndiDatasourceError(err) {const msg = String(err?.message || '');
                                       const prev = String(err?.preview || '');
                                       const combined = `${msg} ${prev}`;
                                       return (/UNABLE\s+TO\s+LOCATE\s+JNDI\s+NAME\s+FOR\s+CT\d+/i.test(combined) ||
                                               /DataSourceLookupFailureException/i.test(combined) ||
                                               /PersistenceException/i.test(combined));}

  function bumpNetStat(path, field) {const st = loadJson(KEY_NET_STATS, { byPath: {} });
                                     st.byPath[path] = st.byPath[path] || { html: 0, json: 0, httpErr: 0 };
                                     st.byPath[path][field] = (st.byPath[path][field] || 0) + 1;
                                     saveJson(KEY_NET_STATS, st);}

  function extractHtmlTitle(html) {const m = String(html || '').match(/<title[^>]*>([\s\S]*?)<\/title>/i);
                                   return norm(m ? m[1] : '');}

  function htmlSignatures(html) {const t = String(html || '').toLowerCase();
                                 return {hasLogin: t.includes('login') && (t.includes('password') || t.includes('user')),
                                         hasHelpDesk: t.includes('osca') && t.includes('help desk'),
                                         hasErrorRetrieving: (t.includes('error retrieving') || t.includes('there was an error retrieving')),
                                         hasNameSearch: t.includes('namesearch') && t.includes('lastname'),
                                         hasCaseHeader: t.includes('case header') || t.includes('keyvaluesection'),
                                         hasCaptcha: t.includes('captcha'),
                                         hasAccessDenied: t.includes('access denied') || t.includes('not authorized'),};}

  function openLastHtmlInNewTab() {const obj = loadLastHtml();
                                  if (!obj?.html) {uiStatus('No captured HTML yet.');
                                                   return;}
                                  const blob = new Blob([obj.html], { type: 'text/html' });
                                  const url = URL.createObjectURL(blob);
                                  window.open(url, '_blank', 'noopener,noreferrer');}

  function loadDraft() {return loadJson(KEY_UI_DRAFT, { first: '', middle: '', last: '', yob: '' });}

  function saveDraft(d) {saveJson(KEY_UI_DRAFT, d || { first: '', middle: '', last: '', yob: '' });}

  function clearDraft() {saveDraft({ first: '', middle: '', last: '', yob: '' });}

  function clearLastHtml() {saveLastHtml(null);}

  function readUiParams() {return {first:  norm(document.getElementById('moNsFirst')?.value || ''),
                                  middle: norm(document.getElementById('moNsMiddle')?.value || ''),
                                  last:   norm(document.getElementById('moNsLast')?.value || ''),
                                  yob:    norm(document.getElementById('moNsYob')?.value || ''),};}

  function writeUiParams(p) {const x = p || {};
                             const set = (id, v) => {const el = document.getElementById(id);
                                                    if (!el) return;
                                                    el.value = String(v || '');};
                             set('moNsFirst', x.first);
                             set('moNsMiddle', x.middle);
                             set('moNsLast', x.last);
                             set('moNsYob', x.yob);}

  function gateNewSearch() {const logLen = loadLog().length;
                            const dbgLen = loadDebug().length;
                            if (logLen > 0 || dbgLen > 0) {uiStatus('Clear Log/Debug before starting a new Search.');
                                                           dbg('search_blocked_not_cleared', { logLen, dbgLen });
                                                           render();
                                                           return false;}
                            return true;}
