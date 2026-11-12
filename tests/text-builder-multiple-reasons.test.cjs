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
const labels = ['Private Attorney','Out of Network','Repeat Attempt','Fresh Start Friday','Initial Warrant','Recent FTA','Florissant Seatbelt'];
test('selection requires a reason, supports toggling, and visits all selected fields once',()=>{
  const c=setup();
  c.textBuilderMultipleReasonAction('chooseResearchType',path);
  assert.equal(c.textBuilderScreenTitle(),"Text Builder - Can'tDo Reason(s)");
  c.textBuilderMultipleReasonAction('confirmMultipleReasons');
  assert.equal(c.textBuilderState.screen,'multipleReasons');
  for(const label of [...labels,'Recent FTA','Recent FTA']) c.textBuilderMultipleReasonAction('toggleMultipleReason',label);
  assert.equal(c.textBuilderState.data.multipleReasons.length,7);
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
  const message=c.textBuilderBuildMessage();
  assert.match(message,/The attached image is a summary and explanation/);
  assert.ok(!message.includes('Summary:'));
  assert.ok(message.includes('FSF is a virtual court hearing'));
  assert.ok(message.includes('https://mocourts.webex.com/meet/courtney.whiteside'));
  assert.ok(message.includes('The Court will not recall seatbelt charges through our program'));
  assert.equal((message.match(/Hello, this is Casey/g)||[]).length,1);
  c.textBuilderBack();
  assert.ok(c.textBuilderScreenTitle().endsWith('Florissant Seatbelt'));
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
    assert.ok(!c.textBuilderBuildMessage().includes('Case 123'));
    if (label === 'Fresh Start Friday') assert.ok(c.textBuilderBuildMessage().includes(c.textBuilderFreshStartFridaysBody()));
    assert.match(c.textBuilderBuildMessage(),/attached image/);
    c.textBuilderState.data[reason.key]='  ';
    assert.ok(!c.textBuilderBuildMessage().includes('attached image'));
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
  assert.equal(c.textBuilderMultipleReasonAction('unrelatedAction'),false);
});

test('standalone Fresh Start Fridays retains the standalone greeting and shared program explanation',()=>{
 const c=setup();
 assert.ok(c.textBuilderFreshStartFridaysMessage().startsWith('This is Casey from the Tap In Center, thank you for filling out the intake!'));
 assert.ok(c.textBuilderFreshStartFridaysMessage().includes('We attached case details, and here is how the program works:'));
 assert.ok(c.textBuilderFreshStartFridaysMessage().includes('FSF is a virtual court hearing'));
});
