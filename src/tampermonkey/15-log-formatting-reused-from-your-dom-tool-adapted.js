
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
                                         `FTA Dates: ${(e.ftaDates || []).join(', ')}`,];
                         if (e.initialAppearanceDate) lines.push(`Initial Appearance: ${e.initialAppearanceDate}`);
                         if (e.licenseHoldDate) lines.push(`License Hold: ${e.licenseHoldDate}`);
                         lines.push(`Upcoming Court Dates: ${e.nextDocketDate || ''}`,'',
                                    `Charge Description: ${e.chargeDescription || ''}`,
                                    `Charge Type: ${e.chargeType || ''}`,
                                    `Charge Class: ${e.chargeClass || ''}`,
                                    `Judge: ${e.judge || ''}`,'',
                                    `CaseNet:\n${e.caseUrl || ''}\n`,'','','');
                         return lines.join('\n');}

  function classifyCaseTitle(titleRaw) {const t = (titleRaw || '').toUpperCase();
                                       if (t.includes('CITY OF ST.LOUIS') || t.includes('CITY OF ST. LOUIS')) return 'REFER';
                                       const urgentNeedles = ['FLORISSANT','ST V ','UNIVERSITY CITY','KIRKWOOD','MANCHESTER','WEBSTER GROVES'];
                                       if (urgentNeedles.some((n) => t.includes(n))) return 'URGENT';
                                       return 'LESS';}

  function buildGroupedCopyText() {const log = loadLog();
                                  const expected = norm(document.getElementById('moNsYob')?.value || '');
                                  const filteredLog = log.filter((e) => {const m = yobMatchesExpected(expected,e?.yobRaw || e?.yob || '');
                                                                         return m.ok;});
                                  const urgent = [];
                                  const refer = [];
                                  const less = [];
                                  for (const e of filteredLog) {const bucket = classifyCaseTitle(e.caseTitle);
                                                               if (bucket === 'REFER') refer.push(e);
                                                               else if (bucket === 'URGENT') urgent.push(e);
                                                               else less.push(e);}
                                  function block(entries) {if (!entries.length) return '';
                                                           return entries.map((e,idx) => `===== Case ${idx + 1} =====
${formatEntry(e)}
`).join('\n');}
                                  return [block(urgent),'','',block(refer),'','',block(less)].join('\n').trim();}



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
ST. LOUIS COUNTY CIRCUIT, DIVISION 20 - (314) 615-1520 {Judge Matthew Hearne}
ST. LOUIS COUNTY CIRCUIT, DIVISION 22 - (314) 615-1522 {Judge Megan Julian}
ST. LOUIS COUNTY CIRCUIT, DIVISION 32 - (314) 615-1532 {Judge Julia Lasater}
ST. LOUIS COUNTY CIRCUIT, DIVISION 33 - (314) 615-1533 {Judge Nicolette Klapp}
ST. LOUIS COUNTY CIRCUIT, DIVISION 39 - (314) 615-1539 {Judge Kelly Snyder}
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

  function normalizeJudgeName(v) {const base = municipalityKey(v)
                                      .replace(/JUDGE\/COMMISSIONER\s+ASSIGNED/,'')
                                      .replace(/^JUDGE\s+/,'');
                                  if (!base) return '';
                                  const scrubbed = base.replace(/[^A-Z,\s]/g,' ').replace(/\s+/g,' ').trim();
                                  const commaMatch = scrubbed.match(/^([A-Z]+)\s*,\s*([A-Z]+)(?:\s+[A-Z]+)?/);
                                  if (commaMatch) return `${commaMatch[2]} ${commaMatch[1]}`.trim();
                                  const tokens = scrubbed.replace(/,/g,' ')
                                                        .split(/\s+/)
                                                        .filter(Boolean)
                                                        .filter((tok) => tok.length > 1 && !/^(JR|SR|II|III|IV|V)$/.test(tok));
                                  if (!tokens.length) return '';
                                  if (tokens.length >= 2) return `${tokens[0]} ${tokens[tokens.length - 1]}`;
                                  return tokens[0];}


  function parseMunicipalityLine(line) {const trimmed = String(line || '').trim();
                                      if (!trimmed) return null;
                                      const judgeMatch = trimmed.match(/\{\s*Judge\s+([^}]+)\}\s*$/i);
                                      const judgeTag = judgeMatch ? norm(judgeMatch[1]) : '';
                                      const lineWithoutTag = judgeMatch ? trimmed.slice(0,judgeMatch.index).trim() : trimmed;
                                      const base = lineWithoutTag.split(' - ')[0].trim();
                                      const key = municipalityKey(base);
                                      if (!key) return null;
                                      return {raw: trimmed,
                                              display: lineWithoutTag,
                                              key,
                                              looseKey: municipalityLooseKey(base),
                                              matchKey: municipalityMatchKey(base),
                                              judgeKey: judgeTag ? normalizeJudgeName(judgeTag) : ''};}

  const MUNICIPALITY_CONTACTS = (() => {const map = new Map();
                                        const lines = MUNICIPALITY_CONTACTS_RAW.split('\n').map((l) => l.trim()).filter(Boolean);
                                        for (const line of lines) {const parsed = parseMunicipalityLine(line);
                                                                   if (!parsed) continue;
                                                                   if (!map.has(parsed.key)) map.set(parsed.key,[]);
                                                                   map.get(parsed.key).push(parsed);}
                                        return map;})();

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
                                                                        if (!pool.length) return judgeKey ? `St. Louis County Circuit - Judge ${judgeKey}` : '';
                                                                        if (judgeKey) {const matched = pool.find((x) => x.judgeKey && x.judgeKey === judgeKey);
                                                                                       if (matched) return matched.display;}
                                                                        if (pool.length === 1) return pool[0].display;
                                                                        if (looseKey) {const operatingMatch = pool.find((x) => (x.looseKey || '').startsWith(`${looseKey} `) && /\bOPERATES IN\b/i.test(x.display));
                                                                                      if (operatingMatch) return operatingMatch.display;}
                                                                        if (judgeKey) return `St. Louis County Circuit - Judge ${judgeKey}`;
                                                                        return pool[0].display;}


  const FRESH_START_FRIDAY_TEXT = ['- - - - -',
                                   '"Fresh Start Fridays" is a virtual court program, allowing those with active warrants in St. Louis County Municipal Court to ask for the warrant to be recalled and for a new court date to be set without fear of arrest. This program is limited to ordinance violation cases (typically traffic-related or other nonviolent offenses).',
                                   'Those with active warrants can log into the virtual docket to speak with a judge at 10am on any Friday, except for those that fall on a county, state or federal holiday. This link will take you to the virtual courtroom:',
                                   'https://mocourts.webex.com/meet/courtney.whiteside ',
                                   '',
                                   'Questions can be directed to the St. Louis County Municipal Court at 314-615-8760.',
                                   '- - - - -'].join('\n');

  function getCaseNumberForSummary(e) {const fromTitle = norm(String(e?.caseTitle || '').split('–')[0]);
                                      if (fromTitle && /^\d/.test(fromTitle)) return fromTitle;
                                      const fromKey = norm(e?.caseKey || '');
                                      if (fromKey) return fromKey;
                                      return '- - -';}

  function getWarrantLabelForSummary(e) {const explicit = norm(String(e?.summaryStatus || '')).toLowerCase();
                                        if (explicit) return explicit;
                                        const upcoming = norm(String(e?.nextDocketDate || '')).toLowerCase();
                                        if (upcoming && upcoming !== '- - -') return 'upcoming';
                                        const ws = norm(String(e?.warrantSummary || '')).toLowerCase();
                                        if (!ws || ws === '- - -') return 'nonwarrant';
                                        if (/\b(?:recall\w*|withdr\w*)\b/i.test(ws)) return 'nonwarrant';
                                        if (ws.includes('warrant served')) return 'nonwarrant';
                                        if (ws.includes('warrant')) return 'warrant';
                                        return 'nonwarrant';}

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

  function buildSummaryCopyText() {const log = loadLog();
                                  const expected = norm(document.getElementById('moNsYob')?.value || '');
                                  const filteredLog = log.filter((e) => {const m = yobMatchesExpected(expected,e?.yobRaw || e?.yob || '');
                                                                         return m.ok && !e?._skipReason;});
                                  const entriesWithoutUpcoming = [];
                                  const entriesWithUpcoming = [];
                                  for (const e of filteredLog) {if (parseUpcomingCourtDate(e)) entriesWithUpcoming.push(e);
                                                                else entriesWithoutUpcoming.push(e);}
                                  const byJurisdiction = new Map();
                                  for (const e of entriesWithoutUpcoming) {const jurisdiction = norm(e?.location || '') || '- - -';
                                                                           if (!byJurisdiction.has(jurisdiction)) byJurisdiction.set(jurisdiction,[]);
                                                                           byJurisdiction.get(jurisdiction).push(e);}

                                  const sections = [];
                                  for (const [jurisdiction,entries] of byJurisdiction.entries()) {const jurisdictionJudge = entries.find((x) => norm(x?.judge || '') && norm(x?.judge || '') !== '- - -')?.judge || '';
                                                                                                   const header = getMunicipalityHeaderForSummary(jurisdiction,jurisdictionJudge) || jurisdiction.toUpperCase();
                                                                                                   const sortedEntries = entries.map((entry,idx) => ({entry,idx}))
                                                                                                                              .sort((a,b) => {const priorityDiff = getSummaryStatusPriority(a.entry) - getSummaryStatusPriority(b.entry);
                                                                                                                                              if (priorityDiff) return priorityDiff;
                                                                                                                                              return a.idx - b.idx;})
                                                                                                                              .map(({entry}) => entry);
                                                                                                   sections.push(header);
                                                                                                   for (const e of sortedEntries) {const caseNo = getCaseNumberForSummary(e);
                                                                                                                             const charge = norm(e?.chargeDescription || '') || 'No Charges Found';
                                                                                                                             const warrantLabel = getWarrantLabelForSummary(e);
                                                                                                                             sections.push(`${caseNo}: ${charge} - ${warrantLabel}`);}
                                                                                                   if (header.includes('FRESH START FRIDAY')) sections.push(FRESH_START_FRIDAY_TEXT);
                                                                                                   sections.push('');
                                                                                                   sections.push('');}

                                  const upcomingByJurisdiction = new Map();
                                  for (const e of entriesWithUpcoming) {const next = parseUpcomingCourtDate(e);
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
