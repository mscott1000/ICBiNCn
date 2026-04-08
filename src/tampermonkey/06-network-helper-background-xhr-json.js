/************************************************************
   * Network helper (background XHR/JSON)
   ************************************************************/
  function looksLikeHtml(txt) {return /^\s*</.test(String(txt || ''));}

  function looksLikeJson(txt) {return /^\s*[{[]/.test(String(txt || ''));}

  async function postFormJson(pathOrUrl,formObj = {},{qs = ''} = {}) {const url = new URL(pathOrUrl,location.origin);
                                                                     if (qs) url.search = qs.startsWith('?') ? qs : `?${qs}`;
                                                                     const body = new URLSearchParams();
                                                                     for (const [k,v] of Object.entries(formObj || {})) {body.set(k,v === undefined || v === null ? '' : String(v));}
                                                                     const resp = await fetch(url.toString(),{method: 'POST',
                                                                                                            credentials: 'include',
                                                                                                            headers: {Accept: 'application/json,text/javascript, */*; q=0.01',
                                                                                                                      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                                                                                                                      'X-Requested-With': 'XMLHttpRequest',},
                                                                                                            body: body.toString(),});
                                                                     const txt = await resp.text();
                                                                     const ct = String(resp.headers.get('content-type') || '').toLowerCase();
                                                                     if (!resp.ok) {bumpNetStat(url.pathname,'httpErr');
                                                                                    dbg('http_error',{status: resp.status,path: url.pathname,preview: txt.slice(0,240)});
                                                                                    const err = new Error(`HTTP ${resp.status} for ${url.pathname}`);
                                                                                    err.status = resp.status;
                                                                                    err.path = url.pathname;
                                                                                    err.preview = txt.slice(0,240);
                                                                                    throw err;}
                                                                     if (looksLikeJson(txt)) {bumpNetStat(url.pathname,'json');
                                                                                              try {return JSON.parse(txt);}
                                                                                              catch {dbg('json_parse_error',{path: url.pathname,preview: txt.slice(0,240)});
                                                                                                     const err = new Error(`JSON parse failed for ${url.pathname}`);
                                                                                                     err.status = resp.status;
                                                                                                     err.path = url.pathname;
                                                                                                     throw err;}}
                                                                     if (looksLikeHtml(txt) || ct.includes('text/html')) {const title = extractHtmlTitle(txt);
                                                                                                                         const sig = htmlSignatures(txt);
                                                                                                                         const respUrl = String(resp.url || '');
                                                                                                                         const redirected = !!resp.redirected;
                                                                                                                         bumpNetStat(url.pathname,'html');
                                                                                                                         const maxStore = 250000;
                                                                                                                         saveLastHtml({ts: new Date().toISOString(),
                                                                                                                                       url: location.href,
                                                                                                                                       path: url.pathname,
                                                                                                                                       status: resp.status,
                                                                                                                                       ct,
                                                                                                                                       respUrl,
                                                                                                                                       redirected,
                                                                                                                                       title,
                                                                                                                                       sig,
                                                                                                                                       html: String(txt).slice(0,maxStore),});
                                                                                                                         dbg('html_instead_of_json',{path: url.pathname,
                                                                                                                                                    status: resp.status,
                                                                                                                                                    ct,
                                                                                                                                                    respUrl,
                                                                                                                                                    redirected,
                                                                                                                                                    title,
                                                                                                                                                    sig,
                                                                                                                                                    preview: txt.slice(0,240),});
                                                                                                                         const err = new Error(`HTML instead of JSON for ${url.pathname}`);
                                                                                                                         err.status = resp.status;
                                                                                                                         err.path = url.pathname;
                                                                                                                         err.retryable = true;
                                                                                                                         err.htmlTitle = title;
                                                                                                                         err.htmlSig = sig;
                                                                                                                         err.respUrl = respUrl;
                                                                                                                         err.redirected = redirected;
                                                                                                                         err.preview = txt.slice(0,2000);
                                                                                                                         throw err;}
                                                                     dbg('non_json_response',{path: url.pathname,status: resp.status,preview: txt.slice(0,240)});
                                                                     const err = new Error(`Non-JSON response for ${url.pathname}`);
                                                                     err.status = resp.status;
                                                                     err.path = url.pathname;
                                                                     err.retryable = true;
                                                                     throw err;}

  function isRetryableError(err) {const s = Number(err?.status || 0);
                                 if ([429,502,503,504].includes(s)) return true;
                                 if (err?.retryable === true) return true;
                                 const msg = String(err?.message || '');
                                 if (/HTML instead of JSON|Non-JSON response|JSON parse failed/i.test(msg)) return true;
                                 return false;}

  async function postFormJsonRetry(pathOrUrl,formObj = {},opts = {},retryCfg = {}) {const retries = Number(retryCfg.retries ?? 3);
                                                                                   const baseDelay = Number(retryCfg.baseDelay ?? 250);
                                                                                   let lastErr = null;
                                                                                   for (let attempt = 0;attempt <= retries;attempt++) {try {if (attempt > 0) {const jitter = Math.floor(Math.random() * 120);
                                                                                                                                             const delay = Math.min(2500,baseDelay * Math.pow(2,attempt - 1) + jitter);
                                                                                                                                             await sleep(delay);}
                                                                                                                                    return await postFormJson(pathOrUrl,formObj,opts);}
                                                                                                                               catch (e) {lastErr = e;
                                                                                                                                          dbg('post_retry_fail',{attempt,msg: String(e?.message || e),status: e?.status || ''});
                                                                                                                                          if (!isRetryableError(e) || attempt === retries) break;}}
                                                                                   throw lastErr;}

  async function postFormJsonRetry_tryCourtIds(pathOrUrl,formObj = {},opts = {},retryCfg = {}) {return await postFormJsonRetry(pathOrUrl,formObj,opts,retryCfg);}
