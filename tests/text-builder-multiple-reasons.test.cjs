const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(`${__dirname}/../src/tampermonkey/17-ui.js`, 'utf8');
function setup() {
  const c = vm.createContext({uiStatus:()=>{},escapeHtml:s=>String(s).replaceAll('<','&lt;'),textBuilderState:{screen:'researchType',history:[],data:{workflow:'postResearch',staff:'Casey',courts:[]}}});
  vm.runInContext(source.slice(source.indexOf('const TEXT_BUILDER_MULTIPLE_REASONS_PATH'),source.indexOf('function textBuilderOptionalBlock')),c);
  vm.runInContext(source.slice(source.indexOf('function textBuilderBuildMessage()'),source.indexOf('function positionTextBuilderPanel()')),c);
  vm.runInContext('renderTextBuilder = () => {};',c);
  return c;
}
const path = "Can'tDo: Multiple Reasons";
const labels = ['Private Attorney','Out of Network','Repeat Attempt','Fresh Start Friday','Initial Warrant','Recent FTA'];
test('selection requires a reason, supports toggling, and visits all selected fields once',()=>{
  const c=setup();
  c.textBuilderMultipleReasonAction('chooseResearchType',path);
  assert.equal(c.textBuilderScreenTitle(),`Text Builder - ${path}`);
  c.textBuilderMultipleReasonAction('confirmMultipleReasons');
  assert.equal(c.textBuilderState.screen,'multipleReasons');
  for(const label of [...labels,'Recent FTA','Recent FTA']) c.textBuilderMultipleReasonAction('toggleMultipleReason',label);
  assert.equal(c.textBuilderState.data.multipleReasons.length,6);
  assert.match(c.textBuilderOptions(path,labels,'toggleMultipleReason',true),/moSelected/);
  assert.deepEqual(c.textBuilderState.data.courts,[]);
  c.textBuilderMultipleReasonAction('confirmMultipleReasons');
  for(const label of labels){
    assert.equal(c.textBuilderState.screen,'multipleReasonInput');
    assert.ok(c.textBuilderScreenTitle().endsWith(label));
    const reason=c.textBuilderSelectedReasons()[c.textBuilderState.data.multipleReasonIndex];
    c.textBuilderState.data[reason.key]=`Summary: ${label}`;
    c.textBuilderMultipleReasonAction('confirmMultipleReasonInput');
  }
  assert.equal(c.textBuilderState.screen,'message');
  const order=['Repeat Attempt','Initial Warrant','Private Attorney','Fresh Start Friday','Recent FTA','Out of Network'];
  assert.equal(c.textBuilderBuildMessage(),['Hello, this is Casey from the Tap In Center. We were unable to find cases that are eligible for our service. Here is a summary and explanation of what we found:',...order.map(label=>`Summary: ${label}`),'If you feel we have missed something, please share the case number(s).'].join('\n\n'));
  c.textBuilderBack();
  assert.ok(c.textBuilderScreenTitle().endsWith('Recent FTA'));
  assert.equal(c.textBuilderState.data.multipleRecentFta,'Summary: Recent FTA');
});
test('every single reason works; blank and deselected summaries are omitted',()=>{
  for(const label of labels){
    const c=setup();
    c.textBuilderMultipleReasonAction('chooseResearchType',path);
    c.textBuilderMultipleReasonAction('toggleMultipleReason',label);
    c.textBuilderMultipleReasonAction('confirmMultipleReasons');
    const reason=c.textBuilderSelectedReasons()[0];
    c.textBuilderState.data[reason.key]='Case 123\nExplanation';
    c.textBuilderMultipleReasonAction('confirmMultipleReasonInput');
    assert.equal(c.textBuilderState.screen,'message');
    assert.match(c.textBuilderBuildMessage(),/found:\n\nCase 123\nExplanation\n\nIf you feel/);
    c.textBuilderState.data[reason.key]='  ';
    assert.match(c.textBuilderBuildMessage(),/found:\n\nIf you feel/);
    c.textBuilderBack();c.textBuilderBack();
    c.textBuilderMultipleReasonAction('toggleMultipleReason',label);
    c.textBuilderState.data[reason.key]='stale summary';
    assert.ok(!c.textBuilderBuildMessage().includes('stale summary'));
  }
});
test('both UI entry points route the new actions and render distinct fields safely',()=>{
  assert.match(source,/textBuilderMultipleReasonAction\(action,value\)/);
  const dock=fs.readFileSync(`${__dirname}/../src/tampermonkey/19-buttons.js`,'utf8');
  assert.match(dock,/textBuilderMultipleReasonAction\(action,value\)/);
  const c=setup();
  c.textBuilderMultipleReasonAction('chooseResearchType',path);
  c.textBuilderMultipleReasonAction('toggleMultipleReason','Private Attorney');
  c.textBuilderMultipleReasonAction('confirmMultipleReasons');
  c.textBuilderState.data.multiplePrivateAttorney='<case>';
  assert.match(c.textBuilderTextarea('Private Attorney','summary','confirmMultipleReasonInput','multiplePrivateAttorney'),/&lt;case>/);
  assert.equal(c.textBuilderMultipleReasonAction('confirmIneligible'),false);
});
