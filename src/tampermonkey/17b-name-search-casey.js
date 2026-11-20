/************************************************************
 * Casey in the Name Search blank area. Artwork is embedded.
 ************************************************************/
function createNameSearchCasey({assets, dock, readState, sizeMode}) {
  if (!['width','height'].includes(sizeMode)) throw new Error('Choose Casey’s button-size reference.');
  const footer = dock.querySelector('#moJsonFooter');
  const clearLog = dock.querySelector('#moJsonClear');
  const content = dock.querySelector('#moJsonContent');
  const row = document.createElement('div');
  row.id = 'moNameSearchCasey';
  row.hidden = true;
  row.innerHTML = `<div class="moCaseyScene" role="img" aria-label="Casey"><div class="moCaseyGround"></div><img class="moCaseyIdle" alt=""><div class="moCaseySpriteWindow"><img class="moCaseySprite" alt=""></div></div>`;
  const scene = row.querySelector('.moCaseyScene');
  const ground = row.querySelector('.moCaseyGround');
  const idle = row.querySelector('.moCaseyIdle');
  const sprite = row.querySelector('.moCaseySprite');
  const label = document.createElement('div');
  label.className = 'moCaseyPassLabel';
  label.hidden = true;
  row.appendChild(label);
  idle.src = assets.idle;
  sprite.src = assets.sprite;
  ground.style.backgroundImage = `url("${assets.ground}")`;
  scene.style.setProperty('--mo-casey-frames', String(assets.frameCount));
  scene.style.setProperty('--mo-casey-cycle', `${assets.frameCount * assets.frameDurationMs}ms`);
  scene.style.setProperty('--mo-casey-ground-cycle', `${assets.groundPeriodMs}ms`);
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let lastVisible = false;
  let lastActive = false;
  let resizePending = 0;
  let displayedColumn = null, displayedLabel = '';
  let fade = null, fadeTarget = null, fadeGeneration = 0;
  function cancelFade() {
    fadeGeneration++;
    fade?.cancel();
    fade = fadeTarget = null;
    row.style.opacity = '1';
  }
  function place(column, text) {
    displayedColumn = column;
    displayedLabel = text;
    row.dataset.column = String(column + 1);
    row.style.setProperty('--mo-casey-center', `${(column + .5) * 100 / 3}%`);
    label.textContent = text;
    label.hidden = !text;
    scene.setAttribute('aria-label', text ? `Casey searching: ${text}` : 'Casey searching cases');
  }
  function fadeIn(column, text, generation) {
    place(column,text);
    row.style.opacity = '0';
    fadeTarget = {column,text};
    fade = row.animate([{opacity:0},{opacity:1}],{duration:100,easing:'ease-in',fill:'forwards'});
    fade.finished.then(() => {
      if (generation === fadeGeneration) cancelFade();
    },() => {});
  }
  function updatePlacement(column, text, animate) {
    if (!animate) {
      cancelFade(); place(column,text); return;
    }
    if (displayedColumn === null) {
      cancelFade();
      if (column > 0) fadeIn(column,text,fadeGeneration);
      else place(column,text);
      return;
    }
    if (fadeTarget?.column === column && fadeTarget.text === text) return;
    if (displayedColumn === column && displayedLabel === text) {
      if (fadeTarget) cancelFade();
      return;
    }
    const opacity = Number.parseFloat(getComputedStyle(row).opacity);
    cancelFade();
    const generation = fadeGeneration;
    fadeTarget = {column,text};
    row.style.opacity = String(opacity);
    if (opacity === 0) { fadeIn(column,text,generation); return; }
    fade = row.animate([{opacity},{opacity:0}],{duration:100,easing:'ease-out',fill:'forwards'});
    fade.finished.then(() => {
      if (generation !== fadeGeneration || row.hidden || !row.isConnected) return;
      row.style.opacity = '0';
      fade.cancel();
      // Reposition only at zero opacity. The walk and ground keep their phase.
      fadeIn(column,text,generation);
    },() => {});
  }
  async function preparePassChange() {
    const state = readState();
    if (row.hidden || scene.hidden || state.stopped || state.minimized || document.hidden || motion.matches || typeof row.animate !== 'function') return;
    const opacity = Number.parseFloat(getComputedStyle(row).opacity);
    cancelFade();
    const generation = fadeGeneration;
    fade = row.animate([{opacity},{opacity:0}],{duration:100,easing:'ease-out',fill:'forwards'});
    // A backgrounded/cancelled animation must never hold up search navigation.
    let timeout;
    await Promise.race([fade.finished.catch(() => {}),new Promise(resolve => { timeout = setTimeout(resolve,200); })]);
    clearTimeout(timeout);
    if (generation !== fadeGeneration) return;
    row.style.opacity = '0';
    fade.cancel();
    fade = null;
  }
  // Overlay the measured blank area without changing the entry/results layout.
  dock.insertBefore(row, footer);
  function measure() {
    resizePending = 0;
    if (row.hidden || !clearLog.offsetWidth) return;
    const width = 1.21 * (sizeMode === 'width' ? clearLog.offsetWidth : clearLog.offsetHeight * assets.frameWidth / assets.frameHeight);
    row.style.setProperty('--mo-casey-width', `${width}px`);
    row.style.setProperty('--mo-casey-lift', `${10 / (dock.getBoundingClientRect().width / dock.offsetWidth || 1)}px`);
    const scale = dock.getBoundingClientRect().width / dock.offsetWidth || 1;
    const entry = content.querySelector('#moSearchEntryPanel');
    if (!entry) { scene.hidden = label.hidden = true; return; }
    const dockRect = dock.getBoundingClientRect(), contentRect = content.getBoundingClientRect();
    const top = Math.max(entry.getBoundingClientRect().bottom, contentRect.top);
    const bottom = Math.min(footer.getBoundingClientRect().top, contentRect.bottom);
    const height = Math.max(0,(bottom-top)/scale);
    row.style.top = `${(top-dockRect.top)/scale-dock.clientTop}px`;
    row.style.height = `${height}px`;
    scene.hidden = height < width * assets.frameHeight / assets.frameWidth || dock.clientWidth / 3 < width;
    label.hidden = !displayedLabel || scene.hidden;
    if (!label.hidden) {
      const figureHeight = width * assets.frameHeight / assets.frameWidth;
      label.hidden = height < figureHeight + 2 * (4 + label.offsetHeight);
    }
  }
  function sync() {
    const state = readState();
    const visible = state.nameView && !state.hasResults && state.searching && !state.stopped;
    const active = visible;
    row.hidden = !visible;
    const column = [0,1,2].includes(state.column) ? state.column : 1;
    const playing = active && !state.minimized && !document.hidden && !motion.matches;
    if (!visible) {
      cancelFade(); displayedColumn = null; label.hidden = true;
    } else updatePlacement(column,state.label || '',playing && typeof row.animate === 'function');
    // Pass changes keep the current pose/ground phase. Stopping hides the
    // figure; hidden views do no animation work.
    if (active !== lastActive) row.classList.toggle('moCaseyActive', active);
    row.classList.toggle('moCaseyPlaying', playing);
    row.classList.toggle('moCaseyReducedMotion', motion.matches);
    if (visible || lastVisible !== visible) {
      if (resizePending) cancelAnimationFrame(resizePending);
      resizePending = requestAnimationFrame(measure);
    }
    lastActive = active;
    lastVisible = visible;
  }
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(() => {
    if (!resizePending) resizePending = requestAnimationFrame(measure);
  }) : null;
  observer?.observe(clearLog);
  observer?.observe(dock);
  observer?.observe(content);
  content.addEventListener('scroll', measure);
  window.addEventListener('resize', measure);
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', sync);
  return {sync, preparePassChange, cancelPassChange() { cancelFade(); sync(); }, element: row, destroy() {
    cancelFade();
    observer?.disconnect();
    if (resizePending) cancelAnimationFrame(resizePending);
    window.removeEventListener('resize', measure);
    content.removeEventListener('scroll', measure);
    document.removeEventListener('visibilitychange', sync);
    motion.removeEventListener('change', sync);
    row.remove();
  }};
}

