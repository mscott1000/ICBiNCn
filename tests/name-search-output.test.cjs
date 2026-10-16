const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const read = name => fs.readFileSync(path.join(__dirname, '../src/tampermonkey', name), 'utf8');
function setup(storage = {state:{active:true,passes:[],params:{},casenetAddedTotal:2}}) {
  const handlers = {}, classes = new Set(), nodes = [];
  const listeners = {}, clock = {now:0};
  const classList = {toggle:(k,on)=>on?classes.add(k):classes.delete(k),remove:()=>{}};
  const context = vm.createContext({
    KEY_NAMESEARCH:'state',KEY_NAMESEARCH_OUTPUT:'output',KEY_NAMESEARCH_HISTORY:'history',
    loadJson:(k,f)=>storage[k] == null ? f : structuredClone(storage[k]),saveJson:(k,v)=>storage[k]=structuredClone(v),
    dock:{addEventListener:(k,fn)=>{(listeners[k] ||= []).push(fn);handlers[k]=e=>Promise.all(listeners[k].map(f=>f(e)));},classList,querySelector:()=>null},
    $content:{classList,appendChild:n=>nodes.push(n)},$status:{style:{}},
    document:{createElement:()=>({}),getElementById:()=>null},
    appView:'home',APP_VIEWS:{name:'Name Search'},
    location:{hostname:'www.courts.mo.gov'},performance:{now:()=>clock.now},KEY_NET_STATS:'net',
    loadLog:()=>[],saveLog:()=>{},loadDraft:()=>({}),
    isRun:()=>false,isStop:()=>!!storage.stopped,setStop:v=>storage.stopped=v,setRun:()=>{},
    saveDebug:()=>{},clearLastHtml:()=>{},
    setIcbincnTabTitleText:()=>{},uiStatus:()=>{},render:()=>{},expandDock:()=>{},dbg:()=>{},
    searchMunicourtEntriesByName:async()=>[],
    buildSummaryCopyText:()=> 'Summary <court>\nordered',buildGroupedCopyText:()=> 'Copy & details\nordered',
    escapeHtml:s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'),
    addBlock:(title,html)=>nodes.push({title,html}),SHOW_NAME_SEARCH_DEBUG_UI:false,
  });
  vm.runInContext(read('02a-name-search-edit-history.js'),context);
  vm.runInContext(read('04-name-search-two-pass-state-machine.js'),context);
  context.setIcbincnTabTitleText = () => {};
  vm.runInContext(read('19-buttons.js'),context);
  return {context,storage,handlers,classes,nodes,clock};
}
test('completion snapshots exact button outputs, expands only name view, and hides debug',async()=>{
  const {context:c,storage,classes,nodes}=setup();
  await c.nameSearchTick();
  assert.equal(storage.output.summary,c.buildSummaryCopyText());
  assert.equal(storage.output.copy,c.buildGroupedCopyText());
  assert.equal(storage.state,null);
  const ui=read('17-ui.js');
  vm.runInContext(ui.slice(ui.indexOf('function render()')),c);
  c.render();
  assert.ok(classes.has('moNameSearchComplete'));
  assert.equal(nodes.some(n=>n.title==='Debug Log'),false);
  const nameHtml=nodes.find(n=>n.title==='Name').html;
  const collapsed=nameHtml.slice(nameHtml.indexOf('<details'),nameHtml.indexOf('</details>'));
  assert.ok(collapsed.includes('moNsYob'));
  assert.ok(collapsed.includes('moJsonNameSearch'));
  assert.ok(collapsed.includes('moJsonClearEntries'));
  assert.ok(!/<details[^>]*\bopen\b/.test(nameHtml));
  const panes=nodes.find(n=>n.className==='moNameSearchOutputs');
  assert.ok(panes.innerHTML.indexOf('moNsSummaryOutput')<panes.innerHTML.indexOf('moNsCopyOutput'));
  assert.ok(panes.innerHTML.includes('Summary &lt;court&gt;'));
  assert.ok(!panes.innerHTML.includes('readonly'));
  c.appView='home';c.render();assert.ok(!classes.has('moNameSearchComplete'));
});
test('edits survive rerender and new searches hide output while retaining history',async()=>{
  const {context:c,storage,handlers}=setup();
  await c.nameSearchTick();
  handlers.input({target:{id:'moNsSummaryOutput',value:'edited summary'}});
  handlers.input({target:{id:'moNsCopyOutput',value:'edited copy'}});
  assert.equal(storage.output.summary,'edited summary');
  assert.equal(storage.output.copy,'edited copy');
  c.saveNameState({active:true});assert.equal(storage.output,null);
  assert.equal(storage.history.summary.value,'edited summary');
  assert.equal(storage.history.copy.value,'edited copy');
  c.saveNameSearchOutput({summary:'next summary',copy:'next copy'});
  c.undoNameOutput('summary');assert.equal(storage.output.summary,'edited summary');
  assert.equal(storage.output.copy,'next copy');
});
test('Case Count follows total log size and Detail labels the legacy full output',()=>{
  const {context:c,nodes}=setup();
  const count={textContent:''},sizer={textContent:''};
  c.dock.querySelector=selector=>selector==='#moJsonCaseCountValue'?count:selector==='#moJsonCaseCountSizer'?sizer:null;
  let log=[];c.loadLog=()=>log;
  const ui=read('17-ui.js');
  vm.runInContext(ui.slice(ui.indexOf('function render()')),c);
  c.appView='name';c.render();assert.equal(count.textContent,'Cases Found: 0');
  log=[{},{},{}];c.render();assert.equal(count.textContent,'Cases Found: 3');
  log=[];c.render();assert.equal(count.textContent,'Cases Found: 0');
  assert.ok(!ui.includes('<button class="moBtn" id="moJsonSummary">'));
  assert.ok(!ui.includes('<button class="moBtn" id="moJsonCopy">'));
  assert.ok(ui.includes('for="moNsCopyOutput">Detail</label>'));
});

