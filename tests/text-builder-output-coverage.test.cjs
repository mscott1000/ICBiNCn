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
test('Repeat Attempt names only the summary Courts, stripping phones and division/judge details',()=>{
 const cases=[
  ['FLORISSANT MUNICIPAL - (314) 921-3322\n- 1: Charge - warrant','in Florissant Municipal Court.'],
  ['FLORISSANT MUNICIPAL - (314) 921-3322\n- 1: Charge - warrant\nST. LOUIS COUNTY CIRCUIT, DIV 39 - Judge KELLY SNYDER\n| Court Clerk: (314) 615-1539 |\n- 2: Other - warrant','in Florissant Municipal Court and St. Louis County Circuit Court.'],
  ['- 1: Charge - warrant','shown in the attached image.']
 ];
 for(const [summary,expected] of cases){
  const c=setup({researchType:'Can’tDo: Repeat Attempt',ineligibleCases:summary,courts:['Bridgeton']});
  const message=c.textBuilderBuildMessage();assert.ok(message.includes('warrants '+expected),message);
  for(const excluded of ['Bridgeton','KELLY SNYDER','615-1539','921-3322','DIV 39','1: Charge'])assert.ok(!message.includes(excluded));
 }
 const c=setup();
 assert.deepEqual(Array.from(c.textBuilderCourtNamesFromSummary('FLORISSANT MUNICIPAL\n- 1: Charge\nFLORISSANT MUNICIPAL COURT\n- 2: Charge')),['Florissant Municipal Court']);
});
test('mixed message uses exact approved sentence and eligible Court names in both address endings',()=>{
 const c=setup({researchType:'CanDo + Can’tDo',courts:['Florissant','Bridgeton'],eligibleCases:entry,multipleReasons:['Private Attorney'],multiplePrivateAttorney:'BRIDGETON MUNICIPAL\n- 2: Example - warrant',addressMode:'Have Address',address:'123 Test St'});
 let message=c.textBuilderBuildMessage();
 assert.ok(message.includes('We also found cases that we CANNOT assist with. The attached image displays what we found.'));
 assert.ok(!message.includes('these courts do not work with our program'));
 assert.ok(message.includes('To proceed with the cases that we CAN do in Florissant Municipal Court, please confirm that 123 Test St'));
 assert.ok(!message.includes('Bridgeton'));
 assert.ok(message.includes('We will submit the request to the Court on Wednesday.'));
 c.textBuilderState.data.addressMode='Need Address';message=c.textBuilderBuildMessage();assert.ok(message.includes('CAN do in Florissant Municipal Court, what address'));
 c.textBuilderState.data.multiplePrivateAttorney=' ';assert.ok(!c.textBuilderBuildMessage().includes('We also found cases'));
});
test('approved library preserves warrant-status meaning, Initial Warrant pluralization and all readiness day variants',()=>{
 const c=setup({researchType:'Nothing Found'});assert.match(c.textBuilderBuildMessage(),/criminal or ordinance violation cases in warrant status/);
 c.textBuilderState.data.researchType='Can’tDo: Initial Warrant';c.textBuilderState.data.courts=['Florissant','Bridgeton'];
 assert.match(c.textBuilderBuildMessage(),/found warrants in the Florissant Municipal and Bridgeton Municipal Courts/);
 assert.match(c.textBuilderBuildMessage(),/initial arrest warrant issued at the beginning of a case/);
 c.textBuilderState.data.courts=['Florissant'];assert.match(c.textBuilderBuildMessage(),/found a warrant in the Florissant Municipal Court/);
 c.textBuilderState.data.workflow='followUpReady';
 for(const [day,phrase] of [['Today is Monday','tomorrow evening'],['Today is Tuesday','this evening'],['Today is Wed-Sun','Tuesday evening']]){
  c.textBuilderState.data.followUpDay=day;const text=c.textBuilderBuildMessage();assert.ok(text.includes(phrase));assert.ok(text.includes('It usually takes the Court one to two weeks to process our requests.'));
 }
});
test('updated Fresh Start Friday body is shared and Walk-In mixed timing is removed without changing eligible-only wording',()=>{
 const c=setup({researchType:"Can'tDo: Multiple Reasons",multipleReasons:['Fresh Start Friday'],multipleFreshStartFriday:entry});
 const text=c.textBuilderBuildMessage();assert.ok(text.includes('Fresh Start Friday is a virtual court hearing'));assert.ok(text.includes('You can call the St. Louis County Municipal Court at (314) 615-8760.'));assert.equal((text.match(/Hello, this is/g)||[]).length,1);
 c.textBuilderState.data.workflow='walkInDropIn';c.textBuilderState.data.eligibleCases=entry;
 assert.ok(c.textBuilderDropInIneligibleMessage().includes('summary of the cases we found.'));
 assert.ok(!c.textBuilderDropInEligibleMessage(false).includes('tomorrow morning'));assert.ok(!c.textBuilderDropInEligibleMessage(false).includes('one to two weeks'));
 assert.ok(c.textBuilderDropInEligibleMessage(true).includes('We are awaiting the Judge’s decision'));
 c.textBuilderState.data.eligibleCases='';assert.ok(c.textBuilderDropInIneligibleMessage().includes('summary of what we found.'));
});
