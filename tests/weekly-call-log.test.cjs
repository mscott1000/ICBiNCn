const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname,'..');
const id = '1TPCAM7rJ9e_YDLrgI4YfjOq_QXZFfo6Sj6c9g9qPth4';
const gid = 1261396864;
const source = fs.readFileSync(path.join(root,'src/tampermonkey/18c-weekly-call-log.js'),'utf8');
const appsSource = fs.readFileSync(path.join(root,'src/google-apps-script/WeeklyCallLog.gs'),'utf8');
function launcher(extra = {}) {
  const storage = {};
  const context = vm.createContext({KEY_NET_STATS:'test-net-stats',URLSearchParams,crypto:require('node:crypto').webcrypto,
    norm:value=>String(value||'').replace(/\s+/g,' ').trim(),
    loadJson:(key,fallback)=>storage[key]||fallback, saveJson:(key,value)=>storage[key]=value,
    isStop:()=>false, buildSummaryCopyText:()=> 'summary\nline 2',buildGroupedCopyText:()=> 'copy\ttext',...extra});
  vm.runInContext(source,context);return {context,storage};
}
function hash(extra = {}) {
  return '#'+new URLSearchParams({icbincn:'weekly-call-log',spreadsheet:id,gid:String(gid),row:'4',first:'Mary Ann',last:"O'Neil",yob:'1990',...extra});
}
test('launch keeps encoded names and rejects the wrong workbook, tab, template, or missing DOB',()=>{
  const {context:c}=launcher();assert.equal(c.parseWeeklyCallLogLaunch(hash()).params.first,'Mary Ann');
  assert.equal(c.parseWeeklyCallLogLaunch(hash()).params.middle,'');
  for(const extra of [{spreadsheet:'other'},{gid:'1'},{row:'3'},{row:'4.5'},{yob:''},{first:''}]) assert.throws(()=>c.parseWeeklyCallLogLaunch(hash(extra)));
  assert.equal(c.parseWeeklyCallLogLaunch('#other=1'),null);
});
test('completion queues exactly the existing Summary/Copy button text; stopped searches queue nothing',()=>{
  const {context:c,storage}=launcher();const state={sheetsPending:{...c.parseWeeklyCallLogLaunch(hash()),requestId:'request-123'}};
  c.persistWeeklyCallLogResult(state);
  assert.equal(storage.mo_casenet_weekly_call_log_results_v1['request-123'].summary,'summary\nline 2');
  assert.equal(storage.mo_casenet_weekly_call_log_results_v1['request-123'].copy,'copy\ttext');
  c.isStop=()=>true;state.sheetsPending.requestId='request-456';c.persistWeeklyCallLogResult(state);
  assert.equal(Object.keys(storage.mo_casenet_weekly_call_log_results_v1).length,1);
});
test('bridge restricts origins/scope and keeps results until acknowledgement',()=>{
  let listener;const sent=[];
  const {context:c,storage}=launcher({hideIcbincnDockOnJotform:()=>{},window:{addEventListener:(_,fn)=>listener=fn}});
  c.persistWeeklyCallLogResult({sheetsPending:{...c.parseWeeklyCallLogLaunch(hash()),requestId:'request-123'}});
  c.initializeWeeklyCallLogBridge();
  const message={channel:'icbincn-weekly-call-log-v1',spreadsheetId:id,sheetId:gid,nonce:'0123456789abcdef',type:'poll'};
  const event={origin:'https://example.org',source:{postMessage:(...args)=>sent.push(args)},data:message};
  listener(event);assert.equal(sent.length,0);
  event.origin='https://n-test-script.googleusercontent.com';listener({...event,data:{...message,spreadsheetId:'wrong'}});assert.equal(sent.length,0);
  listener(event);assert.equal(sent[0][0].results.length,1);assert.equal(sent[0][1],event.origin);
  assert.equal(Object.keys(storage.mo_casenet_weekly_call_log_results_v1).length,1);
  listener({...event,data:{...message,type:'ack',requestId:'request-123'}});
  assert.equal(Object.keys(storage.mo_casenet_weekly_call_log_results_v1).length,0);
});
function apps(identities, {fail=false, mismatch=false}={}) {
  const properties={};const writes=[];let released=0;
  const sheet={getSheetId:()=>gid,getName:()=> 'Weekly Call Log',getLastRow:()=>identities.length+3,
    getRange:(row,col)=>col===14?{getValues:()=>identities}:{getMergedRanges:()=>[],setRichTextValues:values=>{
      if(fail)throw new Error('Protected cell');writes.push({row,col,values});},getValues:()=>mismatch?[['wrong','wrong']]:[writes.at(-1).values[0]]}};
  const book={getId:()=>id,getSheets:()=>[sheet],getSpreadsheetTimeZone:()=> 'America/Mexico_City'};
  const c=vm.createContext({Date,SpreadsheetApp:{getActiveSpreadsheet:()=>book,flush:()=>{},newRichTextValue:()=>({setText(text){this.text=text;return this;},build(){return this.text;}})},
    Utilities:{formatDate:date=>String(date.getFullYear())},LockService:{getDocumentLock:()=>({waitLock:()=>{},releaseLock:()=>released++})},
    PropertiesService:{getDocumentProperties:()=>({getProperty:key=>properties[key],setProperty:(key,value)=>properties[key]=value})}});
  vm.runInContext(appsSource,c);return {c,writes,properties,released:()=>released};
}
function result(extra={}) {return {spreadsheetId:id,sheetId:gid,row:4,requestId:'request-123',params:{first:'Mary Ann',last:"O'Neil",yob:'1990'},summary:'=literal\nsummary',copy:'copy\t"quoted"\nline',...extra};}
test('server relocates a sorted client and writes BB/BC as literal text once',()=>{
  const {c,writes}=apps([['Other','Client','','1980'],['Mary Ann',"O'Neil",'',new Date(1990,4,10)]]);
  assert.equal(c.writeCaseyResult(result()).row,5);assert.equal(writes[0].col,54);
  assert.equal(writes[0].values[0][0],'=literal\nsummary');assert.equal(writes[0].values[0][1],'copy\t"quoted"\nline');
  assert.equal(c.writeCaseyResult(result()).alreadyWritten,true);assert.equal(writes.length,1);
});
test('missing/duplicate identities, wrong targets, and oversized results never write',()=>{
  for(const identities of [[],[['Mary Ann',"O'Neil",'','1990'],['Mary Ann',"O'Neil",'','1990']]]) {
    const {c,writes}=apps(identities);assert.throws(()=>c.writeCaseyResult(result()));assert.equal(writes.length,0);
  }
  const {c,writes}=apps([['Mary Ann',"O'Neil",'','1990']]);
  for(const extra of [{sheetId:1},{row:2},{summary:'x'.repeat(50001)},{params:{first:'Mary Ann',last:"O'Neil",yob:'bad'}}])assert.throws(()=>c.writeCaseyResult(result(extra)));
  assert.equal(writes.length,0);
});
test('failed writes/readbacks are not acknowledged and always release the lock',()=>{
  for(const options of [{fail:true},{mismatch:true}]) {
    const {c,properties,released}=apps([['Mary Ann',"O'Neil",'','1990']],options);
    assert.throws(()=>c.writeCaseyResult(result()));assert.equal(properties.casey_completed_requests,undefined);assert.equal(released(),1);
  }
});

