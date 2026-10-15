const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const read = name => fs.readFileSync(path.join(__dirname, '../src/tampermonkey', name), 'utf8');
function setup() {
  const storage = {state:{active:true,passes:[],params:{},casenetAddedTotal:2}};
  const handlers = {}, classes = new Set(), nodes = [];
  const classList = {toggle:(k,on)=>on?classes.add(k):classes.delete(k),remove:()=>{}};
  const context = vm.createContext({
    KEY_NAMESEARCH:'state',KEY_NAMESEARCH_OUTPUT:'output',
    loadJson:(k,f)=>storage[k]??f,saveJson:(k,v)=>storage[k]=v,
    dock:{addEventListener:(k,fn)=>handlers[k]=fn,classList,querySelector:()=>null},
    $content:{classList,appendChild:n=>nodes.push(n)},$status:{style:{}},
    document:{createElement:()=>({}),getElementById:()=>null},
    appView:'home',APP_VIEWS:{name:'Name Search'},
    location:{hostname:'www.courts.mo.gov'},
    loadLog:()=>[],saveLog:()=>{},loadDraft:()=>({}),
    isRun:()=>false,isStop:()=>false,
    setIcbincnTabTitleText:()=>{},uiStatus:()=>{},render:()=>{},expandDock:()=>{},dbg:()=>{},
    searchMunicourtEntriesByName:async()=>[],
    buildSummaryCopyText:()=> 'Summary <court>\nordered',buildGroupedCopyText:()=> 'Copy & details\nordered',
    escapeHtml:s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'),
    addBlock:(title,html)=>nodes.push({title,html}),SHOW_NAME_SEARCH_DEBUG_UI:false,
  });
  vm.runInContext(read('04-name-search-two-pass-state-machine.js'),context);
  context.setIcbincnTabTitleText = () => {};
  vm.runInContext(read('19-buttons.js'),context);
  return {context,storage,handlers,classes,nodes};
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
test('edits survive rerender and new searches discard the previous completion snapshot',async()=>{
  const {context:c,storage,handlers}=setup();
  await c.nameSearchTick();
  handlers.input({target:{id:'moNsSummaryOutput',value:'edited summary'}});
  handlers.input({target:{id:'moNsCopyOutput',value:'edited copy'}});
  assert.equal(storage.output.summary,'edited summary');
  assert.equal(storage.output.copy,'edited copy');
  c.saveNameState({active:true});assert.equal(storage.output,null);
});
