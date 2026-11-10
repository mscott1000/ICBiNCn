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
function textBuilderInfographicMeasure() {
  const ctx = document.createElement('canvas').getContext('2d');
  return (text,size,bold) => {ctx.font = `${bold ? '700' : '400'} ${size}px Arial`; return ctx.measureText(text).width;};
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
  const ineligible = source.type === 'ineligible';
  const model = {type:source.type,width:800,height:1000,caseBottom:620,boxes:[],sectionRules:[]};
  let y = ineligible ? 60 : 42;
  const add = (text,size,bold,kind='case') => {
    const width = kind === 'step' ? 712 : Math.min(712,Math.max(160,measure(text,size,bold)+8));
    const box = {id:`box-${model.boxes.length}`,text,x:44,y,width,size,bold,kind};
    model.boxes.push(box);
    y += textBuilderInfographicBoxHeight(box,measure) + 18;
    return box;
  };
  add(source.type === 'eligible' ? 'Cases we CAN request' : 'Cases we CANNOT request',ineligible ? 44 : 32,true,'heading');
  y += ineligible ? 50 : 15;
  for (const [index,section] of source.sections.entries()) {
    if (ineligible && index > 0) {model.sectionRules.push(y);y += 44;}
    if (section.title) add(section.title,ineligible ? 36 : 25,true,'subheading');
    const rows = textBuilderInfographicRows(section.text,source.type === 'ineligible');
    const showCourts = rows.filter(row => row.court).length > 1;
    for (const row of rows) {
      // A single court needs no subdivision; multiple courts keep their Summary headings.
      if (row.court && !showCourts && source.type === 'eligible') continue;
      add(ineligible && row.court ? row.text.toUpperCase() : row.text,row.court ? 22 : (ineligible ? 28 : 21),row.court,ineligible && row.court ? 'court' : 'case');
    }
    y += 16;
  }
  model.caseBottom = Math.max(ineligible ? 620 : 440,y + (ineligible ? 42 : 10));
  y = model.caseBottom + 54;
  add(source.type === 'eligible' ? 'Next Steps for TIC' : 'Next Steps for You',ineligible ? 38 : 30,true,'stepsHeading');
  for (let i=0;i<(source.type === 'ineligible' ? 1 : 3);i++) {add('',23,false,'step'); y += 58;}
  model.height = Math.max(900,y + 24);
  if (source.type === 'ineligible') textBuilderIneligibleReflow(model,measure);
  return model;
}
function textBuilderIneligibleReflow(model,measure) {
  let y = model.caseBottom + 148;
  for (const box of model.boxes.filter(box => box.kind === 'step')) {
    box.x = 44; box.y = y; box.width = 712;
    y += Math.max(80,textBuilderInfographicBoxHeight(box,measure)) + 28;
  }
  model.height = Math.max(700,y + 18);
}
function textBuilderInfographicRules(model) {
  if (model.type !== 'ineligible') return [model.caseBottom+232,model.caseBottom+340];
  return model.boxes.filter(box => box.kind === 'step').slice(1).map(box => box.y-14);
}
function textBuilderInfographicDecorations(model,measure) {
  const lines = textBuilderInfographicRules(model).map(y => ({x1:44,x2:756,y,color:'#d1d5db'}));
  if (model.type !== 'ineligible') return lines;
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
    drafts[source.type] = {fingerprint,model:textBuilderInfographicModel(source,textBuilderInfographicMeasure()),selected:null};
  }
  return drafts[source.type];
}
function textBuilderInfographicSvg(model,selected,editing=true) {
  const esc = escapeHtml;
  const measure = textBuilderInfographicMeasure();
  const panel = (y,height,fill) => `<rect x="18" y="${y}" width="764" height="${height}" rx="15" fill="${fill}" stroke="#cbd5ce"/>`;
  const stepsY = model.caseBottom + 18;
  const rules = textBuilderInfographicDecorations(model,measure).map(line => `<line x1="${line.x1}" x2="${line.x2}" y1="${line.y}" y2="${line.y}" stroke="${line.color}"/>`).join('');
  const boxes = model.boxes.map(box => {
    const lines = textBuilderInfographicLines(box,measure);
    const height = textBuilderInfographicBoxHeight(box,measure);
    if (model.type === 'ineligible' && editing && box.kind === 'step') {
      const fieldHeight = Math.max(80,height);
      return `<foreignObject x="${box.x}" y="${box.y}" width="${box.width}" height="${fieldHeight}"><textarea xmlns="http://www.w3.org/1999/xhtml" class="moIneligibleStep" data-info-step="${esc(box.id)}" aria-label="Next step ${model.boxes.filter(b => b.kind === 'step').indexOf(box)+1}" placeholder="Enter next step" style="font:${box.size}px/1.4 Arial">${esc(box.text)}</textarea></foreignObject>`;
    }
    const movable = editing && model.type !== 'ineligible';
    const centered = model.type === 'ineligible' && ['heading','stepsHeading'].includes(box.kind);
    const hint = movable && !box.text ? 'Click to add a next step' : '';
    return `<g ${movable ? `data-info-box="${esc(box.id)}" tabindex="0" role="button" aria-label="${esc(box.text || 'Blank next step')}"` : ''} transform="translate(${box.x},${box.y})">
      ${movable ? `<rect x="-5" y="-5" width="${box.width+10}" height="${height+10}" rx="3" fill="transparent" stroke="${selected === box.id ? '#2563eb' : 'transparent'}" stroke-dasharray="5 3"/>` : ''}
      <text font-family="Arial, sans-serif" font-size="${box.size}" font-weight="${box.bold ? '700' : '400'}" fill="${hint ? '#9ca3af' : box.kind === 'court' ? '#73787c' : '#17212b'}" ${centered ? 'text-anchor="middle"' : ''} dominant-baseline="text-before-edge">${(hint ? [hint] : lines).map((line,i) => `<tspan x="${centered ? model.width/2-box.x : 0}" y="${i*box.size*1.4}">${esc(line)}</tspan>`).join('')}</text></g>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${model.width} ${model.height}" class="moInfographicSvg" aria-label="${model.type === 'eligible' ? 'Eligible' : 'Ineligible'} Constructed Infographic"><rect width="800" height="${model.height}" fill="white"/>${panel(18,model.caseBottom-18,model.type === 'eligible' ? '#eff9ef' : '#fff4f4')}${panel(stepsY,model.height-stepsY-18,'#ffffff')}${rules}${boxes}</svg>`;
}
function textBuilderInfographicCard(source) {
  const draft = textBuilderInfographicDraft(source);
  if (source.type === 'ineligible') return `<section class="moInfographicCard moIneligibleCard" data-info-type="ineligible">
    <div class="moInfographicPreview">${textBuilderInfographicSvg(draft.model,null)}</div>
    <div class="moInfographicTools"><button class="moBtn" data-info-action="addStep">Add next step</button><button class="moBtn" data-info-action="copy">Copy Image</button><button class="moBtn" data-info-action="download">Download for Email</button></div>
    <div class="moInfographicStatus" role="status" aria-live="polite"></div></section>`;
  const label = source.type === 'eligible' ? 'Eligible cases' : 'Ineligible cases';
  return `<section class="moInfographicCard" data-info-type="${source.type}"><h3>${label}</h3>
    <div class="moInfographicPreview">${textBuilderInfographicSvg(draft.model,draft.selected)}</div>
    <p class="moInfographicHelp">Select a text box to edit. Drag it to move, or use arrow keys.</p>
    <label class="moInfographicInspector">Selected text<textarea data-info-edit aria-label="Edit selected infographic text" placeholder="Select a text box above" disabled></textarea></label>
    <div class="moInfographicTools"><button class="moBtn" data-info-action="add">Add text box</button><button class="moBtn" data-info-action="remove">Remove selected</button><button class="moBtn" data-info-action="reset">Reset image</button></div>
    <div class="moInfographicTools"><button class="moBtn" data-info-action="copy">Copy Image</button><button class="moBtn" data-info-action="download">Download JPG</button></div>
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
  if (source.type === 'ineligible') return textBuilderBindIneligible(card,source);
  let draft = textBuilderInfographicDraft(source);
  const preview = card.querySelector('.moInfographicPreview');
  const input = card.querySelector('[data-info-edit]');
  const status = card.querySelector('.moInfographicStatus');
  const selected = () => draft.model.boxes.find(box => box.id === draft.selected);
  const redraw = () => {preview.innerHTML = textBuilderInfographicSvg(draft.model,draft.selected);};
  const inspect = () => {const box = selected(); input.disabled = !box; input.value = box ? box.text : '';};
  const grow = box => {draft.model.height = Math.max(draft.model.height,box.y + textBuilderInfographicBoxHeight(box,textBuilderInfographicMeasure()) + 35);};
  inspect();
  input.addEventListener('input',() => {const box = selected(); if (!box) return; box.text = input.value; grow(box); redraw();});
  preview.addEventListener('pointerdown',event => {
    const group = event.target.closest('[data-info-box]');
    if (!group) return;
    event.preventDefault();
    draft.selected = group.dataset.infoBox;
    const box = selected();
    const svg = group.ownerSVGElement;
    const inverse = svg.getScreenCTM().inverse();
    const start = new DOMPoint(event.clientX,event.clientY).matrixTransform(inverse);
    const origin = {x:box.x,y:box.y};
    inspect(); redraw();
    preview.setPointerCapture(event.pointerId);
    const move = e => {
      const point = new DOMPoint(e.clientX,e.clientY).matrixTransform(inverse);
      box.x = Math.max(24,Math.min(draft.model.width-box.width-24,origin.x+point.x-start.x));
      box.y = Math.max(24,Math.min(draft.model.height-textBuilderInfographicBoxHeight(box,textBuilderInfographicMeasure())-24,origin.y+point.y-start.y));
      redraw();
    };
    const end = () => {preview.removeEventListener('pointermove',move); preview.removeEventListener('pointerup',end); preview.removeEventListener('pointercancel',end);};
    preview.addEventListener('pointermove',move); preview.addEventListener('pointerup',end); preview.addEventListener('pointercancel',end);
  });
  preview.addEventListener('keydown',event => {
    const group = event.target.closest('[data-info-box]'); if (!group) return;
    draft.selected = group.dataset.infoBox;
    if (event.key === 'Enter' || event.key === ' ') {event.preventDefault(); inspect(); input.focus(); return;}
    const delta = {ArrowLeft:[-5,0],ArrowRight:[5,0],ArrowUp:[0,-5],ArrowDown:[0,5]}[event.key];
    if (!delta) return;
    event.preventDefault(); const box = selected();
    box.x = Math.max(24,Math.min(draft.model.width-box.width-24,box.x+delta[0]));
    box.y = Math.max(24,Math.min(draft.model.height-textBuilderInfographicBoxHeight(box,textBuilderInfographicMeasure())-24,box.y+delta[1]));
    inspect(); redraw(); preview.querySelector(`[data-info-box="${box.id}"]`).focus();
  });
  card.addEventListener('click',event => {
    const action = event.target.closest('[data-info-action]')?.dataset.infoAction;
    if (!action) return;
    if (action === 'add') {const id = `added-${Date.now()}-${draft.model.boxes.length}`; draft.model.boxes.push({id,text:'New text',x:100,y:draft.model.caseBottom+150,width:600,size:23,bold:false,kind:'custom'}); draft.selected=id; inspect();redraw();return;}
    if (action === 'remove') {draft.model.boxes = draft.model.boxes.filter(box => box.id !== draft.selected);draft.selected=null;inspect();redraw();return;}
    if (action === 'reset') {if (!window.confirm('Reset this infographic and discard its edits?')) return; draft.model=textBuilderInfographicModel(source,textBuilderInfographicMeasure());draft.selected=null;inspect();redraw();return;}
    if (action === 'copy' || action === 'download') {
      status.textContent = action === 'copy' ? 'Copying image…' : 'Preparing JPG…';
      textBuilderInfographicExport(draft.model,action).then(() => {status.textContent = action === 'copy' ? 'Image copied.' : 'JPG downloaded.';}).catch(error => {status.textContent = `${error.message || error} ${action === 'copy' ? 'Use Download JPG if clipboard access is unavailable.' : ''}`;});
    }
  });
}
function textBuilderBindIneligible(card,source) {
  const draft = textBuilderInfographicDraft(source);
  const preview = card.querySelector('.moInfographicPreview');
  const status = card.querySelector('.moInfographicStatus');
  const redraw = () => {preview.innerHTML = textBuilderInfographicSvg(draft.model,null);};
  preview.addEventListener('input',event => {
    const id = event.target.dataset.infoStep;
    const box = draft.model.boxes.find(box => box.kind === 'step' && box.id === id);
    if (!box) return;
    const start = event.target.selectionStart, end = event.target.selectionEnd;
    const scroll = preview.scrollTop;
    box.text = event.target.value;
    textBuilderIneligibleReflow(draft.model,textBuilderInfographicMeasure());
    redraw();
    const field = preview.querySelector(`[data-info-step="${id}"]`);
    field.focus({preventScroll:true}); field.setSelectionRange(start,end); preview.scrollTop = scroll;
  });
  card.addEventListener('click',event => {
    const action = event.target.closest('[data-info-action]')?.dataset.infoAction;
    if (action === 'addStep') {
      const id = `step-${draft.model.boxes.length}`;
      draft.model.boxes.push({id,text:'',x:44,y:0,width:712,size:23,bold:false,kind:'step'});
      textBuilderIneligibleReflow(draft.model,textBuilderInfographicMeasure()); redraw();
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
  for(const box of model.boxes) {ctx.font=`${box.bold?'700':'400'} ${box.size}px Arial`;ctx.fillStyle=box.kind==='court'?'#73787c':'#17212b';ctx.textAlign=model.type==='ineligible' && ['heading','stepsHeading'].includes(box.kind)?'center':'left';textBuilderInfographicLines(box,measure).forEach((line,i)=>ctx.fillText(line,ctx.textAlign==='center'?model.width/2:box.x,box.y+i*box.size*1.4));}
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
.moInfographicCard.moIneligibleCard{border:0;background:transparent;padding:0;border-radius:0;}
.moIneligibleCard .moInfographicPreview{border:0;max-height:none;overflow:visible;}
.moIneligibleStep{box-sizing:border-box;width:100%;height:100%;padding:0;margin:0;border:0;border-radius:0;resize:none;color:#17212b;background:transparent;outline:0;}
.moIneligibleStep::placeholder{color:#9ca3af;}
.moIneligibleStep:focus{outline:1px solid #93c5fd;outline-offset:-1px;}
.moIneligibleCard .moInfographicSvg{touch-action:auto;}
.moInfographicCard{border:1px solid #cbd5e1;border-radius:10px;background:#f8fafc;padding:10px;margin-bottom:12px;}
.moInfographicCard h3{font-size:14px;margin:0 0 8px;}
.moInfographicPreview{background:#fff;border:1px solid #cbd5e1;max-height:390px;overflow:auto;}
.moInfographicSvg{display:block;width:100%;height:auto;touch-action:none;}
.moInfographicSvg [data-info-box]{cursor:move;outline:none;}
.moInfographicSvg [data-info-box]:focus > rect{stroke:#2563eb;}
.moInfographicHelp{font-size:12px;margin:7px 0;color:#475569;}
.moInfographicInspector{display:block;font-size:12px;font-weight:700;}
.moInfographicInspector textarea{display:block;box-sizing:border-box;width:100%;min-height:65px;resize:vertical;font:13px/1.4 Arial;padding:6px;border:1px solid #94a3b8;border-radius:5px;}
.moInfographicTools{display:flex;gap:5px;flex-wrap:wrap;margin-top:7px;}
.moInfographicTools .moBtn{font-size:12px;padding:6px 8px;}
.moInfographicStatus{font-size:12px;margin-top:5px;overflow-wrap:anywhere;}
#moJsonTextBuilderPanel.moTextBuilderMessagePanel:has(.moConstructedWorkspace){width:min(950px,calc((100dvw - 24px) / var(--mo-ui-scale)));}
`);
