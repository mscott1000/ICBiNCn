/************************************************************
   * Build entry via API for one case
   ************************************************************/
  async function scrapeCaseViaApi({caseKey,caseNumber,courtId},expectedYob4 = '',targetName = null) {let resolvedCourtId = norm(courtId || '').toUpperCase();
                                                                 const resolvedCaseKey = resolvedCourtId ? `${caseNumber}|${resolvedCourtId}` : (caseKey || caseNumber);
                                                                 const entry = {caseKey: resolvedCaseKey,
                                                                                                  caseTitle:'',
                                                                                                  caseUrl:'',
                                                                                                  judge:'- - -',
                                                                                                  dateFiled:'- - -',
                                                                                                  location:'- - -',
                                                                                                  caseBalance:'- - -',
                                                                                                  disposition:'- - -',
                                                                                                  address:'- - -',
                                                                                                  yob:'- - -',
                                                                                                  yobRaw:'',
                                                                                                  attorney:'- - -',
                                                                                                  warrantSummary:'- - -',
                                                                                                  summaryStatus:'',
                                                                                                  initialAppearanceDate:'',
                                                                                                  licenseHoldDate:'',
                                                                                                  nextDocketDate:'- - -',
                                                                                                  ftaDates:['- - -'],
                                                                                                  chargeDescription:'- - -',
                                                                                                  chargeType:'- - -',
                                                                                                  chargeClass:'- - -',};
                                                                 if (resolvedCourtId === 'CT20') {entry._skipReason = 'ct20_disabled';
                                                                                                 return entry;}
                                                                 let header;
                                                                 const mkHeaderPayload = (ct) => ({caseNumber,courtId: ct || '',isTicket:'',locnCode:'',isCriminal:'',diposed:'',pleaAndPayInd:'',});
                                                                 try {header = await postFormJsonRetry_tryCourtIds('/casenet/cases/newHeaderData.do',mkHeaderPayload(resolvedCourtId));}
                                                                 catch (e) {if (isJndiDatasourceError(e)) {entry._skipReason = 'backend_jndi_error';
                                                                                                          dbg('skip_backend_jndi',{caseKey: entry.caseKey,courtId: resolvedCourtId,msg:String(e?.message || e)});
                                                                                                          return entry;}
                                                                            throw e;}
                                                                 resolvedCourtId = norm(header?.courtId || resolvedCourtId || '').toUpperCase();
                                                                 entry.caseKey = resolvedCourtId ? `${caseNumber}|${resolvedCourtId}` : (entry.caseKey || caseNumber);
                                                                 entry.caseUrl = resolvedCourtId ? `https://www.courts.mo.gov/casenet/cases/newHeader.do?inputVO.caseNumber=${encodeURIComponent(caseNumber)}&inputVO.courtId=${encodeURIComponent(resolvedCourtId)}` :
                                                                                                   `https://www.courts.mo.gov/casenet/cases/newHeader.do?inputVO.caseNumber=${encodeURIComponent(caseNumber)}`;
                                                                 const basics = headerToEntryBasics(header);
                                                                 entry.caseTitle = basics.caseTitle;
                                                                 entry.judge = basics.judge;
                                                                 entry.dateFiled = basics.dateFiled;
                                                                 entry.location = basics.location;
                                                                 entry.disposition = basics.disposition;
                                                                 if (/(?:casefile\s*tranf|bndover)/i.test(String(entry.disposition || ''))) {entry._skipReason = 'transferred_case';
                                                                                                                                  dbg('skip_transferred_case',{caseKey: entry.caseKey,caseNumber,courtId: resolvedCourtId,disposition: entry.disposition});
                                                                                                                                  return entry;}
                                                                 if (!hasRealTitle(entry.caseTitle)) {entry._skipReason = 'blank_title';
                                                                                                      dbg('skip_blank_title',{caseKey: entry.caseKey,caseNumber,courtId: resolvedCourtId});
                                                                                                      return entry;}
                                                                 const party = await postFormJsonRetry_tryCourtIds('/casenet/cases/party.do',{caseNumber,courtId: resolvedCourtId,isTicket:'',});
                                                                 const addrYob = extractDefendantAddressYob(party,targetName,expectedYob4);
                                                                 entry.address = addrYob.address;
                                                                 entry.yob = addrYob.yob;
                                                                 entry.yobRaw = addrYob.yobRaw || entry.yob;
                                                                 const match = yobMatchesExpected(expectedYob4,entry.yobRaw);
                                                                 const foundYears = (match?.years || []).filter((y) => /^\d{4}$/.test(String(y || '')));
                                                                 if (!foundYears.length) {dbg('yob_not_meaningful_keep_case',{caseKey: entry.caseKey,caseNumber,courtId: resolvedCourtId,yobRaw: entry.yobRaw || ''});}
                                                                 if (!match.ok && foundYears.length) {entry._skipReason = 'yob_mismatch';
                                                                                                      entry._expectedYob = expectedYob4;
                                                                                                      entry._foundYears = foundYears.join(', ');
                                                                                                      return entry;}
                                                                 entry.attorney = extractAttorney(party);
                                                                 let docket;
                                                                 try {docket = await postFormJsonRetry_tryCourtIds('/casenet/cases/docketEntriesSearch.do',{caseNumber,courtId: resolvedCourtId,isTicket:'',tabName:'Docket',},{qs:'displayOption=A&sortOption=D&hasChange=false'});}
                                                                 catch (e) {const unavailableNeedles = ['location unavailable',
                                                                                                       'court location is currently unavailable',
                                                                                                       'casenet home page'];
                                                                            const preview = String(e?.preview || '').toLowerCase();
                                                                            const msg = String(e?.message || '').toLowerCase();
                                                                            const isDocketUnavailable = unavailableNeedles.some((needle) => preview.includes(needle) || msg.includes(needle));
                                                                            if (!isDocketUnavailable) throw e;
                                                                            entry.nextDocketDate = 'Case DOcket Unavailable';
                                                                            entry._skipReason = 'docket_unavailable';
                                                                            dbg('skip_docket_unavailable',{caseKey: entry.caseKey,caseNumber,courtId: resolvedCourtId,msg:String(e?.message || e)});
                                                                            return entry;}
                                                                 const docketList = docket?.docketTabModelList || [];
                                                                 const hit = findFirstWarrantOrSummons(docketList);
                                                                 const bondAmount = findBondAmountFromDocketEntries(docketList);
                                                                 const f = countFtas(docketList);
                                                                 const docketStatus = analyzeDocketStatus(docketList);
                                                                 if (docketStatus.paidInFull) {entry._skipReason = 'paid_in_full';
                                                                                               return entry;}
                                                                 entry.ftaDates = f.count === 0 ? ['- - -'] : f.dates;
                                                                 entry.bondAmount = bondAmount || '';
                                                                 entry.nextDocketDate = findFirstCurrentOrFutureScheduledLine(docketList);
                                                                 entry.licenseHoldDate = findLicenseHoldDate(docketList) || '';
                                                                 if (!hit) {entry.warrantSummary = '- - -';
                                                                            entry.initialAppearanceDate = findInitialAppearanceDate(docketList) || '';}
                                                                 else if (hit.scheduledFor) {entry.warrantSummary = [hit.filingDate ? `Date: ${hit.filingDate}` : '',`Event: ${hit.event}`,`Scheduled For: ${hit.scheduledFor}`].filter(Boolean).join('\n');
                                                                                             entry.initialAppearanceDate = '';}
                                                                 else {const renderedBond = bondAmount ? `Bond Amount: ${bondAmount}` : (hit.bond ? hit.bond : '');
                                                                       entry.warrantSummary = [hit.filingDate ? `${hit.filingDate}` : '',`Event: ${hit.event}`,renderedBond].filter(Boolean).join('\n');
                                                                       entry.initialAppearanceDate = '';}
                                                                 const hasRecallOrServedLanguage = Boolean(hit?.hasRecallOrServedLanguage);
                                                                 const baseStatus = (!hit || hasRecallOrServedLanguage) ? 'nonwarrant' : (hit.kind === 'warrant' ? 'warrant' : 'nonwarrant');
                                                                 entry.summaryStatus = docketStatus.hasActiveHold ? `${baseStatus} and HOLD placed on license` : baseStatus;
                                                                 let chargesResp = null;
                                                                 try {chargesResp = await postFormJsonRetry_tryCourtIds('/casenet/cases/charges.do',{caseNumber,courtId: resolvedCourtId,isTicket:'',tabName:'Charge',});}
                                                                 catch (e) {dbg('charges_fetch_failed',{caseKey,msg:String(e?.message || e)});}
                                                                 const chargeParts = extractChargePartsFromChargesResponse(chargesResp,header);
                                                                 entry.chargeDescription = chargeParts.desc || 'No Charges Found';
                                                                 entry.chargeType = chargeParts.type || '- - -';
                                                                 entry.chargeClass = chargeParts.cls || '- - -';
                                                                 entry.caseBalance = await getCaseBalanceIfGuiltyViaApi(entry.disposition,basics.header_meta,caseNumber,resolvedCourtId);
                                                                 const isGuiltyDisposed = /guilty/i.test(String(entry.disposition || ''));
                                                                 const caseBalanceText = String(entry.caseBalance || '').trim();
                                                                 const hasUnknownBalance = /^-\s*-\s*-$/.test(caseBalanceText);
                                                                 const hasZeroBalance = !hasUnknownBalance && /^\$?0(?:\.0+)?$/.test(caseBalanceText.replace(/,/g,''));
                                                                 const isNonwarrantStatus = /^nonwarrant\b/i.test(String(entry.summaryStatus || '').trim());
                                                                 const locationText = String(entry.location || '').toLowerCase();
                                                                 const isCityOfStLouisMunicipal = /city\s+of\s+st\.?\s*louis/.test(locationText) && /municipal/.test(locationText);
                                                                 if (isGuiltyDisposed && hasZeroBalance && isNonwarrantStatus && !isCityOfStLouisMunicipal) {entry._skipReason = 'guilty_zero_balance_nonwarrant';
                                                                                                                                                        return entry;}
                                                                 return entry;}
