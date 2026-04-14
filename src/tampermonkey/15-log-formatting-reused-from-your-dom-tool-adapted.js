  function getMuniFieldFromDetail(detailText,label,nextLabels = []) {const raw = norm(detailText || '');
                                                                     if (!raw || !label) return '';
                                                                     const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
                                                                     const nextPattern = nextLabels.map((x) => x && x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).filter(Boolean).join('|');
                                                                     const regex = nextPattern
                                                                       ? new RegExp(`${escapedLabel}:\\s*([\\s\\S]*?)(?=\\s*(?:${nextPattern}):|$)`,'i')
                                                                       : new RegExp(`${escapedLabel}:\\s*([\\s\\S]*?)$`,'i');
                                                                     const m = raw.match(regex);
                                                                     return m?.[1] ? norm(m[1]) : '';}

  function parseMuniDateOnly(rawValue) {const raw = norm(rawValue || '');
                                        if (!raw) return '';
                                        const m = raw.match(/^(\d{1,2}\/\d{1,2}\/\d{2,4})\b/);
                                        return m?.[1] || raw;}

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

  function getMuniCopyHeader(e) {const caseNo = getCaseNumberForSummary(e);
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
                                           warrantSummary: originalDateOnly || e.warrantSummary || '- - -',
                                           event: status || '- - -',
                                           bondAmount: bondAmount || '- - -',
                                           ftaDates: [originalDateOnly || '- - -'],
                                           nextDocketDate: currentDateOnly || '- - -',
                                           chargeDescription: chargeDescription || '- - -',
                                           chargeType: chargeType || '- - -',
                                           chargeClass: e.chargeClass || '- - -',
                                           judge: e.judge || '- - -'};}

