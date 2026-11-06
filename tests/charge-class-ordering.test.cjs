const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname,'../src/tampermonkey/15-log-formatting-reused-from-your-dom-tool-adapted.js'),'utf8');
const entry = (caseNumber,location,chargeType,status='warrant') => ({caseNumber,location,chargeType,status,chargeDescription:caseNumber});
function setup(log) {
  const c = vm.createContext({norm:s=>String(s || '').replace(/\s+/g,' ').trim(),loadLog:()=>log,
    document:{getElementById:()=>null},yobMatchesExpected:()=>({ok:true}),
    formatEntry:e=>e.caseNumber,applyMuniDetailFormatting:e=>e});
  vm.runInContext(source.slice(source.indexOf('  function buildGroupedCopyText()'),source.indexOf('  const MUNICIPALITY_CONTACTS_RAW')),c);
  vm.runInContext(source.slice(source.indexOf('  const MUNICIPALITY_CONTACTS_RAW')),c);
  c.getWarrantLabelForSummary = e=>e.status;
  c.getSummaryLineStatus = e=>e.status;
  c.parseUpcomingCourtDate = e=>e.nextDocketDate || '';
  return c;
}
function inOrder(output,ids) {
  let previous = -1;
  for (const id of ids) {
    const current = output.indexOf(id);
    assert.ok(current > previous,`${id} should appear after previous case in:\n${output}`);
    previous = current;
  }
}
test('Summary and Detail order courts and cases by felony, misdemeanor, then status',()=>{
  const log = [
    entry('1001','Florissant Municipal','Ordinance','hold'),
    entry('1002','Clayton Municipal','Misdemeanor','warrant'),
    entry('1003','Clayton Municipal','Felony','nonwarrant'),
    entry('1004','Clayton Municipal','Misdemeanor','hold'),
    entry('1005','Joplin Municipal','Ordinance','hold'),
    entry('1006','Jefferson County Circuit','Misdemeanor','warrant'),
    entry('1007','Madison Circuit','Felony','nonwarrant'),
  ];
  const c = setup(log);
  for (const output of [c.buildSummaryCopyText(),c.buildGroupedCopyText()]) {
    inOrder(output,['1003','1004','1002','1001','1007','1006','1005']);
  }
  assert.equal(c.getJurisdictionScore([log[2]]),100);
  assert.equal(c.getJurisdictionScore([log[1]]),50);
});
test('Summary orders judge groups by charge weight and preserves ties',()=>{
  const log = [entry('2001','Example Circuit','Ordinance','hold'),entry('2002','Example Circuit','Misdemeanor'),entry('2003','Example Circuit','Felony'),entry('2004','Example Circuit','Felony')];
  log.forEach((e,i)=>e.judge = i === 0 ? 'One' : i === 1 ? 'Two' : 'Three');
  const c = setup(log);
  c.getMunicipalityHeaderForSummary = (location,judge)=> `${location} - ${judge}`;
  const {sections} = c.buildJurisdictionSummarySections([{jurisdiction:'Example Circuit',entries:log}]);
  inOrder(sections.join('\n'),['2003','2004','2002','2001']);
});
test('Upcoming cases stay excluded from summary sections and court score',()=>{
  const upcoming = {...entry('3001','Clayton Municipal','Felony'),nextDocketDate:'12/01/2026'};
  const c = setup([upcoming,entry('3002','Clayton Municipal','Misdemeanor')]);
  assert.equal(c.getJurisdictionScore([upcoming]),0);
  const output = c.buildSummaryCopyText();
  assert.ok(output.indexOf('3002') < output.indexOf('Upcoming Court Dates:'));
  assert.ok(output.indexOf('3001') > output.indexOf('Upcoming Court Dates:'));
});
