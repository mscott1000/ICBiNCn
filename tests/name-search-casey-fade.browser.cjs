const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:1400,height:1000}});
 await context.route('**/*',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><body></body></html>'}));
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const dir=path.join(__dirname,'../src/tampermonkey');
 const code=fs.readdirSync(dir).filter(f=>f.endsWith('.js')&&!f.startsWith('20-')).sort().map(f=>fs.readFileSync(path.join(dir,f),'utf8')).join('\n');
 async function install(){
  await page.evaluate(()=>{
   window.GM_getValue=(k,d)=>{const value=localStorage.getItem('mock:'+k);return value===null?d:JSON.parse(value)};
   window.GM_setValue=(k,v)=>localStorage.setItem('mock:'+k,JSON.stringify(v));
   window.GM_addStyle=css=>{const s=document.createElement('style');s.textContent=css;document.head.append(s)};window.GM_setClipboard=()=>{};
  });
  await page.evaluate(code=>eval(code+`\nstartNameSearchCasey();restoreActiveNameSearchUiOnLoad();render();
   isNameSearchResultsPage=()=>true;
   pullJsonFromResultsPage=async()=>({status:'complete',appendedCount:0});
   window.fadeTest={start:()=>{setRun(false);setStop(false);appView='name';saveNameState({active:true,passIndex:0,params:{},passes:buildNameSearchPasses({}),step:'submitted_waiting_results'});render();expandDock()},pass:i=>saveNameState({...loadNameState(),passIndex:i}),stop:()=>{stopAllOperations();render()},state:loadNameState,tick:nameSearchTick,render};
  })()`),code);
 }
 const row=()=>page.locator('#moNameSearchCasey');
 async function settled(column){await page.waitForFunction(column=>{const r=document.querySelector('#moNameSearchCasey');return r.dataset.column===String(column)&&r.getAnimations().length===0},column)}
 await page.goto('http://casey.test/casenet/results.do');await install();await page.evaluate(()=>fadeTest.start());await settled(1);
 const boundary=await page.evaluate(async()=>{
  const r=document.querySelector('#moNameSearchCasey');fadeTest.pass(1);
  const animation=r.getAnimations()[0],outDuration=animation.effect.getTiming().duration,before=r.dataset.column;
  animation.finish();await animation.finished;await Promise.resolve();
  return {before,after:r.dataset.column,opacity:getComputedStyle(r).opacity,outDuration,inDuration:r.getAnimations()[0]?.effect.getTiming().duration,label:document.querySelector('.moCaseyPassLabel').textContent};
 });
 assert.equal(boundary.before,'1');assert.equal(boundary.after,'2');assert.equal(Number(boundary.opacity),0);assert.equal(boundary.outDuration,100);assert.equal(boundary.inDuration,100);assert.equal(boundary.label,'2. Traffic/Municipal');await settled(2);
 await page.evaluate(()=>{fadeTest.pass(0);fadeTest.pass(2);fadeTest.render()});await settled(3);assert.equal(await page.locator('.moCaseyPassLabel').textContent(),'3. Municourt');
 await page.evaluate(()=>fadeTest.start());await settled(1);
 const navigation=page.waitForURL('**/casenet/nameSearch.do?newSearch=Y');
 await page.evaluate(()=>{window.tickPromise=fadeTest.tick()});
 await page.waitForFunction(()=>document.querySelector('#moNameSearchCasey').getAnimations().length>0);
 assert.equal(await page.evaluate(()=>fadeTest.state().passIndex),0,'Old pass retained during outgoing fade');
 await navigation;await install();
 assert.equal(await page.evaluate(()=>fadeTest.state().passIndex),1);
 assert.equal(await row().getAttribute('data-column'),'2');
 const arrival=await row().evaluate(r=>r.getAnimations()[0]?.effect.getTiming().duration);assert.equal(arrival,100,'New page fades in at the saved column');await settled(2);
 await page.evaluate(()=>fadeTest.start());await settled(1);
 const url=page.url();await page.evaluate(()=>{window.tickPromise=fadeTest.tick()});await page.waitForFunction(()=>document.querySelector('#moNameSearchCasey').getAnimations().length>0);await page.evaluate(()=>fadeTest.stop());await page.evaluate(()=>window.tickPromise);await page.waitForTimeout(230);
 assert.equal(page.url(),url,'Stop during outgoing fade prevents navigation');assert.equal(await row().isVisible(),false);assert.equal(await row().evaluate(r=>r.getAnimations().length),0);
 await page.evaluate(()=>fadeTest.start());await settled(1);await page.evaluate(()=>{window.tickPromise=fadeTest.tick()});await page.waitForFunction(()=>document.querySelector('#moNameSearchCasey').getAnimations().length>0);await page.evaluate(()=>fadeTest.start());await page.evaluate(()=>window.tickPromise);await settled(1);
 assert.equal(page.url(),url,'Restart during outgoing fade prevents stale navigation');assert.equal(await row().evaluate(r=>getComputedStyle(r).opacity),'1','Replacement search stays visible');assert.equal(await page.evaluate(()=>fadeTest.state().active),true);
 await page.evaluate(()=>fadeTest.start());await settled(1);await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>fadeTest.pass(2));assert.equal(await row().getAttribute('data-column'),'3');assert.equal(await row().evaluate(r=>r.getAnimations().length),0);
 assert.deepEqual(errors,[]);await browser.close();console.log('PASS:100ms out/in, invisible reposition, latest pass wins, real navigation/restoration, Stop/restart cancellation, reduced motion, no errors.');
})().catch(e=>{console.error(e);process.exit(1)});
