/************************************************************
 * Casey in the Name Search blank area. Artwork is embedded.
 ************************************************************/
function createNameSearchCasey({assets, dock, readState, sizeMode, keepOnResults}) {
  if (!['width','height'].includes(sizeMode)) throw new Error('Choose Casey’s button-size reference.');
  const footer = dock.querySelector('#moJsonFooter');
  const clearLog = dock.querySelector('#moJsonClear');
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
  // Use the existing blank flex space above the footer. On short windows the
  // fields scroll in their own pane instead of moving beneath the mascot.
  dock.insertBefore(row, footer);
  function measure() {
    resizePending = 0;
    if (row.hidden || !clearLog.offsetWidth) return;
    const width = sizeMode === 'width' ? clearLog.offsetWidth : clearLog.offsetHeight * assets.frameWidth / assets.frameHeight;
    row.style.setProperty('--mo-casey-width', `${width}px`);
    const scale = dock.getBoundingClientRect().width / dock.offsetWidth || 1;
    const dockRect = dock.getBoundingClientRect(), buttonRect = clearLog.getBoundingClientRect();
    row.style.setProperty('--mo-casey-right', `${Math.max(0,(dockRect.right-buttonRect.right)/scale-dock.clientLeft)}px`);
  }
  function sync() {
    const state = readState();
    const visible = state.nameView && (!state.hasResults || keepOnResults);
    const active = visible && state.searching && !state.stopped;
    row.hidden = !visible;
    row.classList.toggle('moCaseyResultsRow', visible && state.hasResults);
    const playing = active && !state.minimized && !document.hidden && !motion.matches;
    // Rerenders keep the current pose/ground phase. Stopping returns to the
    // smiling first pose; hidden views do no animation work.
    if (active !== lastActive) row.classList.toggle('moCaseyActive', active);
    row.classList.toggle('moCaseyPlaying', playing);
    row.classList.toggle('moCaseyReducedMotion', motion.matches);
    scene.setAttribute('aria-label', active ? 'Casey searching' : 'Casey ready');
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
  window.addEventListener('resize', measure);
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', sync);
  return {sync, element: row, destroy() {
    observer?.disconnect();
    if (resizePending) cancelAnimationFrame(resizePending);
    window.removeEventListener('resize', measure);
    document.removeEventListener('visibilitychange', sync);
    motion.removeEventListener('change', sync);
    row.remove();
  }};
}

GM_addStyle(`
#moNameSearchCasey{position:relative;flex:0 0 auto;width:100%;height:calc(var(--mo-casey-width,80px)*440/434 + 8px);pointer-events:none;user-select:none;}
#moNameSearchCasey[hidden]{display:none;}
.moCaseyScene{position:absolute;right:var(--mo-casey-right,10px);bottom:8px;width:var(--mo-casey-width,80px);aspect-ratio:434/440;overflow:hidden;}
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
    keepOnResults: false,
    readState: () => ({
      nameView: appView === 'name',
      hasResults: !!loadJson(KEY_NAMESEARCH_OUTPUT, null),
      searching: !!loadNameState()?.active || caseOverrideRunning,
      stopped: isStop(),
      minimized: dock.classList.contains('moHidden')
    })
  });
  if (typeof GM_addValueChangeListener === 'function') {
    GM_addValueChangeListener(KEY_NAMESEARCH, syncNameSearchCasey);
    GM_addValueChangeListener(KEY_STOP, syncNameSearchCasey);
  }
}
