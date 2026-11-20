/************************************************************
 * Weekly Call Log: one injected Casey button + completion-only Apps Script writer
 ************************************************************/
const WEEKLY_CALL_LOG_ID = '1TPCAM7rJ9e_YDLrgI4YfjOq_QXZFfo6Sj6c9g9qPth4';
const WEEKLY_CALL_LOG_GID = 1261396864;
const KEY_SHEETS_RESULTS = 'mo_casenet_weekly_call_log_results_v1';
const SHEETS_BRIDGE_CHANNEL = 'icbincn-weekly-call-log-v1';
const WEEKLY_CASEY_LOGO = LOGO_CASEY_IMAGE;

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
