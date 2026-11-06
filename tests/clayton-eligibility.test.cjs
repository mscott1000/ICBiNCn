const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const read = name => fs.readFileSync(path.join(__dirname,'../src/tampermonkey',name),'utf8');
const formatting = read('15-log-formatting-reused-from-your-dom-tool-adapted.js');
function setup() {
  const c = vm.createContext({norm:s=>String(s || '').replace(/\s+/g,' ').trim()});
  vm.runInContext(formatting.slice(formatting.indexOf('  const MUNICIPALITY_CONTACTS_RAW')),c);
  return c;
}
test('CaseNet Clayton Municipal is eligible and uses existing uppercase clerk header',()=>{
  const c = setup();
  assert.equal(c.isEligibleSummaryJurisdiction('Clayton Municipal'),true);
  assert.equal(c.isEligibleSummaryJurisdiction('CLAYTON MUNICIPAL'),true);
  assert.equal(c.getMunicipalityHeaderForSummary('Clayton Municipal'),'CLAYTON MUNICIPAL - (314) 290-8441');
  assert.equal(c.isEligibleSummaryJurisdiction('St. Louis County Municipal'),false);
  assert.equal(c.isEligibleSummaryJurisdiction('Joplin Municipal'),false);
});
test('Clayton cases join eligible group while upcoming court dates remain separate',()=>{
  const c = setup();
  c.getWarrantLabelForSummary = ()=> 'warrant';
  const warrant = {location:'Clayton Municipal',charge:'Example',caseNumber:'123'};
  const upcoming = {...warrant,caseNumber:'456',nextDocketDate:'12/01/2026'};
  const groups = c.buildOrderedJurisdictionGroups([warrant,upcoming]);
  assert.equal(groups.eligibleJurisdictions.length,1);
  assert.equal(groups.eligibleJurisdictions[0].entries[0],warrant);
  assert.equal(groups.ineligibleJurisdictions[0].entries[0],upcoming);
});
test('Text Builder uses short option names and municipal labels in constructed messages',()=>{
  const ui = read('17-ui.js');
  const c = vm.createContext({textBuilderState:{data:{staff:'Staff',workflow:'initial',courts:['Clayton'],newCourtDate:'December 1'}}});
  vm.runInContext(ui.slice(ui.indexOf('const TEXT_BUILDER_COURTS'),ui.indexOf('function textBuilderInitialState')),c);
  vm.runInContext(ui.slice(ui.indexOf('function textBuilderCourtLabel'),ui.indexOf('function textBuilderLimitMessage')),c);
  vm.runInContext(ui.slice(ui.indexOf('function textBuilderOptionalBlock'),ui.indexOf('function renderTextBuilder')),c);
  vm.runInContext("textBuilderState.data = {staff:'Staff',workflow:'initial',courts:['Clayton'],newCourtDate:'December 1'}",c);
  const data = vm.runInContext('textBuilderState.data',c);
  assert.equal(vm.runInContext("TEXT_BUILDER_COURTS.includes('Clayton')",c),true);
  assert.equal(c.textBuilderCourtLabel('Clayton'),'Clayton Municipal');
  assert.match(c.textBuilderBuildMessage(),/\nClayton\nFlorissant\n/);
  data.workflow = 'postResearch';
  data.researchType = 'Can’tDo: Out of Network';
  assert.match(c.textBuilderBuildMessage(),/\nClayton\nFlorissant\n/);
  data.workflow = 'followUpNewCourtDate';
  assert.match(c.textBuilderBuildMessage(),/The Clayton Municipal Court has agreed to recall the warrant/);
});