GM_addStyle(`
#moNameSearchCasey{position:absolute;left:0;right:0;pointer-events:none;user-select:none;overflow:hidden;transform:translateY(calc(-1 * var(--mo-casey-lift,0px)));}
#moNameSearchCasey[hidden]{display:none;}
.moCaseyScene{position:absolute;left:var(--mo-casey-center,50%);top:50%;transform:translate(-50%,-50%);width:var(--mo-casey-width,80px);aspect-ratio:434/440;overflow:hidden;}
.moCaseyScene[hidden]{display:none;}
.moCaseyPassLabel{position:absolute;left:var(--mo-casey-center,50%);top:calc(50% + var(--mo-casey-width,80px)*440/434/2 + 4px);transform:translateX(-50%);max-width:calc(100%/3 - 8px);font:600 14px/1.25 system-ui,sans-serif;color:#475569;text-align:center;overflow-wrap:anywhere;}
.moCaseyPassLabel[hidden]{display:none;}
.moCaseyIdle,.moCaseySpriteWindow{position:absolute;inset:0;width:100%;height:100%;}
.moCaseyIdle{object-fit:contain;}
.moCaseySpriteWindow{display:none;overflow:hidden;}
.moCaseySprite{position:absolute;left:0;top:0;width:calc(var(--mo-casey-frames)*100%);height:100%;max-width:none;transform:translateX(0);}
.moCaseyGround{position:absolute;top:86.363636%;left:0;width:200%;height:10.909091%;background-repeat:repeat-x;background-size:50% 100%;transform:translateX(0);}
.moCaseyActive:not(.moCaseyReducedMotion) .moCaseyIdle{display:none;}
.moCaseyActive:not(.moCaseyReducedMotion) .moCaseySpriteWindow{display:block;}
.moCaseyActive .moCaseySprite{animation:moCaseyWalk var(--mo-casey-cycle) steps(var(--mo-casey-frames),end) infinite;animation-play-state:paused;}
.moCaseyActive .moCaseyGround{animation:moCaseyGround var(--mo-casey-ground-cycle) linear infinite;animation-play-state:paused;}
.moCaseyPlaying .moCaseySprite,.moCaseyPlaying .moCaseyGround{animation-play-state:running;}
@keyframes moCaseyWalk{from{transform:translateX(0)}to{transform:translateX(-100%)}}
@keyframes moCaseyGround{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@media(prefers-reduced-motion:reduce){.moCaseySprite,.moCaseyGround{animation:none!important;}}
`);

