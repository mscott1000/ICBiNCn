/************************************************************
   * Case link parsing
   ************************************************************/
  function normalizeUrl(u) {try {const url = new URL(u,location.href);
                                 url.hash = '';
                                 return url.toString();}
                            catch {return String(u || '');}}

  function parseCaseFromUrl(u) {try {const url = new URL(u,location.href);
                                     const sp = url.searchParams;
                                     const caseNumber = sp.get('caseNumber') || sp.get('inputVO.caseNumber') || sp.get('ci') || '';
                                     const courtId = sp.get('courtId') || sp.get('inputVO.courtId') || sp.get('courtCode') || sp.get('l') || '';
                                     const cn = String(caseNumber || '').trim();
                                     const ct = String(courtId || '').trim();
                                     if (!cn || !ct) return null;
                                     const caseKey = `${cn.toUpperCase()}|${ct.toUpperCase()}`;
                                     return {caseKey,caseNumber:cn,courtId:ct,url:normalizeUrl(url.toString())};}
                              catch {return null;}}

  function getMatchingCaseLinksOnResultsPage() {const allLinks = Array.from(document.links);
                                               const hasCaseNumberParam = /caseNumber|inputVO\.caseNumber/i;
                                               const hasDigitsOrDash = /[0-9]{3,}|-/;
                                               const raw = allLinks.map((a) => a.href || '')
                                                                   .filter((href) => hasCaseNumberParam.test(href) && hasDigitsOrDash.test(href));
                                               const out = [];
                                               const seen = new Set();
                                               for (const h of raw) {const p = parseCaseFromUrl(h);
                                                                     if (!p) continue;
                                                                     if (seen.has(p.caseKey)) continue;
                                                                     seen.add(p.caseKey);
                                                                     out.push(p);}
                                               return out;}
