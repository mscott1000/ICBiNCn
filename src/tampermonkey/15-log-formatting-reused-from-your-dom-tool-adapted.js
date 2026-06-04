  function getMuniFieldFromDetail(detailText,label,nextLabels = []) {const raw = norm(detailText || '');
                                                                     if (!raw || !label) return '';
                                                                     const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
                                                                     const nextPattern = nextLabels.map((x) => x && x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).filter(Boolean).join('|');
                                                                     const regex = nextPattern
                                                                       ? new RegExp(`${escapedLabel}:\\s*([\\s\\S]*?)(?=\\s*(?:${nextPattern}):|$)`,'i')
                                                                       : new RegExp(`${escapedLabel}:\\s*([\\s\\S]*?)$`,'i');
                                                                     const m = raw.match(regex);
                                                                     return m?.[1] ? norm(m[1]) : '';}

  function getMuniSectionField(detailText,sectionLabel,fieldLabel,nextSections = []) {const raw = norm(detailText || '');
                                                                                        if (!raw || !sectionLabel || !fieldLabel) return '';
                                                                                        const esc = (txt) => txt.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
                                                                                        const nextPattern = nextSections.map((x) => esc(x || '')).filter(Boolean).join('|');
                                                                                        const sectionRegex = nextPattern
                                                                                          ? new RegExp(`${esc(sectionLabel)}\\s*([\\s\\S]*?)(?=\\s*(?:${nextPattern})\\b|$)`,'i')
                                                                                          : new RegExp(`${esc(sectionLabel)}\\s*([\\s\\S]*?)$`,'i');
                                                                                        const sectionMatch = raw.match(sectionRegex);
                                                                                        if (!sectionMatch?.[1]) return '';
                                                                                        const sectionText = norm(sectionMatch[1]);
                                                                                        const fieldRegex = new RegExp(`${esc(fieldLabel)}:\\s*([^\\n]*?)(?=\\s+[A-Z][A-Za-z ]{1,40}:|$)`,'i');
                                                                                        const fieldMatch = sectionText.match(fieldRegex);
                                                                                        return norm(fieldMatch?.[1] || '');}

  function trimAddressAfterZip(rawAddress) {const raw = norm(rawAddress || '');
                                            if (!raw) return '';
                                            const m = raw.match(/^([\s\S]*?\b\d{5}(?:-\d{4})?)(?:\b|$)/);
                                            return norm(m?.[1] || raw);}

  function getMuniPrimaryCaseNumber(e) {const fromCaseNumber = norm(String(e?.caseNumber || e?.ticketNumber || ''));
                                        if (fromCaseNumber && /^\d/.test(fromCaseNumber)) return fromCaseNumber;
                                        const fromKey = norm(String(e?.caseKey || '').split('|')[0]).replace(/[A-Z]$/i,'');
                                        if (fromKey && /^\d/.test(fromKey)) return fromKey;
                                        const fromTitle = norm(String(e?.caseTitle || ''));
                                        const titleMatch = fromTitle.match(/^(\d[\d-]*)\b/);
                                        return titleMatch?.[1] || '';}

  function getMuniCopyHeader(e) {const caseNo = getMuniPrimaryCaseNumber(e) || norm(getCaseNumberForSummary(e)).replace(/\s*\(municourt\)$/i,'');
                                 const location = norm(e?.location || '');
                                 const locationBase = location.replace(/\s+MUNICIPAL\s+COURT$/i,'')
                                                              .replace(/\s+MUNICIPAL$/i,'')
                                                              .trim();
                                 const locationLabel = (locationBase || location || '- - -').toUpperCase();
                                 return `${caseNo} - ${locationLabel} (municourt)`;}

  function applyMuniDetailFormatting(e) {if (e?._source !== 'municourt') return e;
                                         const detail = norm(e?.muniCaseDetailText || '');
                                         if (!detail) return e;
                                         const status = getMuniFieldFromDetail(detail,'Status',['Case #','Ticket #']);
                                         const bondAmount = getMuniFieldFromDetail(detail,'Bond Set Amount',['Website','Defendant']);
                                         const detailAddress = getMuniFieldFromDetail(detail,'Address',['Violation Information','Date/Time','Issuing Agency','Charge Information']);
                                         const address = trimAddressAfterZip(detailAddress || e.address);
                                         const birthYear = getMuniFieldFromDetail(detail,'Birth Year',['Address','Violation Information']) || e.yob;
                                         const attorney = getMuniSectionField(detail,'Defense Attorney Information','Name',['Case Filed Date','Original Court Date','Current Court Date']) || e.attorney;
                                         const caseFiledDate = getMuniFieldFromDetail(detail,'Case Filed Date',['Original Court Date','Current Court Date']) || e.dateFiled;
                                         const originalCourtDate = getMuniFieldFromDetail(detail,'Original Court Date',['Current Court Date']);
                                         const currentCourtDate = getMuniFieldFromDetail(detail,'Current Court Date',['Charge Information']) || e.nextDocketDate;
                                         const chargeDescriptionRaw = getMuniFieldFromDetail(detail,'Charge',['State Charge','Ordinance']);
                                         const chargeDescription = norm(chargeDescriptionRaw.replace(/^\d+\s+/,'') || '') || e.chargeDescription;
                                         const disposition = status || e.disposition;
                                         const ticketNumber = getMuniFieldFromDetail(detail,'Ticket #',['OCN','Court Name','Bond Set Amount']) || e.ticketNumber || '';
                                         const chargeType = getMuniFieldFromDetail(detail,'Ordinance',['Disposition Date','Plea']) ? 'Ordinance' : (e.chargeType || '- - -');
                                         const originalDateOnly = parseMuniDateOnly(originalCourtDate);
                                         const currentDateOnly = parseMuniDateOnly(currentCourtDate);
                                         return {...e,
                                           caseNumber: ticketNumber || e.caseNumber || e.caseKey || '',
                                           caseTitle: getMuniCopyHeader(e),
                                           dateFiled: caseFiledDate || '- - -',
                                           disposition: disposition || '- - -',
                                           caseBalance: e.caseBalance || '- - -',
                                           address: address || '- - -',
                                           yob: birthYear || '- - -',
                                           attorney: attorney || '- - -',
                                           warrantSummary: e.warrantSummary || originalDateOnly || '- - -',
                                           warrantEvent: e.warrantEvent || status || '- - -',
                                           event: status || e.event || '- - -',
                                           bondAmount: bondAmount || e.bondAmount || '- - -',
                                           ftaDates: [originalDateOnly || '- - -'],
                                           nextDocketDate: currentDateOnly || '- - -',
                                           chargeDescription: chargeDescription || '- - -',
                                           chargeType: chargeType || '- - -',
                                           chargeClass: e.chargeClass || '- - -',
                                           judge: e.judge || '- - -'};}

