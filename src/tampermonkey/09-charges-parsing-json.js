
  /************************************************************
   * Charges parsing (JSON)
   ************************************************************/
  function extractChargePartsFromChargesResponse(chargesResp,headerResp) {const arr = Array.isArray(chargesResp) ? chargesResp : Array.isArray(headerResp?.caseChargeList) ? headerResp.caseChargeList : [];
                                                                          if (!arr || !arr.length) return {desc:'No Charges Found',type:'- - -',cls:'- - -'};
                                                                          const first = arr[0] || {};
                                                                          const desc = norm(first.chargeDescription || '') || 'No Charges Found';
                                                                          let type = norm(first.chargeCodeLevelDescription || '');
                                                                          if (!type) {const ct = norm(headerResp?.caseType || '');
                                                                                     if (/ordinance/i.test(ct)) type = 'Ordinance';
                                                                                     else if (/municipal/i.test(ct)) type = 'Municipal';
                                                                                     else type = '- - -';}
                                                                          const cls = '- - -';
                                                                          return {desc,type,cls};}
