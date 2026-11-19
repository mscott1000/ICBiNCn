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
  // Overlay the measured blank area without changing the entry/results layout.
  dock.insertBefore(row, footer);
  function measure() {
    resizePending = 0;
    if (row.hidden || !clearLog.offsetWidth) return;
    const width = 1.1 * (sizeMode === 'width' ? clearLog.offsetWidth : clearLog.offsetHeight * assets.frameWidth / assets.frameHeight);
    row.style.setProperty('--mo-casey-width', `${width}px`);
    const scale = dock.getBoundingClientRect().width / dock.offsetWidth || 1;
    const entry = content.querySelector('#moSearchEntryPanel');
    if (!entry) { scene.hidden = true; return; }
    const dockRect = dock.getBoundingClientRect(), contentRect = content.getBoundingClientRect();
    const top = Math.max(entry.getBoundingClientRect().bottom, contentRect.top);
    const bottom = Math.min(footer.getBoundingClientRect().top, contentRect.bottom);
    const height = Math.max(0,(bottom-top)/scale);
    row.style.top = `${(top-dockRect.top)/scale-dock.clientTop}px`;
    row.style.height = `${height}px`;
    scene.hidden = height < width * assets.frameHeight / assets.frameWidth || dock.clientWidth / 3 < width;
  }
  function sync() {
    const state = readState();
    const visible = state.nameView && !state.hasResults && state.searching && !state.stopped;
    const active = visible;
    row.hidden = !visible;
    const column = [0,1,2].includes(state.column) ? state.column : 1;
    row.dataset.column = String(column + 1);
    row.style.setProperty('--mo-casey-center', `${(column + .5) * 100 / 3}%`);
    const playing = active && !state.minimized && !document.hidden && !motion.matches;
    // Pass changes keep the current pose/ground phase. Stopping hides the
    // figure; hidden views do no animation work.
    if (active !== lastActive) row.classList.toggle('moCaseyActive', active);
    row.classList.toggle('moCaseyPlaying', playing);
    row.classList.toggle('moCaseyReducedMotion', motion.matches);
    scene.setAttribute('aria-label', `Casey searching, column ${column + 1} of 3`);
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
  return {sync, element: row, destroy() {
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
#moNameSearchCasey{position:absolute;left:0;right:0;pointer-events:none;user-select:none;overflow:hidden;}
#moNameSearchCasey[hidden]{display:none;}
.moCaseyScene{position:absolute;left:var(--mo-casey-center,50%);top:50%;transform:translate(-50%,-50%);width:var(--mo-casey-width,80px);aspect-ratio:434/440;overflow:hidden;}
.moCaseyScene[hidden]{display:none;}
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
function startNameSearchCasey() {
  if (nameSearchCasey) return;
  nameSearchCasey = createNameSearchCasey({
    assets: CASEY_NAME_SEARCH_ASSETS,
    dock,
    sizeMode: 'width',
    readState: () => {
      const search = loadNameState();
      const index = Number(search?.passIndex) || 0;
      return {
      nameView: appView === 'name',
      hasResults: !!loadJson(KEY_NAMESEARCH_OUTPUT, null),
      searching: !!search?.active || caseOverrideRunning,
      column: caseOverrideRunning ? 1 : search?.step === 'municourt_finalizing' ? 2 : Math.min(2,Math.max(0,index)),
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
