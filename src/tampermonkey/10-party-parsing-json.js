
  /************************************************************
   * Party parsing (JSON)
   ************************************************************/
  function extractDefendantAddressYob(partyResp) {const list = partyResp?.partyDetailsList || [];
                                                 const def = list.find((x) => String(x?.descCode || '').toUpperCase() === 'DFT' || /defendant/i.test(String(x?.desc || '')));
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
