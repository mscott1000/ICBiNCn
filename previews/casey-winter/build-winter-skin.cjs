const fs=require('fs'),path=require('path'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'../..'),dir=root+'/assets/casey-name-search';
const uri=p=>'data:image/png;base64,'+fs.readFileSync(p).toString('base64');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const p=await b.newPage();
const out=await p.evaluate(async input=>{
 const image=src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=src});
 const [sprite,idle,hat,ground]=await Promise.all([input.sprite,input.idle,input.hat,input.ground].map(image));
 const canvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
 const hc=canvas(hat.width,hat.height),hx=hc.getContext('2d');hx.drawImage(hat,0,0);const hd=hx.getImageData(0,0,hc.width,hc.height).data;
 let minX=hat.width,minY=hat.height,maxX=0,maxY=0;for(let y=0;y<hat.height;y++)for(let x=0;x<hat.width;x++)if(hd[(y*hat.width+x)*4+3]>20){minX=Math.min(x,minX);minY=Math.min(y,minY);maxX=Math.max(x,maxX);maxY=Math.max(y,maxY)}
 function winterFrame(img,sx,bob){const c=canvas(434,440),ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(img,sx,0,434,440,0,0,434,440);
  // Only the accessory region changes. All original body pixels below y=135 survive exactly.
  ctx.clearRect(38,18+bob,146,107);
  ctx.drawImage(hat,minX,minY,maxX-minX+1,maxY-minY+1,25,4+bob,190,125);
  return c;
 }
 const strip=canvas(434*18,440),sc=strip.getContext('2d');let bodyDifferences=0;
 for(let f=0;f<18;f++){const frame=winterFrame(sprite,434*f,input.bob[f]);sc.drawImage(frame,f*434,0);const compare=canvas(434,440),cx=compare.getContext('2d');cx.drawImage(sprite,f*434,0,434,440,0,0,434,440);const a=cx.getImageData(0,136,434,304).data,b=frame.getContext('2d').getImageData(0,136,434,304).data;for(let i=0;i<a.length;i++)if(a[i]!==b[i])bodyDifferences++;}
 const gc=canvas(ground.width,ground.height),gx=gc.getContext('2d');gx.drawImage(ground,0,0);gx.fillStyle='#c7dfed';gx.fillRect(0,6,gc.width,gc.height-6);
 gx.fillStyle='#f8fdff';gx.fillRect(0,0,gc.width,29);
 for(let x=0;x<gc.width;x+=36){gx.fillRect(x,25,24,8);gx.fillRect(x+6,31,12,4)}
 gx.fillStyle='#9fc7dd';for(let x=18;x<gc.width;x+=72)gx.fillRect(x,38,12,2);
 return {sprite:strip.toDataURL(),idle:winterFrame(idle,0,0).toDataURL(),ground:gc.toDataURL(),bodyDifferences,hatBounds:[minX,minY,maxX,maxY]};
},{sprite:uri(dir+'/sprite.png'),idle:uri(dir+'/placeholder.png'),hat:uri(dir+'/skins/winter/hat.png'),ground:uri(dir+'/ground.png'),bob:JSON.parse(fs.readFileSync(dir+'/manifest.json')).bodyBobPixels});
if(out.bodyDifferences!==0)throw Error('Original body pixels changed');for(const name of ['sprite','idle','ground'])fs.writeFileSync(dir+'/skins/winter/'+(name==='idle'?'placeholder':name)+'.png',Buffer.from(out[name].split(',')[1],'base64'));
console.log({frames:18,bodyPixelDifferences:out.bodyDifferences,hatBounds:out.hatBounds});await b.close();})().catch(e=>{console.error(e);process.exit(1)});
