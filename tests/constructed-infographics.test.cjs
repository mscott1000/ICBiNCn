const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const file=fs.readFileSync(`${__dirname}/../src/tampermonkey/17a-constructed-infographics.js`,'utf8');
function setup(data={}) {const c=vm.createContext({textBuilderState:{data},GM_addStyle:()=>{},escapeHtml:s=>s});vm.runInContext(file,c);return c;}
const measure=(text,size)=>Array.from(text).length*size*0.55;
test('charge truncation keeps case identifiers, status, phone numbers and short charges',()=>{
 const c=setup();
 for(const status of ['- warrant','- open (no warrant found)']){
  assert.equal(c.textBuilderInfographicTruncate(`- 123: Failed To Register Vehicle ${status}`),`- 123: Failed To Re. . . ${status}`);
  assert.equal(c.textBuilderInfographicTruncate(`- 123: Exactly12345 ${status}`),`- 123: Exactly12345 ${status}`);
 }
 for(const line of ['FLORISSANT MUNICIPAL - (314) 921-3322','Notes: contact clerk','- 123: no matching status']) assert.equal(c.textBuilderInfographicTruncate(line),line);
 assert.equal(c.textBuilderInfographicTruncate('- 123: 😀😀😀😀😀😀😀😀😀😀😀😀😀 - warrant'),'- 123: 😀😀😀😀😀😀😀😀😀😀😀😀. . . - warrant');
});
test('eligible and ineligible sources use only entered summaries and correct reason titles',()=>{
 const c=setup({researchType:'CanDo + Can’tDo',eligibleCases:'COURT A\n- 1: Eligible',multipleReasons:['Out of Network','Recent FTA','Repeat Attempt'],multipleOutOfNetwork:'network input',multipleRecentFta:'fta input',multipleRepeatAttempt:'repeat input'});
 const sources=c.textBuilderInfographicSources();
 assert.equal(sources.length,2);assert.equal(sources[0].sections[0].text,'COURT A\n- 1: Eligible');
 assert.equal(sources[1].sections.map(s=>s.title).join('|'),'Repeat Attempt|Recent FTA, Not a Warrant Yet|Not in TIC Network');
 assert.equal(sources[1].sections.map(s=>s.text).join('|'),'repeat input|fta input|network input');
 for(const reason of c.textBuilderInfographicReasons()){
  c.textBuilderState.data={researchType:reason.path,ineligibleCases:'raw input',privateAttorneyCases:'attorney input',remainingIneligibleCases:'remaining input'};
  const s=c.textBuilderInfographicSources()[0];assert.equal(s.type,'ineligible');assert.equal(s.sections[0].title,reason.title);
  assert.equal(s.sections[0].text,reason.label==='Private Attorney'?'attorney input\n\nremaining input':'raw input');
 }
 c.textBuilderState.data={researchType:'Nothing Found'};assert.equal(c.textBuilderInfographicSources().length,0);
 c.textBuilderState.data={researchType:'CanDo: Everything',eligibleCases:'eligible only'};assert.equal(c.textBuilderInfographicSources()[0].type,'eligible');
});
test('models group courts, grow for long input, and generate three empty next-step boxes',()=>{
 const c=setup();
 const text='FLORISSANT MUNICIPAL - (314) 921-3322\n- 1: Failed To Register Vehicle - warrant\nCITY OF ST. LOUIS MUNICIPAL\n- 2: Another Long Charge - warrant';
 const eligible=c.textBuilderInfographicModel({type:'eligible',sections:[{text}]},measure);
 assert.equal(eligible.boxes.filter(b=>b.text.includes('MUNICIPAL')).length,2);
 assert.ok(eligible.boxes.some(b=>b.text.includes('Failed To Register Vehicle')));
 assert.equal(eligible.boxes.filter(b=>b.kind==='step').map(b=>b.text).join(''),'');
 assert.equal(eligible.boxes.filter(b=>b.kind==='step').length,3);
 assert.equal(eligible.boxes.find(b=>b.kind==='stepsHeading').text,'Next Steps for TIC');
 const ineligible=c.textBuilderInfographicModel({type:'ineligible',sections:[{title:'Repeat Attempt',text}]},measure);
 assert.ok(ineligible.boxes.some(b=>b.text.includes('Failed To Re. . .')));
 assert.equal(ineligible.boxes.find(b=>b.kind==='stepsHeading').text,'Next Steps for You');
 const long=c.textBuilderInfographicModel({type:'ineligible',sections:[{title:'Repeat Attempt',text:Array(100).fill('- 123: Failed To Register Vehicle - warrant').join('\n')}]},measure);
 assert.ok(long.height>5000);
 for(const b of long.boxes) assert.ok(b.y+c.textBuilderInfographicBoxHeight(b,measure)<long.height);
});
test('mixed summaries finish at Address and populate the existing constructed message input',()=>{
 const ui=fs.readFileSync(`${__dirname}/../src/tampermonkey/17-ui.js`,'utf8');
 const c=vm.createContext({textBuilderState:{screen:'multipleReasonInput',data:{researchType:'CanDo + Can’tDo',multipleReasons:['Out of Network','Repeat Attempt'],multipleReasonIndex:1,multipleRepeatAttempt:'repeat',multipleOutOfNetwork:'network'}},textBuilderSet:(screen,patch)=>{c.textBuilderState.screen=screen;Object.assign(c.textBuilderState.data,patch);}});
 vm.runInContext(ui.slice(ui.indexOf('const TEXT_BUILDER_MULTIPLE_REASONS_PATH'),ui.indexOf('function textBuilderInitialState')),c);
 c.textBuilderMultipleReasonAction('confirmMultipleReasonInput');
 assert.equal(c.textBuilderState.screen,'address');assert.equal(c.textBuilderState.data.ineligibleCases,'repeat\n\nnetwork');
});

test('ineligible steps start with one field, reflow without overlaps, and retain locked case content',()=>{
 const c=setup();const model=c.textBuilderInfographicModel({type:'ineligible',sections:[{title:'Repeat Attempt',text:'- 123: Register Vehicle - warrant'}]},measure);
 assert.equal(model.boxes.filter(b=>b.kind==='step').length,1);
 assert.equal(model.boxes.find(b=>b.kind==='step').text,'');
 const original=JSON.stringify(model.boxes.filter(b=>b.kind!=='step'));
 model.boxes.find(b=>b.kind==='step').text=Array(40).fill('Long next step entry').join('\n');
 model.boxes.push({id:'another',text:'Second step',kind:'step',x:44,y:0,width:712,size:23,bold:false});
 c.textBuilderIneligibleReflow(model,measure);
 const steps=model.boxes.filter(b=>b.kind==='step');
 assert.ok(steps[1].y>steps[0].y+c.textBuilderInfographicBoxHeight(steps[0],measure));
 assert.ok(model.height>steps[1].y+c.textBuilderInfographicBoxHeight(steps[1],measure));
 assert.equal(c.textBuilderInfographicRules(model).length,1);
 assert.equal(JSON.stringify(model.boxes.filter(b=>b.kind!=='step')),original);
});
