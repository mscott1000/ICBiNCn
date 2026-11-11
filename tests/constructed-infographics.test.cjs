const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const file=fs.readFileSync(`${__dirname}/../src/tampermonkey/17a-constructed-infographics.js`,'utf8');
function setup(data={}) {const c=vm.createContext({textBuilderState:{data},GM_addStyle:()=>{},escapeHtml:s=>s});vm.runInContext(file,c);return c;}
const measure=(text,size)=>Array.from(text).length*size*0.55;
test('table case entries extract full case text and explicit warrant/license statuses',()=>{
 const c=setup();
 const row=c.textBuilderInfographicCaseEntry('- 23SL-CR12345: Failed To Register Vehicle With Expired Plates - warrant - hold placed on license');
 assert.equal(row.label,'23SL-CR12345: Failed To Register Vehicle With Expired Plates');assert.equal(row.warrant,'Yes');assert.equal(row.license,'Yes');
 for(const input of ['- 123: Example - open (no warrant found)','- 123: Example - warrant - open (no warrant found)']) {
  const row=c.textBuilderInfographicCaseEntry(input);assert.equal(row.warrant,'No');assert.equal(row.license,'No');
 }
 assert.equal(c.textBuilderInfographicCaseEntry('- 123: Example - WARRANT - HOLD PLACED ON LICENSE').license,'Yes');
 assert.equal(c.textBuilderInfographicCaseEntry('- 123: Example').warrant,'—');
 assert.equal(c.textBuilderInfographicCaseEntry('Contact the clerk'),null);
});
test('court grouping preserves order, merges repeated headings, and keeps each case at its court',()=>{
 const c=setup();const groups=c.textBuilderInfographicCourtGroups('FLORISSANT MUNICIPAL\n- 1: One - warrant\nCITY OF ST. LOUIS MUNICIPAL\n- 2: Two - open (no warrant found)\nFLORISSANT MUNICIPAL\n- 3: Three - warrant');
 assert.equal(groups.length,2);assert.equal(groups[0].court,'FLORISSANT MUNICIPAL');assert.equal(groups[0].entries.map(row=>row.label).join('|'),'1: One|3: Three');assert.equal(groups[1].entries[0].label,'2: Two');
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
test('models group courts, grow for long input, and generate one empty next-step field',()=>{
 const c=setup();
 const text='FLORISSANT MUNICIPAL - (314) 921-3322\n- 1: Failed To Register Vehicle - warrant\nCITY OF ST. LOUIS MUNICIPAL\n- 2: Another Long Charge - warrant';
 const eligible=c.textBuilderInfographicModel({type:'eligible',sections:[{text}]},measure);
 assert.equal(eligible.boxes.filter(b=>b.text.includes('MUNICIPAL')).length,2);
 assert.ok(eligible.boxes.some(b=>b.text.includes('Failed To Register Vehicle')));
 assert.equal(eligible.boxes.filter(b=>b.kind==='step').map(b=>b.text).join(''),'');
 assert.equal(eligible.boxes.filter(b=>b.kind==='step').length,1);
 assert.equal(eligible.boxes.find(b=>b.kind==='stepsHeading').text,'Next Steps for TIC');
 const ineligible=c.textBuilderInfographicModel({type:'ineligible',sections:[{title:'Repeat Attempt',text}]},measure);
 assert.ok(ineligible.boxes.some(b=>b.text.includes('Failed To Register Vehicle')));
 assert.equal(ineligible.tables.length,2);
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
 c.textBuilderInfographicReflow(model,measure);
 const steps=model.boxes.filter(b=>b.kind==='step');
 assert.ok(steps[1].y>steps[0].y+c.textBuilderInfographicBoxHeight(steps[0],measure));
 assert.ok(model.height>steps[1].y+c.textBuilderInfographicBoxHeight(steps[1],measure));
 assert.equal(c.textBuilderInfographicRules(model).length,1);
 assert.equal(JSON.stringify(model.boxes.filter(b=>b.kind!=='step')),original);
});

test('approved ineligible format has a title underline and only a wide next-step demarcation',()=>{
 const c=setup();const model=c.textBuilderInfographicModel({type:'ineligible',sections:[{title:'Repeat Attempt',text:'FLORISSANT MUNICIPAL\n- 123: Register Vehicle - warrant'},{title:'Not in TIC Network',text:'OTHER MUNICIPAL COURT\n- 234: Other charge - warrant'}]},measure);
 const title=model.boxes.find(b=>b.kind==='heading');
 assert.equal(title.size,44);assert.equal(model.boxes.find(b=>b.kind==='subheading').size,36);
 assert.ok(model.boxes.some(b=>b.kind==='court'));
 const lines=c.textBuilderInfographicDecorations(model,measure);
 assert.equal(lines.length,3); // case-title underline, section separator, next-step demarcation
 const demarcation=lines.find(line=>line.y===model.caseBottom+122);
 assert.equal(demarcation.x1,44);assert.equal(demarcation.x2,756);
 const stepsTitle=model.boxes.find(b=>b.kind==='stepsHeading');
 assert.ok(!lines.some(line=>line.y===stepsTitle.y+c.textBuilderInfographicBoxHeight(stepsTitle,measure)+5));
 assert.ok(lines.some(line=>line.y===title.y+c.textBuilderInfographicBoxHeight(title,measure)+5));
});

test('eligible layout shares the approved headings, rules and fixed steps without charge truncation',()=>{
 const c=setup();const source={type:'eligible',sections:[{text:'FLORISSANT MUNICIPAL\n- 123: Register Vehicle Without Valid Plates - warrant\nCITY OF ST. LOUIS MUNICIPAL\n- 234: Other charge - warrant'}]};
 const model=c.textBuilderInfographicModel(source,measure);
 assert.equal(model.boxes.find(b=>b.kind==='heading').text,'Cases we CAN request');
 assert.equal(model.boxes.find(b=>b.kind==='heading').size,44);
 assert.equal(model.boxes.find(b=>b.kind==='stepsHeading').text,'Next Steps for TIC');
 assert.equal(model.boxes.find(b=>b.kind==='stepsHeading').size,38);
 assert.equal(model.boxes.filter(b=>b.kind==='step').length,1);
 assert.equal(model.boxes.filter(b=>b.kind==='court').length,2);
 assert.ok(model.boxes.some(b=>b.text.includes('Register Vehicle Without Valid Plates')));
 assert.equal(model.tables.length,2);
 const rules=c.textBuilderInfographicDecorations(model,measure);
 assert.ok(rules.some(line=>line.y===model.caseBottom+122));
 assert.equal(rules.length,2);
 const locked=JSON.stringify(model.boxes.filter(b=>b.kind!=='step'));
 model.boxes.find(b=>b.kind==='step').text='Send request';
 c.textBuilderInfographicReflow(model,measure);
 assert.equal(JSON.stringify(model.boxes.filter(b=>b.kind!=='step')),locked);
});

test('bundled Inter is the font used by preview and export, and failed loads cannot use a fallback',async()=>{
 const bytes=fs.readFileSync(`${__dirname}/../assets/fonts/Inter-Variable.ttf`);
 const embedded=file.match(/const TEXT_BUILDER_INTER_BASE64 = '([^']+)'/)[1];
 assert.deepEqual(Buffer.from(embedded,'base64'),bytes);
 assert.ok(bytes.length>100000);
 const c=vm.createContext({GM_addStyle:()=>{},atob:s=>Buffer.from(s,'base64').toString('binary'),FontFace:class{load(){return Promise.reject(new Error('font load failed'));}}});
 vm.runInContext(file,c);
 assert.match(c.textBuilderInfographicFontStyle(44,true),/TICInfographicInter/);
 assert.equal(c.textBuilderInfographicCanvasFont(44,true),'700 44px TICInfographicInter, sans-serif');
 await assert.rejects(c.textBuilderLoadInfographicFont(),/font load failed/);
 assert.throws(()=>c.textBuilderInfographicMeasure(),/not finished loading/);
});

test('table geometry wraps long case text and leaves next steps below the case tables',()=>{
 const c=setup();for(const type of ['eligible','ineligible']){
 const source={type,sections:[{title:type==='ineligible'?'Repeat Attempt':undefined,text:'FLORISSANT MUNICIPAL\n- 123: '+('A long charge description '.repeat(15))+'- warrant - hold placed on license'}]};
 const model=c.textBuilderInfographicModel(source,measure);assert.equal(model.tables.length,1);
 const table=model.tables[0];assert.equal(table.boxes.slice(0,3).map(b=>b.text).join('|'),'Case Number|Warrant Found?|License Hold?');assert.ok(table.rows[1].height>64);
 assert.ok(model.caseBottom>table.y+table.height);
 for(const row of table.rows)for(const cell of table.boxes.filter(b=>b.y===row.y+15))assert.ok(c.textBuilderInfographicBoxHeight(cell,measure)+30<=row.height);
 assert.equal(table.boxes[4].text,'Yes');assert.equal(table.boxes[5].text,'Yes');
 }
});

test('table headers are vertically centered, keep the case label left aligned, and fit status labels on one line',()=>{
 const c=setup();const table=c.textBuilderInfographicTable([{label:'123: Charge',warrant:'Yes',license:'No'}],100,measure,0);
 const header=table.rows[0];const cells=table.boxes.slice(0,3);
 assert.equal(cells[0].center,false);assert.equal(cells[1].center,true);assert.equal(cells[2].center,true);
 for(const box of cells) {assert.equal(c.textBuilderInfographicLines(box,measure).length,1);assert.equal(box.y,header.y+(header.height-c.textBuilderInfographicBoxHeight(box,measure))/2);}
 const model={tables:[table]};assert.ok(!c.textBuilderInfographicTableSvg(model).includes('#e5ebe8'));assert.ok(!c.textBuilderInfographicTableSvg(model).includes('#f8faf9'));
 const fills=[];const ctx={beginPath(){},moveTo(){},lineTo(){},stroke(){},strokeRect(){},fillRect(){fills.push(this.fillStyle);}};
 c.textBuilderInfographicDrawTables(ctx,model);assert.equal(fills.join(','),'#ffffff,#ffffff');
});