/************************************************************
   * Log formatting (reused from your DOM tool, adapted)
   ************************************************************/
  function formatEntry(e) {const lines = [e.caseTitle || '(- - -)','',
                                         `Location: ${e.location || ''}`,
                                         `Date Filed: ${e.dateFiled || ''}`,
                                         `Disposition: ${e.disposition || ''}`,
                                         `Case Balance: ${e.caseBalance || ''}`,'',
                                         `Address: ${e.address || ''}`,
                                         `Year of Birth: ${e.yob || ''}`,
                                         `Attorney: ${e.attorney || ''}`,'',
                                         `Most Recent Warrant/Summons: ${e.warrantSummary || ''}`,
                                         `Event: ${e.event || ''}`,
                                         `Bond Amount: ${e.bondAmount || ''}`,
                                         `FTA Dates: ${(e.ftaDates || []).join(', ')}`,];
                         if (e.initialAppearanceDate) lines.push(`Initial Appearance: ${e.initialAppearanceDate}`);
                         if (e.licenseHoldDate) lines.push(`License Hold: ${e.licenseHoldDate}`);
                         lines.push(`Upcoming Court Dates: ${e.nextDocketDate || ''}`,'',
                                         `Charge Description: ${e.chargeDescription || ''}`,
                                         `Charge Type: ${e.chargeType || ''}`,
                                         `Charge Class: ${e.chargeClass || ''}`,
                                         `Judge: ${e.judge || ''}`,'',);
                         if (e?._source !== 'municourt') lines.push(`CaseNet:\n${e.caseUrl || ''}\n`,'','','');
                         if (e?._source === 'municourt' && norm(e?.muniCaseDetailText || '')) lines.push('MuniCourt Detail:',e.muniCaseDetailText,'','','');
                         return lines.join('\n');}

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
                                  const orderedEntries = [];
                                  function appendEntries(jurisdictions) {for (const {entries} of jurisdictions) {const sortedEntries = entries.map((entry,idx) => ({entry,idx}))
                                                                                                                               .sort((a,b) => {const judgeA = normalizeJudgeName(a.entry?.judge || '');
                                                                                                                                               const judgeB = normalizeJudgeName(b.entry?.judge || '');
                                                                                                                                               const judgeDiff = judgeA.localeCompare(judgeB);
                                                                                                                                               if (judgeDiff) return judgeDiff;
                                                                                                                                               return a.idx - b.idx;})
                                                                                                                               .map(({entry}) => entry);
                                                                                 orderedEntries.push(...sortedEntries);}}
                                  appendEntries(eligibleJurisdictions);
                                  appendEntries(ineligibleJurisdictions);
                                  return orderedEntries.map((e) => formatEntry(applyMuniDetailFormatting(e))).join('\n').trim();}



  const MUNICIPALITY_CONTACTS_RAW = `ARNOLD MUNICIPAL - (636) 296-0595
BALLWIN MUNICIPAL - (636) 227-9468
BELLA VILLA MUNICIPAL - (314) 638-8840
BELLEFONTAINE NEIGHBORS MUNICIPAL - (314) 867-0076
BEL-RIDGE MUNICIPAL - (314) 429-2878 EXT. 200
BERKELEY MUNICIPAL - (314) 524-3313
BELLERIVE ACRES MUNICIPAL - (314) 385-3300
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
CHARLACK MUNICIPAL - (314) 427-4715
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
EDMUNDSON MUNICIPAL - (314) 428-6811 EXT 5
ELLISVILLE MUNICIPAL - (636) 227-3729
EUREKA MUNICIPAL - (636) 549-1828
FENTON MUNICIPAL - (636) 343-1007
FERGUSON MUNICIPAL - (314) 524-5264
FESTUS MUNICIPAL - (636) 797-5303
FLORISSANT MUNICIPAL - (314) 921-3322
FLORDELL HILLS (OPERATES IN PAGEDALE MUNICIPAL) - (314) 726-1200 EXT. 2
FRONTENAC MUNICIPAL - (314) 994-3204
GLENDALE MUNICIPAL - (314) 909-3003
GLEN ECHO PARK - (314) 615-2661 (HOUSED BY STL TRAFFIC COURT)
GRANTWOOD VILLAGE MUNICIPAL - (314) 842-4409 OPTION 3
GREENDALE MUNICIPAL - (314) 385-3300
GREEN PARK (OPERATES IN ST. LOUIS COUNTY MUNICIPAL) - FRESH START FRIDAY
HANLEY HILLS (OPERATES IN ST. ANN CONSOLIDATED MUNICIPAL) - (314) 428-6811 EXT 5
HAZELWOOD MUNICIPAL - (314) 839-2212 EXT 0
HILLSBORO MUNICIPAL - (636) 797-5303
HILLSDALE (OPERATES IN NORMANDY MUNICIPAL) - (314) 385-3300 EXT. 3029
HUNTLEIGH MUNICIPAL - (314) 446-4248
JACKSON COUNTY MUNICIPAL - 740-286-2718
JEFFERSON COUNTY MUNICIPAL - TICKET FROM SHERIFF'S DEPT: (636) 797-6265; TICKET FROM ANY OTHER OFFICER: 636-797-5303
JENNINGS MUNICIPAL - (314) 385-4670
KANSAS CITY MUNICIPAL - (816) 513-2700
KINLOCH (OPERATES IN ST. LOUIS COUNTY MUNICIPAL) - FRESH START FRIDAY
KIRKWOOD MUNICIPAL - (314) 822-5840
LADUE MUNICIPAL - (314) 993-3919
LAKESHIRE MUNICIPAL - (314) 631-6222
LEE'S SUMMIT MUNICIPAL - 816-969-1160
MACON MUNICIPAL - 660-385-4631
MADISON CIRCUIT - (618) 692-6240
MANCHESTER MUNICIPAL - (636) 207-2832
MAPLEWOOD MUNICIPAL - (314) 646-3636
MARLBOROUGH (OPERATES IN ST. LOUIS COUNTY MUNICIPAL) - FRESH START FRIDAY
MARYLAND HEIGHTS MUNICIPAL - (314) 291-6036
MOLINE ACRES (OPERATES IN BERKELEY MUNICIPAL) - (314) 524-3313
NEOSHO MUNICIPAL - (417) 451-8007
NORMANDY MUNICIPAL - (314) 385-3300 EXT. 3029
NORTHWOODS (OPERATES IN ST. ANN CONSOLIDATED MUNICIPAL) - (314) 428-6811 EXT 5
NORWOOD COURT (OPERATES IN ST. LOUIS COUNTY MUNICIPAL) - FRESH START FRIDAY
O'FALLON MUNICIPAL - (636) 240-8766
OAKLAND (OPERATES IN GLENDALE MUNICIPAL) - (314) 909-3003
OLIVETTE MUNICIPAL - (314) 991-6047
OSAGE BEACH MUNICIPAL - (573) 302-2000
OSAGE COUNTY MUNICIPAL - (573) 897-3114
OVERLAND (OPERATES IN ST. ANN MUNICIPAL) - (314) 428-6811 EXT 5
PACIFIC MUNICIPAL - (636) 257-4553
PAGEDALE MUNICIPAL - (314) 726-1200 EXT. 2
PASADENA HILLS (OPERATES IN ST. LOUIS COUNTY MUNICIPAL) - FRESH START FRIDAY
PASADENA PARK (OPERATES IN NORMANDY MUNICIPAL) - (314) 385-3300 EXT. 3029
PINE LAWN (OPERATES IN ST. LOUIS COUNTY MUNICIPAL) - FRESH START FRIDAY
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
ST. JOHN MUNICIPAL - (314) 427-8700 EXT. 6
ST. LOUIS COUNTY CIRCUIT, DIV 20 - Judge MATTHEW HEARNE
Court Clerk: (314) 615-1520
ST. LOUIS COUNTY CIRCUIT, DIV 22 - Judge MEGAN JULIAN
Court Clerk: (314) 615-1522
ST. LOUIS COUNTY CIRCUIT, DIV 32 - Judge JULIA PUSATERI LASATER
Court Clerk: (314) 615-1532
ST. LOUIS COUNTY CIRCUIT, DIV 33 - Judge NICOLETTE KLAPP
Court Clerk: (314) 615-1533
ST. LOUIS COUNTY CIRCUIT, DIV 39 - Judge KELLY SNYDER
Court Clerk: (314) 615-1539
ST. LOUIS COUNTY MUNICIPAL - FRESH START FRIDAY
ST. GENEVIEVE MUNICIPAL - (573)883-2705
ST. GEORGE (OPERATES IN ST. LOUIS COUNTY MUNICIPAL) - FRESH START FRIDAY
ST. PETERS MUNICIPAL - (314) 279-8280
TOWN AND COUNTRY MUNICIPAL - (314) 432-1420
TROY MUNICIPAL - (636) 528-6179
TWIN OAKS (OPERATES IN ST. LOUIS COUNTY MUNICIPAL) - FRESH START FRIDAY
UNIVERSITY CITY MUNICIPAL - (314) 505-8578
UPLANDS PARK (OPERATES IN VELDA VILLAGE HILLS MUNICIPAL) - (314) 261-7221
VALLEY PARK MUNICIPAL - (636) 225-5696
VELDA CITY (OPERATES IN PAGEDALE MUNICIPAL) - (314) 726-1200 EXT. 2
VELDA VILLAGE HILLS MUNICIPAL - (314) 261-7221
VINITA PARK MUNICIPAL (OPERATES IN ST. ANN) - (314) 428-6811 EXT 5
WARSON WOODS (OPERATES IN GLENDALE MUNICIPAL) - (314) 909-3003
WEBSTER GROVES MUNICIPAL - (314) 963-5416
WELLSTON (OPERATES IN ST. ANN CONSOLIDATED MUNICIPAL) - (314) 428-6811 EXT 5
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

  function shouldIncludeJudgeDetails(jurisdiction) {const key = municipalityKey(jurisdiction);
                                                    if (!key) return false;
                                                    if (key.includes('CIRCUIT')) return true;
                                                    if (key.includes('CITY OF ST. LOUIS MUNICIPAL') || key.includes('CITY OF ST LOUIS MUNICIPAL')) return true;
                                                    if (key === 'CITY OF ST. LOUIS' || key === 'CITY OF ST LOUIS') return true;
                                                    if (key.includes('ST. LOUIS COUNTY') || key.includes('ST LOUIS COUNTY')) return true;
                                                    return false;}




  function parseMunicipalityLine(line) {const trimmed = String(line || '').trim();
                                      if (!trimmed) return null;
                                      const baseAndJudgeMatch = trimmed.match(/^(.*?)\s*-\s*Judge\s+(.+)$/i);
                                      const baseLine = baseAndJudgeMatch ? norm(baseAndJudgeMatch[1]) : trimmed;
                                      const judgeTag = baseAndJudgeMatch ? formatJudgeDisplayName(baseAndJudgeMatch[2]) : '';
                                      const clerkMatch = baseLine.match(/^(.*?)(?:\s+-\s+)?Court\s+Clerk:\s*(.+)$/i);
                                      const base = clerkMatch ? norm(clerkMatch[1]) : baseLine.split(' - ')[0].trim();
                                      const clerk = clerkMatch ? norm(clerkMatch[2]) : '';
                                      const key = municipalityKey(base);
                                      if (!key) return null;
                                      const display = judgeTag ? `${base} - Judge ${judgeTag}` : baseLine;
                                      const displayWithClerk = clerk ? `${display}
