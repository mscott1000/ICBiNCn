/************************************************************
   * Financial (JSON)
   ************************************************************/
  async function getCaseBalanceIfGuiltyViaApi(dispositionText,headerMeta,caseNumber,courtId) {if (!/guilty/i.test(dispositionText || '')) return '- - -';
                                                                                             const resp = await postFormJsonRetry_tryCourtIds('/casenet/cases/getFinancialInfo.do',{caseNumber,courtId,isTicket: headerMeta?.isTicket || 'false',locnCode: headerMeta?.locnCode || '',disposed: String(headerMeta?.disposed ?? ''),pleaAndPayInd: headerMeta?.pleaAndPayInd || '',});
                                                                                             const bal = norm(resp?.caseBalance || '');
                                                                                             return bal || '- - -';}
