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
                                     if (!cn) return null;
                                     const caseKey = ct ? `${cn.toUpperCase()}|${ct.toUpperCase()}` : cn.toUpperCase();
                                     return {caseKey,caseNumber:cn,courtId:ct,url:normalizeUrl(url.toString())};}
                              catch {return null;}}