test('deleted text and redo survive fresh script contexts with independent pane histories',()=>{
  const {context:c,storage}=setup({state:null,output:{summary:'Court 😀\nKEEP\nCourt B',copy:'Detail original'}});
  c.saveNameSearchOutput({summary:'Court 😀\nCourt B',copy:'Detail original'});
  c.saveNameSearchOutput({summary:'Court 😀\nCourt B',copy:''});
  const refreshed=setup(structuredClone(storage));
  refreshed.context.undoNameOutput('summary');
  assert.equal(refreshed.storage.output.summary,'Court 😀\nKEEP\nCourt B');
  assert.equal(refreshed.storage.output.copy,'');
  const restarted=setup(structuredClone(refreshed.storage));
  restarted.context.undoNameOutput('summary',true);
  assert.equal(restarted.storage.output.summary,'Court 😀\nCourt B');
  restarted.context.undoNameOutput('copy');
  assert.equal(restarted.storage.output.copy,'Detail original');
});

test('history stores a small deleted span rather than repeated whole documents',()=>{
  const text='x'.repeat(100000)+'deleted'+'y'.repeat(100000);
  const {context:c,storage}=setup({output:{summary:text,copy:''}});
  c.saveNameSearchOutput({summary:text.replace('deleted',''),copy:''});
  assert.deepEqual(storage.history.summary.past,[{at:100000,removed:'deleted',inserted:''}]);
  assert.ok(JSON.stringify(storage.history).length < text.length + 300);
});

test('new edits after undo replace redo while retaining older undo steps',()=>{
  const {context:c,storage}=setup({output:{summary:'first',copy:'detail'}});
  c.saveNameSearchOutput({summary:'second',copy:'detail'});
  c.saveNameSearchOutput({summary:'third',copy:'detail'});
  c.undoNameOutput('summary');
  c.saveNameSearchOutput({summary:'replacement',copy:'detail'});
  assert.equal(c.undoNameOutput('summary',true),null);
  c.undoNameOutput('summary');assert.equal(storage.output.summary,'second');
  c.undoNameOutput('summary');assert.equal(storage.output.summary,'first');
});

test('normal Clear Log is undoable even after a refresh; fifth click purges both timelines',async()=>{
  const {context:c,storage,handlers,clock}=setup({state:null,output:{summary:'summary',copy:'detail'}});
  await handlers.click({target:{id:'moJsonClear'}});
  assert.equal(storage.output,null);
  assert.equal(storage.history.summary.value,'summary');
  const refreshed=setup(structuredClone(storage));
  assert.equal(refreshed.context.undoNameOutput('summary').restored,true);
  assert.deepEqual(refreshed.storage.output,{summary:'summary',copy:'detail'});
  for (const now of [500,1000,1500]) {clock.now=now;await handlers.click({target:{id:'moJsonClear'}});}
  assert.ok(storage.history);
  c.saveJson=(key,value)=>{
    if (key === 'history' && value !== null) throw new Error('No space for another history write');
    storage[key]=structuredClone(value);
  };
  clock.now=2000;await handlers.click({target:{id:'moJsonClear'}});
  assert.equal(storage.history,null);assert.equal(storage.output,null);
  assert.equal(setup(structuredClone(storage)).context.undoNameOutput('summary'),null);
  c.saveJson=(key,value)=>storage[key]=structuredClone(value);
  c.saveNameSearchOutput({summary:'new result',copy:'new detail'});
  c.undoNameOutput('summary');assert.equal(storage.output.summary,'');
});

