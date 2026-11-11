// Run with node tests/constructed-infographics.browser.cjs (Playwright + Chromium).
const {chromium}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const path=require('node:path');
const read=f=>fs.readFileSync(path.join(__dirname,'../src/tampermonkey',f),'utf8');
(async()=>{
 const browser=await chromium.launch({headless:true,...(fs.existsSync('/usr/bin/chromium')?{executablePath:'/usr/bin/chromium'}:{}),args:['--no-sandbox']});
 try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 await page.route('https://www.courts.mo.gov/**',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><body></body></html>'}));
 await page.goto('https://www.courts.mo.gov/casenet/');
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const ui=read('17-ui.js');
 const css=ui.slice(ui.indexOf('GM_addStyle(`')+13,ui.indexOf('`);'));
 await page.setContent(`<style>${css}</style><div id="moJsonDock" class="moTextBuilderDock" style="position:static;transform:none;width:1100px;height:800px"><div id="moJsonTitle"></div><div id="moJsonContent" class="moContentStretch moTextBuilderContent" style="flex:1;min-height:0"></div></div><div id="moJsonTextBuilderPanel"><div id="moJsonTextBuilderBody"></div></div>`);
 await page.addScriptTag({content:`
 const dock=document.getElementById('moJsonDock'), $content=document.getElementById('moJsonContent'),textBuilderPanel=document.getElementById('moJsonTextBuilderPanel'),textBuilderBody=document.getElementById('moJsonTextBuilderBody');
 let appView='text';let textBuilderState={screen:'researchType',history:[],data:{workflow:'postResearch',staff:'Casey',courts:['Florissant']}};
 const TEXT_BUILDER_STAFF=['Casey'],TEXT_BUILDER_COURTS=['Florissant','City of St. Louis Municipal'];
 function escapeHtml(s){return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');}
 function GM_addStyle(css){const s=document.createElement('style');s.textContent=css;document.head.append(s);}
 function uiStatus(s){window.lastStatus=s;}function GM_setClipboard(s){window.copiedText=s;}
 ${ui.slice(ui.indexOf('const TEXT_BUILDER_MULTIPLE_REASONS_PATH'),ui.indexOf('function positionTextBuilderPanel()'))}
 ${read('17a-constructed-infographics.js')}
 ${read('19-buttons.js').slice(read('19-buttons.js').indexOf("dock.addEventListener('click',(e) => {const action = e?.target?.dataset?.tbAction;"),read('19-buttons.js').indexOf("\n\n  dock.addEventListener('input'"))}
 dock.addEventListener('input',e=>{if(e.target.dataset.tbInput)textBuilderState.data[e.target.dataset.tbInput]=e.target.value;});
 renderTextBuilder();
 `});
 const action=async(a,v)=>{const selector=v?`[data-tb-action="${a}"][data-tb-value="${v}"]`:`[data-tb-action="${a}"]`;await page.locator(selector).click();};
 const eligible='FLORISSANT MUNICIPAL - (314) 921-3322\n- 100: Failed To Register Vehicle - warrant\nCITY OF ST. LOUIS MUNICIPAL\n- 200: Speeding - warrant';
 await action('chooseResearchType','CanDo + Can’tDo');
 await action('toggleCourt','Florissant');
 await action('toggleCourt','City of St. Louis Municipal');
 await action('confirmCourts');
 await page.locator('[data-tb-input="eligibleCases"]').fill(eligible);await action('confirmEligible');
 await action('toggleMultipleReason','Repeat Attempt');await action('toggleMultipleReason','Recent FTA');await action('confirmMultipleReasons');
 await page.locator('[data-tb-input="multipleRepeatAttempt"]').fill('ST. LOUIS COUNTY CIRCUIT, DIV 39 - Judge KELLY SNYDER\n| Court Clerk: (314) 615-1539 |\n- 300: Failed To Register Vehicle With A Very Long Charge Description - warrant - hold placed on license\nUpcoming Court Dates:\nST. LOUIS COUNTY CIRCUIT, DIV 39\n11/20/2026; 9:00 AM (for 300, 301)\n12/01/2026; 1:30 PM (for 302)\nCITY OF ST. LOUIS MUNICIPAL\n12/15/2026; 8:00 AM (for 400)');await action('confirmMultipleReasonInput');
 await page.locator('[data-tb-input="multipleRecentFta"]').fill('CITY OF ST. LOUIS MUNICIPAL\n- 400: Failure To Maintain Insurance - open (no warrant found)');await action('confirmMultipleReasonInput');
 // Hold the local font load to prove no fallback-font image is generated first.
 await page.evaluate(()=>{
   const NativeFontFace=window.FontFace;
   window.FontFace=function(...args){const face=new NativeFontFace(...args);const load=face.load.bind(face);face.load=async()=>{await new Promise(resolve=>window.releaseInfographicFont=resolve);return load();};return face;};
 });
 await action('chooseAddress','Need Address');
 assert.equal(await page.locator('.moInfographicCard').count(),0);
 assert.ok((await page.locator('.moInfographicFontStatus').innerText()).includes('Loading'));
 await page.evaluate(()=>window.releaseInfographicFont());
 await page.locator('[data-info-type="eligible"]').waitFor();
 assert.ok(await page.evaluate(()=>textBuilderInterReady && document.fonts.check('700 44px TICInfographicInter')));
 const fontWidths=await page.evaluate(()=>{const ctx=document.createElement('canvas').getContext('2d');ctx.font=textBuilderInfographicCanvasFont(44,true);const inter=ctx.measureText('Cases we CANNOT request').width;ctx.font='700 44px Arial';return {inter,arial:ctx.measureText('Cases we CANNOT request').width};});
 assert.ok(Math.abs(fontWidths.inter-fontWidths.arial)>1,'Inter must be loaded, not an Arial fallback');
 // Host pages can style SVG text and textarea elements, including with important rules.
 await page.addStyleTag({content:'svg text, svg tspan, .moInfographicStep { font-family: Georgia, serif !important; font-size: 12px !important; font-weight: 400 !important; font-style: italic !important; letter-spacing: 3px !important; text-transform: uppercase !important; }'});
 for(const type of ['eligible','ineligible']) {
  const typography=await page.locator(`[data-info-type="${type}"] svg text`).first().evaluate(el=>{const text=getComputedStyle(el),span=getComputedStyle(el.querySelector('tspan'));return [text,span].map(s=>({family:s.fontFamily,size:s.fontSize,weight:s.fontWeight,style:s.fontStyle,spacing:s.letterSpacing,transform:s.textTransform}));});
  for(const style of typography){assert.match(style.family,/TICInfographicInter/);assert.equal(style.size,'44px');assert.equal(style.weight,'700');assert.equal(style.style,'normal');assert.ok(['normal','0px'].includes(style.spacing));assert.equal(style.transform,'none');}
  const fieldStyle=await page.locator(`[data-info-type="${type}"] [data-info-step]`).first().evaluate(el=>({family:getComputedStyle(el).fontFamily,size:getComputedStyle(el).fontSize,weight:getComputedStyle(el).fontWeight}));
  assert.match(fieldStyle.family,/TICInfographicInter/);assert.equal(fieldStyle.size,'23px');assert.equal(fieldStyle.weight,'400');
 }
 assert.equal(await page.locator('.moInfographicCard').count(),2);
 assert.ok((await page.locator('#moTextBuilderConstructed').innerText()).includes('Failed To Register Vehicle'));
 const eligibleCard=page.locator('[data-info-type="eligible"]');const ineligibleCard=page.locator('[data-info-type="ineligible"]');
 for(const [card,headers,count] of [[eligibleCard,['Case Number'],2],[ineligibleCard,['Case Number','Warrant Found?','License Hold?'],3]]){assert.equal(await card.locator('[data-info-table]').count(),count);for(const title of headers)assert.equal(await card.locator('svg text').evaluateAll((nodes,title)=>nodes.filter(node=>node.getAttribute('aria-label')===title).length,title),2);}
 assert.equal(await eligibleCard.locator('text[aria-label="Warrant Found?"]').count(),0);
 assert.equal(await eligibleCard.locator('text[aria-label="License Hold?"]').count(),0);
 const newData=await page.evaluate(()=>{const m=textBuilderState.data.infographicDrafts.ineligible.model;return {upcoming:m.tables.find(t=>t.kind==='upcoming').boxes.map(b=>b.text),clerk:m.boxes.find(b=>b.kind==='courtDetail').text,cases:m.tables.filter(t=>t.kind==='ineligible').flatMap(t=>t.boxes.filter(b=>b.singleLine).map(b=>({text:b.text,width:b.width,size:b.size})))}});
 for(const text of ['Repeat Attempt','Recent FTA, Not a Warrant Yet','Upcoming Court Dates']) assert.equal(await ineligibleCard.locator('svg text').evaluateAll((nodes,text)=>nodes.find(node=>node.getAttribute('aria-label')===text).getAttribute('text-anchor'),text),'middle');
 assert.equal(newData.upcoming[0],'Court Date');assert.equal(newData.upcoming[1],'Location');assert.equal(newData.upcoming[2],'11/20/2026; 9:00 AM (for 300, 301)');assert.equal(newData.upcoming[3],newData.upcoming[5]);assert.ok(newData.clerk.startsWith('| Court Clerk:'));
 assert.ok(newData.cases[0].text.endsWith('...'));
 assert.ok(await page.evaluate(()=>Object.values(textBuilderState.data.infographicDrafts).every(d=>d.model.tables.filter(t=>t.kind!=='upcoming').every(t=>t.boxes.filter(b=>b.singleLine).every(b=>textBuilderInfographicLines(b,textBuilderInfographicMeasure()).length===1 && textBuilderInfographicMeasure()(b.text,b.size,b.bold)<=b.width)))));
 const headersFit=await page.evaluate(()=>Object.values(textBuilderState.data.infographicDrafts).every(draft=>draft.model.tables.every(table=>table.boxes.slice(0,table.widths.length).every(cell=>textBuilderInfographicLines(cell,textBuilderInfographicMeasure()).length===1 && Math.abs(cell.y-(table.y+(table.rows[0].height-textBuilderInfographicBoxHeight(cell,textBuilderInfographicMeasure()))/2))<0.01))));
 assert.ok(headersFit);
 for(const card of [eligibleCard,ineligibleCard]){
  const fills=await card.locator('[data-info-table] rect').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('fill')));assert.ok(fills.every(fill=>fill==='#ffffff'||fill==='none'));
  assert.equal(await card.locator('text[aria-label="Case Number"]').first().getAttribute('text-anchor'),null);
  for(const title of (card===eligibleCard?[]:['Warrant Found?','License Hold?']))assert.equal(await card.locator('text').evaluateAll((nodes,title)=>nodes.find(node=>node.getAttribute('aria-label')===title).getAttribute('text-anchor'),title),'middle');
 }
 const tableData=await page.evaluate(()=>textBuilderState.data.infographicDrafts.ineligible.model.tables.map(t=>t.boxes.slice(3).map(b=>b.text)));
 assert.equal(tableData[0][1],'Yes');assert.equal(tableData[0][2],'Yes');assert.equal(tableData[1][1],'No');assert.equal(tableData[1][2],'No');

 assert.equal(await page.locator('.moConstructedImages > h3').count(),0);
 assert.equal(await ineligibleCard.locator(':scope > h3').count(),0);
 assert.equal(await ineligibleCard.evaluate(el=>getComputedStyle(el).borderTopWidth),'0px');
 assert.equal(await ineligibleCard.evaluate(el=>getComputedStyle(el).paddingTop),'0px');
 assert.equal(await ineligibleCard.locator('[data-info-edit], [data-info-box]').count(),0);
 assert.deepEqual(await ineligibleCard.locator('button').allTextContents(),['Add next step','Copy Image','Download for Email']);
 assert.equal(await ineligibleCard.locator('[data-info-step]').count(),1);
 const lockedBefore=await page.evaluate(()=>JSON.stringify(textBuilderState.data.infographicDrafts.ineligible.model.boxes.filter(b=>b.kind!=='step')));
 await ineligibleCard.locator('[data-info-step]').fill('Call the clerk');
 await ineligibleCard.locator('[data-info-action="addStep"]').click();
 assert.equal(await ineligibleCard.locator('[data-info-step]').count(),2);
 await ineligibleCard.locator('[data-info-step]').nth(1).fill('Bring requested documents\nConfirm the date');
 assert.equal(await ineligibleCard.locator('[data-info-step]').first().inputValue(),'Call the clerk');
 assert.equal(await page.evaluate(()=>JSON.stringify(textBuilderState.data.infographicDrafts.ineligible.model.boxes.filter(b=>b.kind!=='step'))),lockedBefore);
 const frozen=await page.evaluate(()=>textBuilderState.data.infographicDrafts.ineligible.model.boxes.filter(b=>b.kind==='step').map(b=>({x:b.x,y:b.y})));
 const stepBounds=await ineligibleCard.locator('[data-info-step]').first().boundingBox();
 await page.mouse.move(stepBounds.x+15,stepBounds.y+15);await page.mouse.down();await page.mouse.move(stepBounds.x+45,stepBounds.y+45);await page.mouse.up();
 assert.deepEqual(await page.evaluate(()=>textBuilderState.data.infographicDrafts.ineligible.model.boxes.filter(b=>b.kind==='step').map(b=>({x:b.x,y:b.y}))),frozen);
 const title= ineligibleCard.locator('svg text').first();assert.equal(await title.getAttribute('text-anchor'),'middle');
 assert.equal(await ineligibleCard.locator('svg text').filter({hasText:'Next Steps for You'}).getAttribute('text-anchor'),'middle');
 const infoDownload=page.waitForEvent('download');await ineligibleCard.locator('[data-info-action="download"]').click();assert.equal((await infoDownload).suggestedFilename(),'constructed-infographic-ineligible.jpg');
 assert.ok((await ineligibleCard.locator('svg text').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('aria-label')).join(' '))).includes('...'));
 assert.ok(!(await ineligibleCard.locator('svg text').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('aria-label')).join(' '))).includes('Hello'));
 assert.ok((await eligibleCard.locator('svg text').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('aria-label')).join(' '))).includes('Failed To Register Vehicle'));
 const geometry=await page.evaluate(()=>({text:document.querySelector('.moConstructedText').getBoundingClientRect().toJSON(),images:document.querySelector('.moConstructedImages').getBoundingClientRect().toJSON()}));
 assert.ok(geometry.text.right<geometry.images.x);
 assert.equal(await eligibleCard.locator(':scope > h3').count(),0);
 assert.equal(await eligibleCard.evaluate(el=>getComputedStyle(el).borderTopWidth),'0px');
 assert.equal(await eligibleCard.locator('[data-info-edit], [data-info-box]').count(),0);
 assert.deepEqual(await eligibleCard.locator('button').allTextContents(),['Add next step','Copy Image','Download for Email']);
 assert.equal(await eligibleCard.locator('[data-info-step]').count(),2);
 assert.equal(await eligibleCard.locator('[data-info-step]').first().inputValue(),'Request a recall from the Court');
 assert.equal(await eligibleCard.locator('[data-info-step]').nth(1).inputValue(),'When we hear back, we will text you');
 for(const heading of ['Cases we CAN request','Next Steps for TIC']) assert.equal(await eligibleCard.locator('svg text').filter({hasText:heading}).getAttribute('text-anchor'),'middle');
 const lockedEligible=await page.evaluate(()=>JSON.stringify(textBuilderState.data.infographicDrafts.eligible.model.boxes.filter(b=>b.kind!=='step')));
 await eligibleCard.locator('[data-info-step]').first().fill('Call the court on Tuesday');
 await eligibleCard.locator('[data-info-action="addStep"]').click();
 await eligibleCard.locator('[data-info-step]').nth(2).fill('Send the request');
 const fixedEligible=await page.evaluate(()=>textBuilderState.data.infographicDrafts.eligible.model.boxes.filter(b=>b.kind==='step').map(b=>({x:b.x,y:b.y})));
 await eligibleCard.locator('[data-info-step]').first().scrollIntoViewIfNeeded();const eligibleBounds=await eligibleCard.locator('[data-info-step]').first().boundingBox();
 await page.mouse.move(eligibleBounds.x+10,eligibleBounds.y+10);await page.mouse.down();await page.mouse.move(eligibleBounds.x+40,eligibleBounds.y+40);await page.mouse.up();
 assert.deepEqual(await page.evaluate(()=>textBuilderState.data.infographicDrafts.eligible.model.boxes.filter(b=>b.kind==='step').map(b=>({x:b.x,y:b.y}))),fixedEligible);
 assert.equal(await page.evaluate(()=>JSON.stringify(textBuilderState.data.infographicDrafts.eligible.model.boxes.filter(b=>b.kind!=='step'))),lockedEligible);
 await action('toggleCaseData');
 assert.equal(await eligibleCard.locator('[data-info-step]').first().inputValue(),'Call the court on Tuesday');
 assert.equal(await eligibleCard.locator('[data-info-step]').nth(1).inputValue(),'When we hear back, we will text you');
 assert.equal(await eligibleCard.locator('[data-info-step]').nth(2).inputValue(),'Send the request');
 // Both real encoders produce their requested MIME and magic bytes, with editable text retained.
 const encodings=await page.evaluate(async()=>{
 const m=textBuilderState.data.infographicDrafts.eligible.model;
 const jpg=await textBuilderInfographicBlob(m,'image/jpeg');const png=await textBuilderInfographicBlob(m,'image/png');
 return {jpg:{type:jpg.type,bytes:Array.from(new Uint8Array(await jpg.arrayBuffer()).slice(0,3))},png:{type:png.type,bytes:Array.from(new Uint8Array(await png.arrayBuffer()).slice(0,4))},steps:m.boxes.filter(b=>b.kind==='step').map(b=>b.text)};
 });
 assert.equal(encodings.jpg.type,'image/jpeg');assert.deepEqual(encodings.jpg.bytes,[255,216,255]);assert.deepEqual(encodings.png.bytes,[137,80,78,71]);assert.ok(encodings.steps.includes('Call the court on Tuesday'));
 const download=page.waitForEvent('download');await eligibleCard.locator('[data-info-action="download"]').click();assert.equal((await download).suggestedFilename(),'constructed-infographic-eligible.jpg');
 await page.context().grantPermissions(['clipboard-read','clipboard-write'],{origin:'https://www.courts.mo.gov'});
 await ineligibleCard.locator('[data-info-action="copy"]').click();
 await page.waitForFunction(()=>document.querySelector('[data-info-type="ineligible"] .moInfographicStatus').textContent==='Image copied.');
 assert.ok(await page.evaluate(async()=> (await navigator.clipboard.read()).some(item=>item.types.includes('image/png'))));
 await eligibleCard.locator('[data-info-action="copy"]').click();
 await page.waitForFunction(()=>document.querySelector('.moInfographicStatus').textContent==='Image copied.');
 assert.ok(await page.evaluate(async()=> (await navigator.clipboard.read()).some(item=>item.types.includes('image/png'))));
 await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{write:async items=>{const blob=await items[0].getType('image/png');window.copiedImage={type:blob.type,size:blob.size};}}});});
 await eligibleCard.locator('[data-info-action="copy"]').click();await page.waitForFunction(()=>window.copiedImage?.size>0);assert.equal(await page.evaluate(()=>window.copiedImage.type),'image/png');
 await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{write:async()=>{throw new Error('Permission denied');}}});});
 await eligibleCard.locator('[data-info-action="copy"]').click();await page.waitForFunction(()=>document.querySelector('.moInfographicStatus').textContent.includes('Download for Email'));
 if(process.env.INFOGRAPHIC_TEST_SCREENSHOT) await page.screenshot({path:process.env.INFOGRAPHIC_TEST_SCREENSHOT});
 // Same message workspace also mounts in the legacy panel.
 await page.evaluate(()=>{appView='home';renderTextBuilder();});assert.equal(await page.locator('#moJsonTextBuilderBody .moInfographicCard').count(),2);
 assert.deepEqual(errors,[]);
 console.log('Browser checks passed: embedded Inter loading, font isolation, mixed flow, grouped previews, direct step editing, fixed positions, retained drafts, JPEG/PNG encoding, JPG download, clipboard success/failure, adding steps and panel rendering.');
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
