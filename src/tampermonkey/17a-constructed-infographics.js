/************************************************************
 * Constructed Infographics: local, editable SVG preview + canvas export.
 ************************************************************/
function textBuilderInfographicReasons() {
  return [
    {label:'Repeat Attempt',title:'Repeat Attempt',path:'Can’tDo: Repeat Attempt',key:'multipleRepeatAttempt'},
    {label:'Initial Warrant',title:'Initial Warrant',path:'Can’tDo: Initial Warrant',key:'multipleInitialWarrant'},
    {label:'Private Attorney',title:'Private Attorney',path:'Can’tDo: Private Attorney',key:'multiplePrivateAttorney'},
    {label:'Fresh Start Friday',title:'St. Louis County Municipal Court',path:'Can’tDo: Fresh Start Friday',key:'multipleFreshStartFriday'},
    {label:'Recent FTA',title:'Recent FTA, Not a Warrant Yet',path:'Can’tDo: Recent FTA, Not a Warrant Yet',key:'multipleRecentFta'},
    {label:'Out of Network',title:'Not in TIC Network',path:'Can’tDo: Out of Network',key:'multipleOutOfNetwork'}
  ];
}
function textBuilderInfographicSources() {
  const d = textBuilderState.data;
  const mixed = d.researchType === 'CanDo + Can’tDo';
  const multiple = d.researchType === "Can'tDo: Multiple Reasons" || mixed;
  const sources = [];
  if (mixed || d.researchType === 'CanDo: Everything') sources.push({type:'eligible',sections:[{text:d.eligibleCases || ''}]});
  const reasons = textBuilderInfographicReasons();
  if (multiple) {
    const sections = reasons.filter(r => (d.multipleReasons || []).includes(r.label)).map(r => ({title:r.title,text:d[r.key] || ''}));
    if (sections.length) sources.push({type:'ineligible',sections});
  } else {
    const reason = reasons.find(r => r.path === d.researchType);
    if (reason) {
      const text = reason.label === 'Private Attorney' ? [d.privateAttorneyCases,d.remainingIneligibleCases].filter(Boolean).join('\n\n') : d.ineligibleCases;
      sources.push({type:'ineligible',sections:[{title:reason.title,text:text || ''}]});
    }
  }
  return sources;
}
function textBuilderInfographicTruncate(line) {
  const colon = line.indexOf(':');
  if (colon < 0) return line;
  const tail = line.slice(colon + 1);
  const status = /- (?:warrant|open \(no warrant found\))/i.exec(tail);
  if (!status) return line;
  const charge = tail.slice(0,status.index).trim();
  const chars = Array.from(charge);
  if (chars.length <= 12) return line;
  return `${line.slice(0,colon + 1)} ${chars.slice(0,12).join('')}. . . ${tail.slice(status.index)}`;
}
function textBuilderInfographicRows(text,truncate) {
  return String(text || '').split(/\r?\n/).map(line => line.trim()).filter(line => line && !/^(?:-\s*){3,}$/.test(line))
    .map(line => ({text:truncate ? textBuilderInfographicTruncate(line) : line,
      court:!line.includes(':') && /(?:\bmunicipal\b|\bcircuit\b|\bcourt\b|\(\d{3}\)\s*\d{3}[- ]\d{4})/i.test(line)}));
}
// SVG presentation attributes lose to host-page CSS. Lock typography on text,
// tspans and inline entry fields so preview measurements match Canvas exports.
function textBuilderInfographicFontStyle(size,bold) {
  return `font:normal ${bold ? '700' : '400'} ${size}px/1.4 Arial, sans-serif !important;letter-spacing:0 !important;word-spacing:0 !important;text-transform:none !important;`;
}
function textBuilderInfographicCanvasFont(size,bold) {return `${bold ? '700' : '400'} ${size}px Arial, sans-serif`;}
function textBuilderInfographicMeasure() {
  const ctx = document.createElement('canvas').getContext('2d');
  return (text,size,bold) => {ctx.font = textBuilderInfographicCanvasFont(size,bold); return ctx.measureText(text).width;};
}
function textBuilderInfographicLines(box,measure) {
  const lines = [];
  for (const paragraph of String(box.text).split('\n')) {
    let line = '';
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && measure(candidate,box.size,box.bold) > box.width) {lines.push(line); line = '';}
      if (measure(word,box.size,box.bold) > box.width) {
        for (const char of Array.from(word)) {
          if (line && measure(line + char,box.size,box.bold) > box.width) {lines.push(line); line = '';}
          line += char;
        }
      } else line = line ? `${line} ${word}` : word;
    }
    lines.push(line);
  }
  return lines;
}
function textBuilderInfographicBoxHeight(box,measure) {return Math.max(1,textBuilderInfographicLines(box,measure).length) * box.size * 1.4;}
function textBuilderInfographicModel(source,measure) {
  const model = {type:source.type,width:800,height:1000,caseBottom:620,boxes:[],sectionRules:[]};
  let y = 60;
  const add = (text,size,bold,kind='case') => {
    const width = kind === 'step' ? 712 : Math.min(712,Math.max(160,measure(text,size,bold)+8));
    const box = {id:`box-${model.boxes.length}`,text,x:44,y,width,size,bold,kind};
    model.boxes.push(box);
    y += textBuilderInfographicBoxHeight(box,measure) + 18;
    return box;
  };
  add(source.type === 'eligible' ? 'Cases we CAN request' : 'Cases we CANNOT request',44,true,'heading');
  y += 50;
  for (const [index,section] of source.sections.entries()) {
    if (index > 0) {model.sectionRules.push(y);y += 44;}
    if (section.title) add(section.title,36,true,'subheading');
    const rows = textBuilderInfographicRows(section.text,source.type === 'ineligible');
    const showCourts = rows.filter(row => row.court).length > 1;
    let courtCount = 0;
    for (const row of rows) {
      // A single court needs no subdivision; multiple courts keep their Summary headings.
      if (row.court && !showCourts && source.type === 'eligible') continue;
      if (source.type === 'eligible' && row.court && courtCount++ > 0) {model.sectionRules.push(y);y += 44;}
      add(row.court ? row.text.toUpperCase() : row.text,row.court ? 22 : 28,row.court,row.court ? 'court' : 'case');
    }
    y += 16;
  }
  model.caseBottom = Math.max(620,y + 42);
  y = model.caseBottom + 54;
  add(source.type === 'eligible' ? 'Next Steps for TIC' : 'Next Steps for You',38,true,'stepsHeading');
  add('',23,false,'step');
  textBuilderInfographicReflow(model,measure);
  return model;
}
function textBuilderInfographicReflow(model,measure) {
  let y = model.caseBottom + 148;
  for (const box of model.boxes.filter(box => box.kind === 'step')) {
    box.x = 44; box.y = y; box.width = 712;
    y += Math.max(80,textBuilderInfographicBoxHeight(box,measure)) + 28;
  }
  model.height = Math.max(700,y + 18);
}
function textBuilderInfographicRules(model) {
  return model.boxes.filter(box => box.kind === 'step').slice(1).map(box => box.y-14);
}
function textBuilderInfographicDecorations(model,measure) {
  const lines = textBuilderInfographicRules(model).map(y => ({x1:44,x2:756,y,color:'#d1d5db'}));
  const title = model.boxes.find(box => box.kind === 'heading');
  const width = Math.min(712,Math.max(...textBuilderInfographicLines(title,measure).map(text => measure(text,title.size,true))));
  lines.push({x1:400-width/2,x2:400+width/2,y:title.y+textBuilderInfographicBoxHeight(title,measure)+5,color:'#858b91'});
  // Full-width demarcation beneath the next-step heading; no text-width underline.
  lines.push({x1:44,x2:756,y:model.caseBottom+122,color:'#d1d5db'});
  for (const y of model.sectionRules || []) lines.push({x1:44,x2:756,y,color:'#ddd5d7'});
  return lines;
}
function textBuilderInfographicDraft(source) {
  const d = textBuilderState.data;
  const fingerprint = JSON.stringify(source);
  const drafts = d.infographicDrafts || (d.infographicDrafts = {});
  if (!drafts[source.type] || drafts[source.type].fingerprint !== fingerprint) {
    drafts[source.type] = {fingerprint,model:textBuilderInfographicModel(source,textBuilderInfographicMeasure())};
  }
  return drafts[source.type];
}
function textBuilderInfographicSvg(model,editing=true) {
  const esc = escapeHtml;
  const measure = textBuilderInfographicMeasure();
  const panel = (y,height,fill) => `<rect x="18" y="${y}" width="764" height="${height}" rx="15" fill="${fill}" stroke="#cbd5ce"/>`;
  const stepsY = model.caseBottom + 18;
  const rules = textBuilderInfographicDecorations(model,measure).map(line => `<line x1="${line.x1}" x2="${line.x2}" y1="${line.y}" y2="${line.y}" stroke="${line.color}"/>`).join('');
  const boxes = model.boxes.map(box => {
    const lines = textBuilderInfographicLines(box,measure);
    const height = textBuilderInfographicBoxHeight(box,measure);
    if (editing && box.kind === 'step') {
      const fieldHeight = Math.max(80,height);
      return `<foreignObject x="${box.x}" y="${box.y}" width="${box.width}" height="${fieldHeight}"><textarea xmlns="http://www.w3.org/1999/xhtml" class="moInfographicStep" data-info-step="${esc(box.id)}" aria-label="Next step ${model.boxes.filter(b => b.kind === 'step').indexOf(box)+1}" placeholder="Enter next step" style="${textBuilderInfographicFontStyle(box.size,false)}">${esc(box.text)}</textarea></foreignObject>`;
    }
    const centered = ['heading','stepsHeading'].includes(box.kind);
    const style = textBuilderInfographicFontStyle(box.size,box.bold);
    return `<g transform="translate(${box.x},${box.y})">
      <text style="${style}" font-family="Arial, sans-serif" font-size="${box.size}" font-weight="${box.bold ? '700' : '400'}" fill="${box.kind === 'court' ? '#73787c' : '#17212b'}" ${centered ? 'text-anchor="middle"' : ''} dominant-baseline="text-before-edge">${lines.map((line,i) => `<tspan style="${style}" x="${centered ? model.width/2-box.x : 0}" y="${i*box.size*1.4}">${esc(line)}</tspan>`).join('')}</text></g>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${model.width} ${model.height}" class="moInfographicSvg" aria-label="${model.type === 'eligible' ? 'Eligible' : 'Ineligible'} Constructed Infographic"><rect width="800" height="${model.height}" fill="white"/>${panel(18,model.caseBottom-18,model.type === 'eligible' ? '#eff9ef' : '#fff4f4')}${panel(stepsY,model.height-stepsY-18,'#ffffff')}${rules}${boxes}</svg>`;
}
function textBuilderInfographicCard(source) {
  const draft = textBuilderInfographicDraft(source);
  return `<section class="moInfographicCard" data-info-type="${source.type}">
    <div class="moInfographicPreview">${textBuilderInfographicSvg(draft.model)}</div>
    <div class="moInfographicTools"><button class="moBtn" data-info-action="addStep">Add next step</button><button class="moBtn" data-info-action="copy">Copy Image</button><button class="moBtn" data-info-action="download">Download for Email</button></div>
    <div class="moInfographicStatus" role="status" aria-live="polite"></div></section>`;
}
function textBuilderAttachInfographics(target) {
  const sources = textBuilderInfographicSources();
  if (!sources.length || textBuilderState.screen !== 'message') return;
  const block = target.querySelector(':scope > .moBlock');
  if (!block) return;
  const workspace = document.createElement('div');
  workspace.className = 'moConstructedWorkspace';
  const message = document.createElement('div');
  message.className = 'moConstructedText';
  while (block.firstChild) message.appendChild(block.firstChild);
  const images = document.createElement('div');
  images.className = 'moConstructedImages';
  images.innerHTML = sources.map(textBuilderInfographicCard).join('');
  workspace.append(message,images);
  block.appendChild(workspace);
  for (const card of images.querySelectorAll('.moInfographicCard')) textBuilderBindInfographic(card,sources.find(s => s.type === card.dataset.infoType));
}
function textBuilderBindInfographic(card,source) {
  const draft = textBuilderInfographicDraft(source);
  const preview = card.querySelector('.moInfographicPreview');
  const status = card.querySelector('.moInfographicStatus');
  const redraw = () => {preview.innerHTML = textBuilderInfographicSvg(draft.model);};
  preview.addEventListener('input',event => {
    const id = event.target.dataset.infoStep;
    const box = draft.model.boxes.find(box => box.kind === 'step' && box.id === id);
    if (!box) return;
    const start = event.target.selectionStart, end = event.target.selectionEnd;
    const scroll = preview.scrollTop;
    box.text = event.target.value;
    textBuilderInfographicReflow(draft.model,textBuilderInfographicMeasure());
    redraw();
    const field = preview.querySelector(`[data-info-step="${id}"]`);
    field.focus({preventScroll:true}); field.setSelectionRange(start,end); preview.scrollTop = scroll;
  });
  card.addEventListener('click',event => {
    const action = event.target.closest('[data-info-action]')?.dataset.infoAction;
    if (action === 'addStep') {
      const id = `step-${draft.model.boxes.length}`;
      draft.model.boxes.push({id,text:'',x:44,y:0,width:712,size:23,bold:false,kind:'step'});
      textBuilderInfographicReflow(draft.model,textBuilderInfographicMeasure()); redraw();
      const field = preview.querySelector(`[data-info-step="${id}"]`); field.focus(); field.scrollIntoView({block:'nearest'});
    } else if (action === 'copy' || action === 'download') {
      status.textContent = action === 'copy' ? 'Copying image…' : 'Preparing JPG…';
      textBuilderInfographicExport(draft.model,action).then(() => {status.textContent = action === 'copy' ? 'Image copied.' : 'JPG downloaded.';})
        .catch(error => {status.textContent = `${error.message || error} ${action === 'copy' ? 'Use Download for Email if clipboard access is unavailable.' : ''}`;});
    }
  });
}
function textBuilderInfographicBlob(model,mime) {
  const canvas = document.createElement('canvas'); canvas.width=model.width*2; canvas.height=model.height*2;
  const ctx = canvas.getContext('2d'); if (!ctx) return Promise.reject(new Error('Image export is unavailable.'));
  ctx.scale(2,2);ctx.fillStyle='#ffffff';ctx.fillRect(0,0,model.width,model.height);
  const panel = (y,h,color) => {ctx.beginPath();ctx.roundRect(18,y,764,h,15);ctx.fillStyle=color;ctx.fill();ctx.strokeStyle='#cbd5ce';ctx.stroke();};
  panel(18,model.caseBottom-18,model.type==='eligible'?'#eff9ef':'#fff4f4');
  const stepsY=model.caseBottom+18;panel(stepsY,model.height-stepsY-18,'#ffffff');
  const measure=textBuilderInfographicMeasure();
  for(const line of textBuilderInfographicDecorations(model,measure)) {ctx.strokeStyle=line.color;ctx.beginPath();ctx.moveTo(line.x1,line.y);ctx.lineTo(line.x2,line.y);ctx.stroke();}
  ctx.textBaseline='top';ctx.fillStyle='#17212b';
  for(const box of model.boxes) {ctx.font=textBuilderInfographicCanvasFont(box.size,box.bold);ctx.fillStyle=box.kind==='court'?'#73787c':'#17212b';ctx.textAlign=['heading','stepsHeading'].includes(box.kind)?'center':'left';textBuilderInfographicLines(box,measure).forEach((line,i)=>ctx.fillText(line,ctx.textAlign==='center'?model.width/2:box.x,box.y+i*box.size*1.4));}
  return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Could not render image.')),mime,0.95));
}
async function textBuilderInfographicExport(model,action) {
  if(action==='copy') {
    if(!navigator.clipboard?.write || typeof ClipboardItem==='undefined') throw new Error('Image clipboard is not supported in this browser.');
    // Start the clipboard write inside the user gesture; Chromium accepts a promised Blob.
    await navigator.clipboard.write([new ClipboardItem({'image/png':textBuilderInfographicBlob(model,'image/png')})]);
    return;
  }
  const blob=await textBuilderInfographicBlob(model,'image/jpeg');
  const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`constructed-infographic-${model.type}.jpg`;
  document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
GM_addStyle(`
.moConstructedWorkspace{display:grid;grid-template-columns:minmax(0,0.9fr) minmax(0,1.1fr);gap:12px;flex:1;min-height:0;width:100%;height:100%;}
.moConstructedText{display:flex;flex-direction:column;min-width:0;min-height:0;overflow:hidden;}
.moConstructedImages{min-width:0;min-height:0;overflow:auto;overscroll-behavior:contain;padding:0 4px 8px;}
.moInfographicCard{border:0;background:transparent;padding:0;border-radius:0;margin-bottom:12px;}
.moInfographicPreview{border:0;max-height:none;overflow:visible;}
.moInfographicStep{box-sizing:border-box;width:100%;height:100%;padding:0;margin:0;border:0;border-radius:0;resize:none;color:#17212b;background:transparent;outline:0;}
.moInfographicStep::placeholder{color:#9ca3af;}
.moInfographicStep:focus{outline:1px solid #93c5fd;outline-offset:-1px;}
.moInfographicSvg{display:block;width:100%;height:auto;touch-action:auto;}
.moInfographicTools{display:flex;gap:5px;flex-wrap:wrap;margin-top:7px;}
.moInfographicTools .moBtn{font-size:12px;padding:6px 8px;}
.moInfographicStatus{font-size:12px;margin-top:5px;overflow-wrap:anywhere;}
#moJsonTextBuilderPanel.moTextBuilderMessagePanel:has(.moConstructedWorkspace){width:min(950px,calc((100dvw - 24px) / var(--mo-ui-scale)));}
`);