/************************************************************
   * Log formatting (reused from your DOM tool, adapted)
   ************************************************************/
  function parseWarrantSummaryFields(e) {const raw = norm(String(e?.warrantSummary || ''));
                                         const normalizeExtracted = (v) => {const out = norm(String(v || ''));
                                                                            return /^-\s*-\s*-$/.test(out) ? '' : out;};
                                         const toComparableDate = (rawDate) => {const m = String(rawDate || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
                                                                                 if (!m) return null;
                                                                                 const mm = Number(m[1]);
                                                                                 const dd = Number(m[2]);
                                                                                 const yyyy = Number(m[3]);
                                                                                 const d = new Date(yyyy,mm - 1,dd);
                                                                                 if (d.getFullYear() !== yyyy || d.getMonth() !== mm - 1 || d.getDate() !== dd) return null;
                                                                                 return d;};
                                         const today = new Date();
                                         today.setHours(0,0,0,0);
                                         const collectDates = (text) => {const out = [];
                                                                        const rx = /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g;
                                                                        let m;
                                                                        while ((m = rx.exec(String(text || '')))) out.push(m[0]);
                                                                        return out;};
                                         const mostRecentNonFutureDate = (dates) => {const valid = dates.map((d) => ({raw: d,dateObj: toComparableDate(d)}))
                                                                                                  .filter((x) => x.dateObj && x.dateObj <= today)
                                                                                                  .sort((a,b) => b.dateObj - a.dateObj);
                                                                                      return valid[0]?.raw || '';};
                                         const parsedDate = normalizeExtracted(e?.mostRecentWarrantDate);
                                         const parsedEvent = normalizeExtracted(e?.warrantEvent);
                                         const parsedBond = normalizeExtracted(e?.bondAmount);
                                         const parsedEventBondMatch = parsedEvent.match(/\bBond Amount:\s*([0-9][\d,]*(?:\.\d{2})?)/i);
                                         const parsedEventBond = normalizeExtracted(parsedEventBondMatch?.[1] || '');
                                         const fallback = {date: parsedDate || '- - -',event: parsedEvent || '- - -',bond: parsedBond || parsedEventBond || '- - -'};
                                         if (!raw || raw === '- - -') return fallback;
                                         const dateMatch = raw.match(/(?:^|\n)\s*Date:\s*([^\n]+)/i);
                                         const eventMatch = raw.match(/(?:^|\n)\s*Event:\s*([^\n]+)/i);
                                         const bondMatch = raw.match(/(?:^|\n)\s*(?:Bond(?: Amount)?):\s*([^\n]+)/i);
                                         const eventRaw = norm(eventMatch?.[1] || '');
                                         const eventBondMatch = eventRaw.match(/\bBond Amount:\s*\$?\s*([0-9][\d,]*(?:\.\d{1,2})?)/i);
                                         const rawBondMatch = raw.match(/\bBond Amount:\s*\$?\s*([0-9][\d,]*(?:\.\d{1,2})?)/i);
                                         const bondFromLine = normalizeExtracted(bondMatch?.[1] || '');
                                         const bondFromEvent = normalizeExtracted(eventBondMatch?.[1] || '');
                                         const bondFromRaw = normalizeExtracted(rawBondMatch?.[1] || '');
                                         const ftaDates = Array.isArray(e?.ftaDates) ? e.ftaDates : [];
                                         const allDateCandidates = [parsedDate,norm(dateMatch?.[1] || ''),...collectDates(eventRaw),...collectDates(raw),...ftaDates.flatMap((v) => collectDates(v))]
                                                                  .filter(Boolean);
                                         const resolvedDate = mostRecentNonFutureDate(allDateCandidates);
                                         return {date: resolvedDate || fallback.date,
                                                 event: parsedEvent || norm(eventMatch?.[1] || '') || (raw && raw !== '- - -' ? raw : fallback.event),
                                                 bond: parsedBond || bondFromLine || bondFromEvent || bondFromRaw || fallback.bond};}

  function appendDocketHash(url) {const raw = norm(url || '');
                                  if (!raw) return '';
                                  if (/^javascript:/i.test(raw)) return raw;
                                  try {const parsed = new URL(raw);
                                       parsed.hash = 'docket';
                                       return parsed.toString();}
                                  catch (_) {return raw.endsWith('#docket') ? raw : `${raw}#docket`;}}

  function extractBondAmountNumeric(rawValue) {const raw = norm(String(rawValue || ''));
                                               if (!raw || /^-\s*-\s*-$/.test(raw)) return '';
                                               const labelledMatch = raw.match(/\bBond Amount:\s*\$?\s*([0-9][\d,]*(?:\.\d{1,2})?)/i);
                                               const numberMatch = labelledMatch || raw.match(/\$?\s*([0-9][\d,]*(?:\.\d{1,2})?)/);
                                               const numericRaw = norm(numberMatch?.[1] || '').replace(/,/g,'');
                                               if (!numericRaw) return '';
                                               const amount = Number.parseFloat(numericRaw);
                                               if (!Number.isFinite(amount)) return '';
                                               return amount % 1 === 0 ? String(amount) : amount.toFixed(2).replace(/\.00$/,'');}

  function buildCopyFormatLine(e,warrantFields) {const caseNo = getMuniPrimaryCaseNumber(e) || norm(getCaseNumberForSummary(e)).replace(/\s*\(municourt\)$/i,'') || '- - -';
                                                  const warrantDate = warrantFields.date || '- - -';
                                                  const judge = e.judge || '- - -';
                                                  const chargeDescription = e.chargeDescription || '- - -';
                                                  const bondRaw = norm(String(warrantFields.bond || '- - -'));
                                                  const bond = extractBondAmountNumeric(bondRaw) || (bondRaw && !/^-\s*-\s*-$/.test(bondRaw) ? bondRaw : '- - -');
                                                  return `${caseNo}\t\t\t${warrantDate}\t\t\t${judge}\t\t\t\t${chargeDescription}\t\t${bond}`;}

  function parsePineLawnDismissalDate(value) {const raw = norm(String(value || ''));
                                              const m = raw.match(/\b(?:(\d{4})-(\d{1,2})-(\d{1,2})|(\d{1,2})\/(\d{1,2})\/(\d{2,4}))\b/);
                                              if (!m) return null;
                                              const yyyy = Number(m[1] || (String(m[6]).length === 2 ? `20${m[6]}` : m[6]));
                                              const mm = Number(m[2] || m[4]);
                                              const dd = Number(m[3] || m[5]);
                                              const d = new Date(yyyy,mm - 1,dd);
                                              if (d.getFullYear() !== yyyy || d.getMonth() !== mm - 1 || d.getDate() !== dd) return null;
                                              return d;}

  function isPineLawnDismissalDate(value) {const d = parsePineLawnDismissalDate(value);
                                           if (!d) return false;
                                           const cutoff = new Date(2023,11,31);
                                           cutoff.setHours(23,59,59,999);
                                           return d <= cutoff;}

  function isPineLawnCase(e) {const hay = [e?.location,e?.caseTitle,e?.caseKey,e?.muniSummaryRow,e?.muniCaseDetailText].map((v) => norm(String(v || ''))).join(' ');
                              return /\bPINE\s+LAWN\b/i.test(hay);}

  function getPineLawnDismissalCopyLine(e,warrantFields) {if (!isPineLawnCase(e)) return '';
                                                          const label = norm(String(getWarrantLabelForSummary(e) || '')).toLowerCase();
                                                          const explicit = norm(String(e?.summaryStatus || '')).toLowerCase();
                                                          const hasWarrant = /^warrant\b/.test(label) || /^warrant\b/.test(explicit);
                                                          const hasHold = label.includes('hold') || explicit.includes('hold');
                                                          if (hasWarrant && isPineLawnDismissalDate(warrantFields?.date || e?.mostRecentWarrantDate || e?.warrantSummary)) return 'Warrant/Hold dismissed/released';
                                                          if (hasHold && isPineLawnDismissalDate(e?.licenseHoldDate)) return 'Warrant/Hold dismissed/released';
                                                          return '';}

  function formatEntry(e) {const warrantFields = parseWarrantSummaryFields(e);
                           const pineLawnDismissalLine = getPineLawnDismissalCopyLine(e,warrantFields);
                           const lines = [e.caseTitle || '(- - -)'];
                           if (pineLawnDismissalLine) lines.push(pineLawnDismissalLine);
                           lines.push('',
                                         `Location: ${e.location || ''}`,
                                         `Date Filed: ${e.dateFiled || ''}`,
                                         `Disposition: ${e.disposition || ''}`,
                                         `Case Balance: ${e.caseBalance || ''}`,'',
                                         `Address: ${e.address || ''}`,
                                         `Year of Birth: ${e.yob || ''}`,
                                         `Attorney: ${e.attorney || ''}`,'',
                                         `Most Recent Warrant/Summons: ${warrantFields.date || '- - -'}`,
                                         `Event: ${warrantFields.event || '- - -'}`,
                                         `Bond Amount: ${warrantFields.bond || '- - -'}`,
                                         `FTA Dates: ${(e.ftaDates || []).join(', ')}`);
                         if (e.initialAppearanceDate) lines.push(`Initial Appearance: ${e.initialAppearanceDate}`);
                         if (e.licenseHoldDate) lines.push(`License Hold: ${e.licenseHoldDate}`);
                         lines.push(`Upcoming Court Dates: ${e.nextDocketDate || ''}`,'',
                                         `Charge Description: ${e.chargeDescription || ''}`,
                                         `Charge Type: ${e.chargeType || ''}`);
                         if (!/^-\s*-\s*-$/.test(norm(String(e.chargeClass || '')))) lines.push(`Charge Class: ${e.chargeClass || ''}`);
                         lines.push(`Judge: ${e.judge || ''}`);
                         const pleadAndPayTotal = e.pleadAndPayTotal || lookupPleadAndPayTotal(e) || '- - -';
                         if (!/^-\s*-\s*-$/.test(norm(String(pleadAndPayTotal)))) lines.push(`Plead and Pay Total: ${pleadAndPayTotal}`);
                         lines.push('','Copy Format:',buildCopyFormatLine(e,warrantFields),'');
                         if (e?._source !== 'municourt') lines.push(`CaseNet:\n${appendDocketHash(e.caseUrl || '')}\n`);
                         lines.push('','','');
                         if (e?._source === 'municourt' && norm(e?.muniCaseDetailText || '')) lines.push('MuniCourt Detail:',e.muniCaseDetailText,'','','');
                         return lines.join('\n');}

  function getCopySectionHeader(jurisdiction) {const rawHeader = getMunicipalityHeaderForSummary(jurisdiction,'') || jurisdiction.toUpperCase();
                                               return norm(rawHeader.replace(/\s*-\s*(?:\(?\d{3}\)?[\s\d\-\.\(\)A-Z;']+|FRESH START FRIDAYS?)\s*$/i,'')) || rawHeader;}

  function buildGroupedCopyText() {const log = loadLog();
                                  const expected = norm(document.getElementById('moNsYob')?.value || '');
                                  const filteredLog = log.filter((e) => {const m = yobMatchesExpected(expected,e?.yobRaw || e?.yob || '');
                                                                         return m.ok;});
                                  const byJurisdiction = new Map();
                                  for (const e of filteredLog) {const jurisdiction = norm(e?.location || '') || '- - -';
                                                                if (!byJurisdiction.has(jurisdiction)) byJurisdiction.set(jurisdiction,[]);
                                                                byJurisdiction.get(jurisdiction).push(e);}
                                  const sortedJurisdictions = Array.from(byJurisdiction.entries())
                                                                   .map(([jurisdiction,entries],idx) => ({jurisdiction,entries,idx,score: getJurisdictionScore(entries)}))
                                                                   .sort((a,b) => {const scoreDiff = b.score - a.score;
                                                                                   if (scoreDiff) return scoreDiff;
                                                                                   return a.idx - b.idx;});
                                  const eligibleJurisdictions = [];
                                  const ineligibleJurisdictions = [];
                                  for (const jurisdictionEntry of sortedJurisdictions) {if (isEligibleSummaryJurisdiction(jurisdictionEntry.jurisdiction)) eligibleJurisdictions.push(jurisdictionEntry);
                                                                                         else ineligibleJurisdictions.push(jurisdictionEntry);}
                                  const sections = [];
                                  function appendSections(jurisdictions) {for (const {entries} of jurisdictions) {
                                                                                                                                const sortedEntries = entries.map((entry,idx) => ({entry,idx}))
                                                                                                                                                           .sort((a,b) => {const priorityDiff = getSummaryStatusPriority(a.entry) - getSummaryStatusPriority(b.entry);
                                                                                                                                                                           if (priorityDiff) return priorityDiff;
                                                                                                                                                                           return a.idx - b.idx;})
                                                                                                                                                           .map(({entry}) => entry);
                                                                                                                                for (const entry of sortedEntries) sections.push(formatEntry(applyMuniDetailFormatting(entry)),'','');
                                                                                                                                sections.push('','','','');}}
                                  appendSections(eligibleJurisdictions);
                                  appendSections(ineligibleJurisdictions);
                                  return sections.join('\n').trim();}



  const MUNICIPALITY_CONTACTS_RAW = `ARNOLD MUNICIPAL - (636) 296-0595
BALLWIN MUNICIPAL - (636) 227-9468
BELLA VILLA MUNICIPAL - (314) 638-8840
BELLEFONTAINE NEIGHBORS MUNICIPAL - (314) 867-0076
BEL-RIDGE MUNICIPAL - (314) 429-2878 EXT. 200
BERKELEY MUNICIPAL - (314) 524-3313
BELLERIVE ACRES (OPERATES IN NORMANDY MUNICIPAL) - (314) 385-3300
BEL-NOR MUNICIPAL - (314) 381-2834 EXT 3
BEVERLY HILLS (OPERATES IN ST. ANN MUNICIPAL) - (314) 428-6811 EXT 5
BRENTWOOD MUNICIPAL - (314) 963-8623
BEVERLY HILLS MUNICIPAL - (314) 382-6544
BLACK JACK MUNICIPAL - (314) 355-0401
BOONVILLE MUNICIPAL - 660-882-2332
BRECKENRIDGE HILLS MUNICIPAL - (314) 427-1412
BRIDGETON MUNICIPAL - (314) 739-1145
CALVERTON PARK MUNICIPAL - (314) 801-8475
CALLAWAY COUNTY CIRCUIT - (573) 642-0780
CAMDEN CIRCUIT - (573) 346-4440
CAPE GIRARDEAU MUNICIPAL - (573) 339-6323
CASS COUNTY CIRCUIT - 816-380-8227
CHAMP MUNICIPAL - (314) 291-6036
CHARLACK MUNICIPAL (OPERATES IN ST. ANN MUNICIPAL) - (314) 428-6811 EXT 5
CHESTERFIELD MUNICIPAL - (636) 537-4000
CLARKSON VALLEY MUNICIPAL - (636) 537-4718
CLAYTON MUNICIPAL - (314) 290-8441
COOL VALLEY (OPERATES IN NORMANDY MUNICIPAL) - (314) 385-3300 EXT. 3029
COUNTRY CLUB HILLS (OPERATES IN NORMANDY MUNICIPAL) - (314) 385-3300 EXT. 3029
COUNTRY LIFE ACRES (OPERATES IN TOWN AND COUNTRY MUNICIPAL) - (314) 432-1420
CRESTWOOD MUNICIPAL - (314) 729-4776
CREVE COEUR MUNICIPAL - (314) 432-8844
CRYSTAL LAKE PARK (OPERATES IN FRONTENAC MUNICIPAL) - (314) 994-3204
DELLWOOD MUNICIPAL - (314) 521-4339
DES PERES MUNICIPAL - (314) 835-6117
EDMUNDSON MUNICIPAL (OPERATES IN ST. ANN MUNICIPAL) - (314) 428-6811 EXT 5
ELLISVILLE MUNICIPAL - (636) 227-3729
EUREKA MUNICIPAL - (636) 549-1828
FENTON MUNICIPAL - (636) 343-1007
FERGUSON MUNICIPAL - (314) 524-5264
FESTUS MUNICIPAL - (636) 797-5303
FLORISSANT MUNICIPAL - (314) 921-3322
FLORDELL HILLS (OPERATES IN ST. ANN MUNICIPAL) - (314) 428-6811 EXT 5
FRONTENAC MUNICIPAL - (314) 994-3204
GLENDALE MUNICIPAL - (314) 909-3003
GLEN ECHO PARK (OPERATES IN NORMANDY MUNICIPAL) - (314) 333-3200
GRANTWOOD VILLAGE MUNICIPAL - (314) 842-4409 OPTION 3
GREENDALE (OPERATES IN PAGEDALE MUNICIPAL) - (314) 726-1200 EXT. 2
GREEN PARK (OPERATES IN ST. LOUIS COUNTY MUNICIPAL) - FRESH START FRIDAYS
HANLEY HILLS (OPERATES IN ST. ANN CONSOLIDATED MUNICIPAL) - (314) 428-6811 EXT 5
HAZELWOOD MUNICIPAL - (314) 839-2212 EXT 0
HILLSBORO MUNICIPAL - (636) 797-5303
HILLSDALE (OPERATES IN NORMANDY MUNICIPAL) - (314) 385-3300 EXT. 3029
HUNTLEIGH MUNICIPAL - (314) 446-4248
JACKSON COUNTY MUNICIPAL - 740-286-2718
JEFFERSON COUNTY MUNICIPAL - TICKET FROM SHERIFF'S DEPT: (636) 797-6265; TICKET FROM ANY OTHER OFFICER: 636-797-5303
JENNINGS MUNICIPAL - (314) 385-4670
KANSAS CITY MUNICIPAL - (816) 513-2700
KINLOCH (OPERATES IN ST. LOUIS COUNTY CIRCUIT, DIV 21) - (314) 615-8029
KIRKWOOD MUNICIPAL - (314) 822-5840
LADUE MUNICIPAL - (314) 993-3919
LAKESHIRE MUNICIPAL - (314) 631-6222
LEE'S SUMMIT MUNICIPAL - 816-969-1160
MACON MUNICIPAL - 660-385-4631
MADISON CIRCUIT - (618) 692-6240
MANCHESTER MUNICIPAL - (636) 207-2832
MAPLEWOOD MUNICIPAL - (314) 646-3636
MARLBOROUGH (OPERATES IN ST. LOUIS COUNTY MUNICIPAL) - FRESH START FRIDAYS
MARYLAND HEIGHTS MUNICIPAL - (314) 291-6036
MOLINE ACRES (OPERATES IN BERKELEY MUNICIPAL) - (314) 524-3313
NEOSHO MUNICIPAL - (417) 451-8007
NORMANDY MUNICIPAL - (314) 385-3300 EXT. 3029
NORTHWOODS (OPERATES IN ST. ANN CONSOLIDATED MUNICIPAL) - (314) 428-6811 EXT 5
NORWOOD COURT (OPERATES IN ST. LOUIS COUNTY MUNICIPAL) - FRESH START FRIDAYS
O'FALLON MUNICIPAL - (636) 240-8766
OAKLAND (OPERATES IN GLENDALE MUNICIPAL) - (314) 909-3003
OLIVETTE MUNICIPAL - (314) 991-6047
OSAGE BEACH MUNICIPAL - (573) 302-2000
OSAGE COUNTY MUNICIPAL - (573) 897-3114
OVERLAND (OPERATES IN ST. ANN MUNICIPAL) - (314) 428-6811 EXT 5
PACIFIC MUNICIPAL - (636) 257-4553
PAGEDALE MUNICIPAL - (314) 726-1200 EXT. 2
PASADENA HILLS (OPERATES IN ST. LOUIS COUNTY MUNICIPAL) - FRESH START FRIDAYS
PASADENA PARK (OPERATES IN NORMANDY MUNICIPAL) - (314) 385-3300 EXT. 3029
PINE LAWN (OPERATES IN ST. LOUIS COUNTY CIRCUIT, DIV 21) - (314) 615-4823
RICHMOND HEIGHTS MUNICIPAL - (314) 645-1982 EXT. 3
RIVERVIEW MUNICIPAL - (314) 868-0700
ROCK HILL MUNICIPAL - (314) 962-6265
ROGERSVILLE MUNICIPAL - 417-753-2884 X 321
SHREWSBURY MUNICIPAL - (314) 647-8634 EXT. 5
ST. ANN MUNICIPAL - (314) 428-6811 EXT 5
ST. CHARLES CITY MUNICIPAL - (636) 949-3378
ST. CHARLES COUNTY CIRCUIT - (636) 949-3080
ST. CHARLES COUNTY MUNICIPAL - (314) 949-1833
ST. FRANCOIS CIRCUIT - (573) 756-5755
ST. JOHN (OPERATES IN ST. LOUIS COUNTY MUNICIPAL) - FRESH START FRIDAYS
ST. LOUIS COUNTY CIRCUIT, DIV 1 - Judge BRIAN H. MAY - - Court Clerk: (314) 615-1501 - -
ST. LOUIS COUNTY CIRCUIT, DIV 2 - Judge RICHARD M. STEWART - - Court Clerk: (314) 615-1502 - -
ST. LOUIS COUNTY CIRCUIT, DIV 3 - Judge HEATHER R. CUNNINGHAM - - Court Clerk: (314) 615-1503 - -
ST. LOUIS COUNTY CIRCUIT, DIV 4 - Judge JEFFREY P. MEDLER - - Court Clerk: (314) 615-1504 - -
ST. LOUIS COUNTY CIRCUIT, DIV 5 - Judge NICOLE S. ZELLWEGER - - Court Clerk: (314) 615-1505 - -
ST. LOUIS COUNTY CIRCUIT, DIV 6 - Judge JOHN N. BORBONUS - - Court Clerk: (314) 615-1506 - -
ST. LOUIS COUNTY CIRCUIT, DIV 7 - Judge MARY ELIZABETH OTT - - Court Clerk: (314) 615-1507 - -
ST. LOUIS COUNTY CIRCUIT, DIV 8 - Judge AMANDA B. MCNELLEY - - Court Clerk: (314) 615-1508 - -
ST. LOUIS COUNTY CIRCUIT, DIV 9 - Judge DAVID LEE VINCENT, III - - Court Clerk: (314) 615-1509 - -
ST. LOUIS COUNTY CIRCUIT, DIV 10 - Judge JASON D. DODSON - - Court Clerk: (314) 615-1510 - -
ST. LOUIS COUNTY CIRCUIT, DIV 11 - Judge ELLEN SUE LEVY - - Court Clerk: (314) 615-1511 - -
ST. LOUIS COUNTY CIRCUIT, DIV 12 - Judge STANLEY J. WALLACH - - Court Clerk: (314) 615-1512 - -
ST. LOUIS COUNTY CIRCUIT, DIV 13 - Judge BRUCE F. HILTON - - Court Clerk: (314) 615-1513 - -
ST. LOUIS COUNTY CIRCUIT, DIV 14 - Judge KRISTINE ALLEN KERR - - Court Clerk: (314) 615-1514 - -
ST. LOUIS COUNTY CIRCUIT, DIV 15 - Judge JOHN R. LASATER - - Court Clerk: (314) 615-1515 - -
ST. LOUIS COUNTY CIRCUIT, DIV 16 - Judge JEFFERY T. MCPHERSON - - Court Clerk: (314) 615-1516 - -
ST. LOUIS COUNTY CIRCUIT, DIV 17 - Judge LORNE J. BAKER - - Court Clerk: (314) 615-1517 - -
ST. LOUIS COUNTY CIRCUIT, DIV 18 - Judge ELLEN H. RIBAUDO - - Court Clerk: (314) 615-1518 - -
ST. LOUIS COUNTY CIRCUIT, DIV 19 - Judge BRIDGET L. HALQUIST - - Court Clerk: (314) 615-1519 - -
ST. LOUIS COUNTY CIRCUIT, DIV 20 - Judge MATTHEW HEARNE - - Court Clerk: (314) 615-1520 - -
ST. LOUIS COUNTY CIRCUIT, DIV 21 - Judge ELLEN W. DUNNE - - Court Clerk: (314) 615-1521 - -
ST. LOUIS COUNTY CIRCUIT, DIV 22 - Judge MEGAN JULIAN - - Court Clerk: (314) 615-1522 - -
ST. LOUIS COUNTY CIRCUIT, DIV 31 - Judge JASON A. DENNEY - - Court Clerk: (314) 615-1531 - -
ST. LOUIS COUNTY CIRCUIT, DIV 32 - Judge JULIA PUSATERI LASATER - - Court Clerk: (314) 615-1532 - -
ST. LOUIS COUNTY CIRCUIT, DIV 33 - Judge NICOLETTE A. KLAPP - - Court Clerk: (314) 615-1533 - -
ST. LOUIS COUNTY CIRCUIT, DIV 34 - Judge JUSTIN W. RUTH - - Court Clerk: (314) 615-1534 - -
ST. LOUIS COUNTY CIRCUIT, DIV 35 - Judge JASON K. LEWIS - - Court Clerk: (314) 615-1535 - -
ST. LOUIS COUNTY CIRCUIT, DIV 36 - Judge JOSEPH L. GREEN - - Court Clerk: (314) 615-1536 - -
ST. LOUIS COUNTY CIRCUIT, DIV 37 - Judge DANIEL J. KERTZ - - Court Clerk: (314) 615-1537 - -
ST. LOUIS COUNTY CIRCUIT, DIV 38 - Judge NATALIE P. WARNER - - Court Clerk: (314) 615-1538 - -
ST. LOUIS COUNTY CIRCUIT, DIV 39 - Judge KELLY SNYDER - - Court Clerk: (314) 615-1539 - -
ST. LOUIS COUNTY CIRCUIT, DIV 40 - Judge JOHN NEWSHAM - - Court Clerk: (314) 615-1540 - -
ST. LOUIS COUNTY CIRCUIT, DIV 41 - Judge KRISTA S. PEYTON - - Court Clerk: (314) 615-1541 - -
ST. LOUIS COUNTY CIRCUIT, DIV 42 - Judge ROBERT M. HEGGIE - - Court Clerk: (314) 615-1542 - -
ST. LOUIS COUNTY CIRCUIT, DIV 43 - Judge MONDONNA L. GHASEDI - - Court Clerk: (314) 615-1543 - -
ST. LOUIS COUNTY CIRCUIT, DIV 44 - Judge CHASTIDY DILLON-AMELUNG - - Court Clerk: (314) 615-1544 - -
ST. LOUIS COUNTY CIRCUIT, DIV 46 - Judge TORY D. BERNSEN - - Court Clerk: (314) 615-1546 - -
ST. LOUIS COUNTY CIRCUIT, DIV 47 - Judge NICOLE CHIRAVOLLATTI - - Court Clerk: (314) 615-1547 - -
ST. LOUIS COUNTY CIRCUIT, DIV 61 - Judge JENNIFER C. HOFFMAN - - Court Clerk: (314) 615-1561 - -
ST. LOUIS COUNTY CIRCUIT, DIV 62 - Judge CATHERINE W. KEEFE - - Court Clerk: (314) 615-1562 - -
ST. LOUIS COUNTY CIRCUIT, DIV 63 - Judge BRANDI R. MILLER - - Court Clerk: (314) 615-1563 - -
ST. LOUIS COUNTY CIRCUIT, DIV 64 - Judge TERRI JOHNSON - - Court Clerk: (314) 615-1564 - -
ST. LOUIS COUNTY CIRCUIT, DIV 65 - Judge MARY GREAVES - - Court Clerk: (314) 615-1565 - -
ST. LOUIS COUNTY CIRCUIT, DIV 66 - Judge WILLIAM J. GUST - - Court Clerk: (314) 615-7565 - -
ST. LOUIS COUNTY CIRCUIT, DIV 67 - Judge MISTY WATSON - - Court Clerk: (314) 615-2624 - -
ST. LOUIS COUNTY CIRCUIT, DIV 68 - Judge VACANT - - Court Clerk: (314) 615-1568 - -
ST. LOUIS COUNTY MUNICIPAL - FRESH START FRIDAYS
ST. GENEVIEVE MUNICIPAL - (573)883-2705
ST. GEORGE (OPERATES IN ST. LOUIS COUNTY MUNICIPAL) - FRESH START FRIDAYS
ST. PETERS MUNICIPAL - (314) 279-8280
TOWN AND COUNTRY MUNICIPAL - (314) 432-1420
TROY MUNICIPAL - (636) 528-6179
TWIN OAKS (OPERATES IN ST. LOUIS COUNTY MUNICIPAL) - FRESH START FRIDAYS
UNIVERSITY CITY MUNICIPAL - (314) 505-8578
UPLANDS PARK (OPERATES IN VELDA VILLAGE HILLS MUNICIPAL) - (314) 261-7221
VALLEY PARK MUNICIPAL - (636) 225-5696
VELDA CITY (OPERATES IN PAGEDALE MUNICIPAL) - (314) 726-1200 EXT. 2
VELDA VILLAGE HILLS MUNICIPAL - (314) 261-7221
VINITA PARK (OPERATES IN ST. ANN MUNICIPAL) - (314) 428-6811 EXT 5
WARSON WOODS (OPERATES IN GLENDALE MUNICIPAL) - (314) 909-3003
WEBSTER GROVES MUNICIPAL - (314) 963-5416
WELLSTON (OPERATES IN ST. ANN MUNICIPAL) - (314) 428-6811 EXT 5
WENTZVILLE MUNICIPAL - (636) 639-2193
WESTWOOD (OPERATES IN FRONTENAC MUNICIPAL) - (314) 994-3204
WILBUR PARK MUNICIPAL - (314) 800-6593
WILDWOOD MUNICIPAL - (636) 458-8277
WINCHESTER (OPERATES IN BALLWIN MUNICIPAL) - (636) 227-9468
WOODSON TERRACE MUNICIPAL - (314) 427-2600
WRIGHT CITY MUNICIPAL - (636) 745-1025
SUNSET HILLS MUNICIPAL - (314) 849-3402
SYCAMORE HILLS (OPERATES IN ST. JOHN MUNICIPAL) - (314) 427-8700 EXT. 6`;

  function municipalityKey(v) {return norm(v).toUpperCase().replace(/\s+/g,' ').trim();}

  function municipalityLooseKey(v) {return municipalityKey(v).replace(/\([^)]*\)/g,' ').replace(/[.,]/g,' ').replace(/\s+/g,' ').trim();}

  function municipalityMatchKey(v) {const loose = municipalityLooseKey(v);
                                    if (!loose) return '';
                                    const tokens = loose.split(' ').filter(Boolean).map((tok) => {if (tok === 'CO') return 'COUNTY';
                                                                                                   if (tok === 'MUNI' || tok === 'MUN') return 'MUNICIPAL';
                                                                                                   if (tok === 'SAINT') return 'ST';
                                                                                                   return tok;});
                                    return tokens.join(' ');}

  function normalizeJudgeName(v) {const raw = municipalityKey(v);
                                  if (!raw) return '';
                                  const extracted = (() => {const afterAssigned = raw.match(/ASSIGNED\s*([A-Z,.\s]+)/);
                                                             if (afterAssigned?.[1]) return afterAssigned[1];
                                                             const commissionerMatch = raw.match(/JUDGE\/COMMISSIONER\s*ASSIGNED\s*([A-Z,.\s]+)/);
                                                             if (commissionerMatch?.[1]) return commissionerMatch[1];
                                                             return raw;})();
                                  const withoutNoise = extracted.replace(/\bDATE\s+FILED\b[\s\S]*$/,'')
                                                               .replace(/\bLOCATION\b[\s\S]*$/,'')
                                                               .replace(/\bCASE\s+TYPE\b[\s\S]*$/,'')
                                                               .replace(/JUDGE\/COMMISSIONER\s*ASSIGNED/,'')
                                                               .replace(/^JUDGE\s+/,'');
                                  const scrubbed = withoutNoise.replace(/[^A-Z,.\s]/g,' ').replace(/\s+/g,' ').trim();
                                  if (!scrubbed) return '';
                                  const withoutSuffix = scrubbed.replace(/\b(JR|SR|II|III|IV|V)\b/g,' ').replace(/\s+/g,' ').trim();
                                  const commaMatch = withoutSuffix.match(/^([^,]+),\s*(.+)$/);
                                  if (commaMatch) {const last = norm(commaMatch[1]);
                                                   const rest = norm(commaMatch[2]);
                                                   return municipalityKey(`${rest} ${last}`);}
                                  return municipalityKey(withoutSuffix.replace(/,/g,' '));}

  function formatJudgeDisplayName(v) {const normalized = normalizeJudgeName(v);
                                      if (!normalized) return '';
                                      return normalized;}

  function judgeNameTokens(v) {return normalizeJudgeName(v).split(' ').filter(Boolean);}

  function judgeNamesMatch(a,b) {const ak = normalizeJudgeName(a);
                                 const bk = normalizeJudgeName(b);
                                 if (!ak || !bk) return false;
                                 if (ak === bk) return true;
                                 const at = judgeNameTokens(ak);
                                 const bt = judgeNameTokens(bk);
                                 if (at.length < 2 || bt.length < 2) return false;
                                 return at[0] === bt[0] && at[at.length - 1] === bt[bt.length - 1];}

  function isStLouisCountyCircuitHeader(header) {return municipalityMatchKey(header).includes('ST LOUIS COUNTY CIRCUIT');}

  function abbreviateJudgeMiddleNames(v) {const normalized = formatJudgeDisplayName(v);
                                           if (!normalized) return '';
                                           const suffixes = new Set(['JR','SR','II','III','IV','V']);
                                           const parts = normalized.split(' ').filter(Boolean);
                                           if (parts.length <= 2) return normalized;
                                           const first = parts[0];
                                           const lastParts = [];
                                           while (parts.length > 1 && suffixes.has(parts[parts.length - 1].replace(/\./g,''))) lastParts.unshift(parts.pop());
                                           const last = parts.pop();
                                           const middle = parts.slice(1).map((part) => `${part.charAt(0)}.`);
                                           return [first,...middle,last,...lastParts].filter(Boolean).join(' ');}

  function getStLouisCountyCircuitHeaderParts(header,fallbackJudge = '') {const raw = String(header || '');
                                                                       const firstLine = norm(raw.split('\n')[0] || '');
                                                                       const clerkMatch = raw.match(/Court\s+Clerk:\s*([^\n]*?)(?=\s*-\s*-|$)/i);
                                                                       const clerk = norm(clerkMatch?.[1] || '');
                                                                       const divisionMatch = firstLine.match(/\bDIV(?:ISION)?\s+(\d+[A-Z]?)\b/i);
                                                                       const judgeMatch = firstLine.match(/\bJudge\s+(.+)$/i);
                                                                       return {firstLine,
                                                                               clerk,
                                                                               division: divisionMatch ? divisionMatch[1] : '',
                                                                               judge: abbreviateJudgeMiddleNames(judgeMatch?.[1] || fallbackJudge)};}

  function formatStLouisCountyCircuitHeader(header) {const {firstLine,clerk} = getStLouisCountyCircuitHeaderParts(header);
                                                    return clerk ? `${firstLine}\n- - Court Clerk: ${clerk} - -` : firstLine;}

  function formatStLouisCountyCircuitJudgeSubheader(header,fallbackJudge = '') {const {division,judge,clerk} = getStLouisCountyCircuitHeaderParts(header,fallbackJudge);
                                                                               const divisionText = division ? `DIV ${division}` : 'DIV';
                                                                               const judgeText = judge ? `, Judge ${judge}` : '';
                                                                               const clerkText = clerk ? ` - Court Clerk: ${clerk}` : '';
                                                                               return `- ${divisionText}${judgeText}${clerkText} -`;}

  function groupedHasStLouisCountyCircuitHeaders(grouped) {for (const header of grouped.keys()) {if (isStLouisCountyCircuitHeader(header)) return true;}
                                                          return false;}

  function shouldIncludeJudgeDetails(jurisdiction) {const key = municipalityKey(jurisdiction);
                                                    if (!key) return false;
                                                    if (key.includes('CIRCUIT')) return true;
                                                    if (key.includes('CITY OF ST. LOUIS MUNICIPAL') || key.includes('CITY OF ST LOUIS MUNICIPAL')) return true;
                                                    if (key === 'CITY OF ST. LOUIS' || key === 'CITY OF ST LOUIS') return true;
                                                    if (key.includes('ST. LOUIS COUNTY') || key.includes('ST LOUIS COUNTY')) return true;
                                                    return false;}




  function parseMunicipalityLine(line) {const trimmed = String(line || '').trim();
                                      if (!trimmed) return null;
                                      const clerkLineMatch = trimmed.match(/^(.*?)\s*-\s*-\s*Court\s+Clerk:\s*(.*?)\s*-\s*-\s*$/i) || trimmed.match(/^(.*?)\s*-\s*Court\s+Clerk:\s*(.+)$/i);
                                      const lineWithoutClerk = clerkLineMatch ? norm(clerkLineMatch[1]) : trimmed;
                                      const clerk = clerkLineMatch ? norm(clerkLineMatch[2]).replace(/\s*-\s*-\s*$/,'') : '';
                                      const baseAndJudgeMatch = lineWithoutClerk.match(/^(.*?)\s*-\s*Judge\s+(.+)$/i);
                                      const baseLine = baseAndJudgeMatch ? norm(baseAndJudgeMatch[1]) : lineWithoutClerk;
                                      const judgeTag = baseAndJudgeMatch ? formatJudgeDisplayName(baseAndJudgeMatch[2]) : '';
                                      const base = baseLine.split(' - ')[0].trim();
                                      const key = municipalityKey(base);
                                      if (!key) return null;
                                      const display = judgeTag ? `${base} - Judge ${judgeTag}` : baseLine;
                                      const displayWithClerk = clerk ? isStLouisCountyCircuitHeader(display) ? `${display}\n- - Court Clerk: ${clerk} - -` : `${display}\nCourt Clerk: ${clerk}` : display;
                                      const divisionMatch = base.match(/\bDIV(?:ISION)?\s+(\d+[A-Z]?)\b/i);
                                      return {raw: trimmed,
                                              display: displayWithClerk,
                                              displayWithJudge: displayWithClerk,
                                              key,
                                              looseKey: municipalityLooseKey(base),
                                              matchKey: municipalityMatchKey(base),
                                              judgeKey: judgeTag ? normalizeJudgeName(judgeTag) : '',
                                              judgeDisplay: judgeTag,
                                              clerk,
                                              division: divisionMatch ? divisionMatch[1] : '',
                                              courtBase: norm(base.replace(/,\s*DIV(?:ISION)?\s+\d+[A-Z]?\b/i,'')).trim()};}

  function parseMunicipalityContacts(raw) {const map = new Map();
                                           const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
                                           const merged = [];
                                           for (const line of lines) {if (/^Court\s+Clerk:/i.test(line) && merged.length) merged[merged.length - 1] = `${merged[merged.length - 1]} - ${line}`;
                                                                     else merged.push(line);}
                                           for (const line of merged) {const parsed = parseMunicipalityLine(line);
                                                                       if (!parsed) continue;
                                                                       if (!map.has(parsed.key)) map.set(parsed.key,[]);
                                                                       map.get(parsed.key).push(parsed);}
                                           return map;}


  const MUNICIPALITY_CONTACTS = parseMunicipalityContacts(MUNICIPALITY_CONTACTS_RAW);

  function getMunicipalityHeaderForSummary(jurisdiction,judgeName = '') {const key = municipalityKey(jurisdiction);
                                                                        if (!key) return '';
                                                                        const looseKey = municipalityLooseKey(jurisdiction);
                                                                        const matchKey = municipalityMatchKey(jurisdiction);
                                                                        const candidateKeys = [key];
                                                                        if (!/ MUNICIPAL$/.test(key)) candidateKeys.push(`${key} MUNICIPAL`);
                                                                        if (/ MUNICIPAL$/.test(key)) candidateKeys.push(key.replace(/ MUNICIPAL$/,''));
                                                                        const pool = [];
                                                                        for (const candidateKey of candidateKeys) {const matches = MUNICIPALITY_CONTACTS.get(candidateKey) || [];
                                                                                                                for (const match of matches) {if (!pool.includes(match)) pool.push(match);}}
                                                                        if (!pool.length && looseKey) {for (const entries of MUNICIPALITY_CONTACTS.values()) {for (const entry of entries) {const entryLoose = entry.looseKey || municipalityLooseKey(entry.key);
                                                                                                                                                                 const entryMatch = entry.matchKey || municipalityMatchKey(entry.key);
                                                                                                                                                                 if (!entryLoose) continue;
                                                                                                                                                                 if (entryLoose === looseKey || entryLoose.startsWith(`${looseKey} `) || looseKey.startsWith(`${entryLoose} `) || (matchKey && entryMatch && (entryMatch === matchKey || entryMatch.startsWith(`${matchKey} `) || matchKey.startsWith(`${entryMatch} `)))) {if (!pool.includes(entry)) pool.push(entry);}}}}
                                                                        const judgeKey = normalizeJudgeName(judgeName);
                                                                        if (!pool.length) return judgeKey && shouldIncludeJudgeDetails(jurisdiction) ? `${key} - Judge ${formatJudgeDisplayName(judgeKey)}` : key;
                                                                        if (judgeKey) {const matched = pool.find((x) => x.judgeKey && judgeNamesMatch(x.judgeKey,judgeKey));
                                                                                       if (matched) return matched.displayWithJudge || matched.display;}
                                                                        if (pool.length === 1) return pool[0].displayWithJudge || pool[0].display;
                                                                        if (looseKey) {const operatingMatch = pool.find((x) => (x.looseKey || '').startsWith(`${looseKey} `) && /\bOPERATES IN\b/i.test(x.display));
                                                                                      if (operatingMatch) return operatingMatch.displayWithJudge || operatingMatch.display;}
                                                                        if (judgeKey && shouldIncludeJudgeDetails(jurisdiction)) return `${key} - Judge ${formatJudgeDisplayName(judgeKey)}`;
                                                                        return pool[0].displayWithJudge || pool[0].display;}


  const FRESH_START_FRIDAY_TEXT = ['- - - - -',
                                   '"Fresh Start Fridays" is a virtual court program, allowing those with active warrants in St. Louis County Municipal Court to ask for the warrant to be recalled and for a new court date to be set without fear of arrest. This program is limited to ordinance violation cases (typically traffic-related or other nonviolent offenses).',
                                   'Those with active warrants can log into the virtual docket to speak with a judge at 10am on any Friday, except for those that fall on a county, state or federal holiday. This link will take you to the virtual courtroom:',
                                   'https://mocourts.webex.com/meet/courtney.whiteside ',
                                   '',
                                   'Questions can be directed to the St. Louis County Municipal Court at 314-615-8760.',
                                   '- - - - -'].join('\n');

  function getCaseNumberForSummary(e) {const fromTitle = norm(String(e?.caseTitle || '').split('–')[0]);
                                      if (e?._source === 'municourt') {const muniNo = getMuniPrimaryCaseNumber(e) || fromTitle;
                                                                       return muniNo ? `${muniNo} (municourt)` : '(municourt)';}
                                      if (fromTitle && /^\d/.test(fromTitle)) return fromTitle;
                                      const fromCaseNumber = norm(String(e?.caseNumber || e?.ticketNumber || ''));
                                      if (fromCaseNumber && /^\d/.test(fromCaseNumber)) return fromCaseNumber;
                                      const fromKey = norm(e?.caseKey || '');
                                      if (fromKey) {const stripped = norm(fromKey.split('|')[0]);
                                                    const strippedDigits = norm(stripped.replace(/[A-Z]$/i,''));
                                                    if (strippedDigits && /^\d/.test(strippedDigits)) return strippedDigits;
                                                    if (stripped) return stripped;
                                                    return fromKey;}
                                      return '- - -';}

  function getWarrantLabelForSummary(e) {const explicit = norm(String(e?.summaryStatus || '')).toLowerCase();
                                        if (explicit) return explicit.replace(/^nonwarrant\b/,'open (no warrant found)');
                                        const upcoming = norm(String(e?.nextDocketDate || '')).toLowerCase();
                                        if (upcoming && upcoming !== '- - -') return 'upcoming';
                                        const ws = norm(String(e?.warrantSummary || '')).toLowerCase();
                                        if (!ws || ws === '- - -') return 'open (no warrant found)';
                                        if (/\brecall\w*\b|\bserv\w*\b/.test(ws)) return 'open (no warrant found)';
                                        if (ws.includes('warrant')) return 'warrant';
                                        return 'open (no warrant found)';}

  function getFineSuffixForSummary(e) {const raw = norm(String(e?.caseBalance || ''));
                                      if (!raw || raw === '- - -') return '';
                                      const cleaned = raw.replace(/\$/g,'').replace(/,/g,'').trim();
                                      if (!cleaned) return '';
                                      const numeric = Number(cleaned);
                                      if (!Number.isFinite(numeric) || numeric === 0) return '';
                                      return `, ${numeric.toFixed(2)} fine`;}

  function normalizeAttorneyForSummary(attorneyRaw) {const attorney = norm(String(attorneyRaw || ''));
                                                    if (!attorney || attorney === '- - -') return '';
                                                    const nameOnly = attorney.split(/\s+-\s+/)[0].trim();
                                                    if (!nameOnly) return '';
                                                    const stripped = nameOnly.replace(/^attorney\s+/i,'').trim();
                                                    const commaMatch = stripped.match(/^([^,]+),\s*(.+)$/);
                                                    if (commaMatch) {const last = norm(commaMatch[1]);
                                                                     const first = norm(commaMatch[2].split(/\s+/)[0]);
                                                                     if (first && last) return `attorney ${first} ${last}`;}
                                                    const parts = stripped.split(/\s+/).filter(Boolean);
                                                    if (parts.length >= 2) return `attorney ${parts[0]} ${parts[parts.length - 1]}`;
                                                    return '';}

  function getAttorneySuffixForSummary(e) {const normalizedAttorney = normalizeAttorneyForSummary(e?.attorney);
                                          if (!normalizedAttorney) return '';
                                          return `, ${normalizedAttorney}`;}

  function getSummaryLineStatus(e) {const warrantLabel = getWarrantLabelForSummary(e);
                                   const fineSuffix = getFineSuffixForSummary(e);
                                   const attorneySuffix = getAttorneySuffixForSummary(e);
                                   return `${warrantLabel}${fineSuffix}${attorneySuffix}`;}

  function isMuniWarrantStatusForSummary(value) {return /^warrant$/i.test(norm(String(value || '')));}

  function isMuniOpenStatusForSummary(value) {return /^open$/i.test(norm(String(value || '')));}

  function getMunicourtSummaryLineStatus(e) {const statusCandidates = [e?.disposition,e?.warrantEvent,e?.status,e?.caseStatus];
                                            if (statusCandidates.some(isMuniWarrantStatusForSummary)) return 'warrant';
                                            const warrantLabel = getWarrantLabelForSummary(e);
                                            const normalized = norm(String(warrantLabel || '')).toLowerCase();
                                            if (normalized.includes('hold')) return 'hold';
                                            if (statusCandidates.some(isMuniOpenStatusForSummary)) return 'open (no warrant found)';
                                            if (!normalized) return 'nonwarrant';
                                            if (/^warrant\b/.test(normalized)) return 'warrant';
                                            if (/^nonwarrant\b/.test(normalized)) return 'open (no warrant found)';
                                            if (normalized.includes('upcoming')) return 'upcoming';
                                            return normalized;}

  function parseUpcomingCourtDate(e) {const raw = norm(e?.nextDocketDate || '');
                                     if (!raw || raw === '- - -') return '';
                                     const parts = raw.split(';').map((x) => norm(x));
                                     if (!parts.length || !parts[0]) return '';
                                     return `${parts[0]}${parts[1] ? `; ${parts[1]}` : ''}`;}

  function formatCaseNumberList(caseNos) {const clean = caseNos.map((x) => norm(String(x || ''))).filter(Boolean);
                                          if (!clean.length) return '';
                                          if (clean.length === 1) return clean[0];
                                          if (clean.length === 2) return `${clean[0]} and ${clean[1]}`;
                                          return `${clean.slice(0,-1).join(', ')} and ${clean[clean.length - 1]}`;}

  function getSummaryStatusPriority(e) {const label = getWarrantLabelForSummary(e);
                                       const normalized = norm(String(label || '')).toLowerCase();
                                       if (normalized.includes('hold')) return 0;
                                       if (/^warrant\b/.test(normalized)) return 1;
                                       if (/^nonwarrant\b/.test(normalized)) return 2;
                                       return 3;}

  function hasUpcomingCourtDate(e) {const upcoming = norm(String(e?.nextDocketDate || ''));
                                    return !!(upcoming && upcoming !== '- - -');}

  function getJurisdictionScore(entries) {let score = 0;
                                          for (const e of entries) {const label = norm(String(getWarrantLabelForSummary(e) || '')).toLowerCase();
                                                                    if (label.includes('hold')) score += 3;
                                                                    else if (/^warrant\b/.test(label)) score += 2;
                                                                    else score += 1;}
                                          return score;}

  function isEligibleSummaryJurisdiction(jurisdiction) {const key = municipalityMatchKey(jurisdiction);
                                                        if (!key) return false;
                                                        if (key.includes('ST LOUIS COUNTY MUNICIPAL')) return false;
                                                        if (key.includes('FLORISSANT')) return true;
                                                        if (key.includes('UNIVERSITY CITY')) return true;
                                                        if (key.includes('KIRKWOOD')) return true;
                                                        if (key.includes('MANCHESTER')) return true;
                                                        if (key.includes('WEBSTER GROVES')) return true;
                                                        if (key.includes('CITY OF ST LOUIS')) return true;
                                                        if (key.includes('ST LOUIS COUNTY')) return true;
                                                        return false;}

  function buildJurisdictionSummarySections(sortedJurisdictions) {const sections = [];
                                                                  for (const {jurisdiction,entries} of sortedJurisdictions) {const includeJudgeDetails = shouldIncludeJudgeDetails(jurisdiction);
                                                                                                                              const grouped = new Map();
                                                                                                                              if (includeJudgeDetails) {for (const entry of entries) {const header = getMunicipalityHeaderForSummary(jurisdiction,entry?.judge || '') || jurisdiction.toUpperCase();
                                                                                                                                                                                     if (!grouped.has(header)) grouped.set(header,[]);
                                                                                                                                                                                     grouped.get(header).push(entry);}}
                                                                                                                              else {const header = getMunicipalityHeaderForSummary(jurisdiction,'') || jurisdiction.toUpperCase();
                                                                                                                                    grouped.set(header,entries);}

                                                                                                                              if (includeJudgeDetails && grouped.size > 1 && groupedHasStLouisCountyCircuitHeaders(grouped)) {sections.push('ST. LOUIS COUNTY CIRCUIT');
                                                                                                                                                                                                                         for (const [header,headerEntries] of grouped.entries()) {const sortedEntries = headerEntries.map((entry,idx) => ({entry,idx}))
                                                                                                                                                                                                                                                                                .sort((a,b) => {const priorityDiff = getSummaryStatusPriority(a.entry) - getSummaryStatusPriority(b.entry);
                                                                                                                                                                                                                                                                                                if (priorityDiff) return priorityDiff;
                                                                                                                                                                                                                                                                                                return a.idx - b.idx;})
                                                                                                                                                                                                                                                                                .map(({entry}) => entry);
                                                                                                                                                                                                                                                              sections.push(formatStLouisCountyCircuitJudgeSubheader(header,sortedEntries[0]?.judge || ''));
                                                                                                                                                                                                                                                              for (const e of sortedEntries) {const caseNo = getCaseNumberForSummary(e);
                                                                                                                                                                                                                                                                                        const charge = norm(e?.chargeDescription || '') || 'No Charges Found';
                                                                                                                                                                                                                                                                                        const lineStatus = getSummaryLineStatus(e);
                                                                                                                                                                                                                                                                                        sections.push(`${caseNo}: ${charge} - ${lineStatus}`);}
                                                                                                                                                                                                                                                              sections.push('- - -');}
                                                                                                                                                                                                                         sections.push('');
                                                                                                                                                                                                                         sections.push('');
                                                                                                                              continue;}

                                                                                                                              if (includeJudgeDetails && grouped.size > 1 && municipalityKey(jurisdiction).includes('CIRCUIT')) {sections.push(jurisdiction.toUpperCase());
                                                                                                                                                                                               for (const [header,headerEntries] of grouped.entries()) {const sortedEntries = headerEntries.map((entry,idx) => ({entry,idx}))
                                                                                                                                                                                            .sort((a,b) => {const priorityDiff = getSummaryStatusPriority(a.entry) - getSummaryStatusPriority(b.entry);
                                                                                                                                                                                                            if (priorityDiff) return priorityDiff;
                                                                                                                                                                                                            return a.idx - b.idx;})
                                                                                                                                                                                            .map(({entry}) => entry);
                                                                                                                                                                                                         sections.push(isStLouisCountyCircuitHeader(header) ? formatStLouisCountyCircuitHeader(header) : header);
                                                                                                                                                                                                         for (const e of sortedEntries) {const caseNo = getCaseNumberForSummary(e);
                                                                                                                                                                                                                                   const charge = norm(e?.chargeDescription || '') || 'No Charges Found';
                                                                                                                                                                                                                                   const lineStatus = getSummaryLineStatus(e);
                                                                                                                                                                                                                                   sections.push(`${caseNo}: ${charge} - ${lineStatus}`);}}
                                                                                                                                                                                               sections.push('');
                                                                                                                                                                                               sections.push('');
                                                                                                                              continue;}

                                                                                                                              if (includeJudgeDetails && grouped.size > 1) {sections.push(jurisdiction.toUpperCase());
                                                                                                                                                                              for (const [,headerEntries] of grouped.entries()) {const sortedEntries = headerEntries.map((entry,idx) => ({entry,idx}))
                                                                                                                                                                                                                             .sort((a,b) => {const priorityDiff = getSummaryStatusPriority(a.entry) - getSummaryStatusPriority(b.entry);
                                                                                                                                                                                                                                             if (priorityDiff) return priorityDiff;
                                                                                                                                                                                                                                             return a.idx - b.idx;})
                                                                                                                                                                                                                             .map(({entry}) => entry);
                                                                                                                                                                                                             const judge = formatJudgeDisplayName(sortedEntries[0]?.judge || '');
                                                                                                                                                                                                             sections.push('- - -');
                                                                                                                                                                                                             sections.push(`Judge ${judge}`);
                                                                                                                                                                                                             for (const e of sortedEntries) {const caseNo = getCaseNumberForSummary(e);
                                                                                                                                                                                                                                       const charge = norm(e?.chargeDescription || '') || 'No Charges Found';
                                                                                                                                                                                                                                       const lineStatus = getSummaryLineStatus(e);
                                                                                                                                                                                                                                       sections.push(`${caseNo}: ${charge} - ${lineStatus}`);}}
                                                                                                                                                                              sections.push('- - -');
                                                                                                                                                                              sections.push('');
                                                                                                                                                                              sections.push('');
                                                                                                                              continue;}

                                                                                                                              for (const [header,headerEntries] of grouped.entries()) {const sortedEntries = headerEntries.map((entry,idx) => ({entry,idx}))
                                                                                                                                                                                   .sort((a,b) => {const priorityDiff = getSummaryStatusPriority(a.entry) - getSummaryStatusPriority(b.entry);
                                                                                                                                                                                                   if (priorityDiff) return priorityDiff;
                                                                                                                                                                                                   return a.idx - b.idx;})
                                                                                                                                                                                   .map(({entry}) => entry);
                                                                                                                                                                                sections.push(isStLouisCountyCircuitHeader(header) ? formatStLouisCountyCircuitHeader(header) : header);
                                                                                                                                                                                const municourtEntries = sortedEntries.filter((e) => e?._source === 'municourt');
                                                                                                                                                                                const nonMunicourtEntries = sortedEntries.filter((e) => e?._source !== 'municourt');
                                                                                                                                                                                if (municourtEntries.length) {
                                                                                                                                                                                                             for (const e of municourtEntries) {const caseNo = getCaseNumberForSummary(e);
                                                                                                                                                                                                                                            const charge = norm(e?.chargeDescription || '') || 'No Charges Found';
                                                                                                                                                                                                                                            const lineStatus = getMunicourtSummaryLineStatus(e);
                                                                                                                                                                                                                                            sections.push(`${caseNo} - ${charge} - ${lineStatus}`);}
                                                                                                                                                                                                             if (nonMunicourtEntries.length) sections.push('- - -');}
                                                                                                                                                                                for (const e of nonMunicourtEntries) {const caseNo = getCaseNumberForSummary(e);
                                                                                                                                                                                                             const charge = norm(e?.chargeDescription || '') || 'No Charges Found';
                                                                                                                                                                                                             const lineStatus = getSummaryLineStatus(e);
                                                                                                                                                                                                             sections.push(`${caseNo}: ${charge} - ${lineStatus}`);}
                                                                                                                                                                                if (header.includes('FRESH START FRIDAYS')) sections.push(FRESH_START_FRIDAY_TEXT);
                                                                                                                                                                                sections.push('');
                                                                                                                                                                                sections.push('');}}
                                                                  return {sections};}

  function buildSummaryCopyText() {const log = loadLog();
                                  const expected = norm(document.getElementById('moNsYob')?.value || '');
                                  const filteredLog = log.filter((e) => {const m = yobMatchesExpected(expected,e?.yobRaw || e?.yob || '');
                                                                         return m.ok;});
                                  const jurisdictionLog = filteredLog.filter((e) => !hasUpcomingCourtDate(e));
                                  const byJurisdiction = new Map();
                                  for (const e of jurisdictionLog) {const jurisdiction = norm(e?.location || '') || '- - -';
                                                                    if (!byJurisdiction.has(jurisdiction)) byJurisdiction.set(jurisdiction,[]);
                                                                    byJurisdiction.get(jurisdiction).push(e);}

                                  const sortedJurisdictions = Array.from(byJurisdiction.entries())
                                                                   .map(([jurisdiction,entries],idx) => ({jurisdiction,entries,idx,score: getJurisdictionScore(entries)}))
                                                                   .sort((a,b) => {const scoreDiff = b.score - a.score;
                                                                                   if (scoreDiff) return scoreDiff;
                                                                                   return a.idx - b.idx;});
                                  const eligibleJurisdictions = [];
                                  const ineligibleJurisdictions = [];
                                  for (const jurisdictionEntry of sortedJurisdictions) {if (isEligibleSummaryJurisdiction(jurisdictionEntry.jurisdiction)) eligibleJurisdictions.push(jurisdictionEntry);
                                                                                         else ineligibleJurisdictions.push(jurisdictionEntry);}
                                  const {sections: eligibleSections} = buildJurisdictionSummarySections(eligibleJurisdictions);
                                  const {sections: ineligibleSections} = buildJurisdictionSummarySections(ineligibleJurisdictions);
                                  const sections = [...eligibleSections];
                                  sections.push(...ineligibleSections);

                                  const upcomingByJurisdiction = new Map();
                                  for (const e of filteredLog) {const next = parseUpcomingCourtDate(e);
                                                               if (!next) continue;
                                                               const jurisdiction = norm(e?.location || '') || '- - -';
                                                               if (!upcomingByJurisdiction.has(jurisdiction)) upcomingByJurisdiction.set(jurisdiction,new Map());
                                                               if (!upcomingByJurisdiction.get(jurisdiction).has(next)) upcomingByJurisdiction.get(jurisdiction).set(next,[]);
                                                               upcomingByJurisdiction.get(jurisdiction).get(next).push(getCaseNumberForSummary(e));}

                                  if (upcomingByJurisdiction.size) {sections.push('');
                                                                   sections.push('Here are the upcoming court dates we were able to find:');
                                                                   sections.push('');
                                                                   for (const [jurisdiction,dateMap] of upcomingByJurisdiction.entries()) {sections.push(jurisdiction);
                                                                                                                              for (const [dt,caseNos] of dateMap.entries()) {sections.push(`${dt} (for ${formatCaseNumberList(caseNos)})`);}
                                                                                                                              sections.push('');}}

                                  return sections.join('\n').trim();}