test('five-click detection uses the entire rolling two-second window, not gaps between clicks',()=>{
  const c=setup().context;
  for (const time of [0,600,1200,1800,2400]) assert.equal(c.registerNameOutputClearClick(time),false);
  assert.equal(c.registerNameOutputClearClick(2500),true);
  assert.equal(c.registerNameOutputClearClick(2600),false);
  const other=setup().context;
  for (const time of [0,500,1000,1500,2001]) assert.equal(other.registerNameOutputClearClick(time),false);
});

test('keyboard and browser undo events restore text without touching other fields',async()=>{
  const {context:c,storage,handlers}=setup({state:null,output:{summary:'original',copy:'detail'}});
  c.appView='name';c.saveNameSearchOutput({summary:'edited',copy:'detail'});
  const target={id:'moNsSummaryOutput',value:'edited',setSelectionRange:(a,b)=>target.selection=[a,b]};
  let prevented=0;
  await handlers.keydown({target,key:'z',ctrlKey:true,preventDefault:()=>prevented++});
  assert.equal(target.value,'original');assert.equal(prevented,1);
  await handlers.keydown({target,key:'Z',metaKey:true,shiftKey:true,preventDefault:()=>prevented++});
  assert.equal(target.value,'edited');
  await handlers.beforeinput({target,cancelable:true,inputType:'historyUndo',preventDefault:()=>prevented++});
  assert.equal(target.value,'original');
  await handlers.input({target,inputType:'historyRedo',preventDefault:()=>prevented++});
  assert.equal(target.value,'edited');
  assert.equal(storage.output.copy,'detail');
  await handlers.keydown({target:{id:'moNsFirst'},key:'z',ctrlKey:true,preventDefault:()=>assert.fail('name field intercepted')});
  c.appView='text';
  await handlers.keydown({target,key:'z',ctrlKey:true,preventDefault:()=>assert.fail('other tool intercepted')});
  assert.equal(storage.output.summary,'edited');
});

test('Ctrl+Z on Clear Log restores panes, but never while a search is active',async()=>{
  const {context:c,storage,handlers}=setup({state:null,output:{summary:'saved',copy:'saved detail'}});
  c.appView='name';await handlers.click({target:{id:'moJsonClear'}});
  let prevented=0;
  await handlers.keydown({target:{id:'moNsFirst',matches:()=>true},key:'z',ctrlKey:true,preventDefault:()=>assert.fail('input intercepted')});
  await handlers.keydown({target:{id:'moJsonClear'},key:'z',ctrlKey:true,preventDefault:()=>prevented++});
  assert.equal(storage.output.summary,'saved');assert.equal(prevented,1);
  c.saveNameState({active:true});
  await handlers.keydown({target:{id:'moJsonClear'},key:'z',ctrlKey:true,preventDefault:()=>assert.fail('active search intercepted')});
  assert.equal(storage.output,null);
});

test('an in-flight completion cannot reseed history after the five-click reset',async()=>{
  const {context:c,storage,handlers,clock}=setup();
  let finish;
  c.searchMunicourtEntriesByName=()=>new Promise(resolve=>finish=resolve);
  const running=c.nameSearchTick();
  for (const now of [0,100,200,300,400]) {clock.now=now;await handlers.click({target:{id:'moJsonClear'}});}
  finish([]);await running;
  assert.equal(storage.history,null);assert.equal(storage.output,null);
});

test('an older completion cannot replace a newer active search',async()=>{
  const {context:c,storage}=setup();
  let finish;
  c.searchMunicourtEntriesByName=()=>new Promise(resolve=>finish=resolve);
  const running=c.nameSearchTick();
  c.saveNameState({active:true,params:{first:'New name'},step:'go_search'});
  finish([]);await running;
  assert.equal(storage.output,undefined);
  assert.equal(storage.state.params.first,'New name');
});