test('clicking the image anchored at BA7 reads N7/O7/Q7, regardless of active selection or original callback row',()=>{
  const reads=[];let payload;
  const image={getScript:()=> 'caseyRow4',getAltTextTitle:()=> 'ICBiNCn Casey row 4',getAnchorCell:()=>({getColumn:()=>53,getRow:()=>7})};
  const sheet={getSheetId:()=>gid,getName:()=> 'Weekly Call Log',getMaxRows:()=>155,getImages:()=>[image],
    getRange:(row,col,height,width)=>{reads.push([row,col,height,width]);return {getValues:()=>[['Heather','Walker','Ignored middle',new Date(1987,3,2)]]};},
    getActiveRange:()=>{throw new Error('Must not read active selection');}};
  const html={setWidth(){return this;},setHeight(){return this;}};
  const c=vm.createContext({Date,SpreadsheetApp:{getActiveSpreadsheet:()=>({getId:()=>id,getSheets:()=>[sheet],getSpreadsheetTimeZone:()=> 'America/Mexico_City'}),getUi:()=>({showModalDialog:()=>{}})},
    Utilities:{formatDate:date=>String(date.getFullYear())},HtmlService:{createHtmlOutput:text=>html}});
  vm.runInContext(appsSource,c);c.connectCasey=launch=>{payload=launch;};
  c.caseyRow4();
  assert.deepEqual(reads,[[7,14,1,4]]);
  assert.equal(payload.row,7);assert.deepEqual(JSON.parse(JSON.stringify(payload.params)),{first:'Heather',last:'Walker',middle:'',yob:'1987'});
  const oldSheet=sheet.getRange;
  sheet.getRange=()=>({getValues:()=>[['Changed first','Changed last','','2001']]});
  c.caseyRow4();
  assert.equal(payload.params.first,'Changed first');
  sheet.getRange=()=>({getValues:()=>[['Heather','Walker','','']]});
  assert.throws(()=>c.caseyRow4(),/Row 7 needs/);sheet.getRange=oldSheet;
});

