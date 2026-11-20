# Legacy Casey integrations (archived 2026-11-20)

The Weekly Call Log Google Sheets and Jotform integrations are obsolete and excluded from the Tampermonkey build. Retain these sources and supporting data for reference or future retooling. They are shared-scope modules, not standalone userscripts.

- `18b-jotform-launcher.js`: unchanged original Jotform module, including launch controls, table customizations, branding, and result transfer.
- `18c-weekly-call-log.js`: unchanged original Sheets module, including selected-row lookup, launch, bridge, and result transfer.
- `wiring.json`: original source paths, site matches, Jotform storage declarations, completion hooks, and full original initialization code from commit `92f4bb3`.
- `../../google-apps-script/WeeklyCallLog.gs`: retained companion Apps Script at its original path.
- `../../../data/jotform-captures/`: retained HTML/data captures.
- `../../../docs/weekly-call-log-casey.md` and `../../../docs/jotform-table-visual-change-instructions.md`: retained workflow and capture instructions.
- `../../../tests/weekly-call-log.test.cjs`: retained compatibility tests, now loading the archived Sheets module.

The builder includes only `src/tampermonkey/*.js`. No legacy code, bridge startup, result-transfer hook, or Jotform/Sheets site match remains in the active bundle. Existing stored integration data is not deleted or migrated. No Google Sheet, Jotform app, or deployed Apps Script is modified by this repository cleanup.

Shared functionality remains active: normal Case.net/Municourt searches, result formatting, Casey animations, Help/favicon logo, and the Municourt worker’s GM storage listeners/background tabs. Those shared assets and permissions must not be removed merely because the legacy modules also used them. The Jotform intake URL in Text Builder is message content, not an integration hook, and remains intact.

To retool these integrations, use the archived modules and wiring as reference, reassess shared dependencies and site contracts, and deliberately reconnect only the required behavior. Do not move the whole archive into the active source directory automatically.

Bundle reduction for this cleanup: 2,867,928 → 2,818,068 bytes, saving 49,860 bytes (1.74%). Large shared assets are retained; they are not exclusive to these integrations.
