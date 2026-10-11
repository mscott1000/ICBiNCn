/************************************************************
 * Weekly Call Log: one injected Casey button + completion-only Apps Script writer
 ************************************************************/
const WEEKLY_CALL_LOG_ID = '1TPCAM7rJ9e_YDLrgI4YfjOq_QXZFfo6Sj6c9g9qPth4';
const WEEKLY_CALL_LOG_GID = 1261396864;
const KEY_SHEETS_RESULTS = 'mo_casenet_weekly_call_log_results_v1';
const SHEETS_BRIDGE_CHANNEL = 'icbincn-weekly-call-log-v1';
const WEEKLY_CASEY_LOGO = 'data:image/jpeg;base64,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';

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

function weeklyCallLogSelectedRow(address) {
  const match=String(address || '').trim().toUpperCase().match(/^BA([1-9]\d*)$/);
  const row=match?Number(match[1]):0;
  return Number.isSafeInteger(row)&&row>=4?row:0;
}

function parseWeeklyCallLogQuery(text,row) {
  const match=String(text).match(/setResponse\(([\s\S]*)\);?\s*$/);
  if(!match)throw new Error('Sheets returned an unreadable response. Check that you are signed in.');
  const data=JSON.parse(match[1]);
  if(data.status!=='ok')throw new Error('Could not read this row from Sheets.');
  const cells=data.table?.rows?.[0]?.c || [];
  const first=norm(cells[0]?.v),last=norm(cells[1]?.v);
  const dob=cells[3];let yob='';
  const date=String(dob?.v || '').match(/^Date\((\d{4}),/);
  if(date)yob=date[1];
  else if(typeof dob?.v==='number') {
    yob=dob.v>=1900&&dob.v<=2099&&Number.isInteger(dob.v)?String(dob.v):String(new Date(Date.UTC(1899,11,30)+dob.v*86400000).getUTCFullYear());
  } else yob=String(dob?.v || dob?.f || '').match(/\b(?:19|20)\d{2}\b/)?.[0] || '';
  if(!first||!last||!/^(19|20)\d{2}$/.test(yob))throw new Error(`Row ${row} needs a first name in N, last name in O, and valid DOB/birth year in Q.`);
  return {spreadsheetId:WEEKLY_CALL_LOG_ID,sheetId:WEEKLY_CALL_LOG_GID,row,params:{first,last,middle:'',yob}};
}

async function readWeeklyCallLogRow(row) {
  if(!Number.isSafeInteger(row)||row<4)throw new Error('Select a single BA cell in a client row.');
  // Four cells, only on click. Use the existing signed-in Sheets session.
  const query=new URLSearchParams({gid:String(WEEKLY_CALL_LOG_GID),range:`N${row}:Q${row}`,headers:'0',tqx:'out:json',_casey:String(Date.now())});
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),10000);
  try {
    const response=await fetch(`/spreadsheets/d/${WEEKLY_CALL_LOG_ID}/gviz/tq?${query}`,{credentials:'include',cache:'no-store',signal:controller.signal});
    if(!response.ok)throw new Error(`Sheets row read failed (${response.status}).`);
    return parseWeeklyCallLogQuery(await response.text(),row);
  } finally {clearTimeout(timeout);}
}

function initializeWeeklyCallLogBridge() {
  hideIcbincnDockOnJotform();
  let connection=null;
  const deliver=()=>{
    if(!connection)return;
    const results=Object.values(loadJson(KEY_SHEETS_RESULTS,{})).filter(result=>result.spreadsheetId===WEEKLY_CALL_LOG_ID&&result.sheetId===WEEKLY_CALL_LOG_GID);
    try {connection.source.postMessage({channel:SHEETS_BRIDGE_CHANNEL,nonce:connection.nonce,type:'results',results},connection.origin);}
    catch {connection=null;}
  };
  window.addEventListener('message',event=>{
    if(!/^https:\/\/[a-z0-9-]+\.googleusercontent\.com$/.test(event.origin)||!event.source||event.source===window)return;
    const message=event.data;
    if(!message||message.channel!==SHEETS_BRIDGE_CHANNEL||message.spreadsheetId!==WEEKLY_CALL_LOG_ID||message.sheetId!==WEEKLY_CALL_LOG_GID||typeof message.nonce!=='string'||message.nonce.length<16)return;
    if(message.type==='connect'||message.type==='poll'){
      connection={source:event.source,origin:event.origin,nonce:message.nonce};deliver();
    } else if(message.type==='ack'&&connection&&event.source===connection.source&&message.nonce===connection.nonce&&typeof message.requestId==='string'){
      const results=loadJson(KEY_SHEETS_RESULTS,{});delete results[message.requestId];saveJson(KEY_SHEETS_RESULTS,results);
    }
  });
  if(typeof GM_addValueChangeListener==='function')GM_addValueChangeListener(KEY_SHEETS_RESULTS,deliver);
  // No Apps Script invocation is involved in reading the row or starting search.
  installWeeklyCallLogButton(()=>Boolean(connection));
}