var nameSearchCasey;
function syncNameSearchCasey() { nameSearchCasey?.sync(); }
async function fadeNameSearchCaseyForPassChange() { await nameSearchCasey?.preparePassChange(); }
function startNameSearchCasey() {
  if (nameSearchCasey) return;
  nameSearchCasey = createNameSearchCasey({
    assets: CASEY_NAME_SEARCH_ASSETS,
    dock,
    sizeMode: 'width',
    readState: () => {
      const search = loadNameState();
      const index = Number(search?.passIndex) || 0;
      const column = caseOverrideRunning ? 1 : search?.step === 'municourt_finalizing' ? 2 : Math.min(2,Math.max(0,index));
      return {
      nameView: appView === 'name',
      hasResults: !!loadJson(KEY_NAMESEARCH_OUTPUT, null),
      searching: !!search?.active || caseOverrideRunning,
      column,
      label: caseOverrideRunning ? '' : ['1/3 - Criminal','2/3 - Traffic/Municipal','3/3 - Municourt'][column],
      stopped: isStop(),
      minimized: dock.classList.contains('moHidden')
      };
    }
  });
  if (typeof GM_addValueChangeListener === 'function') {
    GM_addValueChangeListener(KEY_NAMESEARCH, syncNameSearchCasey);
    GM_addValueChangeListener(KEY_STOP, syncNameSearchCasey);
  }
}
