const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const dir=path.join(__dirname,'../src/tampermonkey');
 const code=fs.readdirSync(dir).filter(f=>f.endsWith('.js')&&!f.startsWith('20-')).sort().map(f=>fs.readFileSync(path.join(dir,f),'utf8')).join('\n');
 for(const sizeMode of['width']) {
  const page=await browser.newPage({viewport:{width:1400,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('about:blank');
  await page.evaluate(()=>{const storage=new Map();window.GM_getValue=(k,d)=>storage.has(k)?storage.get(k):d;window.GM_setValue=(k,v)=>storage.set(k,v);window.GM_addStyle=css=>{const s=document.createElement('style');s.textContent=css;document.head.appendChild(s)};window.GM_setClipboard=()=>{};});
  await page.evaluate(({code,sizeMode})=>eval(code+`\nstartNameSearchCasey();\nwindow.caseyTest={assets:CASEY_NAME_SEARCH_ASSETS,open:()=>{appView='name';render();expandDock()},start:()=>{setStop(false);saveNameState({active:true,params:{},passes:[]});render()},stop:()=>{stopAllOperations();render()},minimize:minimizeDock,expand:expandDock,home:goHomeView,render,complete:()=>{clearNameState();saveNameSearchOutput({summary:'Summary',copy:'Detail'});render()},clear:()=>document.getElementById('moJsonClear').click(),instance:()=>nameSearchCasey};\n})()`),{code,sizeMode});
  await page.evaluate(()=>caseyTest.open());await page.waitForFunction(()=>document.querySelector('#moNameSearchCasey').offsetWidth>0);
  let geometry=await page.evaluate(()=>{const m=document.querySelector('.moCaseyScene').getBoundingClientRect(),c=document.querySelector('#moJsonClear').getBoundingClientRect(),f=document.querySelector('#moJsonFooter').getBoundingClientRect(),s=document.querySelector('#moJsonNameSearch').getBoundingClientRect();return{width:m.width,height:m.height,buttonWidth:c.width,buttonHeight:c.height,rightDelta:m.right-c.right,bottom:m.bottom,footerTop:f.top,fieldsBottom:s.bottom}});
  assert(Math.abs(geometry.rightDelta)<1);assert(geometry.bottom<geometry.footerTop);assert(geometry.fieldsBottom<geometry.bottom-geometry.height);
  assert(Math.abs((sizeMode==='width'?geometry.width-geometry.buttonWidth:geometry.height-geometry.buttonHeight))<1);
  assert.equal(await page.locator('.moCaseyIdle').evaluate(e=>getComputedStyle(e).display),'block');
  await page.evaluate(()=>caseyTest.start());await page.waitForTimeout(250);
  const run=await page.evaluate(()=>{const e=document.querySelector('.moCaseySprite'),g=document.querySelector('.moCaseyGround');return{active:document.querySelector('#moNameSearchCasey').classList.contains('moCaseyPlaying'),timing:e.getAnimations()[0]?.effect.getTiming(),easing:getComputedStyle(e).animationTimingFunction,ground:g.getAnimations()[0]?.effect.getTiming(),frameCount:caseyTest.assets.frameCount}});
  assert(run.active);assert.equal(run.timing.duration,1800);assert.equal(run.easing,'steps(18)');assert.equal(run.ground.duration,6500);assert.equal(run.ground.easing,'linear');
  const before=await page.locator('.moCaseySprite').evaluate(e=>e.getAnimations()[0].currentTime);await page.evaluate(()=>caseyTest.render());await page.waitForTimeout(80);const after=await page.locator('.moCaseySprite').evaluate(e=>e.getAnimations()[0].currentTime);assert(after>before,'Rerender must not restart walk');
  await page.evaluate(()=>caseyTest.minimize());assert.equal(await page.locator('#moNameSearchCasey').evaluate(e=>e.classList.contains('moCaseyPlaying')),false);await page.evaluate(()=>caseyTest.expand());await page.waitForFunction(()=>document.querySelector('.moCaseySprite').getAnimations()[0]?.playState==='running');
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.querySelector('#moNameSearchCasey').classList.contains('moCaseyReducedMotion'));assert.equal(await page.locator('.moCaseyIdle').evaluate(e=>getComputedStyle(e).display),'block');assert.equal(await page.locator('.moCaseySprite').evaluate(e=>e.getAnimations().length),0);await page.emulateMedia({reducedMotion:'no-preference'});
  await page.evaluate(()=>caseyTest.stop());assert.equal(await page.locator('.moCaseyIdle').evaluate(e=>getComputedStyle(e).display),'block');assert.equal(await page.locator('.moCaseyGround').evaluate(e=>e.getAnimations().length),0);
  await page.evaluate(()=>caseyTest.complete());assert(await page.locator('#moNameSearchCasey').evaluate(e=>e.hidden));assert(await page.locator('#moNsSummaryOutput').isVisible());
  await page.evaluate(()=>caseyTest.clear());await page.waitForTimeout(30);assert(!await page.locator('#moNameSearchCasey').evaluate(e=>e.hidden));
  await page.setViewportSize({width:800,height:680});await page.waitForTimeout(60);assert(await page.locator('#moJsonClear').isVisible());assert.equal(await page.locator('#moNameSearchCasey').evaluate(e=>e.hidden),false);
  if(sizeMode==='width') {await page.screenshot({path:'/workspace/work/casey-name-search/idle.png'});await page.evaluate(()=>caseyTest.start());await page.waitForTimeout(150);await page.screenshot({path:'/workspace/work/casey-name-search/searching.png'});}
  await page.evaluate(()=>caseyTest.home());assert(await page.locator('#moNameSearchCasey').evaluate(e=>e.hidden));assert.deepEqual(errors,[]);await page.close();
 }
 await browser.close();console.log('PASS: production button-width size, alignment, 18-frame cadence, independent ground, persistent phase, stop/minimize/results/reduced-motion lifecycle and viewport resize');
})().catch(e=>{console.error(e);process.exit(1)});
