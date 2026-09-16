/************************************************************
 * INIT
 ************************************************************/
if (isJotformTablesPage()) {initializeJotformIntegration();}
else {startIcbincnTabBrandingObserver();
      uiStatus(getStatus() || 'Ready');
      restoreActiveNameSearchUiOnLoad();
      render();

      let nameSearchTickInFlight = false;
      const kickNameSearchTick = () => {if (nameSearchTickInFlight) return;
                                       nameSearchTickInFlight = true;
                                       Promise.resolve(nameSearchTick()).catch(() => {}).finally(() => {nameSearchTickInFlight = false;});};
      // Run once at page initialization so background-tab timer throttling cannot
      // stall the next pass. The interval remains only as a recovery watchdog.
      kickNameSearchTick();
      window.addEventListener('pageshow',kickNameSearchTick);
      document.addEventListener('visibilitychange',() => {if (!document.hidden) kickNameSearchTick();});
      setInterval(() => {kickNameSearchTick();
                         try {trackTick();}
                         catch (e) {}},900);}})();
