/************************************************************
 * INIT
 ************************************************************/
if (isJotformTablesPage()) {initializeJotformIntegration();}
else {startIcbincnTabBrandingObserver();
      uiStatus(getStatus() || 'Ready');
      restoreActiveNameSearchUiOnLoad();
      render();

      setInterval(() => {try {nameSearchTick();}
                         catch (e) {/* ignore */}
                         try {trackTick();}
                         catch (e) {}},900);}})();
