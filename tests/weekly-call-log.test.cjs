const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..'),id='1TPCAM7rJ9e_YDLrgI4YfjOq_QXZFfo6Sj6c9g9qPth4',gid=1261396864;
const source=fs.readFileSync(path.join(root,'src/tampermonkey/18c-weekly-call-log.js'),'utf8');
const appsSource=fs.readFileSync(path.join(root,'src/google-apps-script/WeeklyCallLog.gs'),'utf8');
function launcher(extra={}){
 const storage={};const c=vm.createContext({URLSearchParams,AbortController,setTimeout,clearTimeout,crypto:require('node:crypto').webcrypto,KEY_NET_STATS:'test-net',
 norm:v=>String(v||'').replace(/\s+/g,' ').trim(),loadJson:(k,f)=>storage[k]||f,saveJson:(k,v)=>storage[k]=v,isStop:()=>false,
 buildSummaryCopyText:()=> 'summary\nline',buildGroupedCopyText:()=> 'copy\ttext',...extra});vm.runInContext(source,c);
 c.installWeeklyCallLogButton=()=>{};return {c,storage};
}
const gviz=cells=>'/*O_o*/\ngoogle.visualization.Query.setResponse('+JSON.stringify({status:'ok',table:{rows:[{c:cells}]}})+');';
test('only a single BA client cell enables a launch',()=>{
 const {c}=launcher();assert.equal(c.weeklyCallLogSelectedRow('BA7'),7);assert.equal(c.weeklyCallLogSelectedRow('ba158'),158);
 for(const text of ['BA3','BB7','N7','BA7:BA8','BA7:BC7','BA0','BA-1',''])assert.equal(c.weeklyCallLogSelectedRow(text),0);
});
test('bounded row response maps N/O/Q and ignores middle name P',()=>{
 const {c}=launcher();const launch=c.parseWeeklyCallLogQuery(gviz([{v:' Heather '},{v:'Walker'},{v:'Ignored'},{v:'Date(1987,3,2)',f:'4-2-1987'}]),7);
 assert.equal(launch.row,7);assert.deepEqual(JSON.parse(JSON.stringify(launch.params)),{first:'Heather',last:'Walker',middle:'',yob:'1987'});
 for(const dob of [{v:'4/2/1987'},{v:1987},{v:31869}])assert.equal(c.parseWeeklyCallLogQuery(gviz([{v:'Heather'},{v:'Walker'},null,dob]),7).params.yob,'1987');
});
test('missing names/DOB and login/error responses block searches',()=>{
 const {c}=launcher();for(const text of ['<html>Sign in</html>','google.visualization.Query.setResponse({"status":"error"});',gviz([null,{v:'Walker'},null,{v:'1987'}]),gviz([{v:'Heather'},{v:'Walker'},null,null])])assert.throws(()=>c.parseWeeklyCallLogQuery(text,7));
});
test('one click reads exactly N7:Q7 without scanning the workbook',async()=>{
 let url,options;const {c}=launcher({fetch:async(u,o)=>{url=u;options=o;return {ok:true,text:async()=>gviz([{v:'Heather'},{v:'Walker'},null,{v:'1987'}])};}});
 assert.equal((await c.readWeeklyCallLogRow(7)).row,7);const query=new URL('https://docs.google.com'+url).searchParams;
 assert.equal(query.get('range'),'N7:Q7');assert.equal(query.get('gid'),String(gid));assert.equal(query.get('headers'),'0');assert.equal(options.credentials,'include');assert.equal(options.cache,'no-store');
});
function searchLauncher(){let state=null;const tabs=[];const {c}=launcher({loadNameState:()=>state,loadTrackState:()=>null,isRun:()=>false,setStop:()=>{},setRun:()=>{},saveDraft:()=>{},saveLog:()=>{},saveDebug:()=>{},clearLastHtml:()=>{},buildNameSearchPasses:()=>['criminal','traffic','municourt'],saveNameState:s=>state=s,setIcbincnTabTitleText:()=>{},openBackgroundTab:(url,options)=>{tabs.push({url,options});return {};},clearNameState:()=>state=null});return {c,tabs,state:()=>state};}
const result=(extra={})=>({spreadsheetId:id,sheetId:gid,row:7,requestId:'request-123',params:{first:'Heather',last:'Walker',yob:'1987'},summary:'=literal\nsummary',copy:'copy\ttext',...extra});
test('direct launch keeps the selected row and existing background search passes',()=>{
 const {c,tabs,state}=searchLauncher();c.startWeeklyCallLogSearch(result());assert.equal(state().sheetsPending.row,7);assert.equal(state().params.first,'Heather');assert.equal(state().params.yob,'1987');assert.equal(state().params.middle,'');assert.deepEqual(Array.from(state().passes),['criminal','traffic','municourt']);assert.equal(tabs[0].options.requireBackground,true);
 assert.throws(()=>c.startWeeklyCallLogSearch(result()),/Another Casey search/);assert.equal(tabs.length,1);
});
test('results push on completion and stay queued until the connected writer acknowledges',()=>{
 let listener,changed;const sent=[],sourceWindow={postMessage:(data,origin)=>sent.push({data,origin})};
 const {c,storage}=launcher({hideIcbincnDockOnJotform:()=>{},window:{addEventListener:(_,fn)=>listener=fn},GM_addValueChangeListener:(_,fn)=>changed=fn});
 c.initializeWeeklyCallLogBridge();const message={channel:'icbincn-weekly-call-log-v1',spreadsheetId:id,sheetId:gid,nonce:'0123456789abcdef',type:'connect'};
 const event={origin:'https://n-test-script.googleusercontent.com',source:sourceWindow,data:message};
 listener({...event,origin:'https://evil.example'});assert.equal(sent.length,0);listener(event);assert.equal(sent[0].data.results.length,0);
 c.persistWeeklyCallLogResult({sheetsPending:result()});changed();assert.equal(sent.at(-1).data.results[0].summary,'summary\nline');assert.equal(sent.at(-1).origin,event.origin);
 listener({...event,source:{postMessage:()=>{}},data:{...message,type:'ack',requestId:'request-123'}});assert.equal(Object.keys(storage.mo_casenet_weekly_call_log_results_v1).length,1);
 listener({...event,data:{...message,type:'ack',requestId:'request-123'}});assert.equal(Object.keys(storage.mo_casenet_weekly_call_log_results_v1).length,0);
 c.isStop=()=>true;c.persistWeeklyCallLogResult({sheetsPending:result()});assert.equal(Object.keys(storage.mo_casenet_weekly_call_log_results_v1).length,0);
});
function apps(identities,{fail=false,mismatch=false}={}){
 const properties={},writes=[];let released=0;
 const sheet={getSheetId:()=>gid,getName:()=> 'Weekly Call Log',getLastRow:()=>identities.length+3,getRange:(_,col)=>col===14?{getValues:()=>identities}:{getMergedRanges:()=>[],setRichTextValues:values=>{if(fail)throw new Error('Protected cell');writes.push(values);},getValues:()=>mismatch?[['wrong','wrong']]:writes.at(-1)}};
 const book={getId:()=>id,getSheets:()=>[sheet],getSpreadsheetTimeZone:()=> 'America/Mexico_City'};
 const c=vm.createContext({Date,SpreadsheetApp:{getActiveSpreadsheet:()=>book,flush:()=>{},newRichTextValue:()=>({setText(text){this.text=text;return this;},build(){return this.text;}})},Utilities:{formatDate:d=>String(d.getFullYear())},LockService:{getDocumentLock:()=>({waitLock:()=>{},releaseLock:()=>released++})},PropertiesService:{getDocumentProperties:()=>({getProperty:k=>properties[k],setProperty:(k,v)=>properties[k]=v})}});vm.runInContext(appsSource,c);return {c,writes,properties,released:()=>released};
}
test('server writes literal summary/copy once after relocating a sorted client',()=>{
 const {c,writes}=apps([['Other','Person','','1980'],['Heather','Walker','',new Date(1987,3,2)]]);assert.equal(c.writeCaseyResult(result()).row,5);assert.equal(writes[0][0][0],'=literal\nsummary');assert.equal(writes[0][0][1],'copy\ttext');assert.equal(c.writeCaseyResult(result()).alreadyWritten,true);assert.equal(writes.length,1);
});
test('ambiguous clients, oversized results and failed readbacks retain results',()=>{
 for(const rows of [[],[['Heather','Walker','','1987'],['Heather','Walker','','1987']]]){const {c,writes}=apps(rows);assert.throws(()=>c.writeCaseyResult(result()));assert.equal(writes.length,0);}
 for(const config of [{fail:true},{mismatch:true}]){const {c,properties,released}=apps([['Heather','Walker','','1987']],config);assert.throws(()=>c.writeCaseyResult(result()));assert.equal(properties.casey_completed_requests,undefined);assert.equal(released(),1);}
 const {c}=apps([['Heather','Walker','','1987']]);assert.throws(()=>c.writeCaseyResult(result({summary:'x'.repeat(50001)})));
});
test('Apps Script connects without polling, drawing, or launching searches',()=>{
 let html;const c=vm.createContext({SpreadsheetApp:{getActiveSpreadsheet:()=>({getId:()=>id,getSheets:()=>[{getSheetId:()=>gid,getName:()=> 'Weekly Call Log'}]}),getUi:()=>({showSidebar:()=>{}})},HtmlService:{createHtmlOutput:text=>{html=text;return {setTitle(){return this;}};}}});vm.runInContext(appsSource,c);c.connectCasey();new vm.Script(html.match(/<script>([\s\S]*?)<\/script>/)[1]);assert.doesNotMatch(html,/setInterval|type:'launch'/);assert.doesNotMatch(appsSource,/insertImage|assignScript|base64Decode|function caseyRow/);
});
test('cleanup removes only legacy Casey images and BA links',()=>{
 let removed=0,cleared;const sheet={getSheetId:()=>gid,getName:()=> 'Weekly Call Log',getMaxRows:()=>5,getImages:()=>[{getAltTextTitle:()=> 'ICBiNCn Casey row 4',remove:()=>removed++},{getAltTextTitle:()=> 'Other',remove:()=>assert.fail()}],getRange:(row,col)=>{assert.equal(row,4);assert.equal(col,53);return {getFormulas:()=>[['=HYPERLINK("icbincn=weekly-call-log")'],['=unrelated()']]};},getRangeList:ranges=>({clearContent:()=>cleared=ranges})};const c=vm.createContext({SpreadsheetApp:{getActiveSpreadsheet:()=>({getId:()=>id,getSheets:()=>[sheet]})}});vm.runInContext(appsSource,c);c.removeLegacyCaseyButtons();assert.equal(removed,1);assert.deepEqual(Array.from(cleared),['BA4']);
});
test('strict background tab never uses foreground fallback',()=>{
 const helpers=fs.readFileSync(path.join(root,'src/tampermonkey/02-helpers-storage-utils.js'),'utf8');let foreground=0;const c=vm.createContext({GM_openInTab:()=>{throw new Error('Unavailable');},window:{open:()=>foreground++}});vm.runInContext(helpers.slice(helpers.indexOf('function openBackgroundTab('),helpers.indexOf('function loadDraft(')),c);assert.equal(c.openBackgroundTab('url',{requireBackground:true}),null);assert.equal(foreground,0);
});
test('one injected button snapshots BA7 on click and reuses the existing background launcher',async()=>{
 const handlers={},appended=[],alerts=[];let tick,selected='BA7',readRow,launched;
 const box={get value(){return selected;},getBoundingClientRect:()=>({right:100,top:40})};
 const button={style:{},dataset:{},appendChild:()=>{},setAttribute:()=>{},addEventListener:(name,fn)=>handlers[name]=fn};
 const document={hidden:false,activeElement:null,body:{appendChild:item=>appended.push(item)},createElement:type=>type==='button'?button:{},querySelector:selector=>selector.includes('t-name-box')?box:null,addEventListener:()=>{}};
 const c=vm.createContext({URLSearchParams,location:{hash:'#gid='+gid,search:''},document,window:{addEventListener:()=>{}},GM_addStyle:()=>{},innerWidth:1200,innerHeight:800,setInterval:fn=>{tick=fn;},requestAnimationFrame:fn=>fn(),alert:msg=>alerts.push(msg)});
 vm.runInContext(source,c);c.readWeeklyCallLogRow=async row=>{readRow=row;selected='BA9';return result({row});};c.startWeeklyCallLogSearch=input=>launched=input;
 c.installWeeklyCallLogButton(()=>true);assert.equal(appended.length,1);assert.equal(button.hidden,false);assert.equal(button.dataset.row,'7');
 await handlers.click({preventDefault:()=>{},stopPropagation:()=>{}});assert.equal(readRow,7);assert.equal(launched.row,7);assert.equal(button.disabled,false);assert.equal(alerts.length,0);
 selected='BB7';tick();assert.equal(button.hidden,true);selected='BA9';tick();assert.equal(button.dataset.row,'9');assert.equal(appended.length,1);
});