test('logo click relay starts the same search passes and opens a background court tab once',()=>{
  const writes=[];const tabs=[];let state=null,listener;
  const {context:c}=launcher({hideIcbincnDockOnJotform:()=>{},window:{addEventListener:(_,fn)=>listener=fn},
    loadNameState:()=>state,loadTrackState:()=>null,isRun:()=>false,setStop:()=>{},setRun:()=>{},
    saveDraft:p=>writes.push(p),saveLog:()=>{},saveDebug:()=>{},clearLastHtml:()=>{},
    buildNameSearchPasses:p=>['criminal','traffic','municourt'],saveNameState:s=>state=s,
    setIcbincnTabTitleText:()=>{},openBackgroundTab:url=>{tabs.push(url);return {};},clearNameState:()=>state=null});
  c.initializeWeeklyCallLogBridge();
  const responses=[];
  const message={channel:'icbincn-weekly-call-log-v1',spreadsheetId:id,sheetId:gid,nonce:'0123456789abcdef',type:'launch',
    launch:{spreadsheetId:id,sheetId:gid,row:7,params:{first:'Heather',last:'Walker',middle:'Ignored',yob:'1987'}}};
  const event={origin:'https://n-test-script.googleusercontent.com',source:{postMessage:r=>responses.push(r)},data:message};
  listener(event);
  assert.equal(state.sheetsPending.row,7);assert.equal(state.params.first,'Heather');assert.equal(state.params.last,'Walker');assert.equal(state.params.yob,'1987');assert.equal(state.params.middle,'');
  assert.deepEqual(Array.from(state.passes),['criminal','traffic','municourt']);assert.equal(tabs.length,1);assert.equal(responses[0].type,'launched');
  listener(event);assert.equal(tabs.length,1);
  listener({...event,data:{...message,nonce:'fedcba9876543210'}});assert.equal(responses.at(-1).type,'launch-error');assert.equal(tabs.length,1);
});

test('button installation embeds the Sheets-sized Casey logo and assigns row callbacks without touching BB/BC',()=>{
  const inserted=[],cleared=[];let removed=0,decoded;
  const own={getAltTextTitle:()=> 'ICBiNCn Casey row 4',remove:()=>removed++};
  const other={getAltTextTitle:()=> 'Unrelated image',remove:()=>{throw new Error('Must preserve other images');}};
  const sheet={getSheetId:()=>gid,getName:()=> 'Weekly Call Log',getLastRow:()=>7,getImages:()=>[own,other],getRowHeight:()=>34,getColumnWidth:()=>100,
    getRange:(row,col,count,width)=>{assert.equal(row,4);assert.equal(count,4);assert.equal(width,col===14?4:1);return col===14?{getValues:()=>[['First','Last','','1980'],['','','',''],['','','',''],['Heather','Walker','','1987']]}:{getFormulas:()=>[['=old icbincn=weekly-call-log'],[''],[''],['=old icbincn=weekly-call-log']]};},
    getRangeList:ranges=>({clearContent:()=>cleared.push(...ranges)}),insertImage:(blob,col,row)=>{const button={col,row};inserted.push(button);
      const chain={setWidth:v=>{button.width=v;return chain;},setHeight:v=>{button.height=v;return chain;},setAnchorCellXOffset:()=>chain,setAnchorCellYOffset:()=>chain,
        setAltTextTitle:()=>chain,setAltTextDescription:()=>chain,assignScript:name=>{button.callback=name;return chain;}};return chain;}};
  const c=vm.createContext({SpreadsheetApp:{getActiveSpreadsheet:()=>({getId:()=>id,getSheets:()=>[sheet]})},
    Utilities:{base64Decode:logo=>{decoded=logo;return [];},newBlob:()=>({})}});
  vm.runInContext(appsSource,c);c.refreshCaseyLinks();
  const sheetsLogo=fs.readFileSync(path.join(root,'assets/images/Casey-sheets-button.jpg'));
  assert.equal(decoded,sheetsLogo.toString('base64'));assert.equal(removed,1);assert.deepEqual(cleared,['BA4','BA7']);
  assert.deepEqual(inserted,[{col:53,row:4,width:30,height:30,callback:'caseyRow4'},{col:53,row:7,width:30,height:30,callback:'caseyRow7'}]);
});

