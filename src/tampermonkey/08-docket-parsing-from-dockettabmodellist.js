
  /************************************************************
   * Docket parsing from docketTabModelList
   ************************************************************/
  function toTitleish(s) {return String(s || '').toLowerCase()
                                         .replace(/\b([a-z])/g,(m) => m.toUpperCase())
                                         .replace(/\bOf\b/g,'of')
                                         .replace(/\bAnd\b/g,'and')
                                         .replace(/\bThe\b/g,'the');}

  function parseBondSummary(docketText) {const t = String(docketText || '');
                                        const m = t.match(/Bond\s*Amount\s*:\s*([0-9,]+(?:\.[0-9]{2})?)([\s\S]*)/i);
                                        if (!m) return '';
                                        const amt = m[1];
                                        let tail = (m[2] || '').trim();
                                        const stop = tail.search(/\b(DEFENDANT|FAILED|F\/T\/A|FTA|ISSUED|SERVED|RETURNED|FOR\s+[A-Z]|DOCUMENT\s+ID)\b/i);
                                        if (stop >= 0) tail = tail.slice(0,stop).trim();
                                        tail = tail.split(/—| - |;|\n/)[0].trim();
                                        tail = tail.replace(/\s+/g,' ').trim();
                                        const prettyTail = tail ? toTitleish(tail) : '';
                                        return `Bond Amount: ${amt}${prettyTail ? ` ${prettyTail}` : ''}`;}

  function docketEntryText(e) {const desc = norm(e?.docketDesc || '');
                               const txt = norm(e?.docketText || '');
                               return norm([desc,txt].filter(Boolean).join(' — '));}

  function findFirstWarrantOrSummons(docketList) {const isWarrant = (t) => /\bwarrant\b/i.test(t);
                                                 const isSummons = (t) => /\bsummons?\b|\bsummon\b|\bsummoned\b/i.test(t);
                                                 for (const e of docketList || []) {const desc = norm(e?.docketDesc || '');
                                                                                   const txt = norm(e?.docketText || '');
                                                                                   const hay = norm([desc,txt].filter(Boolean).join(' '));
                                                                                   if (!hay) continue;
                                                                                   if (isWarrant(hay) || isSummons(hay)) {const filingDate = norm(e?.filingDate || '');
                                                                                                                         const event = desc || (isWarrant(hay) ? 'Warrant' : 'Summons');
                                                                                                                         const bond = parseBondSummary(e?.docketText || '');
                                                                                                                         let sched = '';
                                                                                                                         const isRecalled = isWarrant(hay) && /(recalled|withdrawn)/i.test(hay);
                                                                                                                         if (isRecalled) {const s = (e?.associatedDocketScheduledInfo || [])[0];
                                                                                                                                          if (s?.associatedDate) {const t2 = norm(s?.associatedTime || '');
                                                                                                                                                                  const nm = norm(s?.associatedName || '');
                                                                                                                                                                  sched = [s.associatedDate,t2].filter(Boolean).join(' ') + (nm ? ` — ${nm}` : '');}
                                                                                                                                          else {const d2 = (e?.associatedDocketInfoDetails || [])[0]?.associatedDate || '';
                                                                                                                                                if (d2) sched = d2;}}
                                                                                                                         return {kind:isWarrant(hay) ? 'warrant' : 'summons',filingDate,event,bond,scheduledFor:sched};}}
                                                 return null;}

  function countFtas(docketList) {let count = 0;
                                 const dates = new Set();
                                 for (const e of docketList || []) {const line = docketEntryText(e);
                                                                   if (!line) continue;
                                                                   if (/\bFTA\b/i.test(line) || /Failure\s+to\s+Appear/i.test(line)) {count += 1;
                                                                                                                                    const d = norm(e?.filingDate || '');
                                                                                                                                    if (d) dates.add(d);}}
                                 return {count,dates:Array.from(dates)};}

  function findLicenseHoldDate(docketList) {for (const e of docketList || []) {const line = docketEntryText(e);
                                                                             if (!line) continue;
                                                                             const hasHold = /\bhold\b/i.test(line);
                                                                             const hasLicense = /\blicen[sc]e\b/i.test(line);
                                                                             if (hasHold && hasLicense) return norm(e?.filingDate || '') || '';}
                                            return '';}

  function findInitialAppearanceDate(docketList) {for (const e of docketList || []) {const line = docketEntryText(e);
                                                                                   if (!/Initial\s+Appearance/i.test(line)) continue;
                                                                                   const s = (e?.associatedDocketScheduledInfo || [])[0];
                                                                                   if (s?.associatedDate) return norm(s.associatedDate);
                                                                                   const d2 = (e?.associatedDocketInfoDetails || [])[0]?.associatedDate || '';
                                                                                   if (d2) return norm(d2);
                                                                                   return norm(e?.filingDate || '') || '';}
                                                  return '';}

  function findFirstCurrentOrFutureScheduledLine(docketList) {const today0 = new Date();
                                                             today0.setHours(0,0,0,0);
                                                             const items = [];
                                                             for (const e of docketList || []) {const arr = e?.associatedDocketScheduledInfo || [];
                                                                                               for (const s of arr) {const d = norm(s?.associatedDate || '');
                                                                                                                     if (!/^\d{2}\/\d{2}\/\d{4}$/.test(d)) continue;
                                                                                                                     const [mm,dd,yyyy] = d.split('/').map((n) => Number(n));
                                                                                                                     const dt = new Date(yyyy,mm - 1,dd);
                                                                                                                     dt.setHours(0,0,0,0);
                                                                                                                     const time = norm(s?.associatedTime || '');
                                                                                                                     const name = norm(s?.associatedName || '');
                                                                                                                     const loc = norm(s?.associatedText || '');
                                                                                                                     items.push({dt,d,time,name,loc});}}
                                                             items.sort((a,b) => a.dt.getTime() - b.dt.getTime());
                                                             const next = items.find((x) => x.dt.getTime() >= today0.getTime());
                                                             if (!next) return '- - -';
                                                             return `${next.d}; ${next.time || '- - -'}; ${next.name || '- - -'} ; ${next.loc || '- - -'}`;}