function installWeeklyCallLogButton(isConnected) {
  const button=document.createElement('button');
  button.id='icbincnWeeklyCasey';button.type='button';button.hidden=true;
  const image=document.createElement('img');image.src=WEEKLY_CASEY_LOGO;image.alt='Casey';button.appendChild(image);
  document.body.appendChild(button);
  GM_addStyle('#icbincnWeeklyCasey{position:fixed;z-index:100001;width:30px;height:30px;padding:0;border:2px solid #1d4ed8;border-radius:50%;background:white;cursor:pointer;box-shadow:0 2px 5px #0003}#icbincnWeeklyCasey[hidden]{display:none}#icbincnWeeklyCasey img{width:100%;height:100%;object-fit:cover;border-radius:50%}#icbincnWeeklyCasey:disabled{opacity:.6}');
  const nameBox=()=>document.querySelector('#t-name-box input, input#t-name-box, #t-name-box, input.waffle-name-box');
  const activeTab=()=>new URLSearchParams(location.hash.replace(/^#/,'' )).get('gid') || new URLSearchParams(location.search).get('gid');
  let busy=false;
  const update=()=>{
    if(document.hidden)return;
    const box=nameBox();const row=weeklyCallLogSelectedRow(box?.value);
    const visible=activeTab()===String(WEEKLY_CALL_LOG_GID)&&row&&document.activeElement!==box;
    button.hidden=!visible;
    if(!visible)return;
    button.dataset.row=String(row);button.title=`Search row ${row} with Casey`;button.setAttribute('aria-label',`Search row ${row} with Casey`);
    const selected=document.querySelector('.active-cell-border');
    const rect=selected?.getBoundingClientRect();
    const anchor=rect&&rect.width>=30&&rect.height>=30&&rect.bottom>0&&rect.right>0?rect:box.getBoundingClientRect();
    const left=anchor===rect?anchor.right-32:anchor.right+4;
    const top=anchor===rect?anchor.top+2:anchor.top;
    button.style.left=`${Math.max(0,Math.min(innerWidth-32,left))}px`;
    button.style.top=`${Math.max(0,Math.min(innerHeight-32,top))}px`;
  };
  button.addEventListener('pointerdown',event=>event.preventDefault());
  button.addEventListener('click',async event=>{
    event.preventDefault();event.stopPropagation();if(busy)return;
    const row=weeklyCallLogSelectedRow(nameBox()?.value);
    if(activeTab()!==String(WEEKLY_CALL_LOG_GID)||!row){alert('Select a single BA cell in Weekly Call Log.');return;}
    if(!isConnected()){alert('Open Casey → Connect search results once so BB/BC can be filled, then click Casey again.');return;}
    busy=true;button.disabled=true;
    try {const launch=await readWeeklyCallLogRow(row);startWeeklyCallLogSearch(launch);button.title=`Searching row ${row} in the background`;}
    catch(error){alert(`Casey: ${error.name==='AbortError'?'Sheets row read timed out. Try again.':error.message}`);}
    finally {busy=false;button.disabled=false;}
  });
  document.addEventListener('pointerup',()=>requestAnimationFrame(update),true);
  document.addEventListener('keyup',()=>requestAnimationFrame(update),true);
  window.addEventListener('resize',update);window.addEventListener('hashchange',update);
  setInterval(update,600);update();
}
