
/************************************************************
 * INIT
 ************************************************************/
uiStatus(getStatus() || 'Ready');
render();

setInterval(() => {try {nameSearchTick();}
                   catch (e) {/* ignore */}
                   try {trackTick();}
                   catch (e) {}},900);})();
