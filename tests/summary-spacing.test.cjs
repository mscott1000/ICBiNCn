const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../src/tampermonkey/15-log-formatting-reused-from-your-dom-tool-adapted.js'), 'utf8');
const eligible = 'FLORISSANT MUNICIPAL - (314) 921-3322\n- 200626473: Failed To Register Vehicle - warrant';
function summary(ineligible = '') {
  const c = vm.createContext({loadLog:()=>[],norm:s=>s,document:{getElementById:()=>null},
    buildOrderedJurisdictionGroups:()=>({eligibleJurisdictions:'eligible',ineligibleJurisdictions:'ineligible'}),
    buildJurisdictionSummarySections:group=>({sections:[group==='eligible'?eligible:ineligible,'']})});
  vm.runInContext(source.slice(source.indexOf('  function buildSummaryCopyText()')),c);
  return c.buildSummaryCopyText();
}
test('eligible-only summary has one blank line before closing separator',()=>{
  assert.equal(summary(),`- - -\n\n${eligible}\n\n- - -`);
});
test('eligible section has one blank line before the next section separator',()=>{
  const ineligible='OTHER COURT\n- 123: Example charge - warrant';
  assert.equal(summary(ineligible),`- - -\n\n${eligible}\n\n- - -\n\n${ineligible}\n\n- - -`);
});
