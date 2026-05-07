/************************************************************
   * Party parsing (JSON)
   ************************************************************/
  function splitNameTokens(name) {return norm(name || '').toUpperCase().replace(/[^A-Z\s]/g,' ').split(/\s+/).filter(Boolean);}

  function getPreferredDefendantRecord(partyResp,targetName = null,expectedYob4 = '') {const list = partyResp?.partyDetailsList || [];
                                                                                         const defendants = list.filter((x) => String(x?.descCode || '').toUpperCase() === 'DFT' || /defendant/i.test(String(x?.desc || '')));
                                                                                         if (!defendants.length) return null;
                                                                                         const first = norm(targetName?.first || '').toUpperCase();
                                                                                         const last = norm(targetName?.last || '').toUpperCase();
                                                                                         const middle = norm(targetName?.middle || '').toUpperCase();
                                                                                         if (!first || !last) return defendants[0];
                                                                                         const middleProvided = !!middle;
                                                                                         const targetMiddleInitial = middleProvided ? middle.charAt(0) : '';
                                                                                         const scored = defendants.map((def) => {const full = norm(def?.formattedPartyName || def?.partyName || def?.name || '');
                                                                                                                         const parts = splitNameTokens(full);
                                                                                                                         const firstToken = parts[0] || '';
                                                                                                                         const lastToken = parts[parts.length - 1] || '';
                                                                                                                         const middleTokens = parts.slice(1,-1);
                                                                                                                         const middleInitial = middleTokens.length ? String(middleTokens[0] || '').charAt(0) : '';
                                                                                                                         const firstLastExact = firstToken === first && lastToken === last;
                                                                                                                         let score = 0;
                                                                                                                         if (firstToken === first) score += 3;
                                                                                                                         if (lastToken === last) score += 3;
                                                                                                                         if (middleProvided && middleInitial === targetMiddleInitial) score += 2;
                                                                                                                         if (!middleProvided && firstLastExact) score += 2;
                                                                                                                         if (!middleProvided && firstLastExact && expectedYob4) {const yobRaw = norm(def?.formattedBirthDate || '');
                                                                                                                                                                                 const yobMatch = yobMatchesExpected(expectedYob4,yobRaw);
                                                                                                                                                                                 if (yobMatch?.ok) score += 3;}
                                                                                                                         return {def,score};});
                                                                     scored.sort((a,b) => b.score - a.score);
                                                                     if ((scored[0]?.score || 0) > 0) return scored[0].def;
                                                                     return defendants[0];}

  function extractDefendantAddressYob(partyResp,targetName = null,expectedYob4 = '') {const def = getPreferredDefendantRecord(partyResp,targetName,expectedYob4);
                                                 const address = norm(def?.formattedPartyAddress || '') || '- - -';
                                                 const yob = norm(def?.formattedBirthDate || '') || '- - -';
                                                 return {address,yob,yobRaw:yob};}

  function extractAttorney(partyResp) {const list = partyResp?.partyDetailsList || [];
                                      const def = list.find((x) => String(x?.descCode || '').toUpperCase() === 'DFT' || /defendant/i.test(String(x?.desc || '')));
                                      const pools = [].concat(def?.attorneyList || []).concat(def?.coAttorneyList || []).concat(def?.otherAttorneyList || []);
                                      for (const a of pools) {const nm = norm(a?.formattedPartyName || a?.attorneyName || a?.name || '');
                                                             const role = norm(a?.desc || a?.role || a?.relationship || '');
                                                             if (nm && role) return `${nm} - ${role}`;
                                                             if (nm) return nm;}
                                      const possible = list.filter((x) => String(x?.partyType || '').toLowerCase() === 'attorney');
                                      for (const a of possible) {const nm = norm(a?.formattedPartyName || '');
                                                                const desc = norm(a?.desc || '');
                                                                if (!nm) continue;
                                                                if (/public defender/i.test(desc)) return `${nm} - Public Defender`;
                                                                if (/attorney\s+for\s+defendant/i.test(desc) || /defense/i.test(desc)) return `${nm} - Private Attorney`;}
                                      return '- - -';}
