const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=f=>fs.readFileSync(`${__dirname}/../src/tampermonkey/${f}`,'utf8'),ui=read('17-ui.js');
function setup(data={}){
 const c=vm.createContext({GM_addStyle(){},escapeHtml:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;'),uiStatus:s=>{c.status=s;},GM_setClipboard:s=>{c.copied=s;}});
 vm.runInContext(ui.slice(ui.indexOf('const TEXT_BUILDER_COURTS'),ui.indexOf('function positionTextBuilderPanel()')),c);
 vm.runInContext(read('17a-constructed-infographics.js'),c);
 vm.runInContext('renderTextBuilder=()=>{}',c);
 vm.runInContext('textBuilderState.data={staff:"Casey",workflow:"postResearch",courts:["Florissant"],...'+JSON.stringify(data)+'}',c);
 c.textBuilderState=vm.runInContext("textBuilderState",c);return c;
}
const entry='FLORISSANT MUNICIPAL - (314) 921-3322\n- CASE-123: Example charge - warrant - hold placed on license';
test('every individual reason keeps its case input in the image and out of the outgoing prose',()=>{
 for(const [path,key] of [['Private Attorney','privateAttorneyCases'],['Out of Network','ineligibleCases'],['Repeat Attempt','ineligibleCases'],['Fresh Start Friday','ineligibleCases'],['Initial Warrant','ineligibleCases'],['Recent FTA, Not a Warrant Yet','ineligibleCases']]){
  const c=setup({researchType:'Can’tDo: '+path,[key]:entry,ftaDate:'11/01/2026',remainingIneligibleCases:'obsolete input'});
  const message=c.textBuilderBuildMessage(),sources=c.textBuilderInfographicSources();
  assert.ok(!message.includes('CASE-123'),path);assert.ok(!message.includes('obsolete input'));
  assert.equal(sources.length,1);assert.equal(sources[0].sections[0].text,entry);
  c.textBuilderState.data[key]=' ';assert.equal(c.textBuilderInfographicSources().length,0);
 }
});
test('all seven reasons share omission decisions across mixed, multiple and Walk-In flows',()=>{
 const c=setup();
 for(const mode of ['multiple','mixed','walkin']){
  const d=c.textBuilderState.data;d.workflow=mode==='walkin'?'walkInDropIn':'postResearch';d.researchType=mode==='mixed'?'CanDo + Can’tDo':"Can'tDo: Multiple Reasons";d.eligibleCases=mode==='multiple'?'':entry;
  const reasons=vm.runInContext('TEXT_BUILDER_MULTIPLE_REASONS',c);d.multipleReasons=reasons.map(r=>r.label);
  for(const r of reasons)d[r.key]=entry+' '+r.label;
  const sources=c.textBuilderInfographicSources(),ineligible=sources.find(s=>s.type==='ineligible');
  assert.equal(ineligible.sections.length,7);assert.equal(sources.length,mode==='multiple'?1:2);
  const text=mode==='walkin'?c.textBuilderDropInIneligibleMessage():c.textBuilderBuildMessage();assert.ok(!text.includes('CASE-123'));assert.ok(text.includes('https://mocourts.webex.com/meet/courtney.whiteside'));
  assert.equal((text.match(/thank you for/g)||[]).length,mode==='mixed'?1:mode==='walkin'?1:0);
  d.multipleFreshStartFriday=' ';d.multipleFlorissantSeatbelt='';
  assert.equal(c.textBuilderInfographicSources().find(s=>s.type==='ineligible').sections.length,5);
  const without=mode==='walkin'?c.textBuilderDropInIneligibleMessage():c.textBuilderBuildMessage();assert.ok(!without.includes('webex'));assert.ok(!without.includes('seatbelt charges'));
  d.multipleReasons=[];assert.ok(!c.textBuilderInfographicSources().some(s=>s.type==='ineligible'));assert.ok(!c.textBuilderBuildMessage().includes('what we CANNOT assist with'));
 }
});
test('seatbelt explanation changes with actual eligible content; CanDo Everything ignores old seatbelt fields',()=>{
 const c=setup({researchType:'CanDo + Can’tDo',eligibleCases:entry,multipleReasons:['Florissant Seatbelt'],multipleFlorissantSeatbelt:entry});
 assert.match(c.textBuilderBuildMessage(),/after we hear back on the cases we submit/);
 c.textBuilderState.data.eligibleCases='';assert.match(c.textBuilderBuildMessage(),/Contact the Florissant clerk/);
 c.textBuilderState.data.researchType='CanDo: Everything';c.textBuilderState.data.eligibleCases=entry;c.textBuilderState.data.seatbeltViolations='stale seatbelt';
 assert.equal(c.textBuilderNeedsSeatbeltViolations(),false);assert.ok(!c.textBuilderBuildMessage().includes('seatbelt'));
 assert.equal(c.textBuilderInfographicSources().length,1);
});
test('follow-up date and seatbelt summaries stay in text, with no image even if stale research data exists',()=>{
 const c=setup({workflow:'followUpNewCourtDate',researchType:'CanDo + Can’tDo',eligibleCases:entry,newCourtDate:'11/20/2026; 9:00 AM (for CASE-123)',newCourtDateSeatbeltSummary:'SEATBELT-456'});
 assert.match(c.textBuilderBuildMessage(),/11\/20\/2026; 9:00 AM \(for CASE-123\)/);assert.match(c.textBuilderBuildMessage(),/SEATBELT-456/);assert.equal(c.textBuilderInfographicSources().length,0);
 c.textBuilderState.data.workflow='legalAidResources';c.textBuilderState.data.legalAidResource='Spongey - expungement tool';assert.match(c.textBuilderBuildMessage(),/spongey.app/);assert.equal(c.textBuilderInfographicSources().length,0);
});
test('all output types support editable drafts, exact copying, rerender retention and explicit reset',()=>{
 for(const workflow of ['initial','postResearch','followUpReady','followUpNewCourtDate','legalAidResources','walkInDropIn']){
  const c=setup({workflow,researchType:'CanDo: Everything',eligibleCases:entry,followUpDay:'Today is Monday',legalAidResource:'Spongey - expungement tool'});
  const base=c.textBuilderBuildMessage();assert.match(c.textBuilderMessageEditor('main',base,'field'),/<textarea/);
  c.textBuilderState.data.messageDrafts.main.text='Custom message\nSecond line';
  c.textBuilderMessageEditor('main',base,'field');c.textBuilderOutputAction('copyEditedMessage','main');assert.equal(c.copied,'Custom message\nSecond line');
  c.textBuilderOutputAction('resetMessage','main');assert.equal(c.textBuilderMessageDraft('main',base).text,base);
 }
});
test('rebuilding image case data preserves all edited next steps and removes omitted reason sections',()=>{
 const c=setup({researchType:"Can'tDo: Multiple Reasons",multipleReasons:['Repeat Attempt','Out of Network'],multipleRepeatAttempt:entry,multipleOutOfNetwork:entry});
 c.textBuilderInfographicMeasure=()=>((s,size)=>s.length*size*.5);
 let source=c.textBuilderInfographicSources()[0],draft=c.textBuilderInfographicDraft(source);
 draft.model.boxes.find(b=>b.kind==='step').text='Keep this step';draft.model.boxes.push({id:'extra-step',text:'And this step',x:44,y:0,width:872,size:23,kind:'step'});
 c.textBuilderState.data.multipleReasons=['Repeat Attempt'];c.textBuilderState.data.multipleRepeatAttempt=entry.replace('CASE-123','CASE-789');
 draft=c.textBuilderInfographicDraft(c.textBuilderInfographicSources()[0]);
 assert.deepEqual(Array.from(draft.model.boxes.filter(b=>b.kind==='step'),b=>b.text),['Keep this step','And this step']);
 assert.ok(draft.model.boxes.some(b=>String(b.fullText||b.text).includes('CASE-789')));assert.ok(!draft.model.boxes.some(b=>b.text==='Out of TIC Network'));
});
test('new Courts are selectable and blank inputs do not advance into fabricated results',()=>{
 const c=setup();for(const name of ['Bridgeton','Lakeshire']){assert.ok(vm.runInContext(`TEXT_BUILDER_COURTS.includes('${name}')`,c));assert.equal(c.textBuilderCourtLabel(name),name+' Municipal');}
 assert.match(c.textBuilderBuildMessage.call(null),/Tap In Center/);
 c.textBuilderState.screen='eligibleDropin';c.textBuilderState.data.researchType='CanDo: Everything';c.textBuilderOutputAction('confirmEligible');assert.equal(c.textBuilderState.screen,'eligibleDropin');
 c.textBuilderState.screen='privateAttorneyDropin';c.textBuilderState.data.privateAttorneyCases=entry;c.textBuilderOutputAction('confirmPrivateAttorney');assert.equal(c.textBuilderState.screen,'message');
});
