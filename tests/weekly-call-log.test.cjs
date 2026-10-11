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
  const context = vm.createContext({URLSearchParams,crypto:require('node:crypto').webcrypto,
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
