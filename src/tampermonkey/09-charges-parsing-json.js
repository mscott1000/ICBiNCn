/************************************************************
   * Charges parsing (JSON)
   ************************************************************/
  function collectChargeRows(resp) {if (!resp) return [];
                                    if (Array.isArray(resp)) return resp;
                                    const candidateKeys = ['caseChargeList',
                                                           'chargeTabModelList',
                                                           'chargeList',
                                                           'charges',
                                                           'results'];
                                    for (const key of candidateKeys) {if (Array.isArray(resp?.[key])) return resp[key];}
                                    return [];}

  function extractChargePartsFromChargesResponse(chargesResp,headerResp) {const arr = collectChargeRows(chargesResp).length ? collectChargeRows(chargesResp) : collectChargeRows(headerResp);
                                                                          if (!arr || !arr.length) return {desc:'No Charges Found',type:'- - -',cls:'- - -'};
                                                                          const first = arr[0] || {};
                                                                          const desc = norm(first.chargeDescription || first.chargeDesc || first.offenseDescription || first.violationDescription || '') || 'No Charges Found';
                                                                          let type = norm(first.chargeCodeLevelDescription || first.chargeType || first.levelDescription || '');
                                                                          if (!type) {const ct = norm(headerResp?.caseType || '');
                                                                                     if (/ordinance/i.test(ct)) type = 'Ordinance';
                                                                                     else if (/municipal/i.test(ct)) type = 'Municipal';
                                                                                     else type = '- - -';}
                                                                          const cls = '- - -';
                                                                          return {desc,type,cls};}
