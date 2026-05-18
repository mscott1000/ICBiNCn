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

  function normalizePhraseForMatch(text) {return norm(String(text || '')).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}

  function getDocketEntryTimestamp(e) {const filingDate = norm(e?.filingDate || '');
                                      let time = '';
                                      const sched = (e?.associatedDocketScheduledInfo || [])[0];
                                      if (sched?.associatedTime) time = norm(sched.associatedTime);
                                      const asDate = filingDate && /^\d{2}\/\d{2}\/\d{4}$/.test(filingDate) ? filingDate.split('/').map(Number) : null;
                                      if (!asDate) return Number.NEGATIVE_INFINITY;
                                      const [mm,dd,yyyy] = asDate;
                                      let hh = 0;
                                      let min = 0;
                                      const tm = time.match(/(\d{1,2}):(\d{2})\s*([AP]M)?/i);
                                      if (tm) {hh = Number(tm[1]) % 12;
                                               min = Number(tm[2]);
                                               const ap = String(tm[3] || '').toUpperCase();
                                               if (ap === 'PM') hh += 12;}
                                      return new Date(yyyy,mm - 1,dd,hh,min,0,0).getTime();}

  function isPaidInFullText(text) {return /\bpaid\s+in\s+full\b/i.test(String(text || ''));}

  function classifyLicenseHoldEvent(text) {const t = normalizePhraseForMatch(text);
                                          if (!t) return '';
                                          const hasHold = /\bhold\b/.test(t) || /\bheld\b/.test(t) || /\bhold\s+order\b/.test(t);
                                          const hasLicenseContext = /\blicen[sc]e\b/.test(t) || /\bdmv\b/.test(t) || /\bdor\b/.test(t) || /\bdriv(?:er|ing)\b/.test(t);
                                          if (!hasHold || !hasLicenseContext) return '';
                                          if (/\breleased\b/.test(t) || /\blifted\b/.test(t) || /\bremoved\b/.test(t)) return 'released';
                                          if (/\bplaced\b/.test(t)) return 'placed';
                                          if (/\bplace\b/.test(t)) return 'placed';
                                          return 'placed';}



  function findBondAmountFromDocketEntries(docketList) {for (const e of docketList || []) {const combined = `${norm(e?.docketDesc || '')} ${norm(e?.docketText || '')}`.trim();
                                                     if (!/bond\s*amount/i.test(combined)) continue;
                                                     const m = combined.match(/bond\s*amount\s*:?\s*\$?\s*([0-9][\d,]*(?:\.\d{1,2})?)/i);
                                                     if (!m) continue;
                                                     const n = Number(String(m[1] || '').replace(/,/g,''));
                                                     if (!Number.isFinite(n)) continue;
                                                     return n.toFixed(2);}
                                            return '';}

  function findFirstWarrantOrSummons(docketList) {const hasRecallOrServedLanguage = (t) => /\brecall\w*\b|\bserv\w*\b/i.test(t);
                                                 const isWarrant = (t) => /\bwarrant\b/i.test(t);
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
                                                                                                                         return {kind:isWarrant(hay) ? 'warrant' : 'summons',filingDate,event,bond,scheduledFor:sched,hasRecallOrServedLanguage:hasRecallOrServedLanguage(hay)};}}
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
                                                                             const hasHold = /\bhold\b/i.test(line) || /\bhold\s+order\b/i.test(line);
                                                                             const hasLicenseContext = /\blicen[sc]e\b/i.test(line) || /\bdmv\b/i.test(line) || /\bdor\b/i.test(line) || /\bdriv(?:er|ing)\b/i.test(line);
                                                                             if (hasHold && hasLicenseContext) return norm(e?.filingDate || '') || '';}
                                            return '';}

  function analyzeDocketStatus(docketList) {let paidInFull = false;
                                           let holdPlacedTs = Number.NEGATIVE_INFINITY;
                                           let holdReleasedTs = Number.NEGATIVE_INFINITY;
                                           for (const e of docketList || []) {const line = docketEntryText(e);
                                                                             if (!line) continue;
                                                                             if (isPaidInFullText(line)) paidInFull = true;
                                                                             const holdState = classifyLicenseHoldEvent(line);
                                                                             if (!holdState) continue;
                                                                             const ts = getDocketEntryTimestamp(e);
                                                                             if (holdState === 'placed' && ts >= holdPlacedTs) holdPlacedTs = ts;
                                                                             if (holdState === 'released' && ts >= holdReleasedTs) holdReleasedTs = ts;}
                                           const hasActiveHold = holdPlacedTs > Number.NEGATIVE_INFINITY && holdPlacedTs > holdReleasedTs && !paidInFull;
                                           return {paidInFull,hasActiveHold};}

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