Court Clerk: ${clerk}` : display;
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
                                                                        if (judgeKey) {const matched = pool.find((x) => x.judgeKey && x.judgeKey === judgeKey);
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
                                        if (explicit) return explicit;
                                        const upcoming = norm(String(e?.nextDocketDate || '')).toLowerCase();
                                        if (upcoming && upcoming !== '- - -') return 'upcoming';
                                        const ws = norm(String(e?.warrantSummary || '')).toLowerCase();
                                        if (!ws || ws === '- - -') return 'nonwarrant';
                                        if (/\brecall\w*\b|\bserv\w*\b/.test(ws)) return 'nonwarrant';
                                        if (ws.includes('warrant')) return 'warrant';
                                        return 'nonwarrant';}

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

  function parseUpcomingCourtDate(e) {const raw = norm(e?.nextDocketDate || '');
                                     if (!raw || raw === '- - -') return '';
                                     const parts = raw.split(';').map((x) => norm(x));
                                     if (!parts.length || !parts[0]) return '';
                                     const dt = `${parts[0]}${parts[1] ? `; ${parts[1]}` : ''}`;
                                     const caseNo = getCaseNumberForSummary(e);
                                     return `${dt} (for ${caseNo})`;}

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
                                                        if (key.includes('CITY OF ST LOUIS')) return true;
                                                        if (key.includes('ST LOUIS COUNTY')) return true;
                                                        return false;}

  function buildJurisdictionSummarySections(sortedJurisdictions) {const sections = [];
                                                                  let hasFreshStartFridaySection = false;
                                                                  for (const {jurisdiction,entries} of sortedJurisdictions) {const includeJudgeDetails = shouldIncludeJudgeDetails(jurisdiction);
                                                                                                                              const grouped = new Map();
                                                                                                                              if (includeJudgeDetails) {for (const entry of entries) {const header = getMunicipalityHeaderForSummary(jurisdiction,entry?.judge || '') || jurisdiction.toUpperCase();
                                                                                                                                                                                     if (!grouped.has(header)) grouped.set(header,[]);
                                                                                                                                                                                     grouped.get(header).push(entry);}}
                                                                                                                              else {const header = getMunicipalityHeaderForSummary(jurisdiction,'') || jurisdiction.toUpperCase();
                                                                                                                                    grouped.set(header,entries);}

                                                                                                                              if (includeJudgeDetails && grouped.size > 1 && municipalityKey(jurisdiction).includes('CIRCUIT')) {sections.push(jurisdiction.toUpperCase());
                                                                                                                                                                                               for (const [header,headerEntries] of grouped.entries()) {const sortedEntries = headerEntries.map((entry,idx) => ({entry,idx}))
                                                                                                                                                                                            .sort((a,b) => {const priorityDiff = getSummaryStatusPriority(a.entry) - getSummaryStatusPriority(b.entry);
                                                                                                                                                                                                            if (priorityDiff) return priorityDiff;
                                                                                                                                                                                                            return a.idx - b.idx;})
                                                                                                                                                                                            .map(({entry}) => entry);
                                                                                                                                                                                                         const division = (header.match(/\bDIV(?:ISION)?\s+\d+[A-Z]?\b/i) || ['Division - - -'])[0].replace(/\bDIV\b/i,'Division');
                                                                                                                                                                                                         const judge = formatJudgeDisplayName(sortedEntries[0]?.judge || '') || '- - -';
                                                                                                                                                                                                         const clerkMatch = header.match(/Court\s+Clerk:\s*([^\n]+)/i);
                                                                                                                                                                                                         const clerk = clerkMatch ? norm(clerkMatch[1]) : '- - -';
                                                                                                                                                                                                         sections.push(`${division}, Judge ${judge} - Court Clerk: ${clerk}`);
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
                                                                                                                                                                                sections.push(header);
                                                                                                                                                                                if (sortedEntries.some((entry) => entry?._source === 'municourt')) sections.push('(municourt)');
                                                                                                                                                                                for (const e of sortedEntries) {const caseNo = getCaseNumberForSummary(e);
                                                                                                                                                                                                          const charge = norm(e?.chargeDescription || '') || 'No Charges Found';
                                                                                                                                                                                                          const lineStatus = getSummaryLineStatus(e);
                                                                                                                                                                                                          sections.push(`${caseNo}: ${charge} - ${lineStatus}`);}
                                                                                                                                                                                if (header.includes('FRESH START FRIDAY')) hasFreshStartFridaySection = true;
                                                                                                                                                                                sections.push('');
                                                                                                                                                                                sections.push('');}}
                                                                  return {sections,hasFreshStartFridaySection};}

  function buildSummaryCopyText() {const log = loadLog();
                                  const expected = norm(document.getElementById('moNsYob')?.value || '');
                                  const filteredLog = log.filter((e) => {const m = yobMatchesExpected(expected,e?.yobRaw || e?.yob || '');
                                                                         return m.ok && !e?._skipReason;});
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
                                  const {sections: eligibleSections,hasFreshStartFridaySection: eligibleHasFreshStartFridaySection} = buildJurisdictionSummarySections(eligibleJurisdictions);
                                  const {sections: ineligibleSections,hasFreshStartFridaySection: ineligibleHasFreshStartFridaySection} = buildJurisdictionSummarySections(ineligibleJurisdictions);
                                  const sections = [...eligibleSections];
                                  if (eligibleSections.length && ineligibleSections.length) sections.push('');
                                  sections.push(...ineligibleSections);
                                  const hasFreshStartFridaySection = eligibleHasFreshStartFridaySection || ineligibleHasFreshStartFridaySection;

                                  if (hasFreshStartFridaySection) {sections.push(FRESH_START_FRIDAY_TEXT);
                                                                   sections.push('');
                                                                   sections.push('');}

                                  const upcomingByJurisdiction = new Map();
                                  for (const e of filteredLog) {const next = parseUpcomingCourtDate(e);
                                                               if (!next) continue;
                                                               const jurisdiction = norm(e?.location || '') || '- - -';
                                                               if (!upcomingByJurisdiction.has(jurisdiction)) upcomingByJurisdiction.set(jurisdiction,[]);
                                                               upcomingByJurisdiction.get(jurisdiction).push(next);}

                                  if (upcomingByJurisdiction.size) {sections.push('');
                                                                   sections.push('Here are the upcoming court dates we were able to find:');
                                                                   sections.push('');
                                                                   for (const [jurisdiction,dates] of upcomingByJurisdiction.entries()) {sections.push(jurisdiction);
                                                                                                                              for (const d of dates) sections.push(d);
                                                                                                                              sections.push('');}}

                                  return sections.join('\n').trim();}
