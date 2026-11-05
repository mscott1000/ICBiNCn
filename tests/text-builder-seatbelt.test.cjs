const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '../src/tampermonkey', file), 'utf8');
const ui = read('17-ui.js');
function setup(panel) {
  const listeners = {};
  const context = vm.createContext({
    textBuilderState:{screen:'courts',history:[],data:{workflow:'followUpNewCourtDate',staff:'Staff',courts:[]}},
    renderTextBuilder:()=>{},appView:'text',
    textBuilderPanel:{addEventListener:(type,fn)=>listeners[type]=fn},
    dock:{addEventListener:(type,fn)=>listeners[type]=fn},
  });
  vm.runInContext(ui.slice(ui.indexOf('function textBuilderCourtLabel'),ui.indexOf('function textBuilderOptionBlockClass')),context);
  vm.runInContext(ui.slice(ui.indexOf('function textBuilderOptionalBlock'),ui.indexOf('function textBuilderHasCaseData')),context);
  vm.runInContext(ui.slice(ui.indexOf('function textBuilderFollowUpNewCourtDateMessage'),ui.indexOf('function textBuilderBuildMessage')),context);
  const source = panel ? ui : read('19-buttons.js');
  const start = source.indexOf(panel ? "textBuilderPanel.addEventListener('click'" : "dock.addEventListener('click',(e) => {const action = e?.target?.dataset?.tbAction;");
  const end = source.indexOf(panel ? '\n\n\n\nconst APP_VIEWS' : "\n\n  dock.addEventListener('input'",start);
  vm.runInContext(source.slice(start,end),context);
  return {context,click:(action,value)=>listeners.click({target:{dataset:{tbAction:action,tbValue:value}}})};
}
for (const panel of [false,true]) {
  test(`${panel?'panel':'dock'}: Florissant alone or combined supports Yes, summary, court date and Back/No`,()=>{
    for (const courts of [['Florissant'],['Kirkwood','Florissant']]) {
      const {context:c,click} = setup(panel);
      c.textBuilderState.data.courts = courts;
      click('confirmCourts');
      assert.equal(c.textBuilderScreenTitle(),'Text Builder - New Court Date, Seatbelt?');
      click('chooseNewCourtDateSeatbelt','Yes');
      assert.equal(c.textBuilderScreenTitle(),'Text Builder - Seatbelt');
      c.textBuilderState.data.newCourtDateSeatbeltSummary = 'Case 123: seatbelt';
      click('confirmNewCourtDateSeatbelt');
      assert.equal(c.textBuilderState.screen,'newCourtDateInput');
      c.textBuilderState.data.newCourtDate = 'December 1';
      click('confirmNewCourtDate');
      assert.equal(c.textBuilderState.screen,'message');
      assert.ok(c.textBuilderFollowUpNewCourtDateMessage().endsWith('\n\nAs a reminder, the seatbelt case is still active:\n\nCase 123: seatbelt\n\nYou can address this by phone or in-person with the Florissant clerk. It is now the only remaining warrant in Florissant, and they can provide options for you.'));
      click('back'); click('back'); click('back');
      click('chooseNewCourtDateSeatbelt','No');
      assert.equal(c.textBuilderState.screen,'newCourtDateInput');
      assert.ok(!c.textBuilderFollowUpNewCourtDateMessage().includes('seatbelt'));
    }
  });
  test(`${panel?'panel':'dock'}: other courts skip the prompt and blank summaries omit reminder`,()=>{
    const {context:c,click} = setup(panel);
    c.textBuilderState.data.courts = ['Kirkwood'];
    click('confirmCourts');
    assert.equal(c.textBuilderState.screen,'newCourtDateInput');
    c.textBuilderState.data.courts = ['Florissant'];
    c.textBuilderState.data.newCourtDateSeatbeltSummary = ' \n ';
    assert.ok(!c.textBuilderFollowUpNewCourtDateMessage().includes('seatbelt'));
  });
}