test('sidebar launches without a modal and restores editor focus after acknowledgement',()=>{
  let html,listener,focused=0;
  const c=vm.createContext({SpreadsheetApp:{getActiveSpreadsheet:()=>({getId:()=>id,getSheets:()=>[{getSheetId:()=>gid,getName:()=> 'Weekly Call Log'}]}),
    getUi:()=>({showSidebar:()=>{},showModalDialog:()=>{throw new Error('Must not show modal');}})},
    HtmlService:{createHtmlOutput:text=>{html=text;return {setTitle(){return this;}};}}});
  vm.runInContext(appsSource,c);
  c.connectCasey({spreadsheetId:id,sheetId:gid,row:7,params:{first:'Heather',last:'Walker',yob:'1987'}});
  const requests=[];const top={postMessage:msg=>requests.push(msg)};
  const status={textContent:''},retry={};
  const browser=vm.createContext({crypto:require('node:crypto').webcrypto,window:{top,addEventListener:(_,fn)=>listener=fn},
    document:{getElementById:element=>element==='status'?status:retry},google:{script:{host:{editor:{focus:()=>focused++}}}},
    setInterval:()=>1,setTimeout:()=>1});
  vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],browser);
  const poll=requests[0];assert.equal(poll.type,'poll');
  listener({origin:'https://docs.google.com',source:top,data:{channel:poll.channel,nonce:poll.nonce,type:'results',results:[]}});
  assert.equal(requests.at(-1).type,'launch');assert.equal(requests.at(-1).launch.row,7);
  listener({origin:'https://docs.google.com',source:top,data:{channel:poll.channel,nonce:poll.nonce,type:'launched'}});
  assert.equal(focused,1);assert.match(status.textContent,/Searching in the background/);
});

test('strict background launch requests an inactive tab and never falls back to window.open',()=>{
  const helpers=fs.readFileSync(path.join(root,'src/tampermonkey/02-helpers-storage-utils.js'),'utf8');
  const source=helpers.slice(helpers.indexOf('function openBackgroundTab('),helpers.indexOf('function loadDraft('));
  let foreground=0,options;
  const c=vm.createContext({GM_openInTab:(_url,opts)=>{options=opts;return {};},window:{open:()=>{foreground++;return {};}}});
  vm.runInContext(source,c);assert.ok(c.openBackgroundTab('https://example.org',{requireBackground:true}));assert.equal(options.active,false);
  c.GM_openInTab=()=>{throw new Error('API unavailable');};
  assert.equal(c.openBackgroundTab('https://example.org',{requireBackground:true}),null);assert.equal(foreground,0);
  c.GM_openInTab=undefined;
  assert.equal(c.openBackgroundTab('https://example.org',{requireBackground:true}),null);assert.equal(foreground,0);
});


test('embedded Casey JPEG stays below Sheets image byte and pixel limits',()=>{
  const encoded=appsSource.match(/const CASEY_BUTTON_LOGO_BASE64 = '([^']+)';/)[1];
  const bytes=Buffer.from(encoded,'base64');
  assert.ok(bytes.length < 2*1024*1024);
  assert.equal(bytes.readUInt16BE(0),0xffd8);
  let dimensions;
  for(let offset=2;offset<bytes.length;) {
    assert.equal(bytes[offset++],0xff);
    const marker=bytes[offset++];
    const length=bytes.readUInt16BE(offset);
    if([0xc0,0xc1,0xc2].includes(marker)) {
      dimensions={height:bytes.readUInt16BE(offset+3),width:bytes.readUInt16BE(offset+5)};break;
    }
    offset+=length;
  }
  assert.ok(dimensions,'JPEG must include dimensions');
  assert.ok(dimensions.width*dimensions.height <= 1000000);
  assert.ok(Math.max(dimensions.width,dimensions.height) <= 128);
});
