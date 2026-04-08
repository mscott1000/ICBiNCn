/************************************************************
   * Header parsing (JSON)
   ************************************************************/
  function headerToEntryBasics(headerResp) {const caseNumber = norm(headerResp?.caseNumber || '');
                                           const courtId = norm(headerResp?.courtId || '');
                                           const caseDesc = norm(headerResp?.caseDesc || '');
                                           const caseTitle = caseNumber && caseDesc ? `${caseNumber} – ${caseDesc}` : caseDesc || caseNumber || '(- - -)';
                                           const judge = norm(headerResp?.judgeDetails?.formattedName || '') || norm(headerResp?.dispositionJudgeDetails?.formattedName || '') || '- - -';
                                           const location = norm(headerResp?.location || '') || '- - -';
                                           const dateFiled = norm(headerResp?.dateFiled || headerResp?.fileDate || headerResp?.filingDate || '') || '- - -';
                                           const disposition = norm(headerResp?.caseDispositionDetail?.dispositionDescription || '') || '- - -';
                                           return {caseTitle,judge,location,dateFiled,disposition,header_meta:{locnCode: headerResp?.locnCode || '',
                                                                                                              disposed: headerResp?.disposed,
                                                                                                              pleaAndPayInd: headerResp?.pleaAndPayInd || '',
                                                                                                              isTicket: headerResp?.isTicket === true ? 'true' : headerResp?.isTicket === false ? 'false' : '',},};}
