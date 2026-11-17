const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname,'../src/tampermonkey',file),'utf8');
function setup() {
  const c=vm.createContext({URL,URLSearchParams,Set,DOMException,
    norm:v=>String(v||'').trim(),dbg:()=>{},isStop:()=>false,
    postFormJsonRetry_tryCourtIds:async()=>({courtId:'CT21'}),
    headerToEntryBasics:()=>({caseTitle:'100 – Test',disposition:'Casefile Tranf Guilty',location:'Florissant Municipal Court'}),
    hasRealTitle:()=>true,extractDefendantAddressYob:()=>({yob:'2000'}),yobMatchesExpected:()=>({ok:true,years:[]}),
    extractAttorney:()=>'- - -',findFirstWarrantOrSummons:()=>null,countFtas:()=>({count:0}),
    findBondAmountInDocketEntries:()=>'',analyzeDocketStatus:()=>({paidInFull:true}),
    findFirstCurrentOrFutureScheduledLine:()=>'- - -',findLicenseHoldDate:()=>'',findInitialAppearanceDate:()=>'',
    extractChargePartsFromChargesResponse:()=>({desc:'Test charge'}),getCaseBalanceIfGuiltyViaApi:async()=>'$0.00',
    location:{origin:'https://www.courts.mo.gov'},
  });
  vm.runInContext(read('14-build-entry-via-api-for-one-case.js'),c);
  vm.runInContext(read('18d-case-number-override.js'),c);
  return c;
}
test('normal scraper still stops; override collects all applicable exclusions and charges',async()=>{
  const c=setup(), input={caseNumber:'100',courtId:'CT21'};
  assert.equal((await c.scrapeCaseViaApi(input))._skipReason,'transferred_case');
  const entry=await c.scrapeCaseViaApi(input,'',null,{includeExcluded:true});
  assert.deepEqual(Array.from(entry._exclusionReasons),['transferred_case','paid_in_full','guilty_zero_balance_nonwarrant']);
  assert.equal(entry.chargeDescription,'Test charge');
  assert.ok(c.formatOverrideReasons(entry).includes('- Docket indicates paid in full.'));
});
test('City municipal exception and unknown balance do not report zero-balance exclusion',async()=>{
  const c=setup(), input={caseNumber:'100',courtId:'CT21'};
  c.headerToEntryBasics=()=>({caseTitle:'100 – Test',disposition:'Guilty',location:'City of St. Louis Municipal'});
  assert.ok(!(await c.scrapeCaseViaApi(input,'',null,{includeExcluded:true}))._exclusionReasons.includes('guilty_zero_balance_nonwarrant'));
  c.headerToEntryBasics=()=>({caseTitle:'100 – Test',disposition:'Guilty',location:'Florissant Municipal Court'});
  c.getCaseBalanceIfGuiltyViaApi=async()=>'- - -';
  assert.ok(!(await c.scrapeCaseViaApi(input,'',null,{includeExcluded:true}))._exclusionReasons.includes('guilty_zero_balance_nonwarrant'));
});
test('input deduplicates without interpreting a second case number as court ID',()=>{
  const c=setup();
  assert.deepEqual(Array.from(c.parseOverrideNumbers('100, 200\n100; ab-300')),['100','200','AB-300']);
  assert.throws(()=>c.parseOverrideNumbers('<invalid>'));
  assert.equal(vm.runInContext('MUNI_CASE_COURTS.length',c),50);
});
test('Case.net lookup uses captured payload and follows single-result redirect',async()=>{
  const c=setup();let payload;
  c.stopAwareFetch=async(url,options)=>{payload=new URLSearchParams(options.body);return {ok:true,url:'https://www.courts.mo.gov/casenet/cases/newHeader.do?inputVO.caseNumber=100&inputVO.courtId=CT21',text:async()=>''};};
  c.parseCaseFromUrl=url=>{const p=new URL(url).searchParams;return {caseKey:`${p.get('inputVO.caseNumber')}|${p.get('inputVO.courtId')}`};};
  const result=await c.findCaseCandidatesByCaseNumber('100');
  assert.equal(result[0].caseKey,'100|CT21');
  assert.deepEqual(Object.fromEntries(payload),{caseNumber:'100',courtType:'',countyCode:'',cortCode:'SW'});
});
