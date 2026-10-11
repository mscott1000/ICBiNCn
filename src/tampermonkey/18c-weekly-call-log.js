/************************************************************
 * Weekly Call Log: native Casey image buttons + Apps Script relay
 ************************************************************/
const WEEKLY_CALL_LOG_ID = '1TPCAM7rJ9e_YDLrgI4YfjOq_QXZFfo6Sj6c9g9qPth4';
const WEEKLY_CALL_LOG_GID = 1261396864;
const KEY_SHEETS_RESULTS = 'mo_casenet_weekly_call_log_results_v1';
const SHEETS_BRIDGE_CHANNEL = 'icbincn-weekly-call-log-v1';

function isWeeklyCallLogSpreadsheet() {
  return location.hostname === 'docs.google.com' &&
    location.pathname.startsWith(`/spreadsheets/d/${WEEKLY_CALL_LOG_ID}/`);
}

function parseWeeklyCallLogLaunch(hash) {
  const query = new URLSearchParams(String(hash || '').replace(/^#/, ''));
  if (query.get('icbincn') !== 'weekly-call-log') return null;
  const row = Number(query.get('row'));
  const params = {first:norm(query.get('first')),middle:'',last:norm(query.get('last')),yob:norm(query.get('yob'))};
  if (query.get('spreadsheet') !== WEEKLY_CALL_LOG_ID || Number(query.get('gid')) !== WEEKLY_CALL_LOG_GID ||
      !Number.isSafeInteger(row) || row < 4 || !params.first || !params.last || !/^(19|20)\d{2}$/.test(params.yob)) {
    throw new Error('Invalid Weekly Call Log link. Check FN, LN, and DOB, then refresh Casey links.');
  }
  return {spreadsheetId:WEEKLY_CALL_LOG_ID,sheetId:WEEKLY_CALL_LOG_GID,row,params};
}

function consumeWeeklyCallLogLaunch() {
  if (location.hostname !== 'www.courts.mo.gov' || !location.pathname.startsWith('/casenet/')) return;
  let launch;
  try {launch = parseWeeklyCallLogLaunch(location.hash);}
  catch (error) {uiStatus(error.message); return;}
  if (!launch) return;
  // Consume once; subsequent pass navigations use the existing state machine.
  history.replaceState(null,'',location.pathname + location.search);
  try {startWeeklyCallLogSearch(launch,false);}
  catch (error) {uiStatus(error.message);}
}

function startWeeklyCallLogSearch(input,openCourtTab = true) {
  const launch = {spreadsheetId:input?.spreadsheetId,sheetId:input?.sheetId,row:input?.row,
    params:{first:norm(input?.params?.first),middle:'',last:norm(input?.params?.last),yob:norm(input?.params?.yob)}};
  if (launch.spreadsheetId !== WEEKLY_CALL_LOG_ID || launch.sheetId !== WEEKLY_CALL_LOG_GID ||
      !Number.isSafeInteger(launch.row) || launch.row < 4 || !launch.params.first || !launch.params.last ||
      !/^(19|20)\d{2}$/.test(launch.params.yob)) throw new Error('Casey needs a first name in N, last name in O, and valid birth year in Q on this row.');
  if (loadNameState()?.active || isRun() || loadTrackState()?.active) {
    throw new Error('Another Casey search is running. Wait for completion, then click Casey again.');
  }
  const requestId = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  setStop(false);
  setRun(false);
  saveDraft(launch.params);
  saveLog([]);
  saveDebug([]);
  clearLastHtml();
  saveJson(KEY_NET_STATS,{byPath:{}});
  saveNameState({active:true,passIndex:0,passes:buildNameSearchPasses(launch.params),step:'go_search',
    params:launch.params,casenetAddedTotal:0,autoMinimized:false,launchedFrom:'weekly-call-log',
    sheetsPending:{...launch,requestId},launchedAt:new Date().toISOString()});
  setIcbincnTabTitleText('Searching (1/3)');
  if (openCourtTab && !openBackgroundTab('https://www.courts.mo.gov/casenet/nameSearch.do?newSearch=Y',{requireBackground:true})) {
    clearNameState();
    throw new Error('Could not open the court tab. Enable Tampermonkey background-tab access and try again.');
  }
}

function persistWeeklyCallLogResult(state) {
  if (isStop()) return;
  const pending = state?.sheetsPending;
  if (!pending?.requestId) return;
  const results = loadJson(KEY_SHEETS_RESULTS,{});
  results[pending.requestId] = {...pending,summary:buildSummaryCopyText(),copy:buildGroupedCopyText(),
    completedAt:new Date().toISOString()};
  saveJson(KEY_SHEETS_RESULTS,results);
}

function initializeWeeklyCallLogBridge() {
  hideIcbincnDockOnJotform();
  const launchedNonces = new Set();
  window.addEventListener('message',event => {
    // Reply only to the requesting Google Apps Script iframe, never broadcast results.
    if (!/^https:\/\/[a-z0-9-]+\.googleusercontent\.com$/.test(event.origin) || !event.source || event.source === window) return;
    const message = event.data;
    if (!message || message.channel !== SHEETS_BRIDGE_CHANNEL || message.spreadsheetId !== WEEKLY_CALL_LOG_ID ||
        message.sheetId !== WEEKLY_CALL_LOG_GID || typeof message.nonce !== 'string' || message.nonce.length < 16) return;
    const results = loadJson(KEY_SHEETS_RESULTS,{});
    if (message.type === 'launch') {
      try {
        if (!launchedNonces.has(message.nonce)) {
          startWeeklyCallLogSearch(message.launch);
          launchedNonces.add(message.nonce);
        }
        event.source.postMessage({channel:SHEETS_BRIDGE_CHANNEL,nonce:message.nonce,type:'launched'},event.origin);
      } catch (error) {
        event.source.postMessage({channel:SHEETS_BRIDGE_CHANNEL,nonce:message.nonce,type:'launch-error',error:String(error.message || error)},event.origin);
      }
    } else if (message.type === 'ack' && typeof message.requestId === 'string') {
      delete results[message.requestId];
      saveJson(KEY_SHEETS_RESULTS,results);
    } else if (message.type === 'poll') {
      event.source.postMessage({channel:SHEETS_BRIDGE_CHANNEL,nonce:message.nonce,type:'results',
        results:Object.values(results).filter(result => result.spreadsheetId === WEEKLY_CALL_LOG_ID && result.sheetId === WEEKLY_CALL_LOG_GID)},event.origin);
    }
  });
}
